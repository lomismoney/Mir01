<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * InventoryTransaction 模型 - 庫存交易記錄
 * 
 * 用於記錄所有庫存變動的歷史
 * 每個交易記錄關聯到一個具體的庫存記錄和操作用戶
 */
class InventoryTransaction extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     */
    protected $fillable = [
        'inventory_id',
        'user_id',
        'type',
        'quantity',
        'before_quantity',
        'after_quantity',
        'notes',
        'metadata',
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'inventory_id' => 'integer',
        'user_id' => 'integer',
        'quantity' => 'integer',
        'before_quantity' => 'integer',
        'after_quantity' => 'integer',
        'metadata' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 交易類型常量
     */
    public const TYPE_ADDITION = 'addition';
    public const TYPE_REDUCTION = 'reduction';
    public const TYPE_ADJUSTMENT = 'adjustment';
    public const TYPE_TRANSFER_IN = 'transfer_in';
    public const TYPE_TRANSFER_OUT = 'transfer_out';
    public const TYPE_TRANSFER_CANCEL = 'transfer_cancel';

    /**
     * 獲取該交易記錄所屬的庫存
     * 
     * @return BelongsTo<Inventory, InventoryTransaction>
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class);
    }

    /**
     * 獲取該交易記錄的操作用戶
     * 
     * @return BelongsTo<User, InventoryTransaction>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
    
    /**
     * 範圍查詢：按交易類型查詢
     */
    public function scopeOfType($query, $type)
    {
        return $query->where('type', $type);
    }
    
    /**
     * 範圍查詢：按時間範圍查詢
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }
}
