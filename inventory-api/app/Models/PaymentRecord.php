<?php

namespace App\Models;

use App\Traits\HandlesCurrency;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 付款記錄模型
 * 
 * 用於追蹤訂單的每一筆付款記錄，支援部分付款功能。
 * 每筆付款都會在此表中創建一條記錄，用於完整的付款歷史追蹤。
 */
class PaymentRecord extends Model
{
    use HasFactory, HandlesCurrency;

    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'order_id',
        'creator_id',
        'amount',
        'payment_method',
        'payment_date',
        'notes',
        // 金額欄位（分為單位）
        'amount_cents',
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'payment_date' => 'datetime',
        // 金額欄位使用分為單位
        'amount_cents' => 'integer',
    ];

    /**
     * 關聯到訂單
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 關聯到創建者（用戶）
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * 付款方式的選項列表
     */
    public static function getPaymentMethods(): array
    {
        return [
            'cash' => '現金',
            'transfer' => '轉帳',
            'credit_card' => '信用卡',
        ];
    }

    // ===== 金額處理方法 =====

    /**
     * 定義金額欄位
     */
    protected function getCurrencyFields(): array
    {
        return ['amount'];
    }

    /**
     * 金額 Accessor
     */
    public function getAmountAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('amount'));
    }

    /**
     * 金額 Mutator
     */
    public function setAmountAttribute($value): void
    {
        $this->setCurrencyValue('amount', $value);
    }
}
