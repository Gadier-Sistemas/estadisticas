<?php

namespace App\Http\Controllers\Api;

use App\Models\Proceso;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ProcesoController extends Controller
{
    public function index()
    {
        return response()->json(Proceso::all());
    }
}
