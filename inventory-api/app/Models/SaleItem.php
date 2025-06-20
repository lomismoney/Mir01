<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class SaleItem extends Model
{
    use HasFactory;
    
    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

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
