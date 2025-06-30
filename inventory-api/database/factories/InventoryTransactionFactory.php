<?php

namespace Database\Factories;

use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\InventoryTransaction>
 */
class InventoryTransactionFactory extends Factory
{
    /**
     * 對應的模型名稱
     *
     * @var string
     */
    protected $model = InventoryTransaction::class;

    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $types = ['addition', 'subtraction', 'adjustment', 'transfer_in', 'transfer_out', 'sale', 'return'];
        $type = $this->faker->randomElement($types);
        
        // 根據交易類型生成合理的數量
        $quantity = match($type) {
            'addition', 'transfer_in', 'return' => $this->faker->numberBetween(1, 100),
            'subtraction', 'transfer_out', 'sale' => -$this->faker->numberBetween(1, 50),
            'adjustment' => $this->faker->numberBetween(-20, 20),
            default => $this->faker->numberBetween(1, 50),
        };
        
        $beforeQuantity = $this->faker->numberBetween(0, 500);
        $afterQuantity = $beforeQuantity + $quantity;
        
        return [
            'inventory_id' => Inventory::factory(),
            'type' => $type,
            'quantity' => $quantity,
            'before_quantity' => $beforeQuantity,
            'after_quantity' => $afterQuantity,
            'user_id' => User::factory(),
            'notes' => $this->faker->optional(0.7)->sentence(),
            'metadata' => $this->faker->optional(0.3)->randomElement([
                ['order_id' => $this->faker->numberBetween(1, 1000)],
                ['transfer_id' => $this->faker->numberBetween(1, 100)],
                null
            ]),
        ];
    }
} 