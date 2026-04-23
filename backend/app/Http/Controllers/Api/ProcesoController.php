<?php

namespace App\Http\Controllers\Api;

use App\Models\Proceso;
use App\Http\Controllers\Controller;
use App\Http\Requests\ProcesoStoreRequest;
use App\Http\Requests\ProcesoUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;

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

    /**
     * Importa procesos desde archivo Excel/CSV (solo superadmin).
     * Columnas esperadas (fila 1 = header):
     *   codigo | nombre | categoria | unidad | meta_diaria | tipo_proceso | servicio | descripcion_actividad
     * Los 5 primeros son obligatorios. Los últimos 3 son opcionales.
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:xlsx,xls,csv,txt|max:5120', // 5MB; txt admite CSV detectado como text/plain
        ]);

        $file = $request->file('file');

        // Validar MIME real (no solo extensión) para mitigar archivos maliciosos renombrados
        $mimeReal = $file->getMimeType();
        $mimesPermitidos = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
            'application/vnd.ms-excel', // xls
            'application/octet-stream', // algunos xlsx se reportan así
            'text/csv',
            'text/plain', // csv
            'application/csv',
        ];
        if (!in_array($mimeReal, $mimesPermitidos, true)) {
            return response()->json([
                'message' => 'Tipo de archivo no permitido.',
            ], 422);
        }

        try {
            $reader = IOFactory::createReaderForFile($file->getRealPath());
            $reader->setReadDataOnly(true); // No evaluar fórmulas
            $spreadsheet = $reader->load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $rows = $worksheet->toArray(null, false, false, false); // sin formatos
        } catch (\Throwable $e) {
            Log::warning('procesos.import.read_error', [
                'user_id' => $request->user()?->id,
                'error' => $e->getMessage(),
            ]);
            return response()->json([
                'message' => 'No se pudo leer el archivo. Verifique el formato.',
            ], 422);
        }

        if (count($rows) < 2) {
            return response()->json([
                'message' => 'El archivo no tiene filas de datos.',
            ], 422);
        }

        // Header map (normalizado)
        $header = array_map(
            fn($v) => strtolower(trim((string) $v)),
            $rows[0]
        );
        $colIndex = array_flip($header);

        $requeridas = ['codigo', 'nombre', 'categoria', 'unidad', 'meta_diaria'];
        foreach ($requeridas as $col) {
            if (!isset($colIndex[$col])) {
                return response()->json([
                    'message' => "Falta la columna obligatoria: {$col}",
                ], 422);
            }
        }

        $itemRules = [
            'codigo' => 'required|string|max:50',
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|string|in:OPERATIVO,CUSTODIA',
            'unidad' => 'required|string|max:50',
            'meta_diaria' => 'required|integer|min:1',
            'tipo_proceso' => 'nullable|string|max:100',
            'servicio' => 'nullable|string|max:100',
            'descripcion_actividad' => 'nullable|string|max:1000',
        ];

        $errores = [];
        $normalizados = [];

        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            // Saltar filas totalmente vacías
            $soloVacios = array_filter($row, fn($v) => $v !== null && $v !== '');
            if (empty($soloVacios)) {
                continue;
            }

            $data = [];
            foreach ($itemRules as $field => $_) {
                if (isset($colIndex[$field])) {
                    $val = $row[$colIndex[$field]] ?? null;
                    if (is_string($val)) {
                        $val = trim($val);
                    }
                    if ($val === '') {
                        $val = null;
                    }
                    $data[$field] = $val;
                }
            }

            $v = Validator::make($data, $itemRules);
            if ($v->fails()) {
                $errores[] = [
                    'fila' => $i + 1,
                    'mensajes' => $v->errors()->all(),
                ];
                continue;
            }

            $clean = $v->validated();
            // Metas derivadas
            $clean['meta_hora'] = round($clean['meta_diaria'] / 9, 4);
            $clean['meta_minuto'] = round($clean['meta_diaria'] / 540, 6);

            $normalizados[] = $clean;
        }

        if (!empty($errores)) {
            return response()->json([
                'message' => 'Validación fallida. Ningún proceso fue importado.',
                'errores' => $errores,
            ], 422);
        }

        if (empty($normalizados)) {
            return response()->json([
                'message' => 'No se encontraron filas válidas.',
            ], 422);
        }

        $resultado = DB::transaction(function () use ($normalizados) {
            $nuevos = 0;
            $actualizados = 0;
            foreach ($normalizados as $data) {
                $existente = Proceso::where('codigo', $data['codigo'])->exists();
                Proceso::updateOrCreate(['codigo' => $data['codigo']], $data);
                $existente ? $actualizados++ : $nuevos++;
            }
            return compact('nuevos', 'actualizados');
        });

        Log::info('procesos.import.ok', [
            'user_id' => $request->user()?->id,
            'nuevos' => $resultado['nuevos'],
            'actualizados' => $resultado['actualizados'],
        ]);

        return response()->json([
            'message' => 'Importación exitosa',
            'nuevos' => $resultado['nuevos'],
            'actualizados' => $resultado['actualizados'],
            'total' => count($normalizados),
        ], 200);
    }
}
