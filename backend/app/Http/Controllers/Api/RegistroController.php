<?php

namespace App\Http\Controllers\Api;

use App\Models\Registro;
use App\Http\Controllers\Controller;
use App\Http\Requests\RegistroStoreRequest;
use App\Http\Requests\RegistroUpdateRequest;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

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
        $registro->refresh();

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

    /**
     * Carga masiva de registros (modo tabla multi-actividad).
     * Acepta hasta 50 registros en un solo request, con validación por fila.
     * Transaccional: si al menos una fila falla, ninguna se persiste.
     */
    public function batch(Request $request)
    {
        $request->validate([
            'registros' => 'required|array|min:1|max:50',
        ]);

        $user = $request->user();
        $isSuperadmin = $user->rol === 'superadmin';
        $hoy = Carbon::now('America/Bogota')->toDateString();

        $itemRules = [
            'proyecto_id' => 'required|exists:proyectos,id',
            'proceso_codigo' => 'required|string|exists:procesos,codigo',
            'fecha' => 'required|date',
            'cantidad' => 'required|integer|min:1',
            'tiempo' => ['required', 'string', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/'],
            'media_jornada' => 'sometimes|boolean',
            'cliente' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string|max:1000',
            'tipo' => 'nullable|in:produccion,novedad_total',
            'novedad_tipo' => 'nullable|string|max:100',
        ];

        $errores = [];
        $normalizados = [];

        foreach ($request->input('registros') as $index => $item) {
            $v = Validator::make(is_array($item) ? $item : [], $itemRules);
            if ($v->fails()) {
                $errores[] = ['index' => $index, 'mensajes' => $v->errors()->all()];
                continue;
            }

            $data = $v->validated();

            if (!$isSuperadmin && $data['fecha'] !== $hoy) {
                $errores[] = ['index' => $index, 'mensajes' => ['Solo se permite registrar estadísticas del día actual.']];
                continue;
            }

            $data['user_id'] = $user->id;
            $normalizados[] = $data;
        }

        if (!empty($errores)) {
            return response()->json([
                'message' => 'Validación fallida. Ningún registro fue guardado.',
                'errores' => $errores,
            ], 422);
        }

        $creados = DB::transaction(function () use ($normalizados) {
            $ids = [];
            foreach ($normalizados as $data) {
                $reg = Registro::create($data);
                $reg->refresh();
                $ids[] = $reg->id;
            }
            return Registro::with('proceso', 'proyecto')->whereIn('id', $ids)->get();
        });

        return response()->json([
            'message' => 'Registros guardados correctamente',
            'total' => $creados->count(),
            'registros' => $creados,
        ], 201);
    }
}
