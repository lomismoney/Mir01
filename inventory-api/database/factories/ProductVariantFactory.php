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
        $price = fake()->numberBetween(1000, 100000); // 10.00 to 1000.00 in cents
        $costPrice = fake()->numberBetween(500, (int) ($price * 0.8)); // Cost usually lower than price
        
        return [
            'product_id' => Product::factory(),
            'sku' => fake()->unique()->bothify('SKU-###??##'),
            'price' => $price,
            'cost_price' => $costPrice,
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
        return $this->state(function (array $attributes) {
            $price = fake()->numberBetween(50000, 200000); // 500.00 to 2000.00 in cents
            $costPrice = fake()->numberBetween(25000, (int) ($price * 0.8));
            
            return [
                'price' => $price,
                'cost_price' => $costPrice,
            ];
        });
    }
} 