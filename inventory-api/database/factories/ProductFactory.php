<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->sentence(3, false), // 生成 3 個詞的商品名稱
            'sku' => fake()->unique()->bothify('##??##??'), // 生成類似 "12AB34CD" 的 SKU
            'description' => fake()->optional(0.8)->paragraph(), // 80% 機率有描述
            'selling_price' => fake()->randomFloat(2, 10, 1000), // 售價 10-1000
            'cost_price' => fake()->randomFloat(2, 5, 500), // 成本價 5-500
        ];
    }

    /**
     * 生成高價商品狀態
     */
    public function expensive(): static
    {
        return $this->state(fn (array $attributes) => [
            'selling_price' => fake()->randomFloat(2, 500, 2000),
            'cost_price' => fake()->randomFloat(2, 200, 1000),
        ]);
    }

    /**
     * 生成無描述的商品狀態
     */
    public function noDescription(): static
    {
        return $this->state(fn (array $attributes) => [
            'description' => null,
        ]);
    }
}
