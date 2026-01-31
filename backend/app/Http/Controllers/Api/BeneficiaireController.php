<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Beneficiaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use Carbon\Carbon;

class BeneficiaireController extends Controller
{
    public function index(Request $request)
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

    public function show($id)
    {
        try {
            $beneficiaire = Beneficiaire::with(['commune', 'typeAssistance', 'campagne'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $beneficiaire
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Bénéficiaire non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function store(Request $request)
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

    public function update(Request $request, $id)
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

    public function destroy($id)
    {
        try {
            $beneficiaire = Beneficiaire::findOrFail($id);
            $beneficiaire->delete();

            return response()->json([
                'success' => true,
                'message' => 'Bénéficiaire supprimé'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'campagne_id' => 'required|exists:campagnes,id',
            'file' => 'required|file|mimes:xlsx,xls',
            'type_assistance_id' => 'required|exists:type_assistances,id',
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
            $skipped = 0;

            $headers = array_map('strtolower', array_map('trim', $rows[0]));
            Log::info('Headers detected', ['headers' => $headers]);

            DB::beginTransaction();

            Log::info('Starting import', [
                'total_rows' => count($rows) - 1,
                'campagne_id' => $request->campagne_id,
                'type_assistance_id' => $request->type_assistance_id
            ]);

            $columnMap = $this->mapColumns($headers);
            Log::info('Column mapping', ['map' => $columnMap]);

            foreach (array_slice($rows, 1) as $index => $row) {
                if ($this->isEmptyRow($row)) {
                    $skipped++;
                    Log::info('Skipping empty row', ['line' => $index + 2]);
                    continue;
                }

                try {
                    $extractedData = $this->extractDataFromRow($row, $columnMap);
                    $dateNaissance = $this->parseDate($extractedData['date_naissance'] ?? null);

                    if (empty($extractedData['nom']) || empty($extractedData['prenom']) || empty($extractedData['cin'])) {
                        throw new \Exception("Champs requis manquants (nom, prénom ou CIN)");
                    }

                    $communeId = $this->findCommuneId($extractedData);
                    
                    // Normaliser la décision depuis le fichier Excel
                    $decision = $this->normalizeDecision($extractedData['decision'] ?? null);
                    
                    // Convertir enfant_scolarise depuis le fichier Excel
                    $enfantScolarise = $this->normalizeEnfantScolarise($extractedData['enfant_scolarise'] ?? null);
                    
                    // Normaliser le côté depuis le fichier Excel
                    $cote = $this->normalizeCote($extractedData['cote'] ?? null);
                    
                    $data = [
                        'nom' => trim($extractedData['nom']),
                        'prenom' => trim($extractedData['prenom']),
                        'sexe' => $this->normalizeSex($extractedData['sexe'] ?? 'M'),
                        'date_naissance' => $dateNaissance,
                        'cin' => trim($extractedData['cin']),
                        'telephone' => trim($extractedData['telephone'] ?? '0000000000'),
                        'email' => !empty($extractedData['email']) ? trim($extractedData['email']) : null,
                        'adresse' => trim($extractedData['adresse'] ?? 'Non spécifié'),
                        'commune_id' => $communeId ?? 1,
                        'type_assistance_id' => $request->type_assistance_id,
                        'campagne_id' => $request->campagne_id,
                        'decision' => $decision,
                        'a_beneficie' => false,
                        'hors_campagne' => false,
                        'observation' => !empty($extractedData['observation']) ? trim($extractedData['observation']) : null,
                        'enfant_scolarise' => $enfantScolarise,
                        'cote' => $cote,
                    ];

                    Log::info('Importing beneficiaire', ['line' => $index + 2, 'data' => $data]);

                    $beneficiaire = Beneficiaire::create($data);
                    
                    if ($beneficiaire) {
                        $imported++;
                        Log::info('Beneficiaire created', ['id' => $beneficiaire->id, 'cin' => $beneficiaire->cin]);
                    } else {
                        throw new \Exception("Échec de la création du bénéficiaire");
                    }

                } catch (\Illuminate\Database\QueryException $e) {
                    $errorCode = $e->errorInfo[1] ?? $e->getCode();
                    if ($errorCode == 1062 || $e->getCode() == 23000) {
                        $errors[] = "Ligne " . ($index + 2) . ": CIN déjà existant (" . ($row[$columnMap['cin'] ?? 4] ?? 'N/A') . ")";
                    } else {
                        $errors[] = "Ligne " . ($index + 2) . ": Erreur DB - " . $e->getMessage();
                    }
                    Log::error('Database error during import', [
                        'line' => $index + 2,
                        'error' => $e->getMessage(),
                        'code' => $e->getCode()
                    ]);
                } catch (\Exception $e) {
                    $errors[] = "Ligne " . ($index + 2) . ": " . $e->getMessage();
                    Log::error('Error during import', [
                        'line' => $index + 2,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            if ($imported > 0) {
                DB::commit();
                Log::info("Import completed successfully", [
                    'imported' => $imported, 
                    'errors' => count($errors),
                    'skipped' => $skipped
                ]);
            } else {
                DB::rollBack();
                Log::warning("No beneficiaires imported", ['errors' => $errors, 'skipped' => $skipped]);
            }

            $message = $imported > 0 
                ? "$imported bénéficiaire(s) importé(s) avec succès" 
                : "Aucun bénéficiaire importé";

            if ($skipped > 0) {
                $message .= " ($skipped ligne(s) vide(s) ignorée(s))";
            }

            return response()->json([
                'success' => $imported > 0,
                'message' => $message,
                'imported' => $imported,
                'skipped' => $skipped,
                'errors' => $errors,
                'total_errors' => count($errors)
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Fatal error during import', [
                'error' => $e->getMessage(), 
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'importation',
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ], 500);
        }
    }

    private function mapColumns($headers)
    {
        $map = [];
        
        foreach ($headers as $index => $header) {
            $normalized = $this->normalizeHeader($header);
            
            if (in_array($normalized, ['nom', 'name'])) $map['nom'] = $index;
            if (in_array($normalized, ['prenom', 'prénom', 'firstname'])) $map['prenom'] = $index;
            if (in_array($normalized, ['sexe', 'genre', 'sex', 'gender'])) $map['sexe'] = $index;
            if (in_array($normalized, ['date_naissance', 'datenaissance', 'datedenaissance', 'birthdate', 'naissance'])) $map['date_naissance'] = $index;
            if (in_array($normalized, ['cin', 'identifiant', 'carte'])) $map['cin'] = $index;
            if (in_array($normalized, ['telephone', 'téléphone', 'tel', 'phone', 'mobile'])) $map['telephone'] = $index;
            if (in_array($normalized, ['email', 'mail', 'courriel'])) $map['email'] = $index;
            if (in_array($normalized, ['adresse', 'address', 'rue'])) $map['adresse'] = $index;
            if (in_array($normalized, ['commune', 'ville', 'city'])) $map['commune'] = $index;
            if (in_array($normalized, ['commune_id', 'communeid', 'id_commune'])) $map['commune_id'] = $index;
            if (in_array($normalized, ['decision', 'décision', 'statut', 'status'])) $map['decision'] = $index;
            if (in_array($normalized, ['enfant_scolarise', 'enfantscolarise', 'enfantsscolarises', 'enfants_scolarises', 'scolarise'])) $map['enfant_scolarise'] = $index;
            if (in_array($normalized, ['cote', 'côte', 'côté', 'cote_appareil'])) $map['cote'] = $index;
            if (in_array($normalized, ['observation', 'commentaire', 'comment', 'remarque'])) $map['observation'] = $index;
        }
        
        return $map;
    }

    private function normalizeHeader($header)
    {
        return strtolower(preg_replace('/[^a-z0-9_]/i', '', $header));
    }

    private function extractDataFromRow($row, $columnMap)
    {
        $data = [];
        
        $data['nom'] = $row[$columnMap['nom'] ?? 0] ?? null;
        $data['prenom'] = $row[$columnMap['prenom'] ?? 1] ?? null;
        $data['sexe'] = $row[$columnMap['sexe'] ?? 2] ?? null;
        $data['date_naissance'] = $row[$columnMap['date_naissance'] ?? 3] ?? null;
        $data['cin'] = $row[$columnMap['cin'] ?? 4] ?? null;
        $data['telephone'] = $row[$columnMap['telephone'] ?? 5] ?? null;
        $data['email'] = $row[$columnMap['email'] ?? 6] ?? null;
        $data['adresse'] = $row[$columnMap['adresse'] ?? 7] ?? null;
        $data['commune'] = $row[$columnMap['commune'] ?? 8] ?? null;
        $data['commune_id'] = $row[$columnMap['commune_id'] ?? 9] ?? null;
        $data['decision'] = $row[$columnMap['decision'] ?? -1] ?? null;
        $data['enfant_scolarise'] = $row[$columnMap['enfant_scolarise'] ?? -1] ?? null;
        $data['cote'] = $row[$columnMap['cote'] ?? -1] ?? null;
        $data['observation'] = $row[$columnMap['observation'] ?? -1] ?? null;
        
        return $data;
    }

    private function isEmptyRow($row)
    {
        return empty(array_filter($row, function($cell) {
            return !empty(trim($cell));
        }));
    }

    private function parseDate($date)
    {
        if (empty($date)) return null;
        
        try {
            if (is_numeric($date)) {
                return ExcelDate::excelToDateTimeObject($date)->format('Y-m-d');
            } else {
                return Carbon::parse($date)->format('Y-m-d');
            }
        } catch (\Exception $e) {
            Log::warning('Date parsing failed', ['date' => $date, 'error' => $e->getMessage()]);
            return null;
        }
    }

    private function normalizeSex($sexe)
    {
        $sexe = strtoupper(trim($sexe));
        
        if (in_array($sexe, ['M', 'H', 'HOMME', 'MALE', 'MASCULIN'])) return 'M';
        if (in_array($sexe, ['F', 'FEMME', 'FEMALE', 'FEMININ'])) return 'F';
        
        return 'M';
    }

    private function normalizeDecision($decision)
    {
        if (empty($decision)) {
            return 'En attente';
        }
        
        $decision = trim($decision);
        
        // Normaliser les différentes variantes
        if (in_array(strtolower($decision), ['accepté', 'accepte', 'accepted', 'oui', 'yes'])) {
            return 'Accepté';
        }
        
        if (in_array(strtolower($decision), ['refusé', 'refuse', 'refused', 'non', 'no'])) {
            return 'Refusé';
        }
        
        if (in_array(strtolower($decision), ['en attente', 'attente', 'pending', 'wait'])) {
            return 'En attente';
        }
        
        // Par défaut
        return 'En attente';
    }

    private function normalizeEnfantScolarise($value)
    {
        if ($value === null || $value === '') {
            return null;
        }
        
        $value = strtolower(trim($value));
        
        // Valeurs pour "true"
        if (in_array($value, ['oui', 'yes', '1', 'true', 'vrai'])) {
            return true;
        }
        
        // Valeurs pour "false"
        if (in_array($value, ['non', 'no', '0', 'false', 'faux'])) {
            return false;
        }
        
        return null;
    }

    private function normalizeCote($cote)
    {
        if (empty($cote)) {
            return null;
        }
        
        $cote = trim($cote);
        
        // Normaliser les variantes
        if (in_array(strtolower($cote), ['unilatéral', 'unilateral', 'uni'])) {
            return 'Unilatéral';
        }
        
        if (in_array(strtolower($cote), ['bilatéral', 'bilateral', 'bi'])) {
            return 'Bilatéral';
        }
        
        return null;
    }

    private function findCommuneId($extractedData)
    {
        if (!empty($extractedData['commune_id']) && is_numeric($extractedData['commune_id'])) {
            return (int)$extractedData['commune_id'];
        }
        
        if (!empty($extractedData['commune'])) {
            $commune = \App\Models\Commune::where('nom', 'like', '%' . trim($extractedData['commune']) . '%')
                ->first();
            
            if ($commune) {
                return $commune->id;
            }
        }
        
        return null;
    }

    /**
     * Récupérer tous les participants (table participants) d'une campagne
     * Onglet 1: Tous les participants (Oui, Non, En attente)
     */
    public function getParticipantsByCampagne(Request $request, $campagneId)
    {
        try {
            $query = \App\Models\Participant::where('campagne_id', $campagneId)
                ->with(['commune', 'createdBy', 'updatedBy']);

            // Filtrer par statut si fourni et si différent de "tous"
            if ($request->has('statut') && $request->statut !== '' && $request->statut !== 'tous') {
                $query->where('statut', $request->statut);
            }

            // Recherche
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('cin', 'like', "%{$search}%")
                      ->orWhere('telephone', 'like', "%{$search}%");
                });
            }

            $perPage = $request->get('per_page', 15);
            $participants = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $participants
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getParticipantsByCampagne', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des participants',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Onglet 2: Liste principale (Acceptés)
     * Récupérer les bénéficiaires avec decision='Accepté' pour une campagne
     */
    public function getListePrincipale(Request $request, $campagneId)
    {
        try {
            $query = Beneficiaire::where('campagne_id', $campagneId)
                ->where('decision', 'Accepté')
                ->with(['commune', 'typeAssistance', 'campagne']);

            // Recherche
            if ($request->has('search') && $request->search !== '') {
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
            Log::error('Erreur getListePrincipale', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la liste principale',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Onglet 3: Liste d'attente
     * Récupérer les bénéficiaires (decision='En attente') + participants (statut='En attente')
     */
    public function getListeAttente(Request $request, $campagneId)
    {
        try {
            // Récupérer les bénéficiaires en attente
            $beneficiairesQuery = Beneficiaire::where('campagne_id', $campagneId)
                ->where('decision', 'En attente')
                ->with(['commune', 'typeAssistance', 'campagne']);

            // Récupérer les participants en attente
            $participantsQuery = \App\Models\Participant::where('campagne_id', $campagneId)
                ->where('statut', 'En attente')
                ->with(['commune']);

            // Recherche
            if ($request->has('search') && $request->search !== '') {
                $search = $request->search;
                
                $beneficiairesQuery->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('cin', 'like', "%{$search}%")
                      ->orWhere('telephone', 'like', "%{$search}%");
                });

                $participantsQuery->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('cin', 'like', "%{$search}%")
                      ->orWhere('telephone', 'like', "%{$search}%");
                });
            }

            $beneficiaires = $beneficiairesQuery->get();
            $participants = $participantsQuery->get();

            // Combiner et transformer les données
            $combined = collect();

            // Ajouter les bénéficiaires
            foreach ($beneficiaires as $b) {
                $combined->push([
                    'id' => 'B-' . $b->id,
                    'type' => 'beneficiaire',
                    'cin' => $b->cin,
                    'nom' => $b->nom,
                    'prenom' => $b->prenom,
                    'sexe' => $b->sexe,
                    'telephone' => $b->telephone,
                    'commune' => $b->commune,
                    'decision' => $b->decision,
                    'statut' => 'En attente',
                    'date_appel' => null,
                    'observation_appel' => $b->observation,
                    'created_at' => $b->created_at,
                ]);
            }

            // Ajouter les participants
            foreach ($participants as $p) {
                $combined->push([
                    'id' => 'P-' . $p->id,
                    'type' => 'participant',
                    'cin' => $p->cin,
                    'nom' => $p->nom,
                    'prenom' => $p->prenom,
                    'sexe' => $p->sexe,
                    'telephone' => $p->telephone,
                    'commune' => $p->commune,
                    'decision' => null,
                    'statut' => $p->statut,
                    'date_appel' => $p->date_appel,
                    'observation_appel' => $p->observation_appel,
                    'created_at' => $p->created_at,
                ]);
            }

            // Trier par date de création
            $combined = $combined->sortByDesc('created_at')->values();

            // Pagination manuelle
            $perPage = $request->get('per_page', 15);
            $page = $request->get('page', 1);
            $total = $combined->count();
            
            $paginated = $combined->slice(($page - 1) * $perPage, $perPage)->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'data' => $paginated,
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => ceil($total / $perPage),
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getListeAttente', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la liste d\'attente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Onglet 4: Liste refusée
     * Récupérer les bénéficiaires avec decision='Refusé' pour une campagne
     */
    public function getListeRefusee(Request $request, $campagneId)
    {
        try {
            $query = Beneficiaire::where('campagne_id', $campagneId)
                ->where('decision', 'Refusé')
                ->with(['commune', 'typeAssistance', 'campagne']);

            // Recherche
            if ($request->has('search') && $request->search !== '') {
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
            Log::error('Erreur getListeRefusee', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de la liste refusée',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les statistiques pour toutes les listes
     */
    public function getStatistiquesListes(Request $request, $campagneId)
    {
        try {
            // Tous les participants (table participants)
            $totalParticipants = \App\Models\Participant::where('campagne_id', $campagneId)->count();
            
            // Participants avec statut "Oui" (pour l'export)
            $participantsOui = \App\Models\Participant::where('campagne_id', $campagneId)
                ->where('statut', 'Oui')
                ->count();
            
            // Liste principale (bénéficiaires acceptés)
            $totalAcceptes = Beneficiaire::where('campagne_id', $campagneId)
                ->where('decision', 'Accepté')
                ->count();
            
            // Liste d'attente (bénéficiaires + participants en attente)
            $beneficiairesAttente = Beneficiaire::where('campagne_id', $campagneId)
                ->where('decision', 'En attente')
                ->count();
            $participantsAttente = \App\Models\Participant::where('campagne_id', $campagneId)
                ->where('statut', 'En attente')
                ->count();
            $totalAttente = $beneficiairesAttente + $participantsAttente;
            
            // Liste refusée (bénéficiaires refusés)
            $totalRefuses = Beneficiaire::where('campagne_id', $campagneId)
                ->where('decision', 'Refusé')
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'total_participants' => $totalParticipants,
                    'total_participants_oui' => $participantsOui,
                    'total_acceptes' => $totalAcceptes,
                    'total_attente' => $totalAttente,
                    'total_refuses' => $totalRefuses,
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getStatistiquesListes', [
                'error' => $e->getMessage(),
                'campagne_id' => $campagneId
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Convertir un bénéficiaire en participant
     * Les champs decision, enfant_scolarise et cote ne sont PAS transférés
     */
    public function convertirEnParticipant(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'campagne_id' => 'required|exists:campagnes,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $beneficiaire = Beneficiaire::with('commune')->findOrFail($id);
            
            // Vérifier si le participant n'existe pas déjà
            $existingParticipant = \App\Models\Participant::where('cin', $beneficiaire->cin)
                ->where('campagne_id', $request->campagne_id)
                ->first();

            if ($existingParticipant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Ce bénéficiaire est déjà participant de cette campagne'
                ], 400);
            }

            // Créer le participant SANS les champs decision, enfant_scolarise et cote
            $participant = \App\Models\Participant::create([
                'campagne_id' => $request->campagne_id,
                'commune_id' => $beneficiaire->commune_id,
                'nom' => $beneficiaire->nom,
                'prenom' => $beneficiaire->prenom,
                'cin' => $beneficiaire->cin,
                'date_naissance' => $beneficiaire->date_naissance,
                'sexe' => $beneficiaire->sexe,
                'telephone' => $beneficiaire->telephone,
                'email' => $beneficiaire->email,
                'adresse' => $beneficiaire->adresse,
                'statut' => 'En attente',
                'created_by' => auth()->id(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bénéficiaire converti en participant avec succès',
                'data' => $participant->load(['campagne', 'commune'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur convertirEnParticipant', [
                'error' => $e->getMessage(),
                'beneficiaire_id' => $id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la conversion',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exporter UNIQUEMENT les participants avec statut 'Oui' d'une campagne en Excel
     * Format adapté selon le type d'assistance (Lunettes ou Appareil auditif)
     * Avec listes déroulantes pour Decision, enfant_scolarise et cote
     */
    public function exportParticipantsAcceptes(Request $request, $campagneId)
    {
        try {
            Log::info('Début export participants', ['campagne_id' => $campagneId]);
            
            // Récupérer la campagne avec son type d'assistance
            $campagne = \App\Models\Campagne::with('typeAssistance')->find($campagneId);
            
            if (!$campagne) {
                Log::error('Campagne non trouvée', ['campagne_id' => $campagneId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Campagne non trouvée'
                ], 404);
            }
            
            if (!$campagne->typeAssistance) {
                Log::error('Type assistance non trouvé pour la campagne', ['campagne_id' => $campagneId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Type d\'assistance non configuré pour cette campagne'
                ], 400);
            }
            
            Log::info('Campagne chargée', [
                'campagne' => $campagne->nom,
                'type_assistance' => $campagne->typeAssistance->libelle
            ]);
            
            // Récupérer UNIQUEMENT les participants avec statut = 'Oui'
            $participants = \App\Models\Participant::where('campagne_id', $campagneId)
                ->where('statut', 'Oui')
                ->with(['commune'])
                ->orderBy('nom')
                ->orderBy('prenom')
                ->get();

            if ($participants->isEmpty()) {
                Log::warning('Aucun participant avec statut Oui', ['campagne_id' => $campagneId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Aucun participant avec statut "Oui" trouvé pour cette campagne'
                ], 404);
            }
            
            Log::info('Participants chargés', ['count' => $participants->count()]);

            // Créer un nouveau document Excel
            $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();

            // Déterminer le type d'assistance
            $typeAssistance = $campagne->typeAssistance->libelle;
            $typeAssistanceLower = strtolower($typeAssistance);
            
            $isAppareilAuditif = (stripos($typeAssistanceLower, 'appareil auditif') !== false || 
                                  stripos($typeAssistanceLower, 'auditif') !== false);
            $isLunettes = (stripos($typeAssistanceLower, 'lunette') !== false);

            Log::info('Type assistance détecté', [
                'libelle' => $typeAssistance,
                'is_appareil_auditif' => $isAppareilAuditif,
                'is_lunettes' => $isLunettes
            ]);

            // Définir les en-têtes selon le type d'assistance
            if ($isAppareilAuditif) {
                // Format pour Appareil Auditif (13 colonnes)
                $headers = [
                    'Nom',
                    'Prenom',
                    'Sexe',
                    'Date Naissance',
                    'Telephone',
                    'Email',
                    'Adresse',
                    'Commune',
                    'CIN',
                    'Commentaire',
                    'Decision',
                    'enfants_scolarises',
                    'cote'
                ];
                $sheet->setTitle('Participants OUI');
            } else {
                // Format pour Lunettes (12 colonnes)
                $headers = [
                    'Nom',
                    'Prenom',
                    'Sexe',
                    'Date Naissance',
                    'Telephone',
                    'Email',
                    'Adresse',
                    'Commune',
                    'CIN',
                    'Commentaire',
                    'Decision',
                    'enfants_scolarises'
                ];
                $sheet->setTitle('Feuil1');
            }

            // Écrire les en-têtes
            $columnLetters = range('A', 'Z');
            foreach ($headers as $index => $header) {
                $sheet->setCellValue($columnLetters[$index] . '1', $header);
            }

            // Style des en-têtes
            $headerStyle = [
                'font' => [
                    'bold' => true,
                    'color' => ['rgb' => 'FFFFFF'],
                    'size' => 11,
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4472C4'],
                ],
                'alignment' => [
                    'horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER,
                    'vertical' => \PhpOffice\PhpSpreadsheet\Style\Alignment::VERTICAL_CENTER,
                ],
            ];
            $lastColumn = $columnLetters[count($headers) - 1];
            $sheet->getStyle('A1:' . $lastColumn . '1')->applyFromArray($headerStyle);

            // Remplir les données
            $row = 2;
            foreach ($participants as $participant) {
                $col = 0;
                
                // Colonnes communes
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->nom);
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->prenom);
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->sexe);
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->date_naissance ? \Carbon\Carbon::parse($participant->date_naissance)->format('Y-m-d') : '');
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->telephone);
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->email ?? '');
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->adresse);
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->commune->nom ?? '');
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->cin);
                $sheet->setCellValue($columnLetters[$col++] . $row, $participant->observation_appel ?? '');
                
                $sheet->setCellValue($columnLetters[$col++] . $row, '');
                
                // enfants_scolarises : vide pour les participants (ils n'ont pas ce champ)
                $sheet->setCellValue($columnLetters[$col++] . $row, '');
                
                // Colonne "cote" uniquement pour Appareil Auditif (vide pour les participants)
                if ($isAppareilAuditif) {
                    $sheet->setCellValue($columnLetters[$col++] . $row, '');
                }

                $row++;
            }

            // Auto-dimensionner les colonnes
            foreach ($headers as $index => $header) {
                $sheet->getColumnDimension($columnLetters[$index])->setAutoSize(true);
            }

            // Style du tableau
            $styleArray = [
                'borders' => [
                    'allBorders' => [
                        'borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN,
                        'color' => ['rgb' => '000000'],
                    ],
                ],
            ];
            $sheet->getStyle('A1:' . $lastColumn . ($row - 1))->applyFromArray($styleArray);

            // Alterner les couleurs des lignes
            for ($i = 2; $i < $row; $i++) {
                if ($i % 2 == 0) {
                    $sheet->getStyle('A' . $i . ':' . $lastColumn . $i)
                        ->getFill()
                        ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                        ->getStartColor()
                        ->setRGB('F2F2F2');
                }
            }

            // ========================================
            // AJOUTER LES LISTES DÉROULANTES
            // ========================================
            if ($row > 2) {
                // Validation pour la colonne "Decision" (colonne K - index 10)
                $decisionColumn = 'K';
                $decisionValidation = $sheet->getCell($decisionColumn . '2')->getDataValidation();
                $decisionValidation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
                $decisionValidation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
                $decisionValidation->setAllowBlank(true); // Optionnelle
                $decisionValidation->setShowInputMessage(true);
                $decisionValidation->setShowErrorMessage(true);
                $decisionValidation->setShowDropDown(true);
                $decisionValidation->setErrorTitle('Erreur de saisie');
                $decisionValidation->setError('Veuillez sélectionner une valeur dans la liste');
                $decisionValidation->setPromptTitle('Décision');
                $decisionValidation->setPrompt('Sélectionnez la décision');
                $decisionValidation->setFormula1('"Accepté,En attente,Refusé"');
                
                // Appliquer la validation à toutes les lignes de données
                for ($i = 2; $i < $row; $i++) {
                    $sheet->getCell($decisionColumn . $i)->setDataValidation(clone $decisionValidation);
                }

                // Validation pour la colonne "enfants_scolarises" (colonne L - index 11)
                $enfantColumn = 'L';
                $enfantValidation = $sheet->getCell($enfantColumn . '2')->getDataValidation();
                $enfantValidation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
                $enfantValidation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
                $enfantValidation->setAllowBlank(true);
                $enfantValidation->setShowInputMessage(true);
                $enfantValidation->setShowErrorMessage(true);
                $enfantValidation->setShowDropDown(true);
                $enfantValidation->setErrorTitle('Erreur de saisie');
                $enfantValidation->setError('Veuillez sélectionner une valeur dans la liste');
                $enfantValidation->setPromptTitle('Enfant scolarisé');
                $enfantValidation->setPrompt('Sélectionnez oui ou non');
                $enfantValidation->setFormula1('"oui,non"');
                
                // Appliquer la validation à toutes les lignes de données
                for ($i = 2; $i < $row; $i++) {
                    $sheet->getCell($enfantColumn . $i)->setDataValidation(clone $enfantValidation);
                }

                // Validation pour la colonne "cote" (colonne M - index 12) - uniquement pour Appareil Auditif
                if ($isAppareilAuditif) {
                    $coteColumn = 'M';
                    $coteValidation = $sheet->getCell($coteColumn . '2')->getDataValidation();
                    $coteValidation->setType(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::TYPE_LIST);
                    $coteValidation->setErrorStyle(\PhpOffice\PhpSpreadsheet\Cell\DataValidation::STYLE_STOP);
                    $coteValidation->setAllowBlank(true);
                    $coteValidation->setShowInputMessage(true);
                    $coteValidation->setShowErrorMessage(true);
                    $coteValidation->setShowDropDown(true);
                    $coteValidation->setErrorTitle('Erreur de saisie');
                    $coteValidation->setError('Veuillez sélectionner une valeur dans la liste');
                    $coteValidation->setPromptTitle('Côté');
                    $coteValidation->setPrompt('Sélectionnez le côté');
                    $coteValidation->setFormula1('"Unilatéral,Bilatéral"');
                    
                    // Appliquer la validation à toutes les lignes de données
                    for ($i = 2; $i < $row; $i++) {
                        $sheet->getCell($coteColumn . $i)->setDataValidation(clone $coteValidation);
                    }
                }
            }

            // Générer le fichier avec un nom adapté
            $writer = IOFactory::createWriter($spreadsheet, 'Xlsx');
            $typeLabel = $isAppareilAuditif ? 'appareil_auditif' : ($isLunettes ? 'lunettes' : 'general');
            $fileName = 'liste_participants_oui_' . $typeLabel . '_' . str_replace(' ', '_', $campagne->nom) . '_' . date('Y-m-d_His') . '.xlsx';
            
            // Utiliser le répertoire temporaire du système
            $tempDir = sys_get_temp_dir();
            $tempFile = $tempDir . '/' . $fileName;
            
            Log::info('Écriture du fichier', ['path' => $tempFile]);
            
            $writer->save($tempFile);
            
            if (!file_exists($tempFile)) {
                throw new \Exception('Le fichier n\'a pas pu être créé : ' . $tempFile);
            }

            Log::info('Export participants réussi', [
                'campagne_id' => $campagneId,
                'type_assistance' => $typeAssistance,
                'format' => $isAppareilAuditif ? 'Appareil Auditif (13 colonnes)' : 'Lunettes (12 colonnes)',
                'nombre_participants' => $participants->count(),
                'file_size' => filesize($tempFile)
            ]);

            // Retourner le fichier
            return response()->download($tempFile, $fileName)->deleteFileAfterSend(true);

        } catch (\Exception $e) {
            Log::error('Erreur exportParticipantsAcceptes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'campagne_id' => $campagneId,
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'export',
                'error' => config('app.debug') ? $e->getMessage() : 'Une erreur est survenue'
            ], 500);
        }
    }
}