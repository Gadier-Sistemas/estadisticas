<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Proyecto extends Model
{
    protected $fillable = ['nombre', 'cliente', 'descripcion', 'activo'];

    public function registros()
    {
        return $this->hasMany(Registro::class);
    }
}
