<?php

namespace App\Http\Controllers\Api;

use App\Models\Registro;
use App\Models\User;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function getStats(Request $request)
    {
        $today = now()->toDateString();

        $stats = [
            'total_operarios' => User::where('rol', 'operario')->count(),
            'operarios_activos' => User::where('rol', 'operario')->where('activo', true)->count(),
            'registros_hoy' => Registro::where('fecha', $today)->count(),
            'total_unidades_hoy' => Registro::where('fecha', $today)->sum('cantidad'),
            // Weekly production (last 7 days)
            'produccion_semanal' => Registro::select(DB::raw('DATE(fecha) as date'), DB::raw('SUM(cantidad) as total'))
            ->where('fecha', '>=', now()->subDays(7))
            ->groupBy('date')
            ->get(),
            // Production by Project (Top 5)
            'produccion_por_proyecto' => DB::table('registros')
            ->join('proyectos', 'registros.proyecto_id', '=', 'proyectos.id')
            ->select('proyectos.nombre', DB::raw('SUM(registros.cantidad) as total'))
            ->groupBy('proyectos.nombre')
            ->orderByDesc('total')
            ->limit(5)
            ->get()
        ];

        return response()->json($stats);
    }
}
