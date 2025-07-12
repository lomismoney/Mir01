<?php

namespace Database\Factories;

use App\Models\OrderStatusHistory;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\OrderStatusHistory>
 */
class OrderStatusHistoryFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = OrderStatusHistory::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $statuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        $fromIndex = $this->faker->numberBetween(0, count($statuses) - 2);
        $toIndex = $this->faker->numberBetween($fromIndex + 1, count($statuses) - 1);

        return [
            'order_id' => Order::factory(),
            'status_type' => $this->faker->randomElement(['payment', 'shipping', 'line_item']),
            'from_status' => $statuses[$fromIndex],
            'to_status' => $statuses[$toIndex],
            'user_id' => User::factory(),
            'notes' => $this->faker->optional(0.7)->sentence(),
        ];
    }

    /**
     * 指定特定的狀態變更
     */
    public function fromStatus(string $from, string $to): static
    {
        return $this->state(fn (array $attributes) => [
            'from_status' => $from,
            'to_status' => $to,
        ]);
    }

    /**
     * 指定變更者
     */
    public function changedBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'user_id' => $user->id,
        ]);
    }

    /**
     * 設定為處理中
     */
    public function toProcessing(): static
    {
        return $this->state(fn (array $attributes) => [
            'from_status' => 'pending',
            'to_status' => 'processing',
            'notes' => '訂單開始處理',
        ]);
    }

    /**
     * 設定為已出貨
     */
    public function toShipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'from_status' => 'processing',
            'to_status' => 'shipped',
            'notes' => '訂單已出貨',
        ]);
    }

    /**
     * 設定為已送達
     */
    public function toDelivered(): static
    {
        return $this->state(fn (array $attributes) => [
            'from_status' => 'shipped',
            'to_status' => 'delivered',
            'notes' => '訂單已送達',
        ]);
    }

    /**
     * 設定為已取消
     */
    public function toCancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'to_status' => 'cancelled',
            'notes' => '訂單已取消',
        ]);
    }
}