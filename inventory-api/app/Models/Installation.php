<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Installation extends Model
{
    use HasFactory;
    
    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'installation_number',
        'order_id',
        'installer_user_id',
        'created_by',
        'customer_name',
        'customer_phone',
        'installation_address',
        'status',
        'scheduled_date',
        'actual_start_time',
        'actual_end_time',
        'notes',
    ];

    /**
     * 屬性轉換
     */
    protected $casts = [
        'scheduled_date' => 'date',
        'actual_start_time' => 'datetime',
        'actual_end_time' => 'datetime',
    ];

    /**
     * 一個安裝單包含多個安裝項目 (One-to-Many)
     */
    public function items(): HasMany
    {
        return $this->hasMany(InstallationItem::class);
    }

    /**
     * 一個安裝單包含多個安裝項目 (別名方法)
     */
    public function installationItems(): HasMany
    {
        return $this->hasMany(InstallationItem::class);
    }

    /**
     * 一個安裝單可能關聯一個訂單 (Many-to-One / Inverse)
     * 可選關聯，實現鬆耦合
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 一個安裝單由一個安裝師傅負責 (Many-to-One / Inverse)
     */
    public function installer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'installer_user_id');
    }

    /**
     * 一個安裝單由一個用戶創建 (Many-to-One / Inverse)
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * 🎯 判斷安裝單是否已完成
     * 
     * @return bool
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * 🎯 判斷安裝單是否可以取消
     * 
     * @return bool
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'scheduled']);
    }

    /**
     * 🎯 判斷安裝單是否已開始
     * 
     * @return bool
     */
    public function hasStarted(): bool
    {
        return in_array($this->status, ['in_progress', 'completed']);
    }

    /**
     * 🎯 獲取所有待完成的安裝項目數量
     * 
     * @return int
     */
    public function getPendingItemsCountAttribute(): int
    {
        // 如果 items 關聯已加載，則在集合上操作以避免額外查詢
        if ($this->relationLoaded('items')) {
            return $this->items->where('status', 'pending')->count();
        }
        // 否則，進行資料庫查詢
        return $this->items()->where('status', 'pending')->count();
    }

    /**
     * 🎯 判斷所有安裝項目是否都已完成
     * 
     * @return bool
     */
    public function areAllItemsCompleted(): bool
    {
        return $this->getPendingItemsCountAttribute() === 0;
    }
} 