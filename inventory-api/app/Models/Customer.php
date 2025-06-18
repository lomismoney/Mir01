<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Customer extends Model
{
    /**
     * 可以被批量賦值的屬性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'phone',
        'is_company',
        'tax_id',
        'industry_type',
        'payment_type',
        'contact_address',
        'total_unpaid_amount',
        'total_completed_amount',
    ];

    /**
     * 屬性轉型
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_company' => 'boolean',
        'total_unpaid_amount' => 'decimal:2',
        'total_completed_amount' => 'decimal:2',
    ];

    /**
     * 獲取此客戶的所有地址
     */
    public function addresses(): HasMany
    {
        return $this->hasMany(CustomerAddress::class);
    }

    /**
     * 獲取此客戶的預設地址
     */
    public function defaultAddress(): HasOne
    {
        return $this->hasOne(CustomerAddress::class)->where('is_default', true);
    }
}
