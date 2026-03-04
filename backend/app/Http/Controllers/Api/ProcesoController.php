<?php

namespace App\Http\Controllers\Api;

use App\Models\Proceso;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProcesoController extends Controller
{
    /**
     * Lista todos los procesos disponibles.
     */
    public function index()
    {
        return response()->json(Proceso::orderBy('categoria')->orderBy('codigo')->get());
    }

    /**
     * Almacena un nuevo proceso (solo superadmin).
     */
    public function store(Request $request)
    {
        if ($request->user()->rol !== 'superadmin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'codigo' => 'required|string|unique:procesos,codigo',
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'tipo_proceso' => 'nullable|string|max:100',
            'servicio' => 'nullable|string|max:255',
            'proyecto_origen' => 'nullable|string|max:255',
            'unidad' => 'required|string|max:100',
            'meta_diaria' => 'required|integer|min:1',
            'meta_hora' => 'nullable|numeric',
            'meta_minuto' => 'nullable|numeric',
            'descripcion_actividad' => 'nullable|string',
        ]);

        // Calcular metas automáticas si no se proporcionan (jornada de 540 minutos)
        if (empty($validated['meta_hora'])) {
            $validated['meta_hora'] = round($validated['meta_diaria'] / 9, 4);
        }
        if (empty($validated['meta_minuto'])) {
            $validated['meta_minuto'] = round($validated['meta_diaria'] / 540, 6);
        }

        $proceso = Proceso::create($validated);
        return response()->json($proceso, 201);
    }

    /**
     * Muestra un proceso específico.
     */
    public function show(string $codigo)
    {
        $proceso = Proceso::findOrFail($codigo);
        return response()->json($proceso);
    }

    /**
     * Actualiza un proceso existente (solo superadmin).
     */
    public function update(Request $request, string $codigo)
    {
        if ($request->user()->rol !== 'superadmin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $proceso = Proceso::findOrFail($codigo);

        $validated = $request->validate([
            'nombre' => 'sometimes|string|max:255',
            'categoria' => 'sometimes|string|max:255',
            'tipo_proceso' => 'nullable|string|max:100',
            'servicio' => 'nullable|string|max:255',
            'proyecto_origen' => 'nullable|string|max:255',
            'unidad' => 'sometimes|string|max:100',
            'meta_diaria' => 'sometimes|integer|min:1',
            'meta_hora' => 'nullable|numeric',
            'meta_minuto' => 'nullable|numeric',
            'descripcion_actividad' => 'nullable|string',
        ]);

        // Recalcular metas si cambia meta_diaria
        if (isset($validated['meta_diaria'])) {
            if (empty($validated['meta_hora'])) {
                $validated['meta_hora'] = round($validated['meta_diaria'] / 9, 4);
            }
            if (empty($validated['meta_minuto'])) {
                $validated['meta_minuto'] = round($validated['meta_diaria'] / 540, 6);
            }
        }

        $proceso->update($validated);
        return response()->json($proceso);
    }

    /**
     * Elimina un proceso (solo superadmin).
     */
    public function destroy(Request $request, string $codigo)
    {
        if ($request->user()->rol !== 'superadmin') {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $proceso = Proceso::findOrFail($codigo);

        // Verificar que no tenga registros asociados
        if ($proceso->registros()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar: este proceso tiene registros de producción asociados.'
            ], 422);
        }

        $proceso->delete();
        return response()->json(['message' => 'Proceso eliminado correctamente']);
    }
}
