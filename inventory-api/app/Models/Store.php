<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Store extends Model
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
        'business_hours' => 'array',
        'is_active' => 'boolean',
        'is_default' => 'boolean',
        'latitude' => 'float',
        'longitude' => 'float',
    ];

    /**
     * 獲取該門市的所有用戶
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'store_user')
            ->withTimestamps();   // if pivot tracks created_at/updated_at
    }

    /**
     * 獲取該門市的所有庫存記錄
     */
    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * 獲取該門市的所有進貨單
     */
    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * 獲取該門市的所有銷貨單
     */
    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * 獲取該門市的所有轉出庫存記錄
     */
    public function transfersOut(): HasMany
    {
        return $this->hasMany(InventoryTransfer::class, 'from_store_id');
    }

    /**
     * 獲取該門市的所有轉入庫存記錄
     */
    public function transfersIn(): HasMany
    {
        return $this->hasMany(InventoryTransfer::class, 'to_store_id');
    }

    /**
     * 獲取該門市的所有訂單
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * 更新門市的經緯度座標
     *
     * @param float|null $latitude 緯度
     * @param float|null $longitude 經度
     * @return bool
     */
    public function updateCoordinates(?float $latitude, ?float $longitude): bool
    {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        
        return $this->save();
    }
}