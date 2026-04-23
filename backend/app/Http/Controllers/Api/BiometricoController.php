<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BiometricoRegistro;
use App\Models\Registro;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;

class BiometricoController extends Controller
{
    private const JORNADA_MIN = 540;
    private const UMBRAL_BAJO_RENDIMIENTO = 80.0;

    /**
     * Importa archivo del biométrico (hoja "Reporte de Excepciones").
     * Columnas esperadas (headers fila 3, datos desde fila 5):
     *   ID | Nombre | Departamento | Fecha | Entrada | Salida | Entrada2 | Salida2 |
     *   Retardos (Min) | Salida Temprano (Min) | Falta (Min) | Total (Min)
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB
        ]);

        $file = $request->file('file');

        $mimeReal = $file->getMimeType();
        $mimesPermitidos = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'application/octet-stream',
        ];
        if (!in_array($mimeReal, $mimesPermitidos, true)) {
            return response()->json(['message' => 'Tipo de archivo no permitido.'], 422);
        }

        try {
            $reader = IOFactory::createReaderForFile($file->getRealPath());
            $reader->setReadDataOnly(true);
            $spreadsheet = $reader->load($file->getRealPath());
        } catch (\Throwable $e) {
            Log::warning('biometrico.import.read_error', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'No se pudo leer el archivo.'], 422);
        }

        // Buscar la hoja "Reporte de Excepciones" (con tolerancia a variaciones)
        $hojaExcepciones = null;
        foreach ($spreadsheet->getSheetNames() as $name) {
            if (stripos($name, 'excepcion') !== false) {
                $hojaExcepciones = $spreadsheet->getSheetByName($name);
                break;
            }
        }
        if (!$hojaExcepciones) {
            return response()->json([
                'message' => 'No se encontró la hoja "Reporte de Excepciones".',
            ], 422);
        }

        $rows = $hojaExcepciones->toArray(null, false, false, false);

        // Datos empiezan en fila 5 (índice 4). Las primeras 4 son headers y título.
        $dataRows = array_slice($rows, 4);

        $nuevos = 0;
        $actualizados = 0;
        $ignorados = 0;

        try {
            DB::transaction(function () use ($dataRows, &$nuevos, &$actualizados, &$ignorados) {
                foreach ($dataRows as $idx => $row) {
                    // Saltar filas sin datos en columnas clave: ID (0), Fecha (3)
                    $cedula = isset($row[0]) ? trim((string) $row[0]) : '';
                    $fechaRaw = $row[3] ?? null;

                    if ($cedula === '' || !ctype_digit($cedula)) {
                        $ignorados++;
                        continue;
                    }

                    $fecha = $this->parseFecha($fechaRaw);
                    if (!$fecha) {
                        $ignorados++;
                        continue;
                    }

                    $nombre = isset($row[1]) ? substr(trim((string) $row[1]), 0, 200) : null;
                    $entrada = $this->parseHora($row[4] ?? null);
                    $salida1 = $this->parseHora($row[5] ?? null);
                    $entrada2 = $this->parseHora($row[6] ?? null);
                    $salida = $this->parseHora($row[7] ?? null);
                    $retardo = $this->parseMinutos($row[8] ?? 0);
                    $salidaTemp = $this->parseMinutos($row[9] ?? 0);
                    $falta = min(self::JORNADA_MIN, $this->parseMinutos($row[10] ?? 0));

                    $horaEntrada = $entrada ?: $entrada2;
                    $horaSalida = $salida ?: $salida1;
                    $minTrabajados = max(0, self::JORNADA_MIN - $falta);
                    $ausente = $falta >= self::JORNADA_MIN;

                    $existente = BiometricoRegistro::where('cedula', $cedula)
                        ->where('fecha', $fecha)
                        ->exists();

                    BiometricoRegistro::updateOrCreate(
                        ['cedula' => $cedula, 'fecha' => $fecha],
                        [
                            'nombre_biometrico' => $nombre,
                            'hora_entrada' => $horaEntrada,
                            'hora_salida' => $horaSalida,
                            'retardo_min' => $retardo,
                            'salida_temprano_min' => $salidaTemp,
                            'falta_min' => $falta,
                            'minutos_trabajados' => $minTrabajados,
                            'ausente' => $ausente,
                        ]
                    );

                    $existente ? $actualizados++ : $nuevos++;
                }
            });
        } catch (\Throwable $e) {
            Log::error('biometrico.import.db_error', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json(['message' => 'Error al persistir los datos.'], 500);
        }

        Log::info('biometrico.import.ok', [
            'user_id' => $request->user()?->id,
            'nuevos' => $nuevos,
            'actualizados' => $actualizados,
            'ignorados' => $ignorados,
        ]);

        return response()->json([
            'message' => 'Importación exitosa',
            'nuevos' => $nuevos,
            'actualizados' => $actualizados,
            'ignorados' => $ignorados,
            'total' => $nuevos + $actualizados,
        ], 200);
    }

    /**
     * Cruce de biométrico con registros de estadísticas para una fecha.
     * Devuelve listas categorizadas: ausencias no reportadas, inconsistencias, bajo rendimiento.
     */
    public function cruce(Request $request)
    {
        $request->validate([
            'fecha' => 'required|date_format:Y-m-d',
        ]);

        $fecha = $request->get('fecha');

        // Biométrico del día
        $biometricos = BiometricoRegistro::where('fecha', $fecha)->get()->keyBy('cedula');

        // Registros (estadística) del día, con user y proceso
        $registros = Registro::with('user', 'proceso')
            ->whereDate('fecha', $fecha)
            ->get();

        // Agrupar registros por user_id (un operario puede tener varios)
        $regsPorUserId = $registros->groupBy('user_id');

        $users = User::where('rol', 'operario')
            ->where('activo', true)
            ->get();

        $ausenciasNoReportadas = [];
        $inconsistencias = [];
        $bajoRendimiento = [];
        $cedulasSinUsuario = [];

        // Caso 1 y 2: iterar usuarios activos y cruzar
        foreach ($users as $u) {
            $cedula = $u->cedula;
            $bio = $cedula ? ($biometricos[$cedula] ?? null) : null;
            $regs = $regsPorUserId->get($u->id, collect());
            $tieneProduccion = $regs->where('tipo', '!=', 'novedad_total')->count() > 0;
            $tieneNovedad = $regs->where('tipo', 'novedad_total')->count() > 0;

            // Ausencia biométrica sin novedad reportada
            if ($bio && $bio->ausente && !$tieneNovedad) {
                $ausenciasNoReportadas[] = [
                    'user_id' => $u->id,
                    'cedula' => $cedula,
                    'nombre' => trim($u->name . ' ' . ($u->lastname ?? '')),
                ];
            }

            // Estadística registrada pero biométrico marca ausencia (inconsistencia)
            if ($bio && $bio->ausente && $tieneProduccion) {
                $inconsistencias[] = [
                    'user_id' => $u->id,
                    'cedula' => $cedula,
                    'nombre' => trim($u->name . ' ' . ($u->lastname ?? '')),
                    'tipo' => 'biometrico_ausente_con_produccion',
                ];
            }

            // Producción sin marcaje biométrico en absoluto
            if (!$bio && $tieneProduccion) {
                $inconsistencias[] = [
                    'user_id' => $u->id,
                    'cedula' => $cedula,
                    'nombre' => trim($u->name . ' ' . ($u->lastname ?? '')),
                    'tipo' => 'produccion_sin_biometrico',
                ];
            }

            // Bajo rendimiento (sobre el total del día del operario)
            if ($tieneProduccion) {
                $rendimiento = $this->calcularRendimiento($regs);
                if ($rendimiento < self::UMBRAL_BAJO_RENDIMIENTO) {
                    $bajoRendimiento[] = [
                        'user_id' => $u->id,
                        'cedula' => $cedula,
                        'nombre' => trim($u->name . ' ' . ($u->lastname ?? '')),
                        'rendimiento' => round($rendimiento, 2),
                    ];
                }
            }
        }

        // Caso 3: cédulas del biométrico sin usuario asociado
        $cedulasUsers = $users->pluck('cedula')->filter()->all();
        foreach ($biometricos as $cedula => $bio) {
            if (!in_array($cedula, $cedulasUsers, true)) {
                $cedulasSinUsuario[] = [
                    'cedula' => $cedula,
                    'nombre_biometrico' => $bio->nombre_biometrico,
                    'ausente' => $bio->ausente,
                ];
            }
        }

        return response()->json([
            'fecha' => $fecha,
            'umbral_bajo_rendimiento' => self::UMBRAL_BAJO_RENDIMIENTO,
            'resumen' => [
                'ausencias_no_reportadas' => count($ausenciasNoReportadas),
                'inconsistencias' => count($inconsistencias),
                'bajo_rendimiento' => count($bajoRendimiento),
                'cedulas_sin_usuario' => count($cedulasSinUsuario),
            ],
            'ausencias_no_reportadas' => $ausenciasNoReportadas,
            'inconsistencias' => $inconsistencias,
            'bajo_rendimiento' => $bajoRendimiento,
            'cedulas_sin_usuario' => $cedulasSinUsuario,
        ]);
    }

