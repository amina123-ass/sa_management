<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // ✅ CRITIQUE: HandleCors DOIT être en PREPEND (avant tout)
        $middleware->prepend(\Illuminate\Http\Middleware\HandleCors::class);
        
        // ✅ Ajouter EnsureFrontendRequestsAreStateful pour Sanctum
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
        
        // ✅ Alias des middlewares personnalisés
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'role' => \App\Http\Middleware\CheckRole::class,
            'reception' => \App\Http\Middleware\ReceptionMiddleware::class,
        ]);
        
        // ✅ OPTIONNEL: Désactiver CSRF pour les routes API (si nécessaire)
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();
