<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Inventory 模型 - 庫存管理
 * 
 * 用於管理 SKU 級別的庫存，每個 SKU 變體在每個門市都有獨立的庫存記錄
 * 與 ProductVariant（SKU）和 Store（門市）是多對多關係
 * 在新架構中，庫存直接關聯到具體的 SKU 和門市
 */
class Inventory extends Model
{
    use HasFactory;
    
    /**
     * 允許大量賦值的屬性設定
     * 保護 id 和時間戳不被意外修改
     */
    protected $fillable = [
        'product_variant_id',    // 所屬 SKU 變體的 ID
        'store_id',              // 所屬門市的 ID
        'quantity',              // 當前庫存數量
        'low_stock_threshold',   // 低庫存預警閾值
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'product_variant_id' => 'integer',
        'store_id' => 'integer',
        'quantity' => 'integer',
        'low_stock_threshold' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該庫存記錄所屬的 SKU 變體
     * 
     * @return BelongsTo<ProductVariant, Inventory>
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
    
    /**
     * 獲取該庫存記錄所屬的門市
     * 
     * @return BelongsTo<Store, Inventory>
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * 獲取該庫存的所有交易記錄
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class);
    }

    /**
     * 通過 SKU 變體獲取所屬的 SPU 商品
     * 便利方法，用於快速訪問商品資訊
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasOneThrough<Product>
     */
    public function product()
    {
        return $this->hasOneThrough(
            Product::class,
            ProductVariant::class,
            'id',           // ProductVariant 的主鍵
            'id',           // Product 的主鍵
            'product_variant_id', // Inventory 的外鍵
            'product_id'    // ProductVariant 的外鍵
        );
    }

    /**
     * 作用域：低庫存預警
     * 篩選出庫存數量低於或等於預警閾值的記錄
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLowStock($query)
    {
        return $query->whereRaw('quantity <= low_stock_threshold');
    }

    /**
     * 作用域：無庫存
     * 篩選出庫存數量為 0 的記錄
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOutOfStock($query)
    {
        return $query->where('quantity', 0);
    }

    /**
     * 作用域：有庫存
     * 篩選出庫存數量大於 0 的記錄
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInStock($query)
    {
        return $query->where('quantity', '>', 0);
    }

    /**
     * 檢查是否為低庫存
     * 
     * @return bool
     */
    public function getIsLowStockAttribute(): bool
    {
        return $this->quantity <= $this->low_stock_threshold;
    }

    /**
     * 檢查是否無庫存
     * 
     * @return bool
     */
    public function getIsOutOfStockAttribute(): bool
    {
        return $this->quantity === 0;
    }

    /**
     * 增加庫存並記錄交易
     * 
     * @param int $amount 增加數量
     * @param int $userId 操作用戶ID
     * @param string $notes 備註
     * @param array $metadata 其他元數據
     * @return bool
     */
    public function addStock(int $amount, int $userId, string $notes = null, array $metadata = []): bool
    {
        if ($amount <= 0) {
            return false;
        }
        
        $beforeQuantity = $this->quantity;
        $this->quantity += $amount;
        $result = $this->save();
        
        if ($result) {
            // 記錄交易
            $this->transactions()->create([
                'user_id' => $userId,
                'type' => 'addition',
                'quantity' => $amount,
                'before_quantity' => $beforeQuantity,
                'after_quantity' => $this->quantity,
                'notes' => $notes,
                'metadata' => !empty($metadata) ? json_encode($metadata) : null
            ]);
        }
        
        return $result;
    }

    /**
     * 減少庫存並記錄交易
     * 
     * @param int $amount 減少數量
     * @param int $userId 操作用戶ID
     * @param string $notes 備註
     * @param array $metadata 其他元數據
     * @return bool
     */
    public function reduceStock(int $amount, int $userId, string $notes = null, array $metadata = []): bool
    {
        if ($amount <= 0 || $this->quantity < $amount) {
            return false; // 庫存不足或數量無效
        }
        
        $beforeQuantity = $this->quantity;
        $this->quantity -= $amount;
        $result = $this->save();
        
        if ($result) {
            // 記錄交易
            $this->transactions()->create([
                'user_id' => $userId,
                'type' => 'reduction',
                'quantity' => -$amount, // 負數表示減少
                'before_quantity' => $beforeQuantity,
                'after_quantity' => $this->quantity,
                'notes' => $notes,
                'metadata' => !empty($metadata) ? json_encode($metadata) : null
            ]);
        }
        
        return $result;
    }

    /**
     * 設定庫存數量並記錄交易
     * 
     * @param int $quantity 新的庫存數量
     * @param int $userId 操作用戶ID
     * @param string $notes 備註
     * @param array $metadata 其他元數據
     * @return bool
     */
    public function setStock(int $quantity, int $userId, string $notes = null, array $metadata = []): bool
    {
        if ($quantity < 0) {
            return false; // 庫存不能為負數
        }
        
        if ($quantity === $this->quantity) {
            return true; // 數量沒有變化，無需操作
        }
        
        $beforeQuantity = $this->quantity;
        $change = $quantity - $beforeQuantity;
        $this->quantity = $quantity;
        $result = $this->save();
        
        if ($result) {
            // 記錄交易
            $this->transactions()->create([
                'user_id' => $userId,
                'type' => 'adjustment',
                'quantity' => $change,
                'before_quantity' => $beforeQuantity,
                'after_quantity' => $this->quantity,
                'notes' => $notes,
                'metadata' => !empty($metadata) ? json_encode($metadata) : null
            ]);
        }
        
        return $result;
    }
}
