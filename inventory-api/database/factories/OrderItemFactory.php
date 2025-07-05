<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => null, // 由 OrderFactory 設定，避免無限遞歸
            'product_variant_id' => ProductVariant::factory(),
            'is_stocked_sale' => true,
            'is_backorder' => false,
            'status' => '待處理',
            'product_name' => $this->faker->words(3, true),
            'sku' => $this->faker->unique()->numerify('SKU-####'),
            'price' => $this->faker->randomFloat(2, 10, 1000),
            'cost' => $this->faker->randomFloat(2, 5, 500),
            'quantity' => $this->faker->numberBetween(1, 10),
            'tax_rate' => $this->faker->randomFloat(2, 0, 20),
            'discount_amount' => $this->faker->randomFloat(2, 0, 50),
            'custom_product_name' => null,
            'custom_specifications' => null,
            'custom_product_image' => null,
            'custom_product_category' => null,
            'custom_product_brand' => null,
        ];
    }

    /**
     * 指定此訂單項目為庫存銷售
     */
    public function stockedSale(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_stocked_sale' => true,
            'is_backorder' => false,
        ]);
    }

    /**
     * 指定此訂單項目為預訂商品
     */
    public function backorder(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_stocked_sale' => false,
            'is_backorder' => true,
        ]);
    }

    /**
     * 指定此訂單項目為訂製商品
     */
    public function customProduct(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_variant_id' => null,
            'is_stocked_sale' => false,
            'is_backorder' => false,
            'custom_product_name' => $this->faker->words(3, true),
            'custom_specifications' => [
                'material' => $this->faker->randomElement(['木材', '金屬', '塑膠', '玻璃']),
                'color' => $this->faker->colorName(),
                'size' => $this->faker->randomElement(['小', '中', '大', '特大']),
                'notes' => $this->faker->sentence(),
            ],
            'custom_product_image' => $this->faker->imageUrl(),
            'custom_product_category' => $this->faker->randomElement(['家具', '裝飾品', '配件']),
            'custom_product_brand' => $this->faker->company(),
        ]);
    }

    /**
     * 指定訂單項目的狀態
     */
    public function withStatus(string $status): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => $status,
        ]);
    }
} 