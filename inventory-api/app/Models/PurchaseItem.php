<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PurchaseItem extends Model
{
    use HasFactory;

    /**
     * 允許大量賦值的屬性設定
     */
    protected $guarded = [];

    /**
     * 屬性類型轉換
     */
    protected $casts = [
        'quantity' => 'integer',
        'received_quantity' => 'integer', // 新增：已收貨數量
        'receipt_status' => 'string',     // 新增：收貨狀態
        'unit_price' => 'integer',
        'cost_price' => 'integer',
        'allocated_shipping_cost' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * 允許大量賦值的屬性設定
     */
    protected $fillable = [
        'purchase_id',
        'product_variant_id',
        'quantity',
        'received_quantity',  // 新增：已收貨數量
        'receipt_status',     // 新增：收貨狀態
        'unit_price',
        'cost_price',
        'allocated_shipping_cost',
    ];

    /**
     * 獲取此進貨項目的總成本價格（計算屬性）
     * 直接從原始資料庫值計算，確保一致性
     */
    public function getTotalCostPriceAttribute(): int
    {
        $costPriceInCents = $this->getRawOriginal('cost_price') ?? 0;
        $allocatedShippingCostInCents = $this->getRawOriginal('allocated_shipping_cost') ?? 0;
        
        $totalCostInCents = ($costPriceInCents * $this->quantity) + $allocatedShippingCostInCents;

        return (int) round($totalCostInCents / 100);
    }

    /**
     * 獲取該項目所屬的進貨單
     */
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * 獲取該項目對應的商品變體
     */
    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    /**
     * 獲取該項目對應的商品（通過變體）
     */
    public function product()
    {
        return $this->hasOneThrough(Product::class, ProductVariant::class, 'id', 'id', 'product_variant_id', 'product_id');
    }

    /**
     * 金額欄位的取值器（Accessor）
     * 將資料庫中以分為單位的金額轉換為元
     */
    protected function getUnitPriceAttribute($value)
    {
        return (int) round($value / 100);
    }

    protected function getCostPriceAttribute($value)
    {
        return (int) round($value / 100);
    }

    protected function getAllocatedShippingCostAttribute($value)
    {
        return (int) round($value / 100);
    }

    /**
     * 獲取關聯的訂單項目（通過 purchase_item_id）
     * 這些是與此進貨項目相關聯的預訂商品
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class, 'purchase_item_id', 'id');
    }

    /**
     * 獲取此進貨項目已分配給預訂商品的數量
     */
    public function getAllocatedQuantityAttribute(): int
    {
        return $this->orderItems()
                    ->where('is_backorder', true)
                    ->sum('fulfilled_quantity');
    }

    /**
     * 獲取此進貨項目的可用數量（未分配給預訂的數量）
     */
    public function getAvailableQuantityAttribute(): int
    {
        return $this->quantity - $this->allocated_quantity;
    }

    /**
     * 獲取待收貨數量
     * 
     * @return int
     */
    public function getPendingReceiptQuantityAttribute(): int
    {
        return max(0, $this->quantity - $this->received_quantity);
    }

    /**
     * 獲取收貨進度百分比
     * 
     * @return float
     */
    public function getReceiptProgressAttribute(): float
    {
        if ($this->quantity === 0) {
            return 0.0;
        }
        
        return round(($this->received_quantity / $this->quantity) * 100, 2);
    }

    /**
     * 檢查是否已完全收貨
     * 
     * @return bool
     */
    public function isFullyReceived(): bool
    {
        return $this->received_quantity >= $this->quantity;
    }

    /**
     * 檢查是否部分收貨
     * 
     * @return bool
     */
    public function isPartiallyReceived(): bool
    {
        return $this->received_quantity > 0 && $this->received_quantity < $this->quantity;
    }

    /**
     * 檢查是否尚未收貨
     * 
     * @return bool
     */
    public function isPendingReceipt(): bool
    {
        return $this->received_quantity === 0;
    }

    /**
     * 更新收貨數量並自動設定收貨狀態
     * 
     * @param int $quantity 收貨數量
     * @return bool
     */
    public function updateReceivedQuantity(int $quantity): bool
    {
        if ($quantity < 0) {
            throw new \InvalidArgumentException('收貨數量不能為負數');
        }
        
        if ($quantity > $this->quantity) {
            throw new \InvalidArgumentException('收貨數量不能超過訂購數量');
        }
        
        $this->received_quantity = $quantity;
        
        // 自動更新收貨狀態
        if ($quantity === 0) {
            $this->receipt_status = 'pending';
        } elseif ($quantity < $this->quantity) {
            $this->receipt_status = 'partial';
        } else {
            $this->receipt_status = 'completed';
        }
        
        return $this->save();
    }

    /**
     * 獲取收貨狀態的中文描述
     * 
     * @return string
     */
    public function getReceiptStatusLabelAttribute(): string
    {
        return match($this->receipt_status) {
            'pending' => '待收貨',
            'partial' => '部分收貨',
            'completed' => '已收貨',
            default => '未知狀態'
        };
    }
}
