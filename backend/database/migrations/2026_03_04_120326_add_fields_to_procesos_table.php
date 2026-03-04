<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    /**
     * Migración: Agrega campos de BI al catálogo de procesos.
     * Permite almacenar tipo de proceso, descripción detallada de actividad
     * y proyección por hora/minuto para cálculos de rendimiento.
     */
    public function up(): void
    {
        Schema::table('procesos', function (Blueprint $table) {
            $table->string('tipo_proceso')->nullable()->after('categoria');
            $table->text('descripcion_actividad')->nullable()->after('unidad');
            $table->decimal('meta_hora', 10, 4)->nullable()->after('meta_diaria');
            $table->decimal('meta_minuto', 10, 6)->nullable()->after('meta_hora');
            $table->string('servicio')->nullable()->after('tipo_proceso');
            $table->string('proyecto_origen')->nullable()->after('servicio');
        });
    }

    /**
     * Reversa de la migración.
     */
    public function down(): void
    {
        Schema::table('procesos', function (Blueprint $table) {
            $table->dropColumn([
                'tipo_proceso',
                'descripcion_actividad',
                'meta_hora',
                'meta_minuto',
                'servicio',
                'proyecto_origen',
            ]);
        });
    }
};
