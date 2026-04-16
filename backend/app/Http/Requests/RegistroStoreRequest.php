<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegistroStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Cualquier usuario autenticado puede registrar su propia producción
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'user_id' => 'nullable|exists:users,id',
            'proyecto_id' => 'required|exists:proyectos,id',
            'proceso_codigo' => 'required|string|exists:procesos,codigo',
            'fecha' => 'required|date',
            'cantidad' => 'required|integer|min:1',
            'tiempo' => 'required|string|regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/',
            'cliente' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string|max:1000',
            'tipo' => 'nullable|string',
            'novedad_tipo' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'proceso_codigo.exists' => 'El proceso seleccionado no es válido.',
            'tiempo.regex' => 'El formato del tiempo debe ser HH:MM.',
            'cantidad.min' => 'La cantidad debe ser al menos 1.',
        ];
    }
}
