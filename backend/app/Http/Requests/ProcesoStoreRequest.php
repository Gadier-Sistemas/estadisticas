<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcesoStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() && $this->user()->rol === 'superadmin';
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'codigo' => 'required|string|unique:procesos,codigo',
            'nombre' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'tipo_proceso' => 'nullable|string|max:100',
            'servicio' => 'nullable|string|max:255',
            'proyecto_origen' => 'nullable|string|max:255',
            'unidad' => 'required|string|max:100',
            'meta_diaria' => 'required|integer|min:1',
            'meta_hora' => 'nullable|numeric',
            'meta_minuto' => 'nullable|numeric',
            'descripcion_actividad' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'codigo.unique' => 'El código del proceso ya existe.',
            'meta_diaria.min' => 'La meta diaria debe ser al menos 1.',
        ];
    }
}
