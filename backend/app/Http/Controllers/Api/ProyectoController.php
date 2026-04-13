<?php

namespace App\Http\Controllers\Api;

use App\Models\Proyecto;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProyectoStoreRequest;
use App\Http\Requests\ProyectoUpdateRequest;
use Illuminate\Http\JsonResponse;

class ProyectoController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Proyecto::all());
    }

    public function store(ProyectoStoreRequest $request): JsonResponse
    {
        $proyecto = Proyecto::create($request->validated());
        return response()->json($proyecto, 201);
    }

    public function show(Proyecto $proyecto): JsonResponse
    {
        return response()->json($proyecto);
    }

    public function update(ProyectoUpdateRequest $request, Proyecto $proyecto): JsonResponse
    {
        $proyecto->update($request->validated());
        return response()->json($proyecto);
    }

    public function destroy(Proyecto $proyecto): JsonResponse
    {
        if (request()->user() && request()->user()->rol !== 'superadmin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        if ($proyecto->registros()->exists()) {
            return response()->json(['message' => 'El proyecto tiene registros asociados y no puede ser eliminado. Desactívelo en su lugar.'], 422);
        }

        $proyecto->delete();
        return response()->json(['message' => 'Proyecto eliminado']);
    }
}
