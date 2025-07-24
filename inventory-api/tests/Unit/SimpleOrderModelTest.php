<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Models\Order;
use PHPUnit\Framework\Attributes\Test;

class SimpleOrderModelTest extends TestCase
{
    #[Test]
    public function order_has_correct_fillable_attributes()
    {
        $fillable = [
            'order_number',
            'customer_id',
            'creator_user_id',
            'store_id',
            'shipping_status',
            'payment_status',
            'subtotal',
            'shipping_fee',
            'tax',
            'discount_amount',
            'grand_total',
            'paid_amount',
            'payment_method',
            'order_source',
            'shipping_address',
            'notes',
            'tracking_number',
            'carrier',
            'shipped_at',
            'paid_at',
            'estimated_delivery_date',
            'fulfillment_priority',
            'expected_delivery_date',
            'priority_reason',
            'is_tax_inclusive',
            'tax_rate',
        ];
        
        $order = new Order();
        $this->assertEquals($fillable, $order->getFillable());
    }

    #[Test]
    public function order_has_correct_casts()
    {
        $order = new Order();
        $expectedCasts = [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'shipped_at' => 'datetime',
            'paid_at' => 'datetime',
            'estimated_delivery_date' => 'date',
            'expected_delivery_date' => 'date',
            'is_tax_inclusive' => 'boolean',
            'tax_rate' => 'decimal:2',
        ];
        
        foreach ($expectedCasts as $key => $expectedType) {
            $this->assertArrayHasKey($key, $order->getCasts());
            $this->assertEquals($expectedType, $order->getCasts()[$key]);
        }
    }

    #[Test]
    public function order_uses_has_factory_trait()
    {
        $this->assertTrue(in_array('Illuminate\Database\Eloquent\Factories\HasFactory', class_uses(Order::class)));
    }
}