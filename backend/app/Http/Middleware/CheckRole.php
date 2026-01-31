<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!auth()->check()) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié'
            ], 401);
        }

        $user = auth()->user();

        if (!$user->role) {
            return response()->json([
                'success' => false,
                'message' => 'Aucun rôle attribué'
            ], 403);
        }

        if ($user->role->name !== $role) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé pour ce rôle'
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Compte désactivé'
            ], 403);
        }

        return $next($request);
    }
}