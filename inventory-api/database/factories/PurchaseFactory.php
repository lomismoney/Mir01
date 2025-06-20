<?php

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\Store;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'store_id' => Store::factory(),
            'order_number' => 'PO-' . $this->faker->unique()->numerify('########'),
            'total_amount' => $this->faker->numberBetween(100000, 1000000), // 1000.00 ~ 10000.00
            'shipping_cost' => $this->faker->numberBetween(0, 50000), // 0 ~ 500.00
            'status' => $this->faker->randomElement(['pending', 'confirmed', 'in_transit', 'received', 'completed', 'cancelled']),
            'purchased_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
        ];
    }

    /**
     * Indicate that the purchase is pending.
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'pending',
        ]);
    }

    /**
     * Indicate that the purchase is completed.
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
        ]);
    }
} 