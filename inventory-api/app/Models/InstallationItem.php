<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstallationItem extends Model
{
    use HasFactory;
    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'installation_id',
        'order_item_id',
        'product_variant_id',
        'product_name',
        'sku',
        'quantity',
        'specifications',
        'status',
        'notes',
    ];

    /**
     * 屬性轉換
     */
    protected $casts = [
        'quantity' => 'integer',
    ];

    /**
     * 一個安裝項目屬於一個安裝單 (Many-to-One / Inverse)
     */
    public function installation(): BelongsTo
    {
        return $this->belongsTo(Installation::class);
    }

    /**
     * 一個安裝項目可能關聯一個訂單項目 (Many-to-One / Inverse)
     * 可選關聯，實現鬆耦合
     */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    /**
     * 一個安裝項目可能關聯一個商品變體 (Many-to-One / Inverse)
     * 可選關聯，用於追蹤商品規格
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * 🎯 判斷安裝項目是否已完成
     * 
     * @return bool
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * 🎯 判斷安裝項目是否待處理
     * 
     * @return bool
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * 🎯 標記為已完成
     * 
     * @return bool
     */
    public function markAsCompleted(): bool
    {
        return $this->update(['status' => 'completed']);
    }

    /**
     * 🎯 標記為待處理
     * 
     * @return bool
     */
    public function markAsPending(): bool
    {
        return $this->update(['status' => 'pending']);
    }
} 