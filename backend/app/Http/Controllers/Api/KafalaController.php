<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kafala;
use App\Models\KafalaDocument;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class KafalaController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Kafala::with('document');

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

    public function show($id)
    {
        try {
            $kafala = Kafala::with('document')->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $kafala
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Kafala non trouvée',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'numero_reference' => 'nullable|string|max:255|unique:kafalas,numero_reference',
            'pere_nom' => 'nullable|string|max:255',
            'pere_prenom' => 'nullable|string|max:255',
            'pere_cin' => 'nullable|string|max:50',
            'mere_nom' => 'nullable|string|max:255',
            'mere_prenom' => 'nullable|string|max:255',
            'mere_cin' => 'nullable|string|max:50',
            'date_mariage' => 'nullable|date|date_format:Y-m-d',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'adresse' => 'nullable|string|max:500',
            'enfant_nom' => 'nullable|string|max:255',
            'enfant_prenom' => 'nullable|string|max:255',
            'enfant_sexe' => 'nullable|in:M,F',
            'enfant_date_naissance' => 'nullable|date|date_format:Y-m-d',
            'document' => 'nullable|file|mimes:pdf|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $data = $request->except('document');
            if (empty($data['numero_reference'])) {
                $data['numero_reference'] = 'KAF-' . date('Y') . '-' . str_pad(Kafala::count() + 1, 5, '0', STR_PAD_LEFT);
            }

            $kafala = Kafala::create($data);

            if ($request->hasFile('document')) {
                $file = $request->file('document');
                $path = $file->store('kafala_documents', 'public');
                
                KafalaDocument::create([
                    'kafala_id' => $kafala->id,
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'type_mime' => $file->getMimeType(),
                    'taille' => $file->getSize(),
                ]);
            }

            DB::commit();

            $kafala->load('document');

            return response()->json([
                'success' => true,
                'message' => 'Dossier kafala créé avec succès',
                'data' => $kafala
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur création kafala: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        // ✅ Nettoyer les données avant validation
        $data = $request->all();
        
        // ✅ Supprimer _method et les champs vides
        $data = array_filter($data, function($value, $key) {
            return $value !== null && $value !== '' && $value !== 'null' && $key !== '_method';
        }, ARRAY_FILTER_USE_BOTH);

        $validator = Validator::make($data, [
            'numero_reference' => 'nullable|string|max:255|unique:kafalas,numero_reference,'.$id,
            'pere_nom' => 'nullable|string|max:255',
            'pere_prenom' => 'nullable|string|max:255',
            'pere_cin' => 'nullable|string|max:50',
            'mere_nom' => 'nullable|string|max:255',
            'mere_prenom' => 'nullable|string|max:255',
            'mere_cin' => 'nullable|string|max:50',
            'date_mariage' => 'nullable|date',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'adresse' => 'nullable|string|max:500',
            'enfant_nom' => 'nullable|string|max:255',
            'enfant_prenom' => 'nullable|string|max:255',
            'enfant_sexe' => 'nullable|in:M,F',
            'enfant_date_naissance' => 'nullable|date',
            'document' => 'nullable|file|mimes:pdf|max:5120',
            'delete_document' => 'nullable',
        ]);

        if ($validator->fails()) {
            \Log::error('Validation errors:', $validator->errors()->toArray());
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $kafala = Kafala::with('document')->findOrFail($id);
            
            $existingDocument = $kafala->document;
            
            // ✅ Exclure document, delete_document ET _method
            $updateData = $request->except(['document', 'delete_document', '_method']);
            $kafala->update($updateData);

            $shouldDeleteDocument = in_array($request->input('delete_document'), [true, 'true', '1', 1], true);
            
            if ($shouldDeleteDocument && !$request->hasFile('document')) {
                if ($existingDocument) {
                    Storage::disk('public')->delete($existingDocument->chemin_fichier);
                    $existingDocument->delete();
                    \Log::info("Document supprimé pour kafala ID: {$kafala->id}");
                }
            }

            if ($request->hasFile('document')) {
                if ($existingDocument) {
                    Storage::disk('public')->delete($existingDocument->chemin_fichier);
                    $existingDocument->delete();
                    \Log::info("Ancien document remplacé pour kafala ID: {$kafala->id}");
                }

                $file = $request->file('document');
                $path = $file->store('kafala_documents', 'public');
                
                KafalaDocument::create([
                    'kafala_id' => $kafala->id,
                    'nom_fichier' => $file->getClientOriginalName(),
                    'chemin_fichier' => $path,
                    'type_mime' => $file->getMimeType(),
                    'taille' => $file->getSize(),
                ]);
                
                \Log::info("Nouveau document ajouté pour kafala ID: {$kafala->id}");
            }

            DB::commit();

            $kafala->unsetRelation('document');
            $kafala->load('document');

            return response()->json([
                'success' => true,
                'message' => 'Kafala mise à jour avec succès',
                'data' => $kafala
            ], 200);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Erreur mise à jour kafala: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            
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
            DB::beginTransaction();

            $kafala = Kafala::findOrFail($id);
            
            $document = $kafala->document;
            if ($document) {
                Storage::disk('public')->delete($document->chemin_fichier);
                $document->delete();
            }

            $kafala->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Kafala supprimée avec succès'
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function getDocument($kafalaId, $documentId)
    {
        try {
            $document = KafalaDocument::where('kafala_id', $kafalaId)
                ->where('id', $documentId)
                ->firstOrFail();

            $path = storage_path('app/public/' . $document->chemin_fichier);

            if (!file_exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier introuvable'
                ], 404);
            }

            return response()->file($path, [
                'Content-Type' => $document->type_mime,
                'Content-Disposition' => 'inline; filename="' . $document->nom_fichier . '"'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement du document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function downloadDocument($kafalaId, $documentId)
    {
        try {
            $document = KafalaDocument::where('kafala_id', $kafalaId)
                ->where('id', $documentId)
                ->firstOrFail();

            $path = storage_path('app/public/' . $document->chemin_fichier);

            if (!file_exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier introuvable'
                ], 404);
            }

            return response()->download($path, $document->nom_fichier, [
                'Content-Type' => $document->type_mime,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function statistics()
    {
        try {
            $totalKafalas = Kafala::count();
            $avecPdf = Kafala::has('document')->count();
            $sansPdf = Kafala::doesntHave('document')->count();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'total_kafalas' => $totalKafalas,
                    'avec_pdf' => $avecPdf,
                    'sans_pdf' => $sansPdf,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du calcul des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}