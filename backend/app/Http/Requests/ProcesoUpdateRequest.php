<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ProcesoUpdateRequest extends FormRequest
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
            'nombre' => 'sometimes|string|max:255',
            'categoria' => 'sometimes|string|max:255',
            'tipo_proceso' => 'nullable|string|max:100',
            'servicio' => 'nullable|string|max:255',
            'proyecto_origen' => 'nullable|string|max:255',
            'unidad' => 'sometimes|string|max:100',
            'meta_diaria' => 'sometimes|integer|min:1',
            'meta_hora' => 'nullable|numeric',
            'meta_minuto' => 'nullable|numeric',
            'descripcion_actividad' => 'nullable|string',
        ];
    }
}
