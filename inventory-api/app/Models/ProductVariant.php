<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * ProductVariant 模型 - 商品變體 (SKU)
 * 
 * 用於管理商品的具體變體，例如：紅色S號T-shirt、黑色M號椅子等
 * 每個變體都有唯一的 SKU 和價格
 * 與 Product（SPU）是多對一關係
 * 與 AttributeValue 通過樞紐表建立多對多關係
 * 與 Inventory 是一對一關係
 */
class ProductVariant extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     * 保護 id 和時間戳不被意外修改
     */
    protected $fillable = [
        'product_id',                 // 所屬 SPU 商品的 ID
        'sku',                       // 庫存單位編號，全域唯一
        'price',                     // 商品變體價格
        'cost_price',                // 商品單項成本價格（不含運費）
        'average_cost',              // 平均成本價格（含運費攤銷）
        'total_purchased_quantity',  // 累計進貨數量
        'total_cost_amount',         // 累計成本金額（含運費攤銷）
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'product_id' => 'integer',
        'total_purchased_quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // 金額欄位使用 decimal
        'price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'average_cost' => 'decimal:2',
        'total_cost_amount' => 'decimal:2',
    ];

    /**
     * 獲取該變體所屬的 SPU 商品
     * 例如：「紅色S號T-shirt」屬於「經典棉質T-shirt」
     * 
     * @return BelongsTo<Product, ProductVariant>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * 獲取該變體的所有屬性值組合
     * 通過 attribute_value_product_variant 樞紐表建立多對多關係
     * 例如：「紅色S號T-shirt」包含「紅色」和「S號」兩個屬性值
     * 
     * @return BelongsToMany<AttributeValue>
     */
    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(
            AttributeValue::class, 
            'attribute_value_product_variant'
        );
    }

    /**
     * 獲取該變體的所有庫存記錄
     * 一個 SKU 在不同門市可能都有庫存記錄
     * 
     * @return HasMany<Inventory>
     */
    public function inventory(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * 作用域：根據 SPU 商品篩選變體
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $productId SPU 商品 ID
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByProduct($query, int $productId)
    {
        return $query->where('product_id', $productId);
    }

    /**
     * 作用域：根據 SKU 查找變體
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $sku SKU 編號
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeBySku($query, string $sku)
    {
        return $query->where('sku', $sku);
    }

    /**
     * 獲取變體的屬性組合描述
     * 例如：「紅色 + S號」
     * 
     * @return string
     */
    public function getAttributeCombinationAttribute(): string
    {
        return $this->attributeValues
            ->pluck('value')
            ->join(' + ');
    }

    /**
     * 獲取變體的完整顯示名稱
     * 例如：「經典棉質T-shirt - 紅色 + S號」
     * 
     * @return string
     */
    public function getFullNameAttribute(): string
    {
        $productName = $this->product->name ?? '';
        $combination = $this->getAttributeCombinationAttribute();
        
        return $combination ? "{$productName} - {$combination}" : $productName;
    }

    /**
     * 更新平均成本
     * 根據新的進貨數據重新計算平均成本
     * 
     * @param int $newQuantity 新進貨數量
     * @param float $newCostPrice 新進貨的單項成本
     * @param float $allocatedShippingCost 攤銷的運費
     * @return void
     */
    public function updateAverageCost(int $newQuantity, float $newCostPrice, float $allocatedShippingCost = 0): void
    {
        // 確保屬性不是 null
        $currentTotalPurchased = $this->total_purchased_quantity ?? 0;
        $currentTotalCost = $this->total_cost_amount ?? 0.0;

        // 新進貨的總成本
        $newTotalCost = ($newCostPrice + $allocatedShippingCost) * $newQuantity;

        // 累加歷史數據
        $updatedTotalPurchased = $currentTotalPurchased + $newQuantity;
        $updatedTotalCost = $currentTotalCost + $newTotalCost;

        $this->total_purchased_quantity = $updatedTotalPurchased;
        $this->total_cost_amount = $updatedTotalCost;

        // 避免除以零
        if ($updatedTotalPurchased > 0) {
            $this->average_cost = $updatedTotalCost / $updatedTotalPurchased;
        } else {
            $this->average_cost = 0;
        }

        $this->save();
    }

    /**
     * 獲取利潤率
     * 計算售價與平均成本之間的利潤率
     * 
     * @return float
     */
    public function getProfitMarginAttribute(): float
    {
        // 避免除零錯誤
        if ($this->price <= 0) {
            return 0;
        }
        
        return (($this->price - $this->average_cost) / $this->price) * 100;
    }

    /**
     * 獲取利潤金額
     * 計算售價與平均成本之間的利潤金額
     * 
     * @return float
     */
    public function getProfitAmountAttribute(): float
    {
        return $this->price - $this->average_cost;
    }

    /**
     * 獲取該變體的所有進貨單項目
     * 一個 SKU 可能在多個進貨單中出現
     * 
     * @return HasMany<PurchaseItem>
     */
    public function purchaseItems(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }
    
    /**
     * 獲取該變體的所有訂單項目
     * 一個 SKU 可能在多個訂單中出現
     * 
     * @return HasMany<OrderItem>
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

}
