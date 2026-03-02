<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProcesoController;
use App\Http\Controllers\Api\RegistroController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rutas Públicas
Route::post('/login', [AuthController::class , 'login'])->name('login');

// Ruta de fallback para cuando Laravel intenta redirigir a 'login' por falta de token
Route::get('/login', function () {
    return response()->json(['message' => 'No autorizado. Por favor inicie sesión.'], 401);
});

// Rutas Protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::get('/user', function (Request $request) {
            return $request->user();
        }
        );

        // Procesos
        Route::get('/procesos', [ProcesoController::class , 'index']);

        // Registros
        Route::get('/registros', [RegistroController::class , 'index']);
        Route::post('/registros', [RegistroController::class , 'store']);

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class , 'getStats']);

        // Usuarios (Solo Superadmin - Lógica en el controlador)
        Route::apiResource('/usuarios', UserController::class);
    });
