<?php

namespace Database\Factories;

use App\Models\Installation;
use App\Models\InstallationItem;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InstallationItem>
 */
class InstallationItemFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $productVariant = ProductVariant::factory()->create();
        
        return [
            'installation_id' => Installation::factory(),
            'order_item_id' => OrderItem::factory(),
            'product_variant_id' => $productVariant->id,
            'product_name' => $this->faker->words(3, true),
            'sku' => $productVariant->sku,
            'quantity' => $this->faker->numberBetween(1, 10),
            'specifications' => $this->faker->optional()->sentence(),
            'status' => $this->faker->randomElement(['pending', 'completed']),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    /**
     * 指定安裝項目為待處理狀態
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * 指定安裝項目為已完成狀態
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }

    /**
     * 指定安裝項目的安裝單
     */
    public function forInstallation(Installation $installation): static
    {
        return $this->state(fn (array $attributes) => [
            'installation_id' => $installation->id,
        ]);
    }

    /**
     * 指定安裝項目的訂單項目
     */
    public function forOrderItem(OrderItem $orderItem): static
    {
        return $this->state(fn (array $attributes) => [
            'order_item_id' => $orderItem->id,
            'product_variant_id' => $orderItem->product_variant_id,
            'product_name' => $orderItem->product_name,
            'sku' => $orderItem->sku,
            'quantity' => $orderItem->quantity,
        ]);
    }

    /**
     * 創建沒有訂單項目關聯的安裝項目
     */
    public function withoutOrderItem(): static
    {
        return $this->state(fn (array $attributes) => [
            'order_item_id' => null,
        ]);
    }

    /**
     * 創建沒有產品變體關聯的安裝項目
     */
    public function withoutProductVariant(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_variant_id' => null,
        ]);
    }
} 