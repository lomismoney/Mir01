<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Store>
 */
class StoreFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => $this->faker->unique()->company(),
            'code' => $this->faker->unique()->lexify('STORE???'),
            'address' => $this->faker->address(),
            'phone' => $this->faker->optional()->phoneNumber(),
            'business_hours' => [
                '週一' => ['開放' => '09:00', '關閉' => '18:00'],
                '週二' => ['開放' => '09:00', '關閉' => '18:00'],
                '週三' => ['開放' => '09:00', '關閉' => '18:00'],
                '週四' => ['開放' => '09:00', '關閉' => '18:00'],
                '週五' => ['開放' => '09:00', '關閉' => '18:00'],
                '週六' => ['開放' => '10:00', '關閉' => '17:00'],
                '週日' => ['開放' => '休息']
            ],
            'latitude' => $this->faker->optional()->latitude(21, 26), // 台灣緯度範圍
            'longitude' => $this->faker->optional()->longitude(118, 125), // 台灣經度範圍
            'is_active' => $this->faker->boolean(90), // 90% 機率是活躍的
            'is_default' => false,
        ];
    }
}
