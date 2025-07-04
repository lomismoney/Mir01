<?php

namespace App\Services;

use App\Data\PurchaseData;
use App\Models\Purchase;
use App\Models\Inventory;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

/**
 * 進貨管理服務類別
 * 
 * 處理進貨相關的業務邏輯
 */
class PurchaseService
{
    /**
     * 自動生成進貨單號（黃金標準實現）
     * 
     * 格式：PO-YYYY-MM-DD-XXX (XXX 為當日流水號)
     * 使用獨立的計數器表、資料庫事務和悲觀鎖確保並發安全
     * 
     * @param \DateTime|null $date 日期，預設為今天
     * @return string
     * @throws \Exception 當生成失敗時
     */
    private function generateOrderNumber(\DateTime $date = null): string
    {
        return DB::transaction(function () use ($date) {
            // 獲取日期
            $date = $date ?? new \DateTime();
            $dateStr = $date->format('Y-m-d');
            
            // 查詢並鎖定該日的計數器記錄
            $counter = DB::table('daily_purchase_counters')
                ->where('date', $dateStr)
                ->lockForUpdate()
                ->first();
            
            if (!$counter) {
                // 如果記錄不存在，創建新記錄
                DB::table('daily_purchase_counters')->insert([
                    'date' => $dateStr,
                    'last_sequence' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                
                $newSequence = 1;
            } else {
                // 如果記錄存在，遞增序號
                $newSequence = $counter->last_sequence + 1;
                
                DB::table('daily_purchase_counters')
                    ->where('date', $dateStr)
                    ->update([
                        'last_sequence' => $newSequence,
                        'updated_at' => now(),
                    ]);
            }
            
            // 格式化進貨單號（將日期格式從 YYYY-MM-DD 改為 YYYYMMDD）
            $dateFormatted = $date->format('Ymd');
            $orderNumber = sprintf('PO-%s-%03d', $dateFormatted, $newSequence);
            
            return $orderNumber;
        });
    }
    
    /**
     * 建立新的進貨單
     * 
     * @param PurchaseData $purchaseData 進貨單資料
     * @return Purchase
     */
    public function createPurchase(PurchaseData $purchaseData): Purchase
    {
        // 使用資料庫交易，確保資料一致性
        return DB::transaction(function () use ($purchaseData) {
            // 1. 計算總金額和總數量
            $itemSubtotal = 0;
            $totalQuantity = 0;
            foreach ($purchaseData->items as $item) {
                $itemSubtotal += $item->quantity * $item->cost_price;
                $totalQuantity += $item->quantity;
            }

            $totalAmount = $itemSubtotal + $purchaseData->shipping_cost;

            // 2. 建立進貨單主記錄 (Purchase)
            // 自動生成進貨單號，基於進貨日期
            $purchasedAt = $purchaseData->purchased_at ?? Carbon::now();
            $orderNumber = $this->generateOrderNumber(new \DateTime($purchasedAt));
            
            // 確保用戶已認證
            $userId = Auth::id();
            if (!$userId) {
                throw new \InvalidArgumentException('用戶必須經過認證才能建立進貨單');
            }
            
            $purchase = Purchase::create([
                'store_id' => $purchaseData->store_id,
                'user_id' => $userId,
                'order_number' => $orderNumber,
                'purchased_at' => $purchasedAt,
                'total_amount' => $totalAmount,
                'shipping_cost' => $purchaseData->shipping_cost,
                'status' => $purchaseData->status ?? Purchase::STATUS_PENDING,
            ]);

            // 3. 遍歷進貨項目，建立項目記錄
            $accumulatedShippingCost = 0;
            $itemCount = count($purchaseData->items);

            foreach ($purchaseData->items as $index => $itemData) {
                // 3a. 計算運費攤銷（按數量比例分攤）
                $isLastItem = ($index === $itemCount - 1);
                
                if ($isLastItem) {
                    // 最後一項用總運費減去已分配的，避免因四捨五入產生誤差
                    $allocatedShippingCost = $purchaseData->shipping_cost - $accumulatedShippingCost;
                } else {
                    $allocatedShippingCost = $totalQuantity > 0
                        ? (int) round(($purchaseData->shipping_cost * $itemData->quantity) / $totalQuantity)
                        : 0;
                    $accumulatedShippingCost += $allocatedShippingCost;
                }
                
                // 3b. 建立進貨項目記錄 (PurchaseItem)
                $purchase->items()->create([
                    'product_variant_id' => $itemData->product_variant_id,
                    'quantity' => $itemData->quantity,
                    'unit_price' => $itemData->cost_price, // 使用成本價作為單價
                    'cost_price' => $itemData->cost_price,
                    'allocated_shipping_cost' => $allocatedShippingCost,
                ]);
            }

            // 4. 如果狀態為已完成，則自動入庫
            if ($purchase->status === Purchase::STATUS_COMPLETED) {
                $this->processInventoryForCompletedPurchase($purchase);
            }

            // 5. 返回建立的進貨單模型實例
            return $purchase->load(['store', 'items.productVariant.product']);
        });
    }

    /**
     * 更新進貨單
     * 
     * @param Purchase $purchase 要更新的進貨單
     * @param PurchaseData $purchaseData 新的進貨單資料
     * @return Purchase
     */
    public function updatePurchase(Purchase $purchase, PurchaseData $purchaseData): Purchase
    {
        return DB::transaction(function () use ($purchase, $purchaseData) {
            $oldStatus = $purchase->status;

            // 1. 計算新的總金額
            $itemSubtotal = 0;
            $totalQuantity = 0;
            foreach ($purchaseData->items as $item) {
                $itemSubtotal += $item->quantity * $item->cost_price;
                $totalQuantity += $item->quantity;
            }

            $totalAmount = $itemSubtotal + $purchaseData->shipping_cost;

            // 2. 更新進貨單主記錄
            $purchase->update([
                'store_id' => $purchaseData->store_id,
                'order_number' => $purchaseData->order_number,
                'purchased_at' => $purchaseData->purchased_at ?? $purchase->purchased_at,
                'total_amount' => $totalAmount,
                'shipping_cost' => $purchaseData->shipping_cost,
                'status' => $purchaseData->status ?? $purchase->status,
            ]);

            // 3. 如果已完成入庫，需要先回退庫存
            if ($oldStatus === Purchase::STATUS_COMPLETED && $purchaseData->status !== Purchase::STATUS_COMPLETED) {
                $this->revertInventoryForPurchase($purchase);
            }

            // 4. 刪除舊的進貨項目
            $purchase->items()->delete();

            // 5. 建立新的進貨項目
            $accumulatedShippingCost = 0;
            $itemCount = count($purchaseData->items);
            foreach ($purchaseData->items as $index => $itemData) {
                // 3a. 計算運費攤銷（按數量比例分攤）
                $isLastItem = ($index === $itemCount - 1);

                if ($isLastItem) {
                    $allocatedShippingCost = $purchaseData->shipping_cost - $accumulatedShippingCost;
                } else {
                    $allocatedShippingCost = $totalQuantity > 0
                        ? (int) round(($purchaseData->shipping_cost * $itemData->quantity) / $totalQuantity)
                        : 0;
                    $accumulatedShippingCost += $allocatedShippingCost;
                }

                $purchase->items()->create([
                    'product_variant_id' => $itemData->product_variant_id,
                    'quantity' => $itemData->quantity,
                    'unit_price' => $itemData->cost_price,
                    'cost_price' => $itemData->cost_price,
                    'allocated_shipping_cost' => $allocatedShippingCost,
                ]);
            }

            // 6. 如果新狀態為已完成，則進行入庫
            if ($purchase->status === Purchase::STATUS_COMPLETED) {
                $this->processInventoryForCompletedPurchase($purchase);
            }

            return $purchase->load(['store', 'items.productVariant.product']);
        });
    }

    /**
     * 處理已完成進貨單的庫存入庫
     */
    private function processInventoryForCompletedPurchase(Purchase $purchase): void
    {
        foreach ($purchase->items as $item) {
            // 更新或建立對應的庫存記錄
            $inventory = Inventory::firstOrCreate(
                [
                    'store_id' => $purchase->store_id,
                    'product_variant_id' => $item->product_variant_id,
                ],
                ['quantity' => 0, 'low_stock_threshold' => 5]
            );

            // 使用庫存模型的方法來增加庫存
            $userId = Auth::id();
            if (!$userId) {
                throw new \InvalidArgumentException('用戶必須經過認證才能處理庫存操作');
            }
            
            $inventory->addStock(
                $item->quantity, 
                $userId, 
                "進貨單 #{$purchase->order_number}",
                ['purchase_id' => $purchase->id]
            );

            // 更新商品變體的平均成本
            $productVariant = ProductVariant::find($item->product_variant_id);
            if ($productVariant) {
                $productVariant->updateAverageCost(
                    $item->quantity, 
                    $item->cost_price, 
                    $item->allocated_shipping_cost
                );
            }
        }
    }

    /**
     * 回退進貨單的庫存變更
     */
    private function revertInventoryForPurchase(Purchase $purchase): void
    {
        foreach ($purchase->items as $item) {
            $inventory = Inventory::where('store_id', $purchase->store_id)
                ->where('product_variant_id', $item->product_variant_id)
                ->first();

            if ($inventory) {
                $userId = Auth::id();
                if (!$userId) {
                    throw new \InvalidArgumentException('用戶必須經過認證才能處理庫存操作');
                }
                
                $inventory->reduceStock(
                    $item->quantity,
                    $userId,
                    "進貨單 #{$purchase->order_number} 狀態變更回退",
                    ['purchase_id' => $purchase->id, 'action' => 'revert']
                );
            }
        }
    }
}
