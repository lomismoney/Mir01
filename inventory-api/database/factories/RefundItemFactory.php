<?php

namespace Database\Factories;

use App\Models\Refund;
use App\Models\OrderItem;
use App\Models\RefundItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\RefundItem>
 */
class RefundItemFactory extends Factory
{
    /**
     * 定義模型的預設狀態
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $orderItem = OrderItem::factory()->create();
        $quantity = $this->faker->numberBetween(1, $orderItem->quantity);
        $refundSubtotal = $orderItem->price * $quantity; // Already in cents

        return [
            'refund_id' => Refund::factory(),
            'order_item_id' => $orderItem->id,
            'quantity' => $quantity,
            'refund_subtotal' => $refundSubtotal,
        ];
    }

    /**
     * 指定退款品項的退款單
     */
    public function forRefund(Refund $refund): static
    {
        return $this->state(fn (array $attributes) => [
            'refund_id' => $refund->id,
        ]);
    }

    /**
     * 指定退款品項的訂單項目
     */
    public function forOrderItem(OrderItem $orderItem): static
    {
        return $this->state(fn (array $attributes) => [
            'order_item_id' => $orderItem->id,
            'quantity' => min($attributes['quantity'], $orderItem->quantity),
            'refund_subtotal' => $orderItem->price * min($attributes['quantity'], $orderItem->quantity), // Already in cents
        ]);
    }

    /**
     * 創建完整品項退款
     */
    public function fullRefund(): static
    {
        return $this->state(function (array $attributes) {
            $orderItem = OrderItem::find($attributes['order_item_id']) ?? OrderItem::factory()->create();
            return [
                'order_item_id' => $orderItem->id,
                'quantity' => $orderItem->quantity,
                'refund_subtotal' => $orderItem->price * $orderItem->quantity, // Already in cents
            ];
        });
    }

    /**
     * 創建部分品項退款
     */
    public function partialRefund(int $quantity = null): static
    {
        return $this->state(function (array $attributes) use ($quantity) {
            $orderItem = OrderItem::find($attributes['order_item_id']) ?? OrderItem::factory()->create();
            $refundQuantity = $quantity ?? $this->faker->numberBetween(1, max(1, $orderItem->quantity - 1));
            return [
                'order_item_id' => $orderItem->id,
                'quantity' => min($refundQuantity, $orderItem->quantity),
                'refund_subtotal' => $orderItem->price * min($refundQuantity, $orderItem->quantity), // Already in cents
            ];
        });
    }
} 