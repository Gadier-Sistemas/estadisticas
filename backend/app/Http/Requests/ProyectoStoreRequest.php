<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProyectoStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return request()->user() && request()->user()->rol === 'superadmin';
    }

    public function rules(): array
    {
        return [
            'nombre' => 'required|string|max:255|unique:proyectos',
            'cliente' => 'required|string|max:255',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
        ];
    }
}
