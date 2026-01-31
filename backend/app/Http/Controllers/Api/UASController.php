<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use App\Models\Beneficiaire;
use App\Models\Kafala;
use App\Models\KafalaDocument;
use App\Models\AssistanceMedicale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Carbon\Carbon;

class UASController extends Controller
{
    // ==================== GESTION DES CAMPAGNES ====================
    
    public function getCampagnes(Request $request)
    {
        try {
            $query = Campagne::with('typeAssistance');

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('lieu', 'like', "%{$search}%");
                });
            }

            if ($request->has('statut')) {
                $now = Carbon::now();
                switch ($request->statut) {
                    case 'À venir':
                        $query->where('date_debut', '>', $now);
                        break;
                    case 'En cours':
                        $query->where('date_debut', '<=', $now)
                              ->where('date_fin', '>=', $now);
                        break;
                    case 'Terminée':
                        $query->where('date_fin', '<', $now);
                        break;
                }
            }

            $perPage = $request->get('per_page', 15);
            $campagnes = $query->orderBy('date_debut', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $campagnes
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeCampagne(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'type_assistance_id' => 'required|exists:type_assistances,id',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut',
            'lieu' => 'required|string|max:255',
            'budget' => 'required|numeric|min:0',
            'nombre_beneficiaires_prevus' => 'required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $campagne = Campagne::create($request->all());
            $campagne->load('typeAssistance');

            return response()->json([
                'success' => true,
                'message' => 'Campagne créée avec succès',
                'data' => $campagne
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateCampagne(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'type_assistance_id' => 'sometimes|required|exists:type_assistances,id',
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'sometimes|required|date|after:date_debut',
            'lieu' => 'sometimes|required|string|max:255',
            'budget' => 'sometimes|required|numeric|min:0',
            'nombre_beneficiaires_prevus' => 'sometimes|required|integer|min:1',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $campagne = Campagne::findOrFail($id);
            $campagne->update($request->all());
            $campagne->load('typeAssistance');

            return response()->json([
                'success' => true,
                'message' => 'Campagne mise à jour',
                'data' => $campagne
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteCampagne($id)
    {
        try {
            $campagne = Campagne::findOrFail($id);
            
            if ($campagne->beneficiaires()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer: cette campagne a des bénéficiaires'
                ], 400);
            }

            $campagne->delete();

            return response()->json([
                'success' => true,
                'message' => 'Campagne supprimée'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== GESTION DES BÉNÉFICIAIRES ====================
    
    public function getBeneficiaires(Request $request)
    {
        try {
            $query = Beneficiaire::with(['commune', 'typeAssistance', 'campagne']);

            if ($request->has('campagne_id')) {
                $query->where('campagne_id', $request->campagne_id);
            }

            if ($request->has('decision')) {
                $query->where('decision', $request->decision);
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('cin', 'like', "%{$search}%")
                      ->orWhere('telephone', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $beneficiaires = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $beneficiaires
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeBeneficiaire(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'sexe' => 'required|in:M,F',
            'date_naissance' => 'required|date',
            'cin' => 'required|string|unique:beneficiaires,cin',
            'telephone' => 'required|string',
            'email' => 'nullable|email',
            'adresse' => 'required|string',
            'commune_id' => 'required|exists:communes,id',
            'type_assistance_id' => 'required|exists:type_assistances,id',
            'hors_campagne' => 'boolean',
            'campagne_id' => 'nullable|exists:campagnes,id',
            'decision' => 'in:Accepté,En attente,Refusé',
            'a_beneficie' => 'boolean',
            'observation' => 'nullable|string',
            'enfant_scolarise' => 'nullable|boolean',
            'cote' => 'nullable|in:Unilatéral,Bilatéral',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $beneficiaire = Beneficiaire::create($request->all());
            $beneficiaire->load(['commune', 'typeAssistance', 'campagne']);

            return response()->json([
                'success' => true,
                'message' => 'Bénéficiaire créé avec succès',
                'data' => $beneficiaire
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateBeneficiaire(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'sometimes|required|string|max:255',
            'prenom' => 'sometimes|required|string|max:255',
            'sexe' => 'sometimes|required|in:M,F',
            'date_naissance' => 'sometimes|required|date',
            'cin' => 'sometimes|required|string|unique:beneficiaires,cin,' . $id,
            'telephone' => 'sometimes|required|string',
            'email' => 'nullable|email',
            'adresse' => 'sometimes|required|string',
            'commune_id' => 'sometimes|required|exists:communes,id',
            'type_assistance_id' => 'sometimes|required|exists:type_assistances,id',
            'decision' => 'sometimes|in:Accepté,En attente,Refusé',
            'a_beneficie' => 'boolean',
            'observation' => 'nullable|string',
            'enfant_scolarise' => 'nullable|boolean',
            'cote' => 'nullable|in:Unilatéral,Bilatéral',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $beneficiaire = Beneficiaire::findOrFail($id);
            $beneficiaire->update($request->all());
            $beneficiaire->load(['commune', 'typeAssistance', 'campagne']);

            return response()->json([
                'success' => true,
                'message' => 'Bénéficiaire mis à jour',
                'data' => $beneficiaire
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function importBeneficiaires(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'campagne_id' => 'required|exists:campagnes,id',
            'file' => 'required|file|mimes:xlsx,xls',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('file');
            $spreadsheet = IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray();

            $imported = 0;
            $errors = [];

            DB::beginTransaction();

            foreach (array_slice($rows, 1) as $index => $row) {
                try {
                    $beneficiaire = Beneficiaire::create([
                        'nom' => $row[0],
                        'prenom' => $row[1],
                        'sexe' => $row[2],
                        'date_naissance' => \PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($row[3]),
                        'cin' => $row[4],
                        'telephone' => $row[5],
                        'email' => $row[6] ?? null,
                        'adresse' => $row[7],
                        'commune_id' => $row[8],
                        'type_assistance_id' => $row[9],
                        'campagne_id' => $request->campagne_id,
                        'decision' => 'En attente',
                    ]);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Ligne " . ($index + 2) . ": " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "$imported bénéficiaires importés",
                'imported' => $imported,
                'errors' => $errors
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'importation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== GESTION KAFALA ====================
    
    public function getKafalas(Request $request)
    {
        try {
            $query = Kafala::with('documents');

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('numero_reference', 'like', "%{$search}%")
                      ->orWhere('pere_nom', 'like', "%{$search}%")
                      ->orWhere('mere_nom', 'like', "%{$search}%")
                      ->orWhere('enfant_nom', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $kafalas = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $kafalas
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function storeKafala(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'pere_nom' => 'required|string|max:255',
            'pere_prenom' => 'required|string|max:255',
            'pere_cin' => 'required|string',
            'mere_nom' => 'required|string|max:255',
            'mere_prenom' => 'required|string|max:255',
            'mere_cin' => 'required|string',
            'date_mariage' => 'required|date',
            'telephone' => 'required|string',
            'email' => 'nullable|email',
            'adresse' => 'required|string',
            'enfant_nom' => 'required|string|max:255',
            'enfant_prenom' => 'required|string|max:255',
            'enfant_date_naissance' => 'required|date',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $kafala = Kafala::create($request->except('documents'));

            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $path = $file->store('kafala_documents', 'public');
                    
                    KafalaDocument::create([
                        'kafala_id' => $kafala->id,
                        'nom_fichier' => $file->getClientOriginalName(),
                        'chemin_fichier' => $path,
                        'type_mime' => $file->getMimeType(),
                        'taille' => $file->getSize(),
                    ]);
                }
            }

            DB::commit();

            $kafala->load('documents');

            return response()->json([
                'success' => true,
                'message' => 'Dossier kafala créé avec succès',
                'data' => $kafala
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getAssistancesMedicales(Request $request)
    {
        try {
            $query = AssistanceMedicale::query();

            // Eager load toutes les relations avec gestion des relations nulles
            $query->with([
                'typeAssistance',
                'detailTypeAssistance',
                'beneficiaire.commune', // Charger aussi la commune du bénéficiaire
                'natureDon',
                'etatDon',
                'etatDossier'
            ]);

            // Recherche si paramètre fourni
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                $query->whereHas('beneficiaire', function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $assistances = $query->orderBy('date_assistance', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $assistances
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('Error in getAssistancesMedicales: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du chargement des assistances médicales',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }


    public function getAssistanceMedicale($id)
    {
        try {
            $assistance = AssistanceMedicale::with([
                'typeAssistance',
                'detailTypeAssistance',
                'beneficiaire',
                'natureDon',
                'etatDon',
                'etatDossier'
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $assistance
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in getAssistanceMedicale: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Assistance non trouvée',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function storeAssistanceMedicale(Request $request)
    {
        try {
            // Validation
            $validated = $request->validate([
                'type_assistance_id' => 'required|exists:type_assistances,id',
                'detail_type_assistance_id' => 'nullable|exists:detail_type_assistances,id',
                'beneficiaire_id' => 'required|exists:beneficiaires,id',
                'nature_don_id' => 'required|exists:nature_dons,id',
                'etat_don_id' => 'required|exists:etat_dons,id',
                'etat_dossier_id' => 'required|exists:etat_dossiers,id',
                'date_assistance' => 'required|date',
                'montant' => 'nullable|numeric|min:0',
                'assistance_pour_moi_meme' => 'boolean',
                'observation' => 'nullable|string',
                'duree_utilisation' => 'nullable|integer|min:1',
            ]);

            // Création de l'assistance
            $assistance = AssistanceMedicale::create($validated);
            
            // Charger les relations pour le retour
            $assistance->load([
                'typeAssistance',
                'detailTypeAssistance',
                'beneficiaire',
                'natureDon',
                'etatDon',
                'etatDossier'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Assistance médicale créée avec succès',
                'data' => $assistance
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('Error in storeAssistanceMedicale: ' . $e->getMessage());
            Log::error('Request data: ' . json_encode($request->all()));
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'assistance',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function updateAssistanceMedicale(Request $request, $id)
    {
        try {
            $assistance = AssistanceMedicale::findOrFail($id);
            $assistance->update($request->all());
            $assistance->load([
                'typeAssistance',
                'detailTypeAssistance',
                'beneficiaire',
                'natureDon',
                'etatDon',
                'etatDossier'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Assistance mise à jour',
                'data' => $assistance
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in updateAssistanceMedicale: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteAssistanceMedicale($id)
    {
        try {
            $assistance = AssistanceMedicale::findOrFail($id);
            $assistance->delete();

            return response()->json([
                'success' => true,
                'message' => 'Assistance supprimée'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in deleteAssistanceMedicale: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function retourMateriel(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'date_retour_effective' => 'required|date',
            'observation_retour' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $assistance = AssistanceMedicale::findOrFail($id);
            
            $assistance->update([
                'date_retour_effective' => $request->date_retour_effective,
                'observation_retour' => $request->observation_retour,
                'est_retourne' => true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Retour matériel enregistré',
                'data' => $assistance
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in retourMateriel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== STATISTIQUES ====================
    
    public function getStatistiquesCampagne($campagneId)
    {
        try {
            $campagne = Campagne::findOrFail($campagneId);
            $beneficiaires = $campagne->beneficiaires;

            $stats = [
                'total' => $beneficiaires->count(),
                'par_sexe' => [
                    'masculin' => $beneficiaires->where('sexe', 'M')->count(),
                    'feminin' => $beneficiaires->where('sexe', 'F')->count(),
                ],
                'par_tranche_age' => [
                    'moins_15' => $beneficiaires->filter(fn($b) => $b->age < 15)->count(),
                    'entre_15_64' => $beneficiaires->filter(fn($b) => $b->age >= 15 && $b->age <= 64)->count(),
                    'plus_64' => $beneficiaires->filter(fn($b) => $b->age > 64)->count(),
                ],
                'par_decision' => [
                    'accepte' => $beneficiaires->where('decision', 'Accepté')->count(),
                    'en_attente' => $beneficiaires->where('decision', 'En attente')->count(),
                    'refuse' => $beneficiaires->where('decision', 'Refusé')->count(),
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}