<?php

namespace App\Http\Controllers\Api;

use App\Models\Registro;
use App\Models\Proceso;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Constante: minutos de jornada laboral (9 horas = 540 minutos).
     */
    private const JORNADA_MINUTOS = 540;

    /**
     * Estadísticas generales del dashboard.
     */
    public function getStats(Request $request)
    {
        $today = now()->toDateString();

        $stats = [
            'total_operarios' => User::where('rol', 'operario')->count(),
            'operarios_activos' => User::where('rol', 'operario')->where('activo', true)->count(),
            'registros_hoy' => Registro::where('fecha', $today)->count(),
            'total_unidades_hoy' => Registro::where('fecha', $today)->sum('cantidad'),

            // Producción semanal (últimos 7 días)
            'produccion_semanal' => Registro::select(
            DB::raw('DATE(fecha) as date'),
            DB::raw('SUM(cantidad) as total')
        )
            ->where('fecha', '>=', now()->subDays(7))
            ->groupBy('date')
            ->orderBy('date')
            ->get(),

            // Producción por proyecto (Top 5)
            'produccion_por_proyecto' => DB::table('registros')
            ->join('proyectos', 'registros.proyecto_id', '=', 'proyectos.id')
            ->select('proyectos.nombre', DB::raw('SUM(registros.cantidad) as total'))
            ->groupBy('proyectos.nombre')
            ->orderByDesc('total')
            ->limit(5)
            ->get(),

            // Rendimiento global del día
            'rendimiento_hoy' => $this->calcularRendimientoGlobal($today),
        ];

        return response()->json($stats);
    }

    /**
     * Endpoint de rendimiento detallado por operario.
     * Replica la hoja "Oper.Nombre" del Excel V3.
     *
     * Fórmula del Excel:
     *   Producción Esperada = (Meta Diaria / 540) * Minutos Trabajados
     *   % Rendimiento = Cantidad / Producción Esperada
     */
    public function getRendimiento(Request $request)
    {
        $request->validate([
            'fecha'   => 'nullable|date_format:Y-m-d',
            'user_id' => 'nullable|integer|exists:users,id',
        ]);

        $fecha = $request->get('fecha', now()->toDateString());
        $userId = $request->get('user_id');

        $query = Registro::with(['proceso', 'user', 'proyecto'])
            ->where('fecha', $fecha)
            ->where('tipo', '!=', 'novedad');

        // Si es operario, solo sus registros
        if ($request->user()->rol !== 'superadmin') {
            $query->where('user_id', $request->user()->id);
        }
        elseif ($userId) {
            $query->where('user_id', $userId);
        }

        $registros = $query->get();

        $detalle = $registros->map(function ($registro) {
            $proceso = $registro->proceso;
            $minutosTrabajos = $this->tiempoAMinutos($registro->tiempo);
            $metaDiaria = $proceso ? $proceso->meta_diaria : 0;

            // Fórmula del Excel: Producción Esperada = (Meta / 540) * Minutos
            $produccionEsperada = $metaDiaria > 0 && self::JORNADA_MINUTOS > 0
                ? ($metaDiaria / self::JORNADA_MINUTOS) * $minutosTrabajos
                : 0;

            // % Rendimiento = Cantidad / Producción Esperada
            $rendimiento = $produccionEsperada > 0
                ? round(($registro->cantidad / $produccionEsperada) * 100, 2)
                : 0;

            // Semáforo: 🟢 >= 90%, 🟡 70%-89%, 🔴 < 70%
            $semaforo = $rendimiento >= 90 ? 'verde' : ($rendimiento >= 70 ? 'amarillo' : 'rojo');

            return [
            'id' => $registro->id,
            'operario' => $registro->user ? $registro->user->name . ' ' . $registro->user->lastname : 'N/A',
            'proceso_codigo' => $registro->proceso_codigo,
            'proceso_nombre' => $proceso ? $proceso->nombre : 'N/A',
            'proyecto' => $registro->proyecto ? $registro->proyecto->nombre : 'N/A',
            'cantidad' => $registro->cantidad,
            'tiempo' => $registro->tiempo,
            'minutos_trabajados' => $minutosTrabajos,
            'meta_diaria' => $metaDiaria,
            'produccion_esperada' => round($produccionEsperada, 2),
            'rendimiento_porcentaje' => $rendimiento,
            'rendimiento_faltante' => round(max(0, 100 - $rendimiento), 2),
            'semaforo' => $semaforo,
            'unidad' => $proceso ? $proceso->unidad : 'N/A',
            'observaciones' => $registro->observaciones,
            ];
        });

        // Resumen consolidado (replica hoja "Resumen" del Excel)
        $resumen = $detalle->groupBy('proceso_codigo')->map(function ($grupo) {
            $totalCantidad = $grupo->sum('cantidad');
            $totalEsperada = $grupo->sum('produccion_esperada');
            $rendimientoGlobal = $totalEsperada > 0
                ? round(($totalCantidad / $totalEsperada) * 100, 2)
                : 0;

            return [
            'proceso' => $grupo->first()['proceso_nombre'],
            'unidad' => $grupo->first()['unidad'],
            'produccion_realizada' => $totalCantidad,
            'produccion_esperada' => round($totalEsperada, 2),
            'rendimiento' => $rendimientoGlobal,
            'rendimiento_faltante' => round(max(0, 100 - $rendimientoGlobal), 2),
            'semaforo' => $rendimientoGlobal >= 90 ? 'verde' : ($rendimientoGlobal >= 70 ? 'amarillo' : 'rojo'),
            ];
        })->values();

        return response()->json([
            'fecha' => $fecha,
            'detalle' => $detalle,
            'resumen' => $resumen,
            'total_registros' => $detalle->count(),
        ]);
    }

    /**
     * Calcula el rendimiento global del día (promedio ponderado).
     */
    private function calcularRendimientoGlobal(string $fecha): array
    {
        $registros = Registro::with('proceso')
            ->where('fecha', $fecha)
            ->where('tipo', '!=', 'novedad')
            ->get();

        if ($registros->isEmpty()) {
            return ['porcentaje' => 0, 'semaforo' => 'gris', 'total_registros' => 0];
        }

        $totalCantidad = 0;
        $totalEsperada = 0;

        foreach ($registros as $registro) {
            $proceso = $registro->proceso;
            if (!$proceso || $proceso->meta_diaria <= 0)
                continue;

            $minutos = $this->tiempoAMinutos($registro->tiempo);
            $esperada = ($proceso->meta_diaria / self::JORNADA_MINUTOS) * $minutos;

            $totalCantidad += $registro->cantidad;
            $totalEsperada += $esperada;
        }

        $porcentaje = $totalEsperada > 0
            ? round(($totalCantidad / $totalEsperada) * 100, 2)
            : 0;

        return [
            'porcentaje' => $porcentaje,
            'semaforo' => $porcentaje >= 90 ? 'verde' : ($porcentaje >= 70 ? 'amarillo' : 'rojo'),
            'total_registros' => $registros->count(),
        ];
    }

    /**
     * Convierte un string de tiempo "HH:MM" o "HH:MM:SS" a minutos totales.
     */
    private function tiempoAMinutos(string $tiempo): int
    {
        $partes = explode(':', $tiempo);
        $horas = intval($partes[0] ?? 0);
        $minutos = intval($partes[1] ?? 0);
        return ($horas * 60) + $minutos;
    }
}
