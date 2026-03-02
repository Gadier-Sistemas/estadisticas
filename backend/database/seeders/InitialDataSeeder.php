<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class InitialDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Crear SuperAdmin Inicial
        \App\Models\User::create([
            'name' => 'Felix',
            'lastname' => 'Admin',
            'username' => 'admin',
            'email' => 'admin@gadier.com',
            'password' => \Illuminate\Support\Facades\Hash::make('admin123'),
            'rol' => 'superadmin',
            'activo' => true,
            'codigo' => 'GADIER-001',
        ]);

        // 2. Crear Operario de prueba
        \App\Models\User::create([
            'name' => 'Operario',
            'lastname' => 'Prueba',
            'username' => 'operario1',
            'email' => 'operario@gadier.com',
            'password' => \Illuminate\Support\Facades\Hash::make('123456'),
            'rol' => 'operario',
            'activo' => true,
            'codigo' => 'OP-001',
        ]);

        // 3. Crear Procesos Base (Basado en el sistema actual)
        \App\Models\Proceso::create([
            'codigo' => 'ARCH-01',
            'nombre' => 'Producción de Archivo',
            'categoria' => 'Producción',
            'unidad' => 'Documentos',
            'meta_diaria' => 100
        ]);

        \App\Models\Proceso::create([
            'codigo' => 'DIGI-01',
            'nombre' => 'Digitalización de Documentos',
            'categoria' => 'Producción',
            'unidad' => 'Folios',
            'meta_diaria' => 500
        ]);

        \App\Models\Proceso::create([
            'codigo' => 'CAPT-01',
            'nombre' => 'Captura de Datos',
            'categoria' => 'Producción',
            'unidad' => 'Registros',
            'meta_diaria' => 300
        ]);
    }
}
