<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderStatusHistory extends Model
{
    /**
     * 不使用 updated_at 時間戳
     */
    const UPDATED_AT = null;

    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'order_id',
        'status_type',
        'from_status',
        'to_status',
        'user_id',
        'notes',
    ];

    /**
     * 一條歷史記錄屬於一個訂單
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 一條歷史記錄可能由一個用戶操作 (系統操作則無)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
