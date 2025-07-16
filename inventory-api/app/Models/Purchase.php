<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Purchase extends Model
{
    use HasFactory;

    // 進貨單狀態常數
    const STATUS_PENDING = 'pending';                // 已下單（等待處理）
    const STATUS_CONFIRMED = 'confirmed';            // 已確認（廠商確認訂單）
    const STATUS_IN_TRANSIT = 'in_transit';          // 運輸中
    const STATUS_RECEIVED = 'received';              // 已收貨（但未入庫）
    const STATUS_COMPLETED = 'completed';            // 已完成（已入庫）
    const STATUS_CANCELLED = 'cancelled';            // 已取消
    const STATUS_PARTIALLY_RECEIVED = 'partially_received'; // 部分收貨

    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'total_amount' => 'integer',
        'shipping_cost' => 'integer',
        'purchased_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 獲取該進貨單所屬的門市
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * 獲取創建該進貨單的用戶
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * 獲取該進貨單的所有項目
     */
    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * 取得所有可用的狀態選項
     * 
     * @return array
     */
    public static function getStatusOptions(): array
    {
        return [
            self::STATUS_PENDING => '已下單',
            self::STATUS_CONFIRMED => '已確認',
            self::STATUS_IN_TRANSIT => '運輸中',
            self::STATUS_RECEIVED => '已收貨',
            self::STATUS_COMPLETED => '已完成',
            self::STATUS_CANCELLED => '已取消',
            self::STATUS_PARTIALLY_RECEIVED => '部分收貨',
        ];
    }

    /**
     * 進貨單狀態轉換規則
     * 定義每個狀態可以轉換到哪些狀態
     * 
     * @return array
     */
    public static function getStatusTransitionRules(): array
    {
        return [
            self::STATUS_PENDING => [
                self::STATUS_CONFIRMED,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_CONFIRMED => [
                self::STATUS_IN_TRANSIT,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_IN_TRANSIT => [
                self::STATUS_RECEIVED,
                self::STATUS_PARTIALLY_RECEIVED,
                self::STATUS_CANCELLED,
            ],
            self::STATUS_PARTIALLY_RECEIVED => [
                self::STATUS_RECEIVED,
                self::STATUS_COMPLETED,  // 允許部分收貨直接完成
                self::STATUS_CANCELLED,
            ],
            self::STATUS_RECEIVED => [
                self::STATUS_COMPLETED,
                // 允許回退到已收貨狀態（用於庫存操作錯誤時的修正）
            ],
            self::STATUS_COMPLETED => [
                // 已完成的進貨單通常不允許轉換，除非有特殊業務需求
            ],
            self::STATUS_CANCELLED => [
                // 已取消的進貨單不允許轉換到其他狀態
            ],
        ];
    }

    /**
     * 檢查狀態轉換是否合法
     * 
     * @param string $fromStatus 原始狀態
     * @param string $toStatus 目標狀態
     * @return bool
     */
    public static function isValidStatusTransition(string $fromStatus, string $toStatus): bool
    {
        $rules = self::getStatusTransitionRules();
        
        // 相同狀態視為合法（冪等操作）
        if ($fromStatus === $toStatus) {
            return true;
        }
        
        // 檢查轉換規則
        return isset($rules[$fromStatus]) && in_array($toStatus, $rules[$fromStatus]);
    }

    /**
     * 獲取當前狀態可以轉換到的狀態列表
     * 
     * @return array
     */
    public function getAvailableTransitions(): array
    {
        $rules = self::getStatusTransitionRules();
        return $rules[$this->status] ?? [];
    }

    /**
     * 驗證狀態轉換並拋出異常（如果不合法）
     * 
     * @param string $toStatus 目標狀態
     * @throws \InvalidArgumentException
     */
    public function validateStatusTransition(string $toStatus): void
    {
        if (!self::isValidStatusTransition($this->status, $toStatus)) {
            $fromLabel = self::getStatusOptions()[$this->status] ?? $this->status;
            $toLabel = self::getStatusOptions()[$toStatus] ?? $toStatus;
            $availableTransitions = array_map(
                fn($status) => self::getStatusOptions()[$status] ?? $status,
                $this->getAvailableTransitions()
            );
            
            throw new \InvalidArgumentException(
                "進貨單狀態轉換不合法：無法從「{$fromLabel}」轉換到「{$toLabel}」。" .
                "可用的轉換狀態：" . (empty($availableTransitions) ? '無' : implode('、', $availableTransitions))
            );
        }
    }

    /**
     * 取得狀態的中文描述
     * 
     * @return string
     */
    public function getStatusDescriptionAttribute(): string
    {
        return self::getStatusOptions()[$this->status] ?? '未知狀態';
    }

    /**
     * 檢查是否可以取消
     * 
     * @return bool
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_CONFIRMED,
            self::STATUS_IN_TRANSIT,
        ]);
    }

    /**
     * 檢查是否可以修改
     * 
     * @return bool
     */
    public function canBeModified(): bool
    {
        return in_array($this->status, [
            self::STATUS_PENDING,
            self::STATUS_CONFIRMED,
            self::STATUS_RECEIVED,
            self::STATUS_PARTIALLY_RECEIVED,
        ]);
    }

    /**
     * 檢查是否已完成入庫
     * 
     * @return bool
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * 檢查是否可以進行入庫操作
     * 
     * @return bool
     */
    public function canReceiveStock(): bool
    {
        return in_array($this->status, [
            self::STATUS_RECEIVED,
            self::STATUS_PARTIALLY_RECEIVED,
        ]);
    }

    /**
     * 金額欄位的取值器（Accessor）
     * 將資料庫中以分為單位的金額轉換為元
     */
    protected function getTotalAmountAttribute($value)
    {
        return (int) round($value / 100);
    }

    protected function getShippingCostAttribute($value)
    {
        return (int) round($value / 100);
    }
}
