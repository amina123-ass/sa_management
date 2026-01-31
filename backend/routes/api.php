<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\DictionaryController;
use App\Http\Controllers\Api\CampagneController;
use App\Http\Controllers\Api\BeneficiaireController;
use App\Http\Controllers\Api\KafalaController;
use App\Http\Controllers\Api\AssistanceMedicaleController;
use App\Http\Controllers\Api\ReceptionController;
use App\Http\Controllers\Api\StatistiquesController;

// Routes publiques
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-email', [AuthController::class, 'verifyEmailAndCompleteAccount']);
    Route::post('/resend-verification', [AuthController::class, 'resendVerificationEmail']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/security-questions', [AuthController::class, 'getSecurityQuestions']);
    Route::post('/verify-security-answers', [AuthController::class, 'verifySecurityAnswersAndResetPassword']);
    Route::get('/security-questions/all', [AuthController::class, 'getAllSecurityQuestions']);
});

// Routes protégées (nécessitent authentification)
Route::middleware('auth:sanctum')->group(function () {
    
    // Authentification
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });

    // Routes Admin SI uniquement
    Route::middleware('admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        
        // Gestion des utilisateurs
        Route::prefix('users')->group(function () {
            Route::get('/', [AdminController::class, 'getUsers']);
            Route::get('/{id}', [AdminController::class, 'getUser']);
            Route::patch('/{id}/toggle-status', [AdminController::class, 'toggleUserStatus']);
            Route::patch('/{id}/assign-role', [AdminController::class, 'assignRole']);
            Route::post('/{id}/reset-password', [AdminController::class, 'resetUserPassword']);
            Route::patch('/{id}/unlock', [AdminController::class, 'unlockUser']);
            Route::delete('/{id}', [AdminController::class, 'deleteUser']);
        });
        
        // Gestion des rôles
        Route::prefix('roles')->group(function () {
            Route::get('/', [RoleController::class, 'index']);
            Route::get('/permissions', [RoleController::class, 'getAvailablePermissions']);
            Route::get('/{id}', [RoleController::class, 'show']);
            Route::post('/', [RoleController::class, 'store']);
            Route::put('/{id}', [RoleController::class, 'update']);
            Route::delete('/{id}', [RoleController::class, 'destroy']);
            Route::patch('/{id}/toggle-status', [RoleController::class, 'toggleStatus']);
        });
        
        // Gestion des dictionnaires (CRUD complet pour admin)
        Route::prefix('dictionaries')->group(function () {
            Route::post('/{dictionary}', [DictionaryController::class, 'store']);
            Route::put('/{dictionary}/{id}', [DictionaryController::class, 'update']);
            Route::delete('/{dictionary}/{id}', [DictionaryController::class, 'destroy']);
            Route::patch('/{dictionary}/{id}/toggle-status', [DictionaryController::class, 'toggleStatus']);
        });
        
        Route::get('/audit-logs', [AdminController::class, 'getAuditLogs']);
    });

    // Routes UAS
    Route::middleware(['role:responsable_uas'])->prefix('uas')->group(function () {
        
        // Gestion des campagnes
        Route::prefix('campagnes')->group(function () {
            Route::get('/', [CampagneController::class, 'index']);
            Route::get('/{id}', [CampagneController::class, 'show']);
            Route::post('/', [CampagneController::class, 'store']);
            Route::put('/{id}', [CampagneController::class, 'update']);
            Route::delete('/{id}', [CampagneController::class, 'destroy']);
            Route::get('/{id}/statistiques', [CampagneController::class, 'statistiques']);
        });

        // Gestion des statistiques avancées
        Route::prefix('statistiques')->group(function () {
            Route::get('/campagnes', [StatistiquesController::class, 'getCampagnesList']);
            Route::get('/campagnes/{campagneId}', [StatistiquesController::class, 'getStatistiquesCampagne']);
            Route::get('/campagnes/{campagneId}/export', [StatistiquesController::class, 'exporterStatistiques']);
            Route::get('/evolution', [StatistiquesController::class, 'getStatistiquesEvolution']);
        });

        // Gestion des bénéficiaires
        Route::prefix('beneficiaires')->group(function () {
            Route::get('/', [BeneficiaireController::class, 'index']);
            
            // IMPORTANT : Routes spécifiques AVANT les routes avec {id}
            Route::post('/import', [BeneficiaireController::class, 'import']);
            
            // Gestion des participants par campagne
            Route::get('/campagne/{campagneId}/participants', [BeneficiaireController::class, 'getParticipantsByCampagne']);
            Route::get('/campagne/{campagneId}/participants/export', [BeneficiaireController::class, 'exportParticipantsAcceptes']);
            
            // Routes avec {id} à la fin pour éviter les conflits
            Route::get('/{id}', [BeneficiaireController::class, 'show']);
            Route::post('/', [BeneficiaireController::class, 'store']);
            Route::put('/{id}', [BeneficiaireController::class, 'update']);
            Route::put('/{id}/update-participant', [BeneficiaireController::class, 'updateParticipant']);
            Route::delete('/{id}', [BeneficiaireController::class, 'destroy']);
            Route::post('/{id}/convertir-en-participant', [BeneficiaireController::class, 'convertirEnParticipant']);
            Route::get('/campagnes/{campagneId}/participants', [BeneficiaireController::class, 'getParticipantsByCampagne']);
            Route::get('/campagnes/{campagneId}/liste-principale', [BeneficiaireController::class, 'getListePrincipale']);
            Route::get('/campagnes/{campagneId}/liste-attente', [BeneficiaireController::class, 'getListeAttente']);
            Route::get('/campagnes/{campagneId}/liste-refusee', [BeneficiaireController::class, 'getListeRefusee']);
            Route::get('/campagnes/{campagneId}/statistiques-listes', [BeneficiaireController::class, 'getStatistiquesListes']);
        });

        // Gestion kafala
        Route::prefix('kafalas')->group(function () {
            Route::get('/', [KafalaController::class, 'index']);
            Route::get('/{id}', [KafalaController::class, 'show']);
            Route::post('/', [KafalaController::class, 'store']);
            Route::put('/{id}', [KafalaController::class, 'update']);
            Route::delete('/{id}', [KafalaController::class, 'destroy']);
            Route::post('/{id}/documents', [KafalaController::class, 'uploadDocument']);
            Route::delete('/{kafalaId}/documents/{documentId}', [KafalaController::class, 'deleteDocument']);
            
            Route::get('/{kafalaId}/documents/{documentId}/view', [KafalaController::class, 'getDocument']);
            Route::get('/{kafalaId}/documents/{documentId}/download', [KafalaController::class, 'downloadDocument']);
        });

        // Gestion assistances médicales
        Route::prefix('assistances-medicales')->group(function () {
            Route::get('/', [AssistanceMedicaleController::class, 'index']);
            Route::get('/{id}', [AssistanceMedicaleController::class, 'show']);
            Route::post('/', [AssistanceMedicaleController::class, 'store']);
            Route::put('/{id}', [AssistanceMedicaleController::class, 'update']);
            Route::delete('/{id}', [AssistanceMedicaleController::class, 'destroy']);
            Route::post('/{id}/retour-materiel', [AssistanceMedicaleController::class, 'retourMateriel']);
        });
    });

    // Routes Réception
    Route::middleware(['role:reception'])->prefix('reception')->group(function () {
        
        // Campagnes (lecture seule pour Réception)
        Route::get('/campagnes', [CampagneController::class, 'index']);
        Route::get('/campagnes/{id}', [CampagneController::class, 'show']);
        
        // Participants
        Route::prefix('participants')->group(function () {
            Route::get('/campagne/{campagneId}', [ReceptionController::class, 'getParticipants']);
            Route::post('/', [ReceptionController::class, 'storeParticipant']);
            Route::put('/{id}', [ReceptionController::class, 'updateParticipant']);
            Route::delete('/{id}', [ReceptionController::class, 'deleteParticipant']);
            
            // Import/Export
            Route::post('/import', [ReceptionController::class, 'importerParticipants']);
            Route::get('/canva/{campagneId}', [ReceptionController::class, 'genererCanva']);
            
            // Debug (à commenter en production)
            Route::get('/canva-debug/{campagneId}', [ReceptionController::class, 'debugCanva']);
            
            // Convocations
            Route::get('/{id}/convocation', [ReceptionController::class, 'genererConvocation']);
            
            // Statistiques
            Route::get('/statistiques/{campagneId}', [ReceptionController::class, 'statistiquesParticipants']);
        });
    });
    
    // Dictionnaires en lecture seule pour TOUS les utilisateurs authentifiés
    Route::prefix('dictionaries')->group(function () {
        Route::get('/{dictionary}', [DictionaryController::class, 'index']);
        Route::get('/{dictionary}/{id}', [DictionaryController::class, 'show']);
    });
    
    // Route pour récupérer les rôles actifs (accessible à tous)
    Route::get('/roles/active', [RoleController::class, 'getActiveRoles']);
});

// Route de test
Route::get('/test', function () {
    return response()->json([
        'message' => 'SA Management API is running',
        'version' => '1.0.0',
        'timestamp' => now()
    ]);
});

// Debug
Route::middleware('auth:sanctum')->get('/debug/user', function () {
    $user = auth()->user();
    return response()->json([
        'user' => $user,
        'role' => $user->role,
        'is_admin' => $user->role && $user->role->name === 'admin_si',
    ]);
});