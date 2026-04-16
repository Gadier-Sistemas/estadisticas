<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->rol === 'superadmin';
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'apellido' => 'nullable|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'email' => 'nullable|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'codigo' => 'required|string|max:50|unique:users',
            'rol' => ['required', Rule::in(['superadmin', 'operario'])],
            'activo' => 'boolean',
            'cedula' => 'nullable|string|max:20|unique:users',
            'tipoDocumento' => 'nullable|string|max:5',
        ];
    }
}
