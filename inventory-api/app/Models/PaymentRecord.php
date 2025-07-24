<?php

namespace App\Models;

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
     * 
     * amount 欄位存儲分為單位的整數值
     */
    protected $casts = [
        'payment_date' => 'datetime',
        'amount' => 'integer',
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
     * 獲取以分為單位的金額（用於測試和內部計算）
     * 
     * @return int|null
     */
    public function getAmountCentsAttribute(): ?int
    {
        return $this->attributes['amount'] ?? null;
    }
    
    // ❌ 已移除金額 accessor - 遵循 CLAUDE.md 1.3 節規範
    // 分→元轉換僅在 Resource 層進行，Model 層不得修改金額顯示
    
    /**
     * 獲取以元為單位的金額（用於前端顯示）
     * 
     * @return float|null
     */
    public function getAmountInYuanAttribute(): ?float
    {
        $amount = $this->attributes['amount'] ?? null;
        return $amount !== null ? round($amount / 100, 2) : null;
    }
    
    /**
     * 將元轉換為分
     * 
     * @param float|null $yuan
     * @return int
     */
    public static function yuanToCents(?float $yuan): int
    {
        return $yuan !== null ? (int) round($yuan * 100) : 0;
    }
    
    /**
     * 將分轉換為元
     * 
     * @param int $cents
     * @return float
     */
    public static function centsToYuan(int $cents): float
    {
        return round($cents / 100, 2);
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
