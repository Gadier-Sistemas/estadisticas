<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->rol === 'superadmin';
    }

    public function rules(): array
    {
        $userId = $this->route('usuario') ?: $this->route('user');

        return [
            'name' => 'sometimes|required|string|max:255',
            'apellido' => 'nullable|string|max:255',
            'username' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users')->ignore($userId)],
            'email' => ['nullable', 'string', 'email', 'max:255', Rule::unique('users')->ignore($userId)],
            'password' => 'nullable|string|min:8',
            'codigo' => ['sometimes', 'required', 'string', 'max:50', Rule::unique('users')->ignore($userId)],
            'rol' => ['sometimes', 'required', Rule::in(['superadmin', 'operario'])],
            'activo' => 'boolean',
            'cedula' => ['nullable', 'string', 'max:20', Rule::unique('users')->ignore($userId)],
            'tipoDocumento' => 'nullable|string|max:5',
        ];
    }
}
