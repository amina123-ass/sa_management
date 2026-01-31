<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AssistanceMedicale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;

class AssistanceMedicaleController extends Controller
{
    public function index(Request $request)
    {
        try {
            Log::info('=== DÉBUT GET ASSISTANCES ===');
            Log::info('Params:', $request->all());
            
            $query = AssistanceMedicale::query();

            // Vérifier si la table a des données
            $count = AssistanceMedicale::count();
            Log::info("Nombre total d'assistances: {$count}");

            // Eager load avec gestion d'erreur individuelle
            try {
                $query->with([
                    'typeAssistance',
                    'detailTypeAssistance',
                    'beneficiaire',
                    'natureDon',
                    'etatDon',
                    'etatDossier'
                ]);
            } catch (\Exception $e) {
                Log::error('Erreur lors du chargement des relations: ' . $e->getMessage());
                // Continuer sans les relations si erreur
            }

            // Recherche
            if ($request->has('search') && $request->search) {
                $search = $request->search;
                try {
                    $query->whereHas('beneficiaire', function ($q) use ($search) {
                        $q->where('nom', 'like', "%{$search}%")
                          ->orWhere('prenom', 'like', "%{$search}%");
                    });
                } catch (\Exception $e) {
                    Log::error('Erreur recherche: ' . $e->getMessage());
                }
            }

            // Filtres
            if ($request->has('etat_dossier_id') && $request->etat_dossier_id) {
                $query->where('etat_dossier_id', $request->etat_dossier_id);
            }

            if ($request->has('etat_don_id') && $request->etat_don_id) {
                $query->where('etat_don_id', $request->etat_don_id);
            }

            if ($request->has('type_assistance_id') && $request->type_assistance_id) {
                $query->where('type_assistance_id', $request->type_assistance_id);
            }

            $perPage = $request->get('per_page', 10);
            Log::info("Pagination: {$perPage} par page");
            
            $assistances = $query->orderBy('date_assistance', 'desc')->paginate($perPage);
            
            Log::info('Résultats trouvés: ' . $assistances->count());
            Log::info('=== FIN GET ASSISTANCES (SUCCESS) ===');

            return response()->json([
                'success' => true,
                'data' => $assistances
            ], 200);
            
        } catch (\Exception $e) {
            Log::error('=== ERREUR GET ASSISTANCES ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du chargement des assistances médicales',
                'error' => config('app.debug') ? [
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ] : 'Erreur serveur'
            ], 500);
        }
    }

    public function show($id)
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
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            // Log des données reçues
            Log::info('=== DÉBUT CRÉATION ASSISTANCE ===');
            Log::info('Données reçues:', $request->all());

            // Validation
            $validator = Validator::make($request->all(), [
                'type_assistance_id' => 'required|exists:type_assistances,id',
                'detail_type_assistance_id' => 'nullable|exists:detail_type_assistances,id',
                'beneficiaire_id' => 'required|exists:beneficiaires,id',
                'nature_don_id' => 'required|exists:nature_dons,id',
                'etat_don_id' => 'required|exists:etat_dons,id',
                'etat_dossier_id' => 'required|exists:etat_dossiers,id',
                'date_assistance' => 'required|date',
                'montant' => 'nullable|numeric|min:0',
                'assistance_pour_moi_meme' => 'nullable',
                'observation' => 'nullable|string',
                'duree_utilisation' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation échouée:', $validator->errors()->toArray());
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Préparer les données - Nettoyer les valeurs nulles et vides
            $data = [
                'type_assistance_id' => (int) $request->type_assistance_id,
                'detail_type_assistance_id' => $request->detail_type_assistance_id ? (int) $request->detail_type_assistance_id : null,
                'beneficiaire_id' => (int) $request->beneficiaire_id,
                'nature_don_id' => (int) $request->nature_don_id,
                'etat_don_id' => (int) $request->etat_don_id,
                'etat_dossier_id' => (int) $request->etat_dossier_id,
                'date_assistance' => $request->date_assistance,
                'montant' => $request->montant ? (float) $request->montant : null,
                'assistance_pour_moi_meme' => $request->assistance_pour_moi_meme ? true : false,
                'observation' => $request->observation ?: null,
                'duree_utilisation' => $request->duree_utilisation ? (int) $request->duree_utilisation : null,
            ];

            Log::info('Données préparées:', $data);

            // Calculer la date de retour prévue si c'est un prêt
            if ($request->duree_utilisation && $request->duree_utilisation > 0) {
                $data['date_retour_prevue'] = date('Y-m-d', strtotime($request->date_assistance . ' + ' . $request->duree_utilisation . ' days'));
                $data['est_retourne'] = false;
            }

            Log::info('Tentative d\'insertion...');

            // Création de l'assistance
            $assistance = AssistanceMedicale::create($data);
            
            Log::info('Insertion réussie! ID: ' . $assistance->id);
            
            // Charger les relations pour le retour
            $assistance->load([
                'typeAssistance',
                'detailTypeAssistance',
                'beneficiaire',
                'natureDon',
                'etatDon',
                'etatDossier'
            ]);

            Log::info('=== FIN CRÉATION ASSISTANCE (SUCCESS) ===');

            return response()->json([
                'success' => true,
                'message' => 'Assistance médicale créée avec succès',
                'data' => $assistance
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('ValidationException:', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
            
        } catch (\Exception $e) {
            Log::error('=== ERREUR CRÉATION ASSISTANCE ===');
            Log::error('Message: ' . $e->getMessage());
            Log::error('File: ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'assistance',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'type_assistance_id' => 'sometimes|required|exists:type_assistances,id',
                'detail_type_assistance_id' => 'nullable|exists:detail_type_assistances,id',
                'beneficiaire_id' => 'sometimes|required|exists:beneficiaires,id',
                'nature_don_id' => 'sometimes|required|exists:nature_dons,id',
                'etat_don_id' => 'sometimes|required|exists:etat_dons,id',
                'etat_dossier_id' => 'sometimes|required|exists:etat_dossiers,id',
                'date_assistance' => 'sometimes|required|date',
                'montant' => 'nullable|numeric|min:0',
                'assistance_pour_moi_meme' => 'boolean',
                'observation' => 'nullable|string',
                'duree_utilisation' => 'nullable|integer|min:1',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            $assistance = AssistanceMedicale::findOrFail($id);
            
            $data = $request->only([
                'type_assistance_id',
                'detail_type_assistance_id',
                'beneficiaire_id',
                'nature_don_id',
                'etat_don_id',
                'etat_dossier_id',
                'date_assistance',
                'montant',
                'assistance_pour_moi_meme',
                'observation',
                'duree_utilisation',
            ]);

            // Recalculer la date de retour prévue si durée modifiée
            if ($request->has('duree_utilisation') && $request->duree_utilisation > 0) {
                $dateAssistance = $request->has('date_assistance') ? $request->date_assistance : $assistance->date_assistance;
                $data['date_retour_prevue'] = date('Y-m-d', strtotime($dateAssistance . ' + ' . $request->duree_utilisation . ' days'));
            }

            $assistance->update($data);
            
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
                'message' => 'Assistance mise à jour avec succès',
                'data' => $assistance
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in updateAssistanceMedicale: ' . $e->getMessage());
            Log::error('Stack trace: ' . $e->getTraceAsString());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $assistance = AssistanceMedicale::findOrFail($id);
            $assistance->delete();

            return response()->json([
                'success' => true,
                'message' => 'Assistance supprimée avec succès'
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in deleteAssistanceMedicale: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
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
                'message' => 'Retour matériel enregistré avec succès',
                'data' => $assistance
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error in retourMateriel: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement du retour',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }
}