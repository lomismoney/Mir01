<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductVariant>
 */
class ProductVariantFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'sku' => fake()->unique()->bothify('SKU-###??##'),
            'price' => fake()->randomFloat(2, 10, 1000),
        ];
    }

    /**
     * 生成特定產品的變體
     *
     * @param int $productId 產品ID
     * @return static
     */
    public function forProduct(int $productId): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => $productId,
        ]);
    }

    /**
     * 生成高價變體
     *
     * @return static
     */
    public function expensive(): static
    {
        return $this->state(fn (array $attributes) => [
            'price' => fake()->randomFloat(2, 500, 2000),
        ]);
    }
} 