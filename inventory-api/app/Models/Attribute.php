<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * Attribute 模型 - 商品屬性類型
 * 
 * 用於管理商品屬性的類型定義，例如：顏色、尺寸、材質等
 * 與 AttributeValue 是一對多關係（一個屬性類型可以有多個值）
 * 與 Product（SPU）通過樞紐表建立多對多關係
 */
class Attribute extends Model
{
    /**
     * 允許大量賦值的屬性設定
     * 保護 id 和時間戳不被意外修改
     */
    protected $fillable = [
        'name', // 屬性名稱，例如：顏色、尺寸
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該屬性的所有可能值
     * 一個屬性（如顏色）可以有多個值（如紅色、藍色、綠色）
     * 
     * @return HasMany<AttributeValue>
     */
    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }

    /**
     * 獲取使用此屬性的所有 SPU 商品
     * 通過 product_attribute 樞紐表建立多對多關係
     * 
     * @return BelongsToMany<Product>
     */
    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_attribute');
    }
}
