<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

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
    /**
     * 允許大量賦值的屬性設定
     * 保護 id 和時間戳不被意外修改
     */
    protected $fillable = [
        'product_id', // 所屬 SPU 商品的 ID
        'sku',        // 庫存單位編號，全域唯一
        'price',      // 商品變體價格
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'product_id' => 'integer',
        'price' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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
     * 獲取該變體的庫存記錄
     * SKU 與庫存是一對一關係
     * 
     * @return HasOne<Inventory>
     */
    public function inventory(): HasOne
    {
        return $this->hasOne(Inventory::class);
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
}
