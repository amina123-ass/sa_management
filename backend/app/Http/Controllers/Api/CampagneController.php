<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Campagne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CampagneController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Campagne::with('typeAssistance');

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('lieu', 'like', "%{$search}%")
                      ->orWhere('description', 'like', "%{$search}%");
                });
            }

            if ($request->has('statut') && !empty($request->statut)) {
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

            if ($request->has('type_assistance_id') && !empty($request->type_assistance_id)) {
                $query->where('type_assistance_id', $request->type_assistance_id);
            }

            $perPage = $request->get('per_page', 15);
            $campagnes = $query->orderBy('date_debut', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $campagnes
            ], 200);
        } catch (\Exception $e) {
            Log::error('Erreur dans CampagneController@index: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors du chargement des campagnes',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $campagne = Campagne::with('typeAssistance', 'beneficiaires')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $campagne
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur dans CampagneController@show: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de la campagne',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'nullable|string|max:255',
            'type_assistance_id' => 'nullable|exists:type_assistances,id',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'lieu' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'nombre_beneficiaires_prevus' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ], [
            'type_assistance_id.exists' => 'Le type d\'assistance sélectionné n\'existe pas',
            'date_fin.after_or_equal' => 'La date de fin doit être égale ou postérieure à la date de début',
            'budget.min' => 'Le budget doit être un nombre positif',
            'budget.numeric' => 'Le budget doit être un nombre',
            'nombre_beneficiaires_prevus.min' => 'Le nombre de bénéficiaires doit être positif',
            'nombre_beneficiaires_prevus.integer' => 'Le nombre de bénéficiaires doit être un entier',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Filtrer les valeurs nulles/vides
            $data = array_filter($request->all(), function($value) {
                return $value !== null && $value !== '';
            });

            $campagne = Campagne::create($data);
            $campagne->load('typeAssistance');

            return response()->json([
                'success' => true,
                'message' => 'Campagne créée avec succès',
                'data' => $campagne
            ], 201);
        } catch (\Exception $e) {
            Log::error('Erreur dans CampagneController@store: ' . $e->getMessage(), [
                'data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la campagne',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'nom' => 'nullable|string|max:255',
            'type_assistance_id' => 'nullable|exists:type_assistances,id',
            'date_debut' => 'nullable|date',
            'date_fin' => 'nullable|date|after_or_equal:date_debut',
            'lieu' => 'nullable|string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'nombre_beneficiaires_prevus' => 'nullable|integer|min:0',
            'description' => 'nullable|string',
        ], [
            'type_assistance_id.exists' => 'Le type d\'assistance sélectionné n\'existe pas',
            'date_fin.after_or_equal' => 'La date de fin doit être égale ou postérieure à la date de début',
            'budget.min' => 'Le budget doit être un nombre positif',
            'budget.numeric' => 'Le budget doit être un nombre',
            'nombre_beneficiaires_prevus.min' => 'Le nombre de bénéficiaires doit être positif',
            'nombre_beneficiaires_prevus.integer' => 'Le nombre de bénéficiaires doit être un entier',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $campagne = Campagne::findOrFail($id);
            
            // Filtrer les valeurs nulles/vides
            $data = array_filter($request->all(), function($value) {
                return $value !== null && $value !== '';
            });
            
            $campagne->update($data);
            $campagne->load('typeAssistance');

            return response()->json([
                'success' => true,
                'message' => 'Campagne mise à jour avec succès',
                'data' => $campagne
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur dans CampagneController@update: ' . $e->getMessage(), [
                'id' => $id,
                'data' => $request->all()
            ]);
            
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
            $campagne = Campagne::findOrFail($id);
            
            // Vérifier s'il y a des bénéficiaires associés
            $beneficiairesCount = $campagne->beneficiaires()->count();
            if ($beneficiairesCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Impossible de supprimer cette campagne car elle a {$beneficiairesCount} bénéficiaire(s) associé(s)"
                ], 400);
            }

            $campagne->delete();

            return response()->json([
                'success' => true,
                'message' => 'Campagne supprimée avec succès'
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur dans CampagneController@destroy: ' . $e->getMessage(), [
                'id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function statistiques($id)
    {
        try {
            $campagne = Campagne::with('beneficiaires')->findOrFail($id);
            $beneficiaires = $campagne->beneficiaires;

            $stats = [
                'campagne' => [
                    'nom' => $campagne->nom,
                    'statut' => $campagne->statut,
                    'budget' => $campagne->budget,
                    'nombre_prevus' => $campagne->nombre_beneficiaires_prevus,
                ],
                'beneficiaires' => [
                    'total' => $beneficiaires->count(),
                    'par_sexe' => [
                        'masculin' => $beneficiaires->where('sexe', 'M')->count(),
                        'feminin' => $beneficiaires->where('sexe', 'F')->count(),
                    ],
                    'par_tranche_age' => [
                        'moins_15' => $beneficiaires->filter(function($b) {
                            return $b->date_naissance && 
                                   Carbon::parse($b->date_naissance)->age < 15;
                        })->count(),
                        'entre_15_64' => $beneficiaires->filter(function($b) {
                            $age = $b->date_naissance ? Carbon::parse($b->date_naissance)->age : null;
                            return $age && $age >= 15 && $age <= 64;
                        })->count(),
                        'plus_64' => $beneficiaires->filter(function($b) {
                            return $b->date_naissance && 
                                   Carbon::parse($b->date_naissance)->age > 64;
                        })->count(),
                    ],
                    'par_decision' => [
                        'accepte' => $beneficiaires->where('decision', 'Accepté')->count(),
                        'en_attente' => $beneficiaires->where('decision', 'En attente')->count(),
                        'refuse' => $beneficiaires->where('decision', 'Refusé')->count(),
                    ],
                    'ont_beneficie' => $beneficiaires->where('a_beneficie', true)->count(),
                ],
                'taux_realisation' => $campagne->nombre_beneficiaires_prevus > 0 
                    ? round(($beneficiaires->count() / $campagne->nombre_beneficiaires_prevus) * 100, 2)
                    : 0,
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur dans CampagneController@statistiques: ' . $e->getMessage(), [
                'id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }

    public function getBeneficiaires($id, Request $request)
    {
        try {
            $campagne = Campagne::findOrFail($id);
            
            $query = $campagne->beneficiaires();

            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nom', 'like', "%{$search}%")
                      ->orWhere('prenom', 'like', "%{$search}%")
                      ->orWhere('cin', 'like', "%{$search}%");
                });
            }

            if ($request->has('decision') && !empty($request->decision)) {
                $query->where('decision', $request->decision);
            }

            $perPage = $request->get('per_page', 15);
            $beneficiaires = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $beneficiaires
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Campagne non trouvée'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Erreur dans CampagneController@getBeneficiaires: ' . $e->getMessage(), [
                'id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des bénéficiaires',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur serveur'
            ], 500);
        }
    }
}