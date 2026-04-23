<?php

namespace Database\Factories;

use App\Models\Proceso;
use App\Models\Proyecto;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Registro>
 */
class RegistroFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'proyecto_id' => Proyecto::factory(),
            'proceso_codigo' => Proceso::factory(),
            'fecha' => Carbon::now('America/Bogota')->toDateString(),
            'cantidad' => fake()->numberBetween(1, 500),
            'tiempo' => '08:00',
            'tipo' => 'produccion',
        ];
    }
}
