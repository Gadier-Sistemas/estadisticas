<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Contracts\Validation\Validator;
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
            'tiempo' => ['sometimes', 'string', 'regex:/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/'],
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
            $hoy = Carbon::now('America/Bogota')->toDateString();
            $registro = $this->route('registro');

            $fechaRegistro = $registro?->fecha instanceof \DateTimeInterface
                ? Carbon::parse($registro->fecha)->toDateString()
                : (string) $registro?->fecha;

            if ($fechaRegistro !== $hoy) {
                $v->errors()->add('fecha', 'Solo se permite editar registros del día actual.');
                return;
            }

            if ($this->has('fecha') && $this->input('fecha') !== $hoy) {
                $v->errors()->add('fecha', 'La fecha del registro no puede modificarse a un día distinto al actual.');
            }
        });
    }
}
