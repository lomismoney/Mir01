<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Helpers\MoneyHelper;

/**
 * 付款記錄模型
 * 
 * 用於追蹤訂單的每一筆付款記錄，支援部分付款功能。
 * 每筆付款都會在此表中創建一條記錄，用於完整的付款歷史追蹤。
 */
class PaymentRecord extends Model
{
    use HasFactory;

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
    ];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'payment_date' => 'datetime',
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
     * 取得付款金額（元）
     * 將資料庫中的分轉換為元
     *
     * @param int $value
     * @return float
     */
    public function getAmountAttribute($value): float
    {
        return MoneyHelper::centsToYuan($value);
    }

    /**
     * 設定付款金額（元）
     * 將輸入的元轉換為分儲存
     *
     * @param float $value
     * @return void
     */
    public function setAmountAttribute($value): void
    {
        $this->attributes['amount'] = MoneyHelper::yuanToCents($value);
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

}
