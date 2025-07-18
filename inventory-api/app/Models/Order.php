<?php

namespace App\Models;

use App\Traits\HandlesCurrency;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    use HasFactory, HandlesCurrency;
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
        // 金額欄位（分為單位）
        'subtotal_cents',
        'shipping_fee_cents',
        'tax_cents',
        'discount_amount_cents',
        'grand_total_cents',
        'paid_amount_cents',
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
        // 金額欄位使用整數（分為單位）
        'subtotal' => 'integer',
        'shipping_fee' => 'integer',
        'tax' => 'integer',
        'discount_amount' => 'integer',
        'grand_total' => 'integer',
        'paid_amount' => 'integer',
        'subtotal_cents' => 'integer',
        'shipping_fee_cents' => 'integer',
        'tax_cents' => 'integer',
        'discount_amount_cents' => 'integer',
        'grand_total_cents' => 'integer',
        'paid_amount_cents' => 'integer',
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

    /**
     * 定義金額欄位
     * 
     * @return array
     */
    protected function getCurrencyFields(): array
    {
        return [
            'subtotal',
            'shipping_fee',
            'tax',
            'discount_amount',
            'grand_total',
            'paid_amount',
        ];
    }

    // ===== 金額欄位的 Accessor 方法 =====

    /**
     * 取得小計金額（元）
     */
    public function getSubtotalAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('subtotal'));
    }

    /**
     * 取得運費（元）
     */
    public function getShippingFeeAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('shipping_fee'));
    }

    /**
     * 取得稅額（元）
     */
    public function getTaxAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('tax'));
    }

    /**
     * 取得折扣金額（元）
     */
    public function getDiscountAmountAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('discount_amount'));
    }

    /**
     * 取得總金額（元）
     */
    public function getGrandTotalAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('grand_total'));
    }

    /**
     * 取得已付金額（元）
     */
    public function getPaidAmountAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('paid_amount'));
    }

    // ===== 金額欄位的 Mutator 方法 =====

    /**
     * 設定小計金額
     */
    public function setSubtotalAttribute($value): void
    {
        $this->setCurrencyValue('subtotal', $value);
    }

    /**
     * 設定運費
     */
    public function setShippingFeeAttribute($value): void
    {
        $this->setCurrencyValue('shipping_fee', $value);
    }

    /**
     * 設定稅額
     */
    public function setTaxAttribute($value): void
    {
        $this->setCurrencyValue('tax', $value);
    }

    /**
     * 設定折扣金額
     */
    public function setDiscountAmountAttribute($value): void
    {
        $this->setCurrencyValue('discount_amount', $value);
    }

    /**
     * 設定總金額
     */
    public function setGrandTotalAttribute($value): void
    {
        $this->setCurrencyValue('grand_total', $value);
    }

    /**
     * 設定已付金額
     */
    public function setPaidAmountAttribute($value): void
    {
        $this->setCurrencyValue('paid_amount', $value);
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
     * 計算剩餘應付金額（分為單位）
     * 
     * @return int
     */
    public function getRemainingAmountCentsAttribute(): int
    {
        $grandTotalCents = $this->getCentsValue('grand_total');
        $paidAmountCents = $this->getCentsValue('paid_amount');
        return max(0, $grandTotalCents - $paidAmountCents);
    }

    /**
     * 檢查訂單是否已完全付款
     * 
     * @return bool
     */
    public function isFullyPaidAttribute(): bool
    {
        return $this->remaining_amount_cents <= 0;
    }

    /**
     * 獲取訂單金額摘要
     * 
     * @return array
     */
    public function getAmountSummary(): array
    {
        return [
            'subtotal' => $this->getFormattedCurrency('subtotal'),
            'shipping_fee' => $this->getFormattedCurrency('shipping_fee'),
            'tax' => $this->getFormattedCurrency('tax'),
            'discount_amount' => $this->getFormattedCurrency('discount_amount'),
            'grand_total' => $this->getFormattedCurrency('grand_total'),
            'paid_amount' => $this->getFormattedCurrency('paid_amount'),
            'remaining_amount' => self::formatCurrency($this->remaining_amount_cents),
            'is_fully_paid' => $this->is_fully_paid,
        ];
    }
}
