<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BiometricoRegistro extends Model
{
    use HasFactory;

    protected $table = 'biometrico_registros';

    protected $fillable = [
        'cedula',
        'fecha',
        'nombre_biometrico',
        'hora_entrada',
        'hora_salida',
        'retardo_min',
        'salida_temprano_min',
        'falta_min',
        'minutos_trabajados',
        'ausente',
    ];

    protected $casts = [
        'ausente' => 'boolean',
        'retardo_min' => 'integer',
        'salida_temprano_min' => 'integer',
        'falta_min' => 'integer',
        'minutos_trabajados' => 'integer',
    ];
}
