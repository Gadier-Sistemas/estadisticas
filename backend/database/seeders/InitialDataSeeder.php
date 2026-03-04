<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InitialDataSeeder extends Seeder
{
    /**
     * Carga datos iniciales: usuarios de prueba y los 20 procesos BC
     * reales extraídos del Excel V3 (Estadísticas_de_Trabajo_V3.xlsm).
     */
    public function run(): void
    {
        // 1. Crear SuperAdmin Inicial
        \App\Models\User::updateOrCreate(
        ['username' => 'admin'],
        [
            'name' => 'Felix',
            'lastname' => 'Admin',
            'email' => 'admin@gadier.com',
            'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
            'rol' => 'superadmin',
            'activo' => true,
            'codigo' => 'GADIER-001',
        ]
        );

        // 2. Crear Operario de prueba
        \App\Models\User::updateOrCreate(
        ['username' => 'operario1'],
        [
            'name' => 'Operario',
            'lastname' => 'Prueba',
            'email' => 'operario@gadier.com',
            'password' => \Illuminate\Support\Facades\Hash::make('123456'),
            'rol' => 'operario',
            'activo' => true,
            'codigo' => 'OP-001',
        ]
        );

        // 3. Procesos Reales BC (Bodega Custodia) — Extraídos del Excel V3
        $procesosBc = [
            [
                'codigo' => 'BC1',
                'nombre' => 'Consultas Custodia - (Imagen) Superiores 5 Unidades',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Imagen',
                'meta_diaria' => 700,
                'meta_hora' => 77.7778,
                'meta_minuto' => 1.296296,
                'descripcion_actividad' => '1. Recibir consulta por correo electrónico.
2. Identificar qué cliente está realizando la solicitud.
3. Realizar la búsqueda en la base de datos.
4. Anotar la ubicación topográfica del documento.
5. Desmonte de cajas.
6. Extraer el documento.
7. Digitalizar las imágenes.
8. Elaboración de respuesta adjuntando las imágenes.
9. Ubicar el documento en la estantería.
10. Montar Cajas.',
            ],
            [
                'codigo' => 'BC2',
                'nombre' => 'Consultas Custodia - (Imagen) Hasta 5 Unidades Documentales',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Imagen',
                'meta_diaria' => 50,
                'meta_hora' => 5.5556,
                'meta_minuto' => 0.092593,
                'descripcion_actividad' => '1. Recibir consulta por correo electrónico.
2. Identificar qué cliente está realizando la solicitud.
3. Realizar búsqueda en la base de datos.
4. Desmonte de cajas, extracción, digitalización.
5. Elaboración de respuesta.
6. Ubicar documento en estantería.',
            ],
            [
                'codigo' => 'BC3',
                'nombre' => 'Consultas Custodia UA',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Archivística',
                'meta_diaria' => 40,
                'meta_hora' => 4.4444,
                'meta_minuto' => 0.074074,
                'descripcion_actividad' => '1. Recibir consulta por correo electrónico.
2. Búsqueda en base de datos.
3. Ubicación topográfica.
4. Desmonte y extracción.
5. Elaboración de respuesta.
6. Empacar y planillar envío.',
            ],
            [
                'codigo' => 'BC4',
                'nombre' => 'Devoluciones e Involucrar',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Archivística',
                'meta_diaria' => 60,
                'meta_hora' => 6.6667,
                'meta_minuto' => 0.111111,
                'descripcion_actividad' => '1. Planillar por correspondencia la recogida.
2. Clasificar por cliente.
3. Verificar unidades archivísticas completas.
4. Sacar ubicación topográfica.
5. Desmonte y monte de cajas.
6. Registrar cantidad involucrada.',
            ],
            [
                'codigo' => 'BC5',
                'nombre' => 'Recepción',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Archivística',
                'meta_diaria' => 630,
                'meta_hora' => 70.0,
                'meta_minuto' => 1.166667,
                'descripcion_actividad' => '1. Planillar por correspondencia recoger la documentación.
2. Verificación de inventario.
3. Punteo de inventario vs físico.
4. Registrar la cantidad realizada.',
            ],
            [
                'codigo' => 'BC6',
                'nombre' => 'Recepción Cambio de Unidad y Caja',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Archivística',
                'meta_diaria' => 60,
                'meta_hora' => 6.6667,
                'meta_minuto' => 0.111111,
                'descripcion_actividad' => '1. Planillar por correspondencia.
2. Organización de la documentación.
3. Elaboración de inventario.
4. Cambio de AZ a tapa yute.
5. Ubicación en carpeta correspondiente.',
            ],
            [
                'codigo' => 'BC7',
                'nombre' => 'Recepción y Automatización',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Documental',
                'meta_diaria' => 1800,
                'meta_hora' => 200.0,
                'meta_minuto' => 3.333333,
                'descripcion_actividad' => '1. Verificación de inventario vs físico.
2. Pegado de SR de carpeta y caja.
3. Ajustar campos a plantilla de SIRCAI.',
            ],
            [
                'codigo' => 'BC8',
                'nombre' => 'Organización',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Archivística',
                'meta_diaria' => 500,
                'meta_hora' => 55.5556,
                'meta_minuto' => 0.925926,
                'descripcion_actividad' => '1. Clasificación por cliente.
2. Clasificación por serie.
3. Elaboración de inventario.
4. Colocar información en caja.',
            ],
            [
                'codigo' => 'BC9',
                'nombre' => 'Organización H.L.',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Documental',
                'meta_diaria' => 1836,
                'meta_hora' => 204.0,
                'meta_minuto' => 3.4,
                'descripcion_actividad' => '1. Organización cronológica de las historias laborales.
2. Organización de las unidades documentales.
3. Registrar en el Check List las documentales encontradas.
4. Registrar en el reporte.
5. Ubicar en la caja correspondiente.',
            ],
            [
                'codigo' => 'BC10',
                'nombre' => 'Automatización',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Archivística',
                'meta_diaria' => 600,
                'meta_hora' => 66.6667,
                'meta_minuto' => 1.111111,
                'descripcion_actividad' => '1. Verificación de inventario con características de la Tabla Principal.
2. Copiar y pegar registros del inventario al formato SIRCAI.
3. Ingresar datos restantes de ubicación topográfica.
4. Control de calidad: verificar duplicados y concordancia.',
            ],
            [
                'codigo' => 'BC11',
                'nombre' => 'Automatización Check List',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Documental',
                'meta_diaria' => 2430,
                'meta_hora' => 270.0,
                'meta_minuto' => 4.5,
                'descripcion_actividad' => '1. Pegado de SR de carpeta y caja.
2. Verificación del Check List.
3. Copiar y pegar registros al formato SIRCAI.',
            ],
            [
                'codigo' => 'BC12',
                'nombre' => 'Preparación Física Microfilmación',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Documental',
                'meta_diaria' => 7344,
                'meta_hora' => 816.0,
                'meta_minuto' => 13.6,
                'descripcion_actividad' => '1. Clasificar por ciudades.
2. Desprender tapas de libros.
3. Quitar colbón de la documentación.
4. Reparar el documento.
5. Clasificar por series.
6. Clasificar cronológicamente.',
            ],
            [
                'codigo' => 'BC13',
                'nombre' => 'Preparación Física HL',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Documental',
                'meta_diaria' => 7610,
                'meta_hora' => 845.5556,
                'meta_minuto' => 14.092593,
                'descripcion_actividad' => '1. Clasificación de historias laborales por Organismo.
2. Clasificar unidades documentales según estructura.
3. Preparación física: quitar ganchos y separar por secciones.',
            ],
            [
                'codigo' => 'BC14',
                'nombre' => 'Inserción Facturas',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Documental',
                'meta_diaria' => 1600,
                'meta_hora' => 177.7778,
                'meta_minuto' => 2.962963,
                'descripcion_actividad' => '1. Clasificar por Organismo (empresa).
2. Organización por fecha.
3. Organizar por consecutivo de factura.
4. Búsqueda de ubicación topográfica.
5. Inserción de factura.
6. Reporte de la estadística.',
            ],
            [
                'codigo' => 'BC15',
                'nombre' => 'Inserción Documentos',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Unidad Documental',
                'meta_diaria' => 90,
                'meta_hora' => 10.0,
                'meta_minuto' => 0.166667,
                'descripcion_actividad' => '1. Clasificar por Cliente.
2. Búsqueda de ubicación topográfica.
3. Desmonte de cajas.
4. Inserción del documento.
5. Monte de Cajas.
6. Reporte de la estadística.',
            ],
            [
                'codigo' => 'BC16',
                'nombre' => 'Digitalización HL',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Imagen',
                'meta_diaria' => 6903,
                'meta_hora' => 767.0,
                'meta_minuto' => 12.783333,
                'descripcion_actividad' => '1. Configuración de escáner.
2. Digitalizar por sesiones de la historia laboral.
3. Subir a la nube las imágenes.',
            ],
            [
                'codigo' => 'BC17',
                'nombre' => 'Digitalización Simple',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Imagen',
                'meta_diaria' => 4000,
                'meta_hora' => 444.4444,
                'meta_minuto' => 7.407407,
                'descripcion_actividad' => '1. Ubicar documentos a digitalizar.
2. Quitar ganchos de cosedora.
3. Configuración de escáner.
4. Digitalización de imágenes y ubicar en ruta indicada.',
            ],
            [
                'codigo' => 'BC18',
                'nombre' => 'Foliación H.L.',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Folio',
                'meta_diaria' => 2196,
                'meta_hora' => 244.0,
                'meta_minuto' => 4.066667,
                'descripcion_actividad' => '1. Ubicar las historias laborales.
2. Foliar en la parte superior derecha en lápiz.
3. Indicar en el Check List la cantidad de folios.',
            ],
            [
                'codigo' => 'BC19',
                'nombre' => 'Microfilmación',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Fotograma',
                'meta_diaria' => 5589,
                'meta_hora' => 621.0,
                'meta_minuto' => 10.35,
                'descripcion_actividad' => '1. Verificar contador en ceros.
2. Dar espacio de seguridad de enhebrado del Rollo.
3. Microfilmar documentación normativa.
4. Microfilmar Lado A y Lado B.
5. Marcar cajas con sello de Microfilmado.
6. Ubicar en estantería.',
            ],
            [
                'codigo' => 'BC20',
                'nombre' => 'Mantenimiento',
                'categoria' => 'Custodia',
                'tipo_proceso' => 'Operativo',
                'unidad' => 'Caja',
                'meta_diaria' => 150,
                'meta_hora' => 16.6667,
                'meta_minuto' => 0.277778,
                'descripcion_actividad' => '1. Identificar cantidad de cajas a eliminar.
2. Solicitar insumos.
3. Desmonte.
4. Cambio de caja.
5. Elaboración de rótulos de contenido.
6. Verificar unificación con otra caja.
7. Monte de cajas.
8. Reportar estadísticas.',
            ],
        ];

        foreach ($procesosBc as $proceso) {
            \App\Models\Proceso::updateOrCreate(
            ['codigo' => $proceso['codigo']],
                $proceso
            );
        }
    }
}
