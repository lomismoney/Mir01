<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Laravel\Eloquent\Filter\SearchFilter;
use ApiPlatform\Laravel\Eloquent\Filter\OrderFilter;
use ApiPlatform\Metadata\QueryParameter;
use Illuminate\Database\Eloquent\Factories\HasFactory;
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
#[ApiResource(
    shortName: 'Attribute',
    description: '商品屬性管理',
    operations: [
        new GetCollection(
            // security: "is_granted('viewAny', 'App\\Models\\Attribute')"
        ),
        new Get(
            // security: "is_granted('view', object)"
        ),
        new Post(
            // security: "is_granted('create', 'App\\Models\\Attribute')"
        ),
        new Put(
            // security: "is_granted('update', object)"
        ),
        new Delete(
            // security: "is_granted('delete', object) and !object.values()->exists()"
        )
    ],
    paginationItemsPerPage: 20,
    paginationClientEnabled: true,
    paginationClientItemsPerPage: true
)]
#[QueryParameter(
    key: 'search',
    filter: SearchFilter::class,
    property: 'name'
)]
#[QueryParameter(
    key: 'order[name]',
    filter: OrderFilter::class
)]
#[QueryParameter(
    key: 'order[created_at]',
    filter: OrderFilter::class
)]
class Attribute extends Model
{
    use HasFactory;

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
     * 將 products_count 加入到可訪問的屬性
     */
    protected $appends = ['products_count'];

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

    /**
     * 獲取實際使用此屬性的不重複商品數量
     * 通過屬性值 -> 商品變體 -> 商品的關聯鏈計算
     * 
     * @return int
     */
    public function getProductsCountAttribute(): int
    {
        // 始終使用資料庫查詢來獲取準確的計數
        return \DB::table('attribute_value_product_variant')
            ->join('attribute_values', 'attribute_values.id', '=', 'attribute_value_product_variant.attribute_value_id')
            ->join('product_variants', 'product_variants.id', '=', 'attribute_value_product_variant.product_variant_id')
            ->where('attribute_values.attribute_id', $this->id)
            ->distinct('product_variants.product_id')
            ->count('product_variants.product_id');
    }
}
