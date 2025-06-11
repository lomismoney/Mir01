<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * AttributeValue 模型 - 商品屬性值
 * 
 * 用於管理商品屬性的具體值，例如：紅色、藍色、S、M、L等
 * 與 Attribute 是多對一關係（多個值屬於同一個屬性類型）
 * 與 ProductVariant（SKU）通過樞紐表建立多對多關係
 */
class AttributeValue extends Model
{
    /**
     * 允許大量賦值的屬性設定
     * 保護 id 和時間戳不被意外修改
     */
    protected $fillable = [
        'attribute_id', // 所屬屬性類型的 ID
        'value',        // 屬性值，例如：紅色、S
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'attribute_id' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該屬性值所屬的屬性類型
     * 例如：「紅色」屬於「顏色」屬性
     * 
     * @return BelongsTo<Attribute, AttributeValue>
     */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    /**
     * 獲取使用此屬性值的所有 SKU 商品變體
     * 通過 attribute_value_product_variant 樞紐表建立多對多關係
     * 例如：「紅色」可能用於多個不同的商品變體
     * 
     * @return BelongsToMany<ProductVariant>
     */
    public function productVariants(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariant::class, 
            'attribute_value_product_variant'
        );
    }

    /**
     * 作用域：根據屬性類型篩選屬性值
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $attributeId 屬性類型 ID
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByAttribute($query, int $attributeId)
    {
        return $query->where('attribute_id', $attributeId);
    }
}
