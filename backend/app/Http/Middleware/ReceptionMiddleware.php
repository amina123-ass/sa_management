<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;

class ReceptionMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        Log::info('ReceptionMiddleware: Request received', [
            'path' => $request->path(),
            'method' => $request->method(),
        ]);

        if (!auth()->check()) {
            Log::warning('ReceptionMiddleware: User not authenticated');
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        $user = auth()->user();
        
        Log::info('ReceptionMiddleware: User authenticated', [
            'user_id' => $user->id,
            'email' => $user->email,
            'has_role' => $user->role !== null,
            'role_name' => $user->role?->name ?? 'N/A',
        ]);

        // Vérifier si l'utilisateur a le rôle reception
        if (!$user->role) {
            Log::warning('ReceptionMiddleware: User has no role assigned', [
                'user_id' => $user->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé. Aucun rôle attribué.'
            ], 403);
        }

        if ($user->role->name !== 'reception') {
            Log::warning('ReceptionMiddleware: User does not have reception role', [
                'user_id' => $user->id,
                'role' => $user->role->name,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé. Réservé à l\'acteur Réception.'
            ], 403);
        }

        // Vérifier si le compte est actif
        if (!$user->is_active) {
            Log::warning('ReceptionMiddleware: User account is inactive', [
                'user_id' => $user->id,
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Votre compte est désactivé'
            ], 403);
        }

        Log::info('ReceptionMiddleware: Access granted', [
            'user_id' => $user->id,
        ]);

        return $next($request);
    }
}