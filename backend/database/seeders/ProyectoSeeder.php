<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Proyecto;

class ProyectoSeeder extends Seeder
{
    public function run(): void
    {
        Proyecto::updateOrCreate(
        ['nombre' => 'Archivo Central GADIER'],
        [
            'cliente' => 'GADIER',
            'descripcion' => 'Organización y digitalización del archivo central',
            'activo' => true
        ]
        );

        Proyecto::updateOrCreate(
        ['nombre' => 'Digitalización Bancaria 2026'],
        [
            'cliente' => 'Cliente Externo',
            'descripcion' => 'Captura de datos de pagarés y créditos',
            'activo' => true
        ]
        );

        Proyecto::updateOrCreate(
        ['nombre' => 'Gestión Documental UU'],
        [
            'cliente' => 'Empresas Unidas',
            'descripcion' => 'Consultoría en tablas de retención',
            'activo' => true
        ]
        );
    }
}
