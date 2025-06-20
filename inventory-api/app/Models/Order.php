<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'order_number',
        'customer_id',
        'creator_user_id',
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
    ];

    /**
     * 一個訂單包含多個訂單項目 (One-to-Many)
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * 一個訂單包含多個訂單項目 (別名方法)
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * 一個訂單擁有多筆付款記錄 (One-to-Many)
     */
    public function paymentRecords(): HasMany
    {
        return $this->hasMany(PaymentRecord::class);
    }

    /**
     * 一個訂單擁有多筆退款記錄 (One-to-Many)
     */
    public function refunds(): HasMany
    {
        return $this->hasMany(Refund::class);
    }

    /**
     * 一個訂單擁有一個狀態變更歷史記錄 (One-to-Many)
     */
    public function statusHistories(): HasMany
    {
        return $this->hasMany(OrderStatusHistory::class);
    }

    /**
     * 一個訂單屬於一個客戶 (Many-to-One / Inverse)
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * 一個訂單由一個用戶創建 (Many-to-One / Inverse)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_user_id');
    }
}
