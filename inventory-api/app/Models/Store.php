<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 獲取該門市的所有庫存記錄
     */
    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * 獲取該門市的所有進貨單
     */
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * 獲取該門市的所有銷貨單
     */
    public function sales()
    {
        return $this->hasMany(Sale::class);
    }
}
