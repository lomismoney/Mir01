<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'order_id',
        'product_variant_id',
        'is_stocked_sale',
        'status',
        'custom_specifications',
        'product_name',
        'sku',
        'price',
        'cost',
        'quantity',
        'tax_rate',
        'discount_amount',
        'custom_product_name',
        'custom_product_specs',
        'custom_product_image',
        'custom_product_category',
        'custom_product_brand',
    ];

    /**
     * 屬性轉換
     */
    protected $casts = [
        'is_stocked_sale' => 'boolean',
        'custom_specifications' => 'json',
        'price' => 'decimal:2',
        'cost' => 'decimal:2',
        'quantity' => 'integer',
        'tax_rate' => 'decimal:2',
        'discount_amount' => 'decimal:2',
    ];

    /**
     * 一個訂單項目屬於一個訂單
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 一個訂單項目可能關聯到一個商品變體 (訂製商品則無)
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }
}
