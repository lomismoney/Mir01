<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * InventoryTransfer 模型 - 庫存轉移記錄
 * 
 * 用於記錄門市之間的庫存轉移
 * 每個轉移記錄關聯到來源門市、目標門市、商品變體和操作用戶
 */
class InventoryTransfer extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     */
    protected $fillable = [
        'from_store_id',
        'to_store_id',
        'user_id',
        'product_variant_id',
        'quantity',
        'status',
        'notes',
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'from_store_id' => 'integer',
        'to_store_id' => 'integer',
        'user_id' => 'integer',
        'product_variant_id' => 'integer',
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 轉移狀態常量
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_TRANSIT = 'in_transit';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * 獲取該轉移記錄的來源門市
     * 
     * @return BelongsTo<Store, InventoryTransfer>
     */
    public function fromStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'from_store_id');
    }

    /**
     * 獲取該轉移記錄的目標門市
     * 
     * @return BelongsTo<Store, InventoryTransfer>
     */
    public function toStore(): BelongsTo
    {
        return $this->belongsTo(Store::class, 'to_store_id');
    }

    /**
     * 獲取該轉移記錄的操作用戶
     * 
     * @return BelongsTo<User, InventoryTransfer>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 獲取該轉移記錄的商品變體
     * 
     * @return BelongsTo<ProductVariant, InventoryTransfer>
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
    
    /**
     * 範圍查詢：按狀態查詢
     */
    public function scopeOfStatus($query, $status)
    {
        return $query->where('status', $status);
    }
    
    /**
     * 範圍查詢：按來源門市查詢
     */
    public function scopeFromStore($query, $storeId)
    {
        return $query->where('from_store_id', $storeId);
    }
    
    /**
     * 範圍查詢：按目標門市查詢
     */
    public function scopeToStore($query, $storeId)
    {
        return $query->where('to_store_id', $storeId);
    }
}
