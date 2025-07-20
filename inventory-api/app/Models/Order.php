<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory;
    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
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
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'shipped_at' => 'datetime',
        'paid_at' => 'datetime',
        'estimated_delivery_date' => 'date',
        'expected_delivery_date' => 'date',
        // 金額欄位使用 decimal
        'subtotal' => 'decimal:2',
        'shipping_fee' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    /**
     * 一個訂單包含多個訂單項目 (One-to-Many)
     */
    public function items(): HasMany
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

    /**
     * 一個訂單屬於一個門市 (Many-to-One / Inverse)
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * 一個訂單可能有多個相關的安裝單 (One-to-Many)
     */
    public function installations(): HasMany
    {
        return $this->hasMany(Installation::class);
    }

    /**
     * 一個訂單擁有多個庫存轉移記錄 (One-to-Many)
     */
    public function inventoryTransfers(): HasMany
    {
        return $this->hasMany(InventoryTransfer::class, 'order_id');
    }
    

    /**
     * 🎯 判斷訂單是否包含訂製商品
     * 
     * @return bool
     */
    public function getHasCustomItemsAttribute(): bool
    {
        // 如果 items 關聯已加載，則在集合上操作以避免額外查詢
        if ($this->relationLoaded('items')) {
            return $this->items->contains(fn ($item) => is_null($item->product_variant_id));
        }
        // 否則，進行資料庫查詢
        return $this->items()->whereNull('product_variant_id')->exists();
    }


    // ===== 業務邏輯方法 =====

    /**
     * 計算剩餘應付金額
     * 
     * @return float
     */
    public function getRemainingAmountAttribute(): float
    {
        return max(0, $this->grand_total - $this->paid_amount);
    }


    /**
     * 檢查訂單是否已完全付款
     * 
     * @return bool
     */
    public function isFullyPaidAttribute(): bool
    {
        return $this->remaining_amount <= 0;
    }

    /**
     * 獲取訂單金額摘要
     * 
     * @return array
     */
    public function getAmountSummary(): array
    {
        return [
            'subtotal' => 'NT$ ' . number_format($this->subtotal, 2),
            'shipping_fee' => 'NT$ ' . number_format($this->shipping_fee, 2),
            'tax' => 'NT$ ' . number_format($this->tax, 2),
            'discount_amount' => 'NT$ ' . number_format($this->discount_amount, 2),
            'grand_total' => 'NT$ ' . number_format($this->grand_total, 2),
            'paid_amount' => 'NT$ ' . number_format($this->paid_amount, 2),
            'remaining_amount' => 'NT$ ' . number_format($this->remaining_amount, 2),
            'is_fully_paid' => $this->is_fully_paid,
        ];
    }
}
