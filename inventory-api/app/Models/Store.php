<?php

namespace App\Models;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Laravel\Eloquent\Filter\PartialSearchFilter;
use ApiPlatform\Metadata\QueryParameter;
// use App\Http\Requests\StoreFormRequest;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

#[ApiResource(
    shortName: 'Store',
    description: '分店管理',
    operations: [
        new GetCollection(),
        new Get(),
        new Post(),
        new Put(),
        new Delete()
    ],
    paginationItemsPerPage: 15,
    paginationClientEnabled: true,
    paginationClientItemsPerPage: true,
    rules: [
        'name' => 'required|string|max:255',
        'address' => 'nullable|string|max:500',
        'code' => 'nullable|string|max:50', // 允許 code 為空
        'phone' => 'nullable|string|max:50',
        'manager_id' => 'nullable|integer|exists:users,id',
        'is_active' => 'nullable|boolean',
        'description' => 'nullable|string|max:1000',
    ]
)]
#[QueryParameter(
    key: 'search',
    filter: PartialSearchFilter::class,
    property: 'name'
)]
class Store extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     */
    protected $fillable = [
        'name',
        'address',
        'code',
        'phone',
        'manager_id',
        'is_active',
        'description'
    ];

    /**
     * 類型轉換
     */
    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * 預設屬性值
     * 解決 API Platform POST 請求時 code 欄位沒有預設值的問題
     */
    protected $attributes = [
        'is_active' => true,
        'code' => null, // 允許 code 為 null
    ];

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
     * 獲取該門市的所有訂單
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
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
