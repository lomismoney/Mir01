<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Inventory>
 */
class InventoryFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // 為了避免在 API 文檔生成時的唯一約束衝突，使用有限的範圍
        // 這樣可以減少重複的 product_variant_id + store_id 組合
        $productVariantId = fake()->numberBetween(1, 50);
        $storeId = fake()->numberBetween(1, 10);
        
        return [
            'product_variant_id' => $productVariantId,
            'store_id' => $storeId,
            'quantity' => fake()->numberBetween(0, 100),
            'low_stock_threshold' => fake()->numberBetween(5, 20),
        ];
    }

    /**
     * 為特定 SKU 變體建立庫存
     *
     * @param int $variantId 變體ID
     * @return static
     */
    public function forVariant(int $variantId): static
    {
        return $this->state(fn (array $attributes) => [
            'product_variant_id' => $variantId,
        ]);
    }

    /**
     * 設定庫存為低庫存狀態
     *
     * @return static
     */
    public function lowStock(): static
    {
        return $this->state(function (array $attributes) {
            $threshold = $attributes['low_stock_threshold'] ?? 10;
            return [
                'quantity' => fake()->numberBetween(0, $threshold - 1),
            ];
        });
    }

    /**
     * 設定庫存為零庫存狀態
     *
     * @return static
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'quantity' => 0,
        ]);
    }
} 