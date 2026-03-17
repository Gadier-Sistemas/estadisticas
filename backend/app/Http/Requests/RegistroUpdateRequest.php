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
            'cantidad' => 'sometimes|integer|min:0',
            'tiempo' => 'sometimes|string|regex:/^\d{2}:\d{2}$/',
            'cliente' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string',
            'tipo' => 'nullable|string',
            'novedad_tipo' => 'nullable|string',
        ];
    }
}
