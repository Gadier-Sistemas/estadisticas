<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proceso extends Model
{
    use HasFactory;

    protected $primaryKey = 'codigo';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'codigo',
        'nombre',
        'categoria',
        'tipo_proceso',
        'servicio',
        'proyecto_origen',
        'unidad',
        'meta_diaria',
        'meta_hora',
        'meta_minuto',
        'descripcion_actividad',
    ];

    /**
     * Relación: Un proceso tiene muchos registros de producción.
     */
    public function registros()
    {
        return $this->hasMany(Registro::class , 'proceso_codigo', 'codigo');
    }
}
