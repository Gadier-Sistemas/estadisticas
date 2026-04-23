<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Contracts\Validation\Validator;
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
            'tiempo' => ['required', 'string', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/'],
            'media_jornada' => 'sometimes|boolean',
            'cliente' => 'nullable|string|max:255',
            'observaciones' => 'nullable|string|max:1000',
            'tipo' => 'nullable|in:produccion,novedad_total',
            'novedad_tipo' => 'nullable|string|max:100',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            if ($this->user() && $this->user()->rol === 'superadmin') {
                return;
            }
            $fecha = $this->input('fecha');
            if (!$fecha) {
                return;
            }
            $hoy = Carbon::now('America/Bogota')->toDateString();
            if ($fecha !== $hoy) {
                $v->errors()->add('fecha', 'Solo se permite registrar estadísticas del día actual.');
            }
        });
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
