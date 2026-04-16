<?php

namespace App\Http\Controllers\Api;

use App\Models\Registro;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegistroStoreRequest;
use App\Http\Requests\RegistroUpdateRequest;
use Illuminate\Http\Request;

class RegistroController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'fecha_inicio' => 'nullable|date_format:Y-m-d',
            'fecha_fin'    => 'nullable|date_format:Y-m-d|after_or_equal:fecha_inicio',
        ]);

        $user = $request->user();
        $query = Registro::with('proceso', 'proyecto');

        if ($user->rol !== 'superadmin') {
            $query->where('user_id', $user->id);
        }

        if ($request->filled('fecha_inicio')) {
            $query->whereDate('fecha', '>=', $request->fecha_inicio);
        }

        if ($request->filled('fecha_fin')) {
            $query->whereDate('fecha', '<=', $request->fecha_fin);
        }

        return response()->json($query->orderBy('fecha', 'desc')->get());
    }

    public function store(RegistroStoreRequest $request)
    {
        $validated = $request->validated();

        $userId = ($request->user()->rol === 'superadmin' && $request->has('user_id'))
            ? $validated['user_id']
            : $request->user()->id;

        $registro = Registro::create(array_merge($validated, ['user_id' => $userId]));

        return response()->json($registro->load('proceso', 'proyecto'), 201);
    }

    public function update(RegistroUpdateRequest $request, Registro $registro)
    {
        $user = $request->user();

        if ($user->rol !== 'superadmin' && $user->id !== $registro->user_id) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $registro->update($request->validated());
        return response()->json($registro->load('proceso', 'proyecto'));
    }

    public function destroy(Request $request, Registro $registro)
    {
        if ($request->user()->rol !== 'superadmin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $registro->delete();
        return response()->json(['message' => 'Registro eliminado correctamente']);
    }
}
