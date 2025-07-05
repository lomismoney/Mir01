<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = $this->faker->randomFloat(2, 100, 5000);
        $shippingFee = $this->faker->randomFloat(2, 0, 200);
        $tax = $subtotal * 0.05; // 5% 稅金
        $discountAmount = $this->faker->boolean(30) ? $this->faker->randomFloat(2, 0, $subtotal * 0.2) : 0;
        $grandTotal = $subtotal + $shippingFee + $tax - $discountAmount;
        
        // 預設為待付款狀態
        $paymentStatus = 'pending';
        $paidAmount = 0;

        return [
            'order_number' => 'PO-' . date('Ymd') . '-' . $this->faker->unique()->numberBetween(1000, 9999),
            'customer_id' => Customer::factory(),
            'creator_user_id' => User::factory(),
            'shipping_status' => $this->faker->randomElement(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
            'payment_status' => $paymentStatus,
            'subtotal' => $subtotal,
            'shipping_fee' => $shippingFee,
            'tax' => $tax,
            'discount_amount' => $discountAmount,
            'grand_total' => $grandTotal,
            'paid_amount' => $paidAmount,
            'payment_method' => $this->faker->randomElement(['cash', 'transfer', 'card']),
            'order_source' => $this->faker->randomElement(['walk-in', 'website', 'line']),
            'shipping_address' => $this->faker->address(),
            'notes' => $this->faker->optional(0.3)->sentence(),
            'tracking_number' => null,
            'carrier' => null,
            'shipped_at' => null,
            'paid_at' => null,
            'estimated_delivery_date' => null,
        ];
    }

    /**
     * 指定訂單狀態為待處理
     */
    public function pending(): static
    {
        return $this->state(fn (array $attributes) => [
            'shipping_status' => 'pending',
            'payment_status' => 'pending',
            'paid_amount' => 0,
            'paid_at' => null,
            'shipped_at' => null,
        ]);
    }

    /**
     * 指定訂單狀態為已付款
     */
    public function paid(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'shipping_status' => 'delivered', // 確保不是 cancelled 狀態
                'payment_status' => 'paid',
                'paid_amount' => $attributes['grand_total'],
                'paid_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            ];
        });
    }

    /**
     * 指定訂單狀態為部分付款
     */
    public function partiallyPaid(): static
    {
        return $this->state(function (array $attributes) {
            $partialAmount = $this->faker->randomFloat(2, 10, $attributes['grand_total'] * 0.8);
            return [
                'payment_status' => 'partial',
                'paid_amount' => $partialAmount,
                'paid_at' => $this->faker->dateTimeBetween('-1 month', 'now'),
            ];
        });
    }

    /**
     * 指定訂單狀態為已出貨
     */
    public function shipped(): static
    {
        return $this->state(fn (array $attributes) => [
            'shipping_status' => 'shipped',
            'tracking_number' => $this->faker->numerify('TW#########'),
            'carrier' => $this->faker->randomElement(['黑貓宅急便', '新竹貨運', '郵局', 'DHL']),
            'shipped_at' => $this->faker->dateTimeBetween('-2 weeks', 'now'),
            'estimated_delivery_date' => $this->faker->dateTimeBetween('now', '+1 week'),
        ]);
    }

    /**
     * 指定訂單狀態為已完成
     */
    public function completed(): static
    {
        return $this->state(function (array $attributes) {
            $shippedAt = $this->faker->dateTimeBetween('-1 month', '-1 week');
            return [
                'shipping_status' => 'delivered',
                'payment_status' => 'paid',
                'paid_amount' => $attributes['grand_total'],
                'paid_at' => $this->faker->dateTimeBetween('-2 months', $shippedAt),
                'tracking_number' => $this->faker->numerify('TW#########'),
                'carrier' => $this->faker->randomElement(['黑貓宅急便', '新竹貨運', '郵局', 'DHL']),
                'shipped_at' => $shippedAt,
                'estimated_delivery_date' => $this->faker->dateTimeBetween($shippedAt, 'now'),
            ];
        });
    }

    /**
     * 指定訂單狀態為已取消
     */
    public function cancelled(): static
    {
        return $this->state(fn (array $attributes) => [
            'shipping_status' => 'cancelled',
            'payment_status' => 'cancelled',
            'notes' => '訂單已取消：' . $this->faker->randomElement(['客戶要求取消', '商品缺貨', '付款問題']),
        ]);
    }

    /**
     * 指定特定的客戶
     */
    public function forCustomer(Customer $customer): static
    {
        return $this->state(fn (array $attributes) => [
            'customer_id' => $customer->id,
        ]);
    }

    /**
     * 指定創建者
     */
    public function createdBy(User $user): static
    {
        return $this->state(fn (array $attributes) => [
            'creator_user_id' => $user->id,
        ]);
    }

    /**
     * Configure the model factory.
     */
    public function configure()
    {
        return $this->afterCreating(function (Order $order) {
            // 自動創建 2-5 個訂單項目，確保 Scribe 能獲得完整的關聯數據
            $itemsCount = $this->faker->numberBetween(2, 5);
            
            for ($i = 0; $i < $itemsCount; $i++) {
                \App\Models\OrderItem::factory()->create([
                    'order_id' => $order->id,
                ]);
            }
            
            // 重新計算訂單總額（基於項目）
            $items = $order->items;
            $subtotal = $items->sum(function ($item) {
                return $item->price * $item->quantity;
            });
            
            $tax = $subtotal * 0.05;
            $grandTotal = $subtotal + $order->shipping_fee + $tax - $order->discount_amount;
            
            $order->update([
                'subtotal' => $subtotal,
                'tax' => $tax,
                'grand_total' => $grandTotal,
            ]);
        });
    }

    /**
     * 設定特定的金額
     */
    public function withAmount(float $grandTotal): static
    {
        return $this->state(function (array $attributes) use ($grandTotal) {
            $subtotal = $grandTotal * 0.9; // 假設稅金和運費佔 10%
            $shippingFee = $grandTotal * 0.05;
            $tax = $grandTotal * 0.05;
            
            return [
                'subtotal' => $subtotal,
                'shipping_fee' => $shippingFee,
                'tax' => $tax,
                'discount_amount' => 0,
                'grand_total' => $grandTotal,
            ];
        });
    }
} 