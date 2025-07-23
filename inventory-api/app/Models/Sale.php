<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;

class Sale extends Model
{
    use HasFactory;
    
    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 獲取總金額（轉換為元）
     */
    protected function totalAmount(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $value / 100,
            set: fn ($value) => $value * 100,
        );
    }

    /**
     * 獲取該銷貨單所屬的門市
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * 獲取該銷貨單的所有項目
     */
    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}
