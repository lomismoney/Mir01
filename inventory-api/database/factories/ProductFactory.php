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
            'description' => fake()->optional(0.8)->paragraph(), // 80% 機率有描述
            'category_id' => null, // 預設無分類
        ];
    }

    /**
     * 生成有分類的商品狀態
     */
    public function withCategory($categoryId): static
    {
        return $this->state(fn (array $attributes) => [
            'category_id' => $categoryId,
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
