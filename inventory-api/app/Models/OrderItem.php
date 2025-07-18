<?php

namespace App\Models;

use App\Traits\HandlesCurrency;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Casts\Attribute;

class OrderItem extends Model
{
    use HasFactory, HandlesCurrency;
    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'order_id',
        'product_variant_id',
        'is_stocked_sale',
        'is_backorder', // 🎯 Operation: Precise Tagging - 新增預訂標記欄位
        'status',
        'custom_specifications',
        'product_name',
        'sku',
        'price',
        'cost',
        'quantity',
        'fulfilled_quantity',
        'tax_rate',
        'discount_amount',
        'custom_product_name',
        'custom_product_specs',
        'custom_product_image',
        'custom_product_category',
        'custom_product_brand',
        'purchase_item_id',
        'is_fulfilled',
        'fulfilled_at',
        // 金額欄位（分為單位）
        'price_cents',
        'cost_cents',
        'discount_amount_cents',
        // 分配優先級欄位
        'allocation_priority_score',
        'allocation_metadata',
    ];

    /**
     * 屬性轉換
     */
    protected $casts = [
        'is_stocked_sale' => 'boolean',
        'is_backorder' => 'boolean', // 🎯 Operation: Precise Tagging - 預訂標記轉換
        'is_fulfilled' => 'boolean',
        'custom_specifications' => 'json',
        'quantity' => 'integer',
        'fulfilled_quantity' => 'integer',
        'tax_rate' => 'decimal:2',
        'fulfilled_at' => 'datetime',
        // 金額欄位使用整數（分為單位）
        'price' => 'integer',
        'cost' => 'integer',
        'discount_amount' => 'integer',
        'price_cents' => 'integer',
        'cost_cents' => 'integer', 
        'discount_amount_cents' => 'integer',
        // 分配優先級欄位
        'allocation_priority_score' => 'integer',
        'allocation_metadata' => 'json',
    ];

    /**
     * 模型的預設屬性值
     */
    protected $attributes = [
        'status' => '待處理',
        'is_stocked_sale' => true,
        'is_backorder' => false, // 🎯 Operation: Precise Tagging - 預設非預訂商品
    ];

    /**
     * 不可批量賦值的屬性（防止意外保存動態屬性）
     */
    protected $guarded = [
        'calculated_priority_score', // 動態計算的優先級分數，不應保存到資料庫
    ];

    /**
     * 追加到模型陣列和 JSON 的存取器
     */
    protected $appends = [
        'purchase_status',
        'purchase_status_text',
        'status_text'
    ];

    /**
     * 一個訂單項目屬於一個訂單
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 一個訂單項目可能關聯到一個商品變體 (訂製商品則無)
     */
    public function productVariant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * 關聯的進貨項目（用於追蹤預訂商品的採購狀態）
     */
    public function linkedPurchaseItem(): BelongsTo
    {
        return $this->belongsTo(PurchaseItem::class, 'purchase_item_id');
    }

    /**
     * 獲取採購狀態
     * 
     * @return string
     */
    public function getPurchaseStatusAttribute(): string
    {
        // 非預訂商品不需要採購
        if (!$this->is_backorder) {
            return 'not_applicable';
        }

        // 尚未建立進貨單
        if (!$this->purchase_item_id) {
            return 'pending_purchase';
        }

        // 返回關聯進貨單的狀態
        $purchase = $this->linkedPurchaseItem?->purchase;
        if (!$purchase) {
            return 'unknown';
        }

        // 根據進貨單狀態返回對應的採購狀態
        return match($purchase->status) {
            'pending' => 'purchase_created',      // 進貨單已建立
            'confirmed' => 'ordered_from_supplier', // 已確認
            'in_transit' => 'in_transit',         // 運送中
            'ordered' => 'ordered_from_supplier', // 已向供應商下單
            'partial' => 'partially_received',    // 部分到貨
            'received' => 'fully_received',       // 完全到貨
            'partially_received' => 'partially_received', // 部分收貨
            'completed' => 'fully_received',      // 已完成
            'cancelled' => 'purchase_cancelled',  // 進貨單已取消
            default => 'unknown'
        };
    }

    /**
     * 獲取採購狀態的中文說明
     * 
     * @return string
     */
    public function getPurchaseStatusTextAttribute(): string
    {
        return match($this->purchase_status) {
            'not_applicable' => '無需採購',
            'pending_purchase' => '待建立進貨單',
            'purchase_created' => '進貨單已建立',
            'ordered_from_supplier' => '已向供應商下單',
            'in_transit' => '運送中',
            'partially_received' => '部分到貨',
            'fully_received' => '已全部到貨',
            'purchase_cancelled' => '進貨單已取消',
            default => '未知狀態'
        };
    }

    /**
     * 獲取訂單項目狀態的中文說明
     *
     * @return string
     */
    public function getStatusTextAttribute(): string
    {
        return match($this->status) {
            'pending' => '待處理',
            'transfer_pending' => '調貨中',
            'backordered' => '預訂中',
            'shipped' => '已出貨',
            'completed' => '已完成',
            'cancelled' => '已取消',
            default => '未知狀態'
        };
    }
    
    /**
     * 獲取相關的庫存轉移記錄
     * 透過 order_id 和 product_variant_id 關聯
     * 
     * @return \App\Models\InventoryTransfer|null
     */
    public function getTransferAttribute()
    {
        // 使用屬性方式獲取相關的轉移記錄
        return InventoryTransfer::where('order_id', $this->order_id)
                               ->where('product_variant_id', $this->product_variant_id)
                               ->first();
    }
    
    /**
     * 定義轉移關聯（用於 eager loading）
     * 
     * @return \Illuminate\Database\Eloquent\Relations\HasOne
     */
    public function transfer()
    {
        return $this->hasOne(InventoryTransfer::class, 'order_id', 'order_id');
    }
    
    /**
     * 獲取關聯的進貨項目
     * 
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function purchaseItem()
    {
        return $this->belongsTo(PurchaseItem::class, 'purchase_item_id');
    }
    
    /**
     * 獲取整合狀態（結合採購和轉移狀態）
     * 
     * @return string
     */
    public function getIntegratedStatusAttribute(): string
    {
        // 獲取相關的轉移記錄
        $transfer = $this->transfer;
        $purchaseStatus = $this->purchase_status;
        
        // 如果沒有轉移記錄，返回採購狀態
        if (!$transfer) {
            return 'purchase_' . $purchaseStatus;
        }
        
        // 如果有轉移記錄
        $transferStatus = $transfer->status;
        
        // 如果沒有進貨單，返回轉移狀態
        if ($purchaseStatus === 'pending_purchase' || $purchaseStatus === 'not_applicable') {
            return 'transfer_' . $transferStatus;
        }
        
        // 如果進貨已完成但轉移未完成，優先顯示轉移狀態
        if ($purchaseStatus === 'fully_received' && $transferStatus !== 'completed') {
            return 'transfer_' . $transferStatus;
        }
        
        // 其他情況優先顯示進貨狀態
        return 'purchase_' . $purchaseStatus;
    }
    
    /**
     * 獲取整合狀態的中文說明
     * 
     * @return string
     */
    public function getIntegratedStatusTextAttribute(): string
    {
        $integratedStatus = $this->integrated_status;
        $transfer = $this->transfer;
        
        // 轉移狀態對應文字
        $transferStatusTexts = [
            'transfer_pending' => '待調撥',
            'transfer_in_transit' => '庫存調撥中',
            'transfer_completed' => '調撥完成',
            'transfer_cancelled' => '調撥已取消',
        ];
        
        // 如果是轉移狀態
        if (isset($transferStatusTexts[$integratedStatus])) {
            return $transferStatusTexts[$integratedStatus];
        }
        
        // 如果是進貨狀態但同時有轉移
        if (str_starts_with($integratedStatus, 'purchase_') && $transfer) {
            $baseText = $this->purchase_status_text;
            $transferStatus = $transfer->status;
            
            if ($transferStatus === 'completed') {
                return $baseText . '（部分已調貨）';
            } elseif (in_array($transferStatus, ['pending', 'in_transit'])) {
                return $baseText . '（同時調貨中）';
            }
        }
        
        // 預設返回採購狀態文字
        return $this->purchase_status_text;
    }
    
    /**
     * 獲取剩餘待履行數量
     * 
     * @return int
     */
    public function getRemainingFulfillmentQuantityAttribute(): int
    {
        return max(0, $this->quantity - $this->fulfilled_quantity);
    }
    
    /**
     * 檢查是否部分履行
     * 
     * @return bool
     */
    public function getIsPartiallyFulfilledAttribute(): bool
    {
        return $this->fulfilled_quantity > 0 && $this->fulfilled_quantity < $this->quantity;
    }
    
    /**
     * 檢查是否完全履行
     * 
     * @return bool
     */
    public function getIsFullyFulfilledAttribute(): bool
    {
        return $this->fulfilled_quantity >= $this->quantity;
    }
    
    /**
     * 更新履行數量
     * 
     * @param int $additionalQuantity 新增的履行數量
     * @return bool
     */
    public function addFulfilledQuantity(int $additionalQuantity): bool
    {
        $newFulfilledQuantity = $this->fulfilled_quantity + $additionalQuantity;
        
        // 確保不超過訂購數量
        if ($newFulfilledQuantity > $this->quantity) {
            $newFulfilledQuantity = $this->quantity;
        }
        
        // 更新履行數量
        $this->fulfilled_quantity = $newFulfilledQuantity;
        
        // 如果完全履行，更新履行狀態
        if ($newFulfilledQuantity >= $this->quantity) {
            $this->is_fulfilled = true;
            $this->fulfilled_at = now();
        }
        
        // 移除動態計算的屬性（防止資料庫錯誤）
        unset($this->attributes['calculated_priority_score']);
        
        return $this->save();
    }

    // ===== 金額處理方法 =====

    /**
     * 定義金額欄位
     */
    protected function getCurrencyFields(): array
    {
        return ['price', 'cost', 'discount_amount'];
    }

    /**
     * 價格 Accessor
     */
    public function getPriceAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('price'));
    }

    /**
     * 價格 Mutator
     */
    public function setPriceAttribute($value): void
    {
        $this->setCurrencyValue('price', $value);
    }

    /**
     * 成本 Accessor  
     */
    public function getCostAttribute(): ?float
    {
        // 如果 cost_cents 是 null，直接返回 null
        if (is_null($this->cost_cents)) {
            return null;
        }
        return self::centsToYuan($this->getCentsValue('cost'));
    }

    /**
     * 成本 Mutator
     */
    public function setCostAttribute($value): void
    {
        $this->setCurrencyValue('cost', $value);
    }

    /**
     * 折扣金額 Accessor
     */
    public function getDiscountAmountAttribute(): float
    {
        return self::centsToYuan($this->getCentsValue('discount_amount'));
    }

    /**
     * 折扣金額 Mutator
     */
    public function setDiscountAmountAttribute($value): void
    {
        $this->setCurrencyValue('discount_amount', $value);
    }

    /**
     * 計算小計（單價 × 數量 - 折扣）
     */
    public function getSubtotalAttribute(): float
    {
        $priceCents = $this->getCentsValue('price');
        $discountCents = $this->getCentsValue('discount_amount');
        $subtotalCents = ($priceCents * $this->quantity) - $discountCents;
        return self::centsToYuan($subtotalCents);
    }

    /**
     * 計算小計（分為單位）
     */
    public function getSubtotalCentsAttribute(): int
    {
        $priceCents = $this->getCentsValue('price');
        $discountCents = $this->getCentsValue('discount_amount');
        return ($priceCents * $this->quantity) - $discountCents;
    }
}
