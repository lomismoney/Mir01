<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Purchase extends Model
{
    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'total_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'purchased_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該進貨單所屬的門市
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * 獲取該進貨單的所有項目
     */
    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }
}
