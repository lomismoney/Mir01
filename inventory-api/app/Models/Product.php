<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Product 模型 - SPU (Standard Product Unit)
 * 
 * 用於管理標準化商品單元，例如：「經典棉質T-shirt」、「Aeron 人體工學椅」
 * 一個 SPU 可以有多個 SKU 變體
 * 與 Category 是多對一關係
 * 與 ProductVariant（SKU）是一對多關係
 * 與 Attribute 通過樞紐表建立多對多關係
 */
class Product extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     * 保護 id 和時間戳不被意外修改
     */
    protected $fillable = [
        'name',        // SPU 名稱，例如：經典棉質T-shirt
        'description', // 商品描述
        'category_id', // 所屬分類 ID
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'category_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該 SPU 所屬的分類
     * 
     * @return BelongsTo<Category, Product>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * 獲取該 SPU 的所有 SKU 變體
     * 一個 SPU 可以有多個不同的 SKU（如不同顏色、尺寸的組合）
     * 
     * @return HasMany<ProductVariant>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * 獲取該 SPU 支援的所有屬性類型
     * 通過 product_attribute 樞紐表建立多對多關係
     * 例如：T-shirt SPU 支援「顏色」和「尺寸」屬性
     * 
     * @return BelongsToMany<Attribute>
     */
    public function attributes(): BelongsToMany
    {
        return $this->belongsToMany(Attribute::class, 'product_attribute');
    }

    /**
     * 獲取該 SPU 的所有庫存記錄（透過 SKU 變體）
     * 注意：在新架構中，庫存直接關聯到 SKU，而非 SPU
     * 此方法提供便利的聚合查詢
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasManyThrough<Inventory>
     */
    public function inventories()
    {
        return $this->hasManyThrough(Inventory::class, ProductVariant::class);
    }

    /**
     * 作用域：根據分類篩選商品
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $categoryId 分類 ID
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCategory($query, int $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * 作用域：搜尋商品名稱
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $name 搜尋關鍵字
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeSearchName($query, string $name)
    {
        return $query->where('name', 'like', "%{$name}%");
    }

    /**
     * 獲取該 SPU 的總庫存數量
     * 計算所有 SKU 變體的庫存總和
     * 
     * @return int
     */
    public function getTotalStockAttribute(): int
    {
        return $this->inventories()->sum('quantity');
    }

    /**
     * 獲取該 SPU 的 SKU 變體數量
     * 
     * @return int
     */
    public function getVariantCountAttribute(): int
    {
        return $this->variants()->count();
    }

    /**
     * 獲取該 SPU 的價格範圍
     * 返回最低價和最高價
     * 
     * @return array
     */
    public function getPriceRangeAttribute(): array
    {
        $variants = $this->variants();
        
        return [
            'min' => $variants->min('price'),
            'max' => $variants->max('price'),
        ];
    }
}
