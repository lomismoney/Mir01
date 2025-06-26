<?php

namespace Database\Factories;

use App\Models\Installation;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Installation>
 */
class InstallationFactory extends Factory
{
    /**
     * 定義的模型名稱
     *
     * @var string
     */
    protected $model = Installation::class;

    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'installation_number' => 'I-' . $this->faker->year . '-' . str_pad($this->faker->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'order_id' => null, // 預設為獨立安裝單
            'installer_user_id' => null, // 預設尚未分配安裝師傅
            'created_by' => User::factory(),
            'customer_name' => $this->faker->name(),
            'customer_phone' => $this->faker->phoneNumber(),
            'installation_address' => $this->faker->address(),
            'status' => 'pending',
            'scheduled_date' => $this->faker->dateTimeBetween('now', '+30 days'),
            'actual_start_time' => null,
            'actual_end_time' => null,
            'notes' => $this->faker->optional()->sentence(),
        ];
    }

    /**
     * 指定安裝單狀態為「已排程」
     */
    public function scheduled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'scheduled',
            'installer_user_id' => User::factory(),
        ]);
    }

    /**
     * 指定安裝單狀態為「進行中」
     */
    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
            'installer_user_id' => User::factory(),
            'actual_start_time' => $this->faker->dateTimeThisMonth(),
        ]);
    }

    /**
     * 指定安裝單狀態為「已完成」
     */
    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'installer_user_id' => User::factory(),
            'actual_start_time' => $this->faker->dateTimeThisMonth(),
            'actual_end_time' => $this->faker->dateTimeThisMonth('+1 day'),
        ]);
    }

    /**
     * 指定安裝單狀態為「已取消」
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'cancelled',
            'notes' => $this->faker->sentence(),
        ]);
    }

    /**
     * 關聯到訂單
     */
    public function forOrder(Order $order): static
    {
        return $this->state(fn (array $attributes) => [
            'order_id' => $order->id,
            'customer_name' => $order->customer_name,
            'customer_phone' => $order->customer_phone,
            'installation_address' => $order->shipping_address,
        ]);
    }
} 