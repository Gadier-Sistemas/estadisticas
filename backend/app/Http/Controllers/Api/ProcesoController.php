<?php

namespace App\Http\Controllers\Api;

use App\Models\Proceso;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProcesoStoreRequest;
use App\Http\Requests\ProcesoUpdateRequest;
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
    public function store(ProcesoStoreRequest $request)
    {
        $validated = $request->validated();

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
    public function update(ProcesoUpdateRequest $request, string $codigo)
    {
        $proceso = Proceso::findOrFail($codigo);
        $validated = $request->validated();

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
