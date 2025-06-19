<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerAddress extends Model
{
    use HasFactory;
    /**
     * 可以被批量賦值的屬性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'customer_id',
        'address',
        'is_default',
    ];

    /**
     * 屬性轉型
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_default' => 'boolean',
    ];

    /**
     * 獲取此地址所屬的客戶
     */
    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
