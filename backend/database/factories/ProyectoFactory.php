<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Proyecto>
 */
class ProyectoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nombre' => fake()->company(),
            'cliente' => fake()->company(),
            'descripcion' => null,
            'activo' => true,
        ];
    }
}
