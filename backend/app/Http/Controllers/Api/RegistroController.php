<?php

namespace App\Http\Controllers\Api;

use App\Models\Registro;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegistroStoreRequest;
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

    public function store(RegistroStoreRequest $request)
    {
        $validated = $request->validated();

        // Si el usuario es admin, puede enviar un user_id manual. Si no, usamos el del token.
        $userId = ($request->user()->rol === 'superadmin' && $request->has('user_id'))
            ? $validated['user_id']
            : $request->user()->id;

        $registro = Registro::create(array_merge($validated, ['user_id' => $userId]));

        return response()->json($registro->load('proceso', 'proyecto'), 201);
    }
}
