<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProyectoUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return request()->user() && request()->user()->rol === 'superadmin';
    }

    public function rules(): array
    {
        $proyectoId = $this->route('proyecto');
        if (is_object($proyectoId)) {
            $proyectoId = $proyectoId->id;
        }

        return [
            'nombre' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('proyectos')->ignore($proyectoId)],
            'cliente' => 'sometimes|required|string|max:255',
            'descripcion' => 'nullable|string',
            'activo' => 'boolean',
        ];
    }
}
