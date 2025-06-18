<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'allocated_shipping_cost' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該項目所屬的進貨單
     */
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * 獲取該項目對應的商品變體
     */
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * 獲取該項目對應的商品（通過變體）
     */
    public function product()
    {
        return $this->hasOneThrough(Product::class, ProductVariant::class, 'id', 'id', 'product_variant_id', 'product_id');
    }
}
