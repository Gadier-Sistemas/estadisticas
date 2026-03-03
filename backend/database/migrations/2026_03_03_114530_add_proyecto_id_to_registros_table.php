<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::table('registros', function (Blueprint $table) {
            $table->foreignId('proyecto_id')->nullable()->after('user_id')->constrained('proyectos')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('registros', function (Blueprint $table) {
            $table->dropConstrainedForeignId('proyecto_id');
        });
    }
};