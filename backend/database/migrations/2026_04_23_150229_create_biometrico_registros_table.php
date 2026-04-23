<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('biometrico_registros', function (Blueprint $table) {
            $table->id();
            $table->string('cedula', 20);
            $table->date('fecha');
            $table->string('nombre_biometrico')->nullable();
            $table->string('hora_entrada', 8)->nullable();
            $table->string('hora_salida', 8)->nullable();
            $table->unsignedSmallInteger('retardo_min')->default(0);
            $table->unsignedSmallInteger('salida_temprano_min')->default(0);
            $table->unsignedSmallInteger('falta_min')->default(0);
            $table->unsignedSmallInteger('minutos_trabajados')->default(0);
            $table->boolean('ausente')->default(false);
            $table->timestamps();

            $table->unique(['cedula', 'fecha']);
            $table->index('fecha');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('biometrico_registros');
    }
};
