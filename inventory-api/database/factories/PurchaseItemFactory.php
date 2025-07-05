<?php

namespace Database\Factories;

use App\Models\PurchaseItem;
use App\Models\Purchase;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PurchaseItem>
 */
class PurchaseItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = $this->faker->numberBetween(1, 100);
        $unitPrice = $this->faker->numberBetween(1000, 100000); // 10.00 ~ 1000.00
        $costPrice = $unitPrice;
        $allocatedShippingCost = $this->faker->numberBetween(0, 10000); // 0 ~ 100.00

        return [
            'purchase_id' => null, // 由 PurchaseFactory 設定，避免無限遞歸
            'product_variant_id' => ProductVariant::factory(),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'cost_price' => $costPrice,
            'allocated_shipping_cost' => $allocatedShippingCost,
        ];
    }
} 