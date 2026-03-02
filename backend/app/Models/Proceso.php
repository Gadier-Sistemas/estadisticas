<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proceso extends Model
{
    protected $primaryKey = 'codigo';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'codigo',
        'nombre',
        'categoria',
        'unidad',
        'meta_diaria',
    ];

    public function registros()
    {
        return $this->hasMany(Registro::class , 'proceso_codigo', 'codigo');
    }
}
