<?php

namespace Database\Factories;

use App\Models\InventoryTransfer;
use App\Models\Store;
use App\Models\User;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Factories\Factory;

class InventoryTransferFactory extends Factory
{
    protected $model = InventoryTransfer::class;

    public function definition()
    {
        return [
            'from_store_id' => Store::factory(),
            'to_store_id' => Store::factory(),
            'user_id' => User::factory(),
            'product_variant_id' => ProductVariant::factory(),
            'quantity' => $this->faker->numberBetween(1, 50),
            'status' => $this->faker->randomElement([
                InventoryTransfer::STATUS_PENDING,
                InventoryTransfer::STATUS_IN_TRANSIT,
                InventoryTransfer::STATUS_COMPLETED,
                InventoryTransfer::STATUS_CANCELLED,
            ]),
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    public function pending()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => InventoryTransfer::STATUS_PENDING,
            ];
        });
    }

    public function inTransit()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => InventoryTransfer::STATUS_IN_TRANSIT,
            ];
        });
    }

    public function completed()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => InventoryTransfer::STATUS_COMPLETED,
            ];
        });
    }

    public function cancelled()
    {
        return $this->state(function (array $attributes) {
            return [
                'status' => InventoryTransfer::STATUS_CANCELLED,
            ];
        });
    }
} 