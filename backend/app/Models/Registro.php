<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Registro extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'proceso_codigo',
        'proyecto_id',
        'fecha',
        'cliente',
        'cantidad',
        'tiempo',
        'media_jornada',
        'observaciones',
        'tipo',
        'novedad_tipo',
    ];

    protected $casts = [
        'media_jornada' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function proyecto()
    {
        return $this->belongsTo(Proyecto::class);
    }

    public function proceso()
    {
        return $this->belongsTo(Proceso::class , 'proceso_codigo', 'codigo');
    }
}
