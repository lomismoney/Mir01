<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\PaymentRecord;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * PaymentRecord 工廠
 * 
 * 用於創建付款記錄的測試數據
 */
class PaymentRecordFactory extends Factory
{
    protected $model = PaymentRecord::class;

    /**
     * 定義模型的默認狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'creator_id' => \App\Models\User::factory(),
            'amount' => $this->faker->numberBetween(1000, 50000), // 10.00 - 500.00 元
            'payment_method' => $this->faker->randomElement(['cash', 'transfer', 'credit_card']),
            'payment_date' => $this->faker->dateTimeBetween('-30 days', 'now'),
            'notes' => $this->faker->optional(0.3)->sentence(),
        ];
    }

    /**
     * 已完成的付款記錄
     */
    public function completed(): Factory
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => 'completed',
            'paid_at' => $this->faker->dateTimeBetween('-30 days', 'now'),
        ]);
    }

    /**
     * 待處理的付款記錄
     */
    public function pending(): Factory
    {
        return $this->state(fn (array $attributes) => [
            'payment_status' => 'pending',
            'paid_at' => null,
        ]);
    }

    /**
     * 現金付款
     */
    public function cash(): Factory
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'cash',
            'transaction_id' => 'CASH-' . $this->faker->numerify('######'),
        ]);
    }

    /**
     * 信用卡付款
     */
    public function creditCard(): Factory
    {
        return $this->state(fn (array $attributes) => [
            'payment_method' => 'credit_card',
            'transaction_id' => 'CC-' . $this->faker->numerify('##########'),
        ]);
    }
} 