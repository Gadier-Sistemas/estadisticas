<?php

namespace App\Http\Controllers\Api;

use App\Models\Proyecto;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProyectoController extends Controller
{
    public function index()
    {
        return response()->json(Proyecto::where('activo', true)->get());
    }
}
