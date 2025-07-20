<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * 退款品項模型
 * 
 * 代表一筆退款中的單一品項明細，包含：
 * 1. 退貨數量資訊
 * 2. 退款小計計算
 * 3. 與訂單品項的關聯
 * 4. 與主退款單的關聯
 * 
 * @property int $id
 * @property int $refund_id
 * @property int $order_item_id
 * @property int $quantity
 * @property float $refund_subtotal
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 * 
 * @property-read \App\Models\Refund $refund
 * @property-read \App\Models\OrderItem $orderItem
 */
class RefundItem extends Model
{
    use HasFactory;

    /**
     * 資料表名稱
     * 
     * @var string
     */
    protected $table = 'refund_items';

    /**
     * 可批量賦值的屬性
     * 
     * @var array<int, string>
     */
    protected $fillable = [
        'refund_id',
        'order_item_id',
        'quantity',
        'refund_subtotal',
    ];

    /**
     * 屬性轉換
     * 
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        // 金額欄位使用 decimal
        'refund_subtotal' => 'decimal:2',
    ];

    /**
     * 關聯：退款品項所屬的退款單
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\Refund, \App\Models\RefundItem>
     */
    public function refund(): BelongsTo
    {
        return $this->belongsTo(Refund::class);
    }

    /**
     * 關聯：退款品項對應的訂單品項
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo<\App\Models\OrderItem, \App\Models\RefundItem>
     */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    /**
     * 範圍查詢：依據退款單篩選
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $refundId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForRefund($query, int $refundId)
    {
        return $query->where('refund_id', $refundId);
    }

    /**
     * 範圍查詢：依據訂單品項篩選
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $orderItemId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForOrderItem($query, int $orderItemId)
    {
        return $query->where('order_item_id', $orderItemId);
    }

    /**
     * 範圍查詢：依據退貨數量範圍篩選
     * 
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $minQuantity
     * @param int|null $maxQuantity
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeQuantityRange($query, int $minQuantity, ?int $maxQuantity = null)
    {
        $query->where('quantity', '>=', $minQuantity);
        
        if ($maxQuantity !== null) {
            $query->where('quantity', '<=', $maxQuantity);
        }
        
        return $query;
    }

    /**
     * 存取器：格式化退款小計顯示
     * 
     * @return string
     */
    public function getFormattedSubtotalAttribute(): string
    {
        return '$' . number_format($this->refund_subtotal, 2);
    }

    /**
     * 存取器：退款品項摘要
     * 
     * @return string
     */
    public function getSummaryAttribute(): string
    {
        $sku = $this->orderItem->productVariant->sku ?? 'N/A';
        return "SKU: {$sku} × {$this->quantity} = {$this->formatted_subtotal}";
    }

    /**
     * 存取器：單價（從訂單品項獲取）
     * 
     * @return float
     */
    public function getUnitPriceAttribute(): float
    {
        return $this->orderItem ? $this->orderItem->price : 0;
    }

    /**
     * 存取器：商品名稱（從訂單品項獲取）
     * 
     * @return string
     */
    public function getProductNameAttribute(): string
    {
        return $this->orderItem->productVariant->product->name ?? 'Unknown Product';
    }

    /**
     * 存取器：商品 SKU（從訂單品項獲取）
     * 
     * @return string
     */
    public function getSkuAttribute(): string
    {
        return $this->orderItem->productVariant->sku ?? 'N/A';
    }

    /**
     * 業務方法：驗證退款小計是否正確
     * 
     * @return bool
     */
    public function validateSubtotal(): bool
    {
        $expectedSubtotal = $this->unit_price * $this->quantity;
        return abs($this->refund_subtotal - $expectedSubtotal) < 0.01; // 允許 1 分錢的誤差
    }

    /**
     * 業務方法：計算退款比例
     * 
     * @return float 返回 0-1 之間的比例
     */
    public function getRefundRatio(): float
    {
        if (!$this->orderItem || $this->orderItem->quantity <= 0) {
            return 0;
        }
        
        return $this->quantity / $this->orderItem->quantity;
    }

    /**
     * 業務方法：檢查是否為完整品項退款
     * 
     * @return bool
     */
    public function isFullItemRefund(): bool
    {
        return $this->orderItem && $this->quantity >= $this->orderItem->quantity;
    }

    /**
     * 業務方法：獲取該品項的總退貨數量（跨所有退款）
     * 
     * @return int
     */
    public function getTotalRefundedQuantity(): int
    {
        return self::where('order_item_id', $this->order_item_id)->sum('quantity');
    }

    /**
     * 業務方法：獲取該品項的剩餘可退數量
     * 
     * @return int
     */
    public function getRemainingRefundableQuantity(): int
    {
        if (!$this->orderItem) {
            return 0;
        }
        
        $totalRefunded = $this->getTotalRefundedQuantity();
        return max(0, $this->orderItem->quantity - $totalRefunded);
    }

    /**
     * 靜態方法：計算指定訂單品項的總退款金額
     * 
     * @param int $orderItemId
     * @return float
     */
    public static function getTotalRefundedAmount(int $orderItemId): float
    {
        return self::where('order_item_id', $orderItemId)->sum('refund_subtotal');
    }

    /**
     * 靜態方法：檢查訂單品項是否可以退款指定數量
     * 
     * @param int $orderItemId
     * @param int $requestedQuantity
     * @return bool
     */
    public static function canRefundQuantity(int $orderItemId, int $requestedQuantity): bool
    {
        $orderItem = OrderItem::find($orderItemId);
        if (!$orderItem) {
            return false;
        }
        
        $totalRefunded = self::where('order_item_id', $orderItemId)->sum('quantity');
        $availableQuantity = $orderItem->quantity - $totalRefunded;
        
        return $requestedQuantity <= $availableQuantity && $requestedQuantity > 0;
    }

    /**
     * 啟動事件
     * 
     * @return void
     */
    protected static function booted(): void
    {
        // 創建退款品項時自動計算小計
        static::creating(function (RefundItem $refundItem) {
            if (!$refundItem->refund_subtotal && $refundItem->orderItem) {
                $refundItem->refund_subtotal = $refundItem->orderItem->price * $refundItem->quantity;
            }
        });

        // 更新退款品項時重新計算小計
        static::updating(function (RefundItem $refundItem) {
            if ($refundItem->isDirty(['quantity']) && $refundItem->orderItem) {
                $refundItem->refund_subtotal = $refundItem->orderItem->price * $refundItem->quantity;
            }
        });
    }

}
