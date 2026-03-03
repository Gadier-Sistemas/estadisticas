<?php

namespace App\Http\Controllers\Api;

use App\Models\Registro;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class RegistroController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($user->rol === 'superadmin') {
            return response()->json(Registro::with('proceso')->get());
        }

        return response()->json($user->registrations()->with('proceso')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'nullable|exists:users,id',
            'proyecto_id' => 'required|exists:proyectos,id',
            'proceso_codigo' => 'required|string',
            'fecha' => 'required|date',
            'cantidad' => 'required|integer',
            'tiempo' => 'required|string',
            'cliente' => 'nullable|string',
            'observaciones' => 'nullable|string',
            'tipo' => 'nullable|string',
            'novedad_tipo' => 'nullable|string',
        ]);

        // Si el usuario es admin, puede enviar un user_id manual. Si no, usamos el del token.
        $userId = ($request->user()->rol === 'superadmin' && $request->has('user_id'))
            ? $validated['user_id']
            : $request->user()->id;

        $registro = Registro::create(array_merge($validated, ['user_id' => $userId]));

        return response()->json($registro->load('proceso', 'proyecto'), 201);
    }
}
