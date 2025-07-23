<?php

namespace App\Models;

use App\Helpers\MoneyHelper;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * 退款模型
 * 
 * 代表一筆完整的訂單退款記錄，包含：
 * 1. 退款基本資訊（金額、原因、備註）
 * 2. 庫存處理決策
 * 3. 操作員追蹤
 * 4. 關聯的退款品項明細
 * 
 * @property int $id
 * @property int $order_id
 * @property int $creator_id  
 * @property float $total_refund_amount
 * @property string $reason
 * @property string|null $notes
 * @property bool $should_restock
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * 
 * @property-read \App\Models\Order $order
 * @property-read \App\Models\User $creator
 * @property-read \Illuminate\Database\Eloquent\Collection<\App\Models\RefundItem> $refundItems
 */
class Refund extends Model
{
    use HasFactory;

    /**
     * 資料表名稱
     * 
     * @var string
     */
    protected $table = 'refunds';

    /**
     * 可批量賦值的屬性
     * 
     * @var array<int, string>
     */
    protected $fillable = [
        'order_id',
        'creator_id',
        'total_refund_amount',
        'reason',
        'notes',
        'should_restock',
    ];

    /**
     * 屬性轉換
     * 
     * @var array<string, string>
     */
    protected $casts = [
        'should_restock' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 預設屬性值
     * 
     * @var array<string, mixed>
     */
    protected $attributes = [
        'total_refund_amount' => 0,
        'should_restock' => true,
    ];

    /**
     * 關聯：退款所屬的訂單
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Order, \App\Models\Refund>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 關聯：創建退款的操作員
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\User, \App\Models\Refund>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * 關聯：退款的品項明細
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\RefundItem>
     */
    public function refundItems(): HasMany
    {
        return $this->hasMany(RefundItem::class);
    }

    /**
     * 範圍查詢：依據訂單篩選
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $orderId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForOrder($query, int $orderId)
    {
        return $query->where('order_id', $orderId);
    }

    /**
     * 範圍查詢：依據創建者篩選
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $creatorId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCreator($query, int $creatorId)
    {
        return $query->where('creator_id', $creatorId);
    }

    /**
     * 範圍查詢：依據日期範圍篩選
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $startDate
     * @param string $endDate
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeDateRange($query, string $startDate, string $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * 範圍查詢：是否處理庫存回補
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param bool $shouldRestock
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeRestocked($query, bool $shouldRestock = true)
    {
        return $query->where('should_restock', $shouldRestock);
    }

    // ===== 金額 Accessor/Mutator (分/元轉換) =====
    
    /**
     * Total Refund Amount Accessor - 將分轉換為元
     * 
     * @return float
     */
    public function getTotalRefundAmountAttribute(): float
    {
        return MoneyHelper::centsToYuan($this->attributes['total_refund_amount'] ?? 0);
    }
    
    /**
     * Total Refund Amount Mutator - 將元轉換為分
     * 
     * @param float|null $value
     * @return void
     */
    public function setTotalRefundAmountAttribute($value): void
    {
        $this->attributes['total_refund_amount'] = MoneyHelper::yuanToCents($value);
    }

    /**
     * 存取器：格式化退款金額顯示
     * 
     * @return string
     */
    public function getFormattedAmountAttribute(): string
    {
        return MoneyHelper::formatWithDecimals($this->attributes['total_refund_amount'] ?? 0);
    }

    /**
     * 存取器：退款摘要說明
     * 
     * @return string
     */
    public function getSummaryAttribute(): string
    {
        $itemCount = $this->refundItems()->count();
        return "退款 {$itemCount} 個品項，總額 {$this->formatted_amount}";
    }

    /**
     * 存取器：庫存處理狀態文字
     * 
     * @return string
     */
    public function getRestockStatusTextAttribute(): string
    {
        return $this->should_restock ? '已回補庫存' : '未回補庫存';
    }

    /**
     * 業務方法：計算退款品項總數量
     * 
     * @return int
     */
    public function getTotalRefundQuantity(): int
    {
        return $this->refundItems()->sum('quantity');
    }

    /**
     * 業務方法：驗證退款金額是否正確
     * 
     * @return bool
     */
    public function validateTotalAmount(): bool
    {
        // 計算所有退款項目的總額（以分為單位）
        $calculatedTotalCents = $this->refundItems()->sum('refund_subtotal');
        
        // 獲取當前退款總額（以分為單位）
        $currentTotalCents = $this->attributes['total_refund_amount'] ?? 0;
        
        // 比較是否相等（允許 1 分錢的誤差）
        return abs($currentTotalCents - $calculatedTotalCents) <= 1;
    }

    /**
     * 業務方法：獲取退款的商品 SKU 列表
     * 
     * @return array<string>
     */
    public function getRefundedSkus(): array
    {
        return $this->refundItems()
                   ->with('orderItem.productVariant')
                   ->get()
                   ->pluck('orderItem.productVariant.sku')
                   ->unique()
                   ->values()
                   ->toArray();
    }

    /**
     * 業務方法：檢查是否為完整訂單退款
     * 
     * @return bool
     */
    public function isFullOrderRefund(): bool
    {
        // 獲取訂單總金額（以分為單位）
        $orderTotalCents = $this->order->attributes['grand_total'] ?? 0;
        
        // 獲取該訂單的所有退款總額（以分為單位）
        $orderRefundsCents = self::where('order_id', $this->order_id)->sum('total_refund_amount');
        
        // 比較是否相等（允許 1 分錢的誤差）
        return abs($orderTotalCents - $orderRefundsCents) <= 1;
    }

    /**
     * 啟動事件
     * 
     * @return void
     */
    protected static function booted(): void
    {
        // 創建退款時的事件處理
        static::creating(function (Refund $refund) {
            // 確保有創建者
            if (!$refund->creator_id && auth()->check()) {
                $refund->creator_id = auth()->id();
            }
        });

        // 刪除退款時級聯刪除相關記錄
        static::deleting(function (Refund $refund) {
            $refund->refundItems()->delete();
        });
    }

}
