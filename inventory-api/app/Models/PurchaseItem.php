<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseItem extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'integer',
        'cost_price' => 'integer',
        'allocated_shipping_cost' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取此進貨項目的總成本價格（計算屬性）
     * 直接從原始資料庫值計算，確保一致性
     */
    public function getTotalCostPriceAttribute(): int
    {
        $costPriceInCents = $this->getRawOriginal('cost_price') ?? 0;
        $allocatedShippingCostInCents = $this->getRawOriginal('allocated_shipping_cost') ?? 0;
        
        $totalCostInCents = ($costPriceInCents * $this->quantity) + $allocatedShippingCostInCents;

        return (int) round($totalCostInCents / 100);
    }

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

    protected function getUnitPriceAttribute($value)
    {
        return (int) round($value / 100);
    }

    protected function getCostPriceAttribute($value)
    {
        return (int) round($value / 100);
    }

    protected function getAllocatedShippingCostAttribute($value)
    {
        return (int) round($value / 100);
    }
}
