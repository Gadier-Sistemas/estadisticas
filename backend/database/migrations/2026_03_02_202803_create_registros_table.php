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
        Schema::create('registros', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('proceso_codigo')->nullable();
            $table->date('fecha');
            $table->string('cliente')->nullable();
            $table->integer('cantidad')->default(0);
            $table->string('tiempo')->nullable(); // HH:MM
            $table->text('observaciones')->nullable();
            $table->enum('tipo', ['produccion', 'novedad_total'])->default('produccion');
            $table->string('novedad_tipo')->nullable();
            $table->timestamps();

            $table->foreign('proceso_codigo')->references('codigo')->on('procesos')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('registros');
    }
};
