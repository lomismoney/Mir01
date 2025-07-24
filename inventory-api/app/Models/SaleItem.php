<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaleItem extends Model
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
        'unit_price' => 'integer',
    ];

    /**
     * 獲取該項目所屬的銷貨單
     */
    public function sale(): BelongsTo
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * 獲取該項目對應的商品
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
