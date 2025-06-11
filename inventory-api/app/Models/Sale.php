<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

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
