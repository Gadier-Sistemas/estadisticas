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
            'proceso_id' => 'required|exists:procesos,id',
            'fecha' => 'required|date',
            'cantidad' => 'required|integer',
            'tiempo' => 'required|string',
            'cliente' => 'nullable|string',
            'observaciones' => 'nullable|string',
        ]);

        $registro = $request->user()->registrations()->create($validated);

        return response()->json($registro, 201);
    }
}
