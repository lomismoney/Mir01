<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;

class SaleItem extends Model
{
    use HasFactory;
    
    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 獲取單價（轉換為元）
     */
    protected function unitPrice(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => $value * 100,
        );
    }

    /**
     * 獲取該項目所屬的銷貨單
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * 獲取該項目對應的商品
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
