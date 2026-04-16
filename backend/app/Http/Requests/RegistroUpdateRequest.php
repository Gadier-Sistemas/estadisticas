<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegistroUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        $registro = $this->route('registro');
        return $this->user() && ($this->user()->rol === 'superadmin' || $this->user()->id === $registro->user_id);
    }

    public function rules(): array
    {
        return [
            'proyecto_id' => 'sometimes|exists:proyectos,id',
            'proceso_codigo' => 'sometimes|string|exists:procesos,codigo',
            'fecha' => 'sometimes|date',
            'cantidad' => 'sometimes|integer|min:1',
            'tiempo' => 'sometimes|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
            'cliente' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string|max:1000',
            'tipo' => 'nullable|string',
            'novedad_tipo' => 'nullable|string',
        ];
    }
}
