<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Attribute>
 */
class AttributeFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $attributes = ['顏色', '尺寸', '材質', '重量', '功能', '風格'];
        
        return [
            'name' => fake()->unique()->randomElement($attributes),
        ];
    }
} 