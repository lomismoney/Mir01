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
        $priceInYuan = fake()->randomFloat(2, 10, 1000);
        $costPriceInYuan = fake()->randomFloat(2, 5, $priceInYuan * 0.8); // 成本價通常低於售價
        
        return [
            'product_id' => Product::factory(),
            'sku' => fake()->unique()->bothify('SKU-###??##'),
            'price' => (int) round($priceInYuan * 100), // 轉換為分
            'cost_price' => (int) round($costPriceInYuan * 100), // 轉換為分
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
            $priceInYuan = fake()->randomFloat(2, 500, 2000);
            $costPriceInYuan = fake()->randomFloat(2, 250, $priceInYuan * 0.8);
            
            return [
                'price' => (int) round($priceInYuan * 100),
                'cost_price' => (int) round($costPriceInYuan * 100),
            ];
        });
    }
} 