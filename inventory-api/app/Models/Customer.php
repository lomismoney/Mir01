<?php

namespace App\Models;

use App\Traits\HandlesCurrency;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes, HandlesCurrency;
    /**
     * 可以被批量賦值的屬性
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'phone',
        'email',
        'is_company',
        'tax_id',
        'industry_type',
        'payment_type',
        'contact_address',
        'total_unpaid_amount',
        'total_completed_amount',
        'priority_level',
        'is_priority_customer',
        // 金額欄位（分為單位）
        'total_unpaid_amount_cents',
        'total_completed_amount_cents',
    ];

    /**
     * 屬性轉型
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_company' => 'boolean',
        'is_priority_customer' => 'boolean',
        // 金額欄位使用分為單位
        'total_unpaid_amount_cents' => 'integer',
        'total_completed_amount_cents' => 'integer',
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

    /**
     * 獲取此客戶的所有訂單
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    // ===== 金額處理方法 =====

    /**
     * 定義金額欄位
     */
    protected function getCurrencyFields(): array
    {
        return ['total_unpaid_amount', 'total_completed_amount'];
    }

    /**
     * 未付金額 Accessor
     */
    public function getTotalUnpaidAmountAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('total_unpaid_amount'));
    }

    /**
     * 未付金額 Mutator
     */
    public function setTotalUnpaidAmountAttribute($value): void
    {
        $this->setCurrencyValue('total_unpaid_amount', $value);
    }

    /**
     * 已完成金額 Accessor
     */
    public function getTotalCompletedAmountAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('total_completed_amount'));
    }

    /**
     * 已完成金額 Mutator
     */
    public function setTotalCompletedAmountAttribute($value): void
    {
        $this->setCurrencyValue('total_completed_amount', $value);
    }
}
