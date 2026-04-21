<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProcesoController;
use App\Http\Controllers\Api\RegistroController;
use App\Http\Controllers\Api\ProyectoController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Rutas Públicas
Route::post('/login', [AuthController::class , 'login'])->middleware('throttle:10,1')->name('login');

// Rutas Protegidas
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class , 'logout']);
    Route::get('/user', function (Request $request) {
            return $request->user();
        }
        );

        // Procesos (CRUD completo - crear/editar/eliminar solo superadmin)
        Route::apiResource('/procesos', ProcesoController::class)->only(['index', 'show']);
        Route::apiResource('/procesos', ProcesoController::class)->except(['index', 'show'])->middleware(['superadmin', 'throttle:30,1']);

        // Proyectos
        Route::apiResource('/proyectos', ProyectoController::class)->only(['index', 'show']);
        Route::apiResource('/proyectos', ProyectoController::class)->except(['index', 'show'])->middleware(['superadmin', 'throttle:30,1']);

        // Registros
        Route::get('/registros', [RegistroController::class , 'index']);
        Route::post('/registros', [RegistroController::class , 'store'])->middleware('throttle:60,1');
        Route::put('/registros/{registro}', [RegistroController::class , 'update'])->middleware('throttle:60,1');
        Route::delete('/registros/{registro}', [RegistroController::class , 'destroy'])->middleware('throttle:30,1');

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class , 'getStats']);
        Route::get('/dashboard/rendimiento', [DashboardController::class , 'getRendimiento']);

        // Usuarios (Solo Superadmin)
        Route::apiResource('/usuarios', UserController::class)->middleware(['superadmin', 'throttle:30,1']);
    });
