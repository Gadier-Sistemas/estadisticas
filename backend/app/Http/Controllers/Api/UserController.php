<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(User::all());
    }

    public function store(UserStoreRequest $request): JsonResponse
    {
        $validated = $request->validated();
        
        $user = new User();
        $user->name = $validated['name'];
        $user->lastname = $validated['apellido'] ?? null;
        $user->username = $validated['username'];
        $user->email = $validated['email'] ?? null;
        $user->password = Hash::make($validated['password']);
        $user->codigo = $validated['codigo'];
        $user->rol = $validated['rol'];
        $user->activo = $validated['activo'] ?? true;
        $user->cedula = $validated['cedula'] ?? null;
        $user->tipo_documento = $validated['tipoDocumento'] ?? null;
        $user->save();

        return response()->json($user, 201);
    }

    public function show(User $usuario): JsonResponse
    {
        return response()->json($usuario);
    }

    public function update(UserUpdateRequest $request, User $usuario): JsonResponse
    {
        $validated = $request->validated();

        if (array_key_exists('name', $validated)) $usuario->name = $validated['name'];
        if (array_key_exists('apellido', $validated)) $usuario->lastname = $validated['apellido'];
        if (array_key_exists('username', $validated)) $usuario->username = $validated['username'];
        if (array_key_exists('email', $validated)) $usuario->email = $validated['email'];
        if (array_key_exists('codigo', $validated)) $usuario->codigo = $validated['codigo'];
        if (array_key_exists('rol', $validated)) $usuario->rol = $validated['rol'];
        if (array_key_exists('activo', $validated)) $usuario->activo = $validated['activo'];
        if (array_key_exists('cedula', $validated)) $usuario->cedula = $validated['cedula'];
        if (array_key_exists('tipoDocumento', $validated)) $usuario->tipo_documento = $validated['tipoDocumento'];
        
        if (!empty($validated['password'])) {
            $usuario->password = Hash::make($validated['password']);
        }

        $usuario->save();

        return response()->json($usuario);
    }

    public function destroy(User $usuario): JsonResponse
    {
        $usuario->delete();
        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }
}