    private function calcularRendimiento($registros): float
    {
        $totalCantidad = 0;
        $totalEsperada = 0;
        foreach ($registros as $reg) {
            if ($reg->tipo === 'novedad_total' || !$reg->proceso) {
                continue;
            }
            $meta = (int) $reg->proceso->meta_diaria;
            if ($meta <= 0) continue;

            $min = $this->tiempoAMinutos($reg->tiempo ?? '0:00');
            $jornada = ((bool) ($reg->media_jornada ?? false)) ? 270 : self::JORNADA_MIN;
            $esperada = ($meta / $jornada) * $min;

            $totalCantidad += (int) $reg->cantidad;
            $totalEsperada += $esperada;
        }
        return $totalEsperada > 0 ? ($totalCantidad / $totalEsperada) * 100 : 0;
    }

    private function tiempoAMinutos(string $tiempo): int
    {
        $partes = explode(':', $tiempo);
        $h = intval($partes[0] ?? 0);
        $m = intval($partes[1] ?? 0);
        return ($h * 60) + $m;
    }

    private function parseFecha($raw): ?string
    {
        if ($raw === null || $raw === '') return null;
        // Formato común del reporte: "2026-03-23"
        $s = trim((string) $raw);
        try {
            $d = Carbon::parse($s);
            return $d->toDateString();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function parseHora($raw): ?string
    {
        if ($raw === null || $raw === '') return null;
        $s = trim((string) $raw);
        if (!preg_match('/^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $s)) {
            return null;
        }
        return substr($s, 0, 5); // HH:MM
    }

    private function parseMinutos($raw): int
    {
        if ($raw === null || $raw === '') return 0;
        if (is_numeric($raw)) {
            $n = (int) $raw;
            return $n < 0 ? 0 : min(65535, $n); // cap al máximo unsignedSmallInteger
        }
        return 0;
    }
}
