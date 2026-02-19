<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoleController extends Controller
{
    /**
     * Liste tous les rôles (pour admin)
     */
    public function index(Request $request)
    {
        try {
            $query = Role::query();

            if ($request->has('is_active')) {
                $query->where('is_active', $request->is_active);
            }

            $roles = $query->withCount('users')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des rôles',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permissions disponibles
     */
    public function getAvailablePermissions()
    {
        try {
            $permissions = [
                // UAS Permissions
                'uas.campagnes.view' => 'Voir les campagnes',
                'uas.campagnes.create' => 'Créer des campagnes',
                'uas.campagnes.edit' => 'Modifier des campagnes',
                'uas.campagnes.delete' => 'Supprimer des campagnes',
                'uas.beneficiaires.view' => 'Voir les bénéficiaires',
                'uas.beneficiaires.create' => 'Créer des bénéficiaires',
                'uas.beneficiaires.edit' => 'Modifier des bénéficiaires',
                'uas.beneficiaires.delete' => 'Supprimer des bénéficiaires',
                'uas.kafalas.view' => 'Voir les kafalas',
                'uas.kafalas.create' => 'Créer des kafalas',
                'uas.kafalas.edit' => 'Modifier des kafalas',
                'uas.kafalas.delete' => 'Supprimer des kafalas',
                'uas.assistances.view' => 'Voir les assistances médicales',
                'uas.assistances.create' => 'Créer des assistances médicales',
                'uas.assistances.edit' => 'Modifier des assistances médicales',
                'uas.assistances.delete' => 'Supprimer des assistances médicales',
                
                // Réception Permissions
                'reception.campagnes.view' => 'Voir les campagnes (Réception)',
                'reception.participants.view' => 'Voir les participants',
                'reception.participants.create' => 'Créer des participants',
                'reception.participants.edit' => 'Modifier des participants',
                'reception.participants.delete' => 'Supprimer des participants',
                'reception.convocations.generate' => 'Générer des convocations',
                
                // Admin Permissions
                'admin.users.view' => 'Voir les utilisateurs',
                'admin.users.create' => 'Créer des utilisateurs',
                'admin.users.edit' => 'Modifier des utilisateurs',
                'admin.users.delete' => 'Supprimer des utilisateurs',
                'admin.roles.manage' => 'Gérer les rôles',
                'admin.dictionaries.manage' => 'Gérer les dictionnaires',
                'admin.audit.view' => 'Voir les logs d\'audit',
            ];

            return response()->json([
                'success' => true,
                'data' => $permissions
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des permissions',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer les rôles actifs (accessible à tous les utilisateurs authentifiés)
     */
    public function getActiveRoles()
    {
        try {
            $roles = Role::where('is_active', true)
                ->select('id', 'name', 'display_name', 'description')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $roles
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des rôles actifs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un rôle spécifique
     */
    public function show($id)
    {
        try {
            $role = Role::withCount('users')->findOrFail($id);
            
            return response()->json([
                'success' => true,
                'data' => $role
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Rôle non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Créer un nouveau rôle
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:roles,name|max:255',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $role = Role::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Rôle créé avec succès',
                'data' => $role
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour un rôle
     */
    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        // Empêcher la modification du rôle admin_si
        if ($role->name === 'admin_si') {
            return response()->json([
                'success' => false,
                'message' => 'Le rôle Admin SI ne peut pas être modifié'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255|unique:roles,name,' . $id,
            'display_name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'permissions' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $role->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Rôle mis à jour avec succès',
                'data' => $role
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un rôle
     */
    public function destroy($id)
    {
        try {
            $role = Role::findOrFail($id);

            // Empêcher la suppression du rôle admin_si
            if ($role->name === 'admin_si') {
                return response()->json([
                    'success' => false,
                    'message' => 'Le rôle Admin SI ne peut pas être supprimé'
                ], 403);
            }

            // Empêcher la suppression si des utilisateurs ont ce rôle
            if ($role->users()->count() > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer un rôle attribué à des utilisateurs'
                ], 422);
            }

            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Rôle supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Activer/Désactiver un rôle
     */
    public function toggleStatus($id)
    {
        try {
            $role = Role::findOrFail($id);

            // Empêcher la désactivation du rôle admin_si
            if ($role->name === 'admin_si') {
                return response()->json([
                    'success' => false,
                    'message' => 'Le rôle Admin SI ne peut pas être désactivé'
                ], 403);
            }

            $role->is_active = !$role->is_active;
            $role->save();

            return response()->json([
                'success' => true,
                'message' => 'Statut du rôle modifié avec succès',
                'data' => $role
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du changement de statut',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
