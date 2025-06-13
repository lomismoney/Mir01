<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Store extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 獲取該門市的所有用戶
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'store_user')
            ->withTimestamps();   // if pivot tracks created_at/updated_at
    }

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

    /**
     * 獲取該門市的所有轉出庫存記錄
     */
    public function transfersOut()
    {
        return $this->hasMany(InventoryTransfer::class, 'from_store_id');
    }

    /**
     * 獲取該門市的所有轉入庫存記錄
     */
    public function transfersIn()
    {
        return $this->hasMany(InventoryTransfer::class, 'to_store_id');
    }
}
