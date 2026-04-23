<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Proceso>
 */
class ProcesoFactory extends Factory
{
    public function definition(): array
    {
        return [
            'codigo' => strtoupper(fake()->unique()->lexify('P???')),
            'nombre' => fake()->sentence(3),
            'categoria' => fake()->randomElement(['OPERATIVO', 'CUSTODIA']),
            'unidad' => 'unidad',
            'meta_diaria' => fake()->numberBetween(100, 1000),
        ];
    }
}
