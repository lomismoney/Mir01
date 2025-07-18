<?php

namespace App\Services;

use App\Data\PurchaseData;
use App\Models\Purchase;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\OrderItem;
use App\Models\PurchaseItem;
use App\Services\BaseService;
use App\Services\Traits\HandlesInventoryOperations;
use App\Services\Traits\HandlesStatusHistory;
use App\Services\BackorderAllocationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;

/**
 * 進貨管理服務類別
 * 
 * 處理進貨相關的業務邏輯
 */
class PurchaseService extends BaseService
{
    use HandlesInventoryOperations, HandlesStatusHistory;
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
        return $this->executeInTransaction(function () use ($date) {
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
        return $this->executeInTransaction(function () use ($purchaseData) {
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
            $userId = $this->requireAuthentication('建立進貨單');
            
            $purchase = Purchase::create([
                'store_id' => $purchaseData->store_id,
                'user_id' => $userId,
                'order_number' => $orderNumber,
                'purchased_at' => $purchasedAt,
                'total_amount' => $totalAmount,
                'shipping_cost' => $purchaseData->shipping_cost,
                'status' => $purchaseData->status ?? Purchase::STATUS_PENDING,
                'notes' => $purchaseData->notes,
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
                    // 保持原有邏輯，已經是整數計算（以分為單位）
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

            // 4. 如果有待進貨訂單項目，進行綁定
            if ($purchaseData->order_items && count($purchaseData->order_items) > 0) {
                $orderItemsArray = $purchaseData->order_items->toArray();
                $this->bindOrdersToPurchase($purchase, $orderItemsArray);
            }

            // 5. 如果狀態為已完成，則自動入庫
            if ($purchase->status === Purchase::STATUS_COMPLETED) {
                $this->processInventoryForCompletedPurchase($purchase);
            }

            // 6. 返回建立的進貨單模型實例
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
        return $this->executeInTransaction(function () use ($purchase, $purchaseData) {
            $oldStatus = $purchase->status;
            $newStatus = $purchaseData->status ?? $purchase->status;

            // 1. 計算新的總金額
            $itemSubtotal = 0;
            $totalQuantity = 0;
            foreach ($purchaseData->items as $item) {
                $itemSubtotal += $item->quantity * $item->cost_price;
                $totalQuantity += $item->quantity;
            }

            $totalAmount = $itemSubtotal + $purchaseData->shipping_cost;

            // 2. 如果狀態有變更，先處理庫存回退（如果需要）
            if ($oldStatus !== $newStatus) {
                // 驗證狀態轉換合法性
                if (!$this->isValidStatusTransition($oldStatus, $newStatus)) {
                    throw new \InvalidArgumentException(
                        "無法從 " . (Purchase::getStatusOptions()[$oldStatus] ?? $oldStatus) . 
                        " 轉換到 " . (Purchase::getStatusOptions()[$newStatus] ?? $newStatus)
                    );
                }

                // 如果從已完成狀態變更，需要先回退庫存
                if ($oldStatus === Purchase::STATUS_COMPLETED && $newStatus !== Purchase::STATUS_COMPLETED) {
                    $this->revertInventoryForPurchase($purchase);
                }
            }

            // 3. 更新進貨單主記錄
            $purchase->update([
                'store_id' => $purchaseData->store_id,
                'order_number' => $purchaseData->order_number,
                'purchased_at' => $purchaseData->purchased_at ?? $purchase->purchased_at,
                'total_amount' => $totalAmount,
                'shipping_cost' => $purchaseData->shipping_cost,
                'status' => $newStatus,
            ]);

            // 4. 刪除舊的進貨項目
            $purchase->items()->delete();

            // 5. 建立新的進貨項目
            $accumulatedShippingCost = 0;
            $itemCount = count($purchaseData->items);
            foreach ($purchaseData->items as $index => $itemData) {
                // 5a. 計算運費攤銷（按數量比例分攤）
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
            if ($newStatus === Purchase::STATUS_COMPLETED) {
                $this->processInventoryForCompletedPurchase($purchase);
            }

            // 7. 如果狀態有變更，記錄日誌
            if ($oldStatus !== $newStatus) {
                $userId = $this->requireAuthentication('狀態變更');
                $this->logStatusChange($purchase, $oldStatus, $newStatus, $userId, '進貨單更新時狀態變更');
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
            // 使用實際收貨數量，如果為0或null則使用訂購數量
            $quantityToAdd = ($item->received_quantity > 0) ? $item->received_quantity : $item->quantity;
            
            // 如果實際收貨數量為 0，跳過此項目
            if ($quantityToAdd <= 0) {
                Log::warning('進貨項目實際收貨數量為 0，跳過入庫', [
                    'purchase_id' => $purchase->id,
                    'item_id' => $item->id,
                    'sku' => $item->sku,
                    'product_name' => $item->product_name
                ]);
                continue;
            }
            
            // 更新或建立對應的庫存記錄
            $inventory = Inventory::firstOrCreate(
                [
                    'store_id' => $purchase->store_id,
                    'product_variant_id' => $item->product_variant_id,
                ],
                ['quantity' => 0, 'low_stock_threshold' => 5]
            );

            // 使用庫存模型的方法來增加庫存
            $userId = $this->requireAuthentication('庫存操作');
            
            $inventory->addStock(
                $quantityToAdd, 
                $userId, 
                "進貨單 #{$purchase->order_number} (實收數量)",
                [
                    'purchase_id' => $purchase->id,
                    'original_quantity' => $item->quantity,
                    'received_quantity' => $quantityToAdd
                ]
            );

            // 更新商品變體的平均成本
            $productVariant = ProductVariant::find($item->product_variant_id);
            if ($productVariant) {
                $productVariant->updateAverageCost(
                    $quantityToAdd, 
                    $item->cost_price, 
                    $item->allocated_shipping_cost
                );
            }
            
            Log::info('進貨項目入庫成功', [
                'purchase_id' => $purchase->id,
                'item_id' => $item->id,
                'sku' => $item->sku,
                'original_quantity' => $item->quantity,
                'received_quantity' => $quantityToAdd
            ]);
        }
        
        // 🎯 新增：更新關聯的訂單項目為已履行
        $this->markRelatedOrderItemsAsFulfilled($purchase);
    }
    
    /**
     * 標記關聯的訂單項目為已履行（智能分配版）
     * 
     * 當進貨單完成時，使用智能分配系統將商品分配給預訂訂單
     * 支援優先級排序、客戶等級、緊急程度等多維度考量
     * 
     * @param Purchase|PurchaseItem $purchaseOrItem
     * @param array $allocationOptions 分配選項
     */
    public function markRelatedOrderItemsAsFulfilled($purchaseOrItem, array $allocationOptions = []): void
    {
        // 處理兩種調用方式：Purchase 或 PurchaseItem
        if ($purchaseOrItem instanceof Purchase) {
            $purchase = $purchaseOrItem;
            $purchaseItems = $purchase->items;
        } elseif ($purchaseOrItem instanceof PurchaseItem) {
            $purchaseItems = collect([$purchaseOrItem]);
            $purchase = $purchaseOrItem->purchase;
        } else {
            throw new \InvalidArgumentException('參數必須是 Purchase 或 PurchaseItem 實例');
        }

        // 獲取分配服務實例
        $allocationService = app(BackorderAllocationService::class);
        
        // 設定預設分配選項
        $defaultOptions = [
            'allocation_strategy' => 'smart_priority', // 智能優先級分配
            'store_id' => $purchase->store_id,
            'enable_logging' => true,
        ];
        $options = array_merge($defaultOptions, $allocationOptions);
        
        // 處理每個進貨項目
        foreach ($purchaseItems as $purchaseItem) {
            try {
                // 檢查是否有已關聯的訂單項目（直接關聯的情況）
                $directLinkedItems = OrderItem::where('purchase_item_id', $purchaseItem->id)
                    ->whereRaw('fulfilled_quantity < quantity')
                    ->get();

                if ($directLinkedItems->isNotEmpty()) {
                    // 直接關聯的項目：使用傳統FIFO分配
                    $this->allocateToDirectLinkedItems($purchaseItem, $directLinkedItems, $purchase);
                } else {
                    // 無直接關聯：使用智能分配系統
                    $allocationResult = $allocationService->allocateToBackorders($purchaseItem, $options);
                    
                    Log::info('智能分配完成', [
                        'purchase_item_id' => $purchaseItem->id,
                        'purchase_order_number' => $purchase->order_number ?? 'N/A',
                        'product_variant_id' => $purchaseItem->product_variant_id,
                        'total_allocated' => $allocationResult['total_allocated'],
                        'remaining_quantity' => $allocationResult['remaining_quantity'],
                        'allocated_orders_count' => count($allocationResult['allocated_items']),
                        'allocation_efficiency' => $allocationResult['allocation_summary']['allocation_efficiency'] ?? 0,
                    ]);
                    
                    // 如果還有剩餘數量，記錄警告
                    if ($allocationResult['remaining_quantity'] > 0) {
                        Log::warning('智能分配後仍有剩餘進貨數量', [
                            'purchase_item_id' => $purchaseItem->id,
                            'purchase_order_number' => $purchase->order_number ?? 'N/A',
                            'product_variant_id' => $purchaseItem->product_variant_id,
                            'remaining_quantity' => $allocationResult['remaining_quantity'],
                            'total_candidates' => $allocationResult['allocation_summary']['total_candidates'] ?? 0,
                        ]);
                    }
                }
                
            } catch (\Exception $e) {
                Log::error('進貨項目分配失敗', [
                    'purchase_item_id' => $purchaseItem->id,
                    'purchase_order_number' => $purchase->order_number ?? 'N/A',
                    'product_variant_id' => $purchaseItem->product_variant_id,
                    'error' => $e->getMessage(),
                ]);
                
                
                // 分配失敗時回退到簡單的FIFO分配
                $this->fallbackToSimpleAllocation($purchaseItem, $purchase);
            }
        }
    }

    /**
     * 分配給直接關聯的訂單項目
     * 
     * @param PurchaseItem $purchaseItem
     * @param Collection $directLinkedItems
     * @param Purchase $purchase
     */
    protected function allocateToDirectLinkedItems(PurchaseItem $purchaseItem, $directLinkedItems, Purchase $purchase): void
    {
        $remainingQuantity = $purchaseItem->quantity;
        
        // 對直接關聯的項目按創建時間排序（FIFO）
        $sortedItems = $directLinkedItems->sortBy('created_at');
        
        foreach ($sortedItems as $orderItem) {
            if ($remainingQuantity <= 0) {
                break;
            }
            
            $toFulfill = min($remainingQuantity, $orderItem->remaining_fulfillment_quantity);
            
            if ($toFulfill > 0) {
                $orderItem->addFulfilledQuantity($toFulfill);
                $remainingQuantity -= $toFulfill;
                
                Log::info('直接關聯項目履行更新', [
                    'order_item_id' => $orderItem->id,
                    'order_number' => $orderItem->order->order_number ?? 'N/A',
                    'purchase_order_number' => $purchase->order_number ?? 'N/A',
                    'product_name' => $orderItem->product_name,
                    'sku' => $orderItem->sku,
                    'fulfilled_quantity' => $toFulfill,
                    'total_fulfilled' => $orderItem->fulfilled_quantity,
                    'is_fully_fulfilled' => $orderItem->is_fully_fulfilled,
                ]);
            }
        }
    }

    /**
     * 回退到簡單分配（當智能分配失敗時）
     * 
     * @param PurchaseItem $purchaseItem
     * @param Purchase $purchase
     */
    protected function fallbackToSimpleAllocation(PurchaseItem $purchaseItem, Purchase $purchase): void
    {
        Log::info('回退到簡單FIFO分配', [
            'purchase_item_id' => $purchaseItem->id,
            'product_variant_id' => $purchaseItem->product_variant_id,
        ]);
        
        // 找出所有相同商品變體的待履行訂單項目
        $orderItems = OrderItem::where('product_variant_id', $purchaseItem->product_variant_id)
            ->whereRaw('fulfilled_quantity < quantity')
            ->whereHas('order', function ($q) {
                $q->whereNotIn('shipping_status', ['cancelled', 'delivered']);
            })
            ->orderBy('created_at') // 簡單的先進先出
            ->get();
        
        $remainingQuantity = $purchaseItem->quantity;
        
        foreach ($orderItems as $orderItem) {
            if ($remainingQuantity <= 0) {
                break;
            }
            
            $toFulfill = min($remainingQuantity, $orderItem->remaining_fulfillment_quantity);
            
            if ($toFulfill > 0) {
                $orderItem->addFulfilledQuantity($toFulfill);
                $remainingQuantity -= $toFulfill;
                
                Log::info('回退分配履行更新', [
                    'order_item_id' => $orderItem->id,
                    'order_number' => $orderItem->order->order_number ?? 'N/A',
                    'purchase_order_number' => $purchase->order_number ?? 'N/A',
                    'fulfilled_quantity' => $toFulfill,
                    'allocation_method' => 'fallback_fifo'
                ]);
            }
        }
    }

    /**
     * 回退進貨單的庫存變更
     */
    private function revertInventoryForPurchase(Purchase $purchase): void
    {
        foreach ($purchase->items as $item) {
            // 使用實際收貨數量來回退，如果沒有記錄則使用訂購數量
            $quantityToRevert = $item->received_quantity ?? $item->quantity;
            
            // 如果實際收貨數量為 0，跳過此項目
            if ($quantityToRevert <= 0) {
                continue;
            }
            
            $inventory = Inventory::where('store_id', $purchase->store_id)
                ->where('product_variant_id', $item->product_variant_id)
                ->first();

            if ($inventory) {
                $userId = $this->requireAuthentication('庫存操作');
                
                // 檢查庫存是否足夠回退
                if ($inventory->quantity < $quantityToRevert) {
                    throw new \Exception(
                        "庫存不足以回退進貨項目。當前庫存：{$inventory->quantity}，" .
                        "嘗試回退數量：{$quantityToRevert}，商品SKU：{$item->sku}"
                    );
                }
                
                $inventory->reduceStock(
                    $quantityToRevert,
                    $userId,
                    "進貨單 #{$purchase->order_number} 狀態變更回退 (實收數量)",
                    [
                        'purchase_id' => $purchase->id, 
                        'action' => 'revert',
                        'original_quantity' => $item->quantity,
                        'received_quantity' => $quantityToRevert
                    ]
                );
            }
        }
        
        // 🎯 新增：回退關聯的訂單項目履行狀態
        $this->revertRelatedOrderItemsFulfillment($purchase);
    }
    
    /**
     * 回退關聯的訂單項目履行狀態
     * 
     * 當進貨單從已完成狀態回退時，相關的訂單項目也要回退履行狀態
     * 
     * @param Purchase $purchase
     */
    private function revertRelatedOrderItemsFulfillment(Purchase $purchase): void
    {
        foreach ($purchase->items as $purchaseItem) {
            // 找出所有關聯到此進貨項目的訂單項目
            $orderItems = OrderItem::where('purchase_item_id', $purchaseItem->id)
                ->where('is_fulfilled', true)
                ->get();
            
            foreach ($orderItems as $orderItem) {
                $orderItem->update([
                    'is_fulfilled' => false,
                    'fulfilled_at' => null,
                ]);
                
                Log::info('訂單項目履行狀態已回退', [
                    'order_item_id' => $orderItem->id,
                    'order_number' => $orderItem->order->order_number ?? 'N/A',
                    'purchase_order_number' => $purchase->order_number,
                    'product_name' => $orderItem->product_name,
                    'sku' => $orderItem->sku,
                ]);
            }
        }
    }

    /**
     * 統一的進貨單狀態更新方法
     * 
     * 確保所有狀態變更都經過相同的業務邏輯驗證和處理
     * 
     * @param Purchase $purchase 進貨單實例
     * @param string $newStatus 新狀態
     * @param int|null $userId 操作用戶ID，若未提供則使用當前認證用戶
     * @param string|null $reason 狀態變更原因
     * @return Purchase 更新後的進貨單
     * @throws \InvalidArgumentException 當狀態轉換不合法時
     * @throws \Exception 當庫存操作失敗時
     */
    public function updatePurchaseStatus(Purchase $purchase, string $newStatus, ?int $userId = null, ?string $reason = null): Purchase
    {
        return $this->executeInTransaction(function () use ($purchase, $newStatus, $userId, $reason) {
            $oldStatus = $purchase->status;
            $userId = $userId ?? $this->requireAuthentication('更新進貨單狀態');
            
            // 1. 驗證狀態轉換合法性
            $purchase->validateStatusTransition($newStatus);
            
            // 2. 驗證業務邏輯條件
            $this->validateBusinessLogicForStatusTransition($purchase, $oldStatus, $newStatus);
            
            // 3. 更新狀態
            $purchase->update([
                'status' => $newStatus,
                'updated_at' => now()
            ]);
            
            // 3. 處理業務邏輯副作用
            $this->handleStatusChangeEffects($purchase, $oldStatus, $newStatus, $userId);
            
            // 4. 記錄狀態變更日誌
            $this->logStatusChange($purchase, $oldStatus, $newStatus, $userId, $reason);
            
            return $purchase->fresh(['store', 'items.productVariant.product']);
        });
    }

    /**
     * 處理狀態變更的業務邏輯副作用
     * 
     * @param Purchase $purchase 進貨單實例
     * @param string $oldStatus 原狀態
     * @param string $newStatus 新狀態
     * @param int $userId 操作用戶ID
     * @return void
     * @throws \Exception 當庫存操作失敗時
     */
    private function handleStatusChangeEffects(Purchase $purchase, string $oldStatus, string $newStatus, int $userId): void
    {
        // 處理庫存相關邏輯
        if ($oldStatus !== Purchase::STATUS_COMPLETED && $newStatus === Purchase::STATUS_COMPLETED) {
            // 狀態變更為已完成：執行庫存入庫
            try {
                $this->processInventoryForCompletedPurchase($purchase);
                
                Log::info('進貨單庫存入庫成功', [
                    'purchase_id' => $purchase->id,
                    'order_number' => $purchase->order_number,
                    'user_id' => $userId,
                    'items_count' => $purchase->items->count()
                ]);
                
            } catch (\Exception $e) {
                Log::error('進貨單庫存入庫失敗', [
                    'purchase_id' => $purchase->id,
                    'order_number' => $purchase->order_number,
                    'error' => $e->getMessage(),
                    'user_id' => $userId
                ]);
                
                throw new \Exception("庫存入庫失敗：{$e->getMessage()}");
            }
            
        } elseif ($oldStatus === Purchase::STATUS_COMPLETED && $newStatus !== Purchase::STATUS_COMPLETED) {
            // 狀態從已完成變更為其他：回退庫存
            try {
                $this->revertInventoryForPurchase($purchase);
                
                Log::info('進貨單庫存回退成功', [
                    'purchase_id' => $purchase->id,
                    'order_number' => $purchase->order_number,
                    'user_id' => $userId
                ]);
                
            } catch (\Exception $e) {
                Log::error('進貨單庫存回退失敗', [
                    'purchase_id' => $purchase->id,
                    'order_number' => $purchase->order_number,
                    'error' => $e->getMessage(),
                    'user_id' => $userId
                ]);
                
                throw new \Exception("庫存回退失敗：{$e->getMessage()}");
            }
        }
        
        // 未來可擴展其他業務邏輯：
        // - 發送通知
        // - 更新相關統計
        // - 觸發工作流
    }

    /**
     * 記錄狀態變更日誌
     * 
     * @param Purchase $purchase 進貨單實例
     * @param string $oldStatus 原狀態
     * @param string $newStatus 新狀態
     * @param int $userId 操作用戶ID
     * @param string|null $reason 變更原因
     * @return void
     */
    private function logStatusChange(Purchase $purchase, string $oldStatus, string $newStatus, int $userId, ?string $reason = null): void
    {
        $logData = [
            'purchase_id' => $purchase->id,
            'order_number' => $purchase->order_number,
            'old_status' => $oldStatus,
            'old_status_display' => Purchase::getStatusOptions()[$oldStatus] ?? $oldStatus,
            'new_status' => $newStatus,
            'new_status_display' => Purchase::getStatusOptions()[$newStatus] ?? $newStatus,
            'user_id' => $userId,
            'reason' => $reason ?? '狀態更新',
            'inventory_affected' => $this->isInventoryAffected($oldStatus, $newStatus),
            'timestamp' => now()->toISOString()
        ];
        
        Log::info('進貨單狀態變更', $logData);
        
        // 如果涉及庫存變更，發送額外的監控日誌
        if ($this->isInventoryAffected($oldStatus, $newStatus)) {
            Log::channel('inventory')->info('進貨單狀態變更影響庫存', $logData);
        }
    }

    /**
     * 檢查狀態變更是否影響庫存
     * 
     * @param string $oldStatus 原狀態
     * @param string $newStatus 新狀態
     * @return bool
     */
    private function isInventoryAffected(string $oldStatus, string $newStatus): bool
    {
        return ($oldStatus !== Purchase::STATUS_COMPLETED && $newStatus === Purchase::STATUS_COMPLETED) ||
               ($oldStatus === Purchase::STATUS_COMPLETED && $newStatus !== Purchase::STATUS_COMPLETED);
    }

    /**
     * 驗證狀態轉換是否合法
     * 
     * @param string $currentStatus 當前狀態
     * @param string $newStatus 新狀態
     * @return bool
     */
    private function isValidStatusTransition(string $currentStatus, string $newStatus): bool
    {
        if ($currentStatus === $newStatus) {
            return true;
        }
        
        $validTransitions = [
            Purchase::STATUS_PENDING => [
                Purchase::STATUS_CONFIRMED,
                Purchase::STATUS_CANCELLED,
            ],
            Purchase::STATUS_CONFIRMED => [
                Purchase::STATUS_IN_TRANSIT,
                Purchase::STATUS_CANCELLED,
            ],
            Purchase::STATUS_IN_TRANSIT => [
                Purchase::STATUS_RECEIVED,
                Purchase::STATUS_PARTIALLY_RECEIVED,
            ],
            Purchase::STATUS_RECEIVED => [
                Purchase::STATUS_COMPLETED,
                Purchase::STATUS_PARTIALLY_RECEIVED,
            ],
            Purchase::STATUS_PARTIALLY_RECEIVED => [
                Purchase::STATUS_COMPLETED,
                Purchase::STATUS_RECEIVED,
                Purchase::STATUS_PARTIALLY_RECEIVED, // 🎯 允許部分收貨狀態再次調整數量
            ],
            // 已完成的進貨單可以回退到已收貨狀態（用於修正錯誤）
            Purchase::STATUS_COMPLETED => [
                Purchase::STATUS_RECEIVED,
            ],
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
    }

    /**
     * 從預訂商品批量創建進貨單
     * 
     * @param array $backorderItemIds 預訂商品的 OrderItem ID 陣列
     * @param array $options 選項配置
     * @return array 返回創建的進貨單陣列
     * @throws \Exception
     */
    public function createFromBackorders(array $backorderItemIds, array $options = []): array
    {
        return $this->executeInTransaction(function () use ($backorderItemIds, $options) {
            // 1. 獲取有效的預訂商品（包含需要進貨的訂製商品）
            $backorderItems = OrderItem::whereIn('id', $backorderItemIds)
                ->where(function ($q) {
                    // 包含預訂商品和需要進貨的訂製商品
                    $q->where('is_backorder', true)
                      ->orWhere(function ($subQ) {
                          $subQ->where('is_stocked_sale', false)
                               ->where('is_backorder', false)
                               ->whereNotNull('product_variant_id');
                      });
                })
                ->whereNull('purchase_item_id')  // 尚未關聯進貨單
                ->where('is_fulfilled', false)    // 尚未履行
                ->whereHas('order', function ($q) {
                    // 只包含未取消的訂單
                    $q->where('shipping_status', '!=', 'cancelled');
                })
                ->with(['productVariant.product', 'order'])
                ->get();

            if ($backorderItems->isEmpty()) {
                throw new \Exception('沒有找到有效的預訂商品');
            }

            // 2. 按照供應商（或門市）分組
            // 這裡假設我們按門市分組，您可以根據實際需求調整
            $groupedByStore = [];
            
            foreach ($backorderItems as $item) {
                // 使用選項中指定的門市，或使用訂單的門市，或使用預設門市
                $storeId = $options['store_id'] ?? 
                          $item->order->store_id ?? 
                          Auth::user()->stores->first()?->id ?? 
                          1; // 預設門市 ID
                
                if (!isset($groupedByStore[$storeId])) {
                    $groupedByStore[$storeId] = [];
                }
                
                $groupedByStore[$storeId][] = $item;
            }

            // 3. 為每個門市創建進貨單
            $createdPurchases = [];
            
            foreach ($groupedByStore as $storeId => $items) {
                // 生成進貨單號
                $orderNumber = $this->generateOrderNumber();
                
                // 計算總金額（暫時使用商品變體的成本價）
                $totalAmount = 0;
                $purchaseItems = [];
                
                foreach ($items as $orderItem) {
                    $cost = $orderItem->productVariant->cost ?? 0;
                    $totalAmount += $cost * $orderItem->quantity;
                    
                    $purchaseItems[] = [
                        'product_variant_id' => $orderItem->product_variant_id,
                        'quantity' => $orderItem->quantity,
                        'unit_price' => $cost,
                        'cost_price' => $cost,
                        'allocated_shipping_cost' => 0, // 可以之後再調整
                    ];
                }
                
                // 創建進貨單
                $purchase = Purchase::create([
                    'store_id' => $storeId,
                    'user_id' => $this->requireAuthentication('創建進貨單'),
                    'order_number' => $orderNumber,
                    'purchased_at' => now(),
                    'total_amount' => $totalAmount,
                    'shipping_cost' => 0, // 可以之後再調整
                    'status' => Purchase::STATUS_PENDING,
                    'notes' => '從客戶預訂單自動生成 - 包含 ' . count($items) . ' 個預訂項目',
                ]);
                
                // 創建進貨項目並關聯訂單項目
                foreach ($items as $index => $orderItem) {
                    $purchaseItem = $purchase->items()->create($purchaseItems[$index]);
                    
                    // 更新訂單項目，建立與進貨項目的關聯
                    $orderItem->update(['purchase_item_id' => $purchaseItem->id]);
                    
                    // 記錄關聯日誌
                    Log::info('預訂商品關聯進貨單', [
                        'order_item_id' => $orderItem->id,
                        'order_number' => $orderItem->order->order_number,
                        'purchase_item_id' => $purchaseItem->id,
                        'purchase_order_number' => $purchase->order_number,
                        'product_name' => $orderItem->product_name,
                        'quantity' => $orderItem->quantity,
                    ]);
                }
                
                $createdPurchases[] = $purchase->load(['store', 'items.productVariant.product']);
            }
            
            // 4. 記錄整體操作日誌
            Log::info('批量創建進貨單完成', [
                'backorder_item_count' => count($backorderItemIds),
                'processed_item_count' => $backorderItems->count(),
                'purchase_count' => count($createdPurchases),
                'user_id' => $this->requireAuthentication('創建進貨單'),
            ]);
            
            return $createdPurchases;
        });
    }

    /**
     * 取得可以批量轉換為進貨單的預訂商品彙總
     * 
     * @param array $filters 篩選條件
     * @return \Illuminate\Support\Collection
     */
    public function getBackordersSummaryForPurchase(array $filters = [])
    {
        $query = OrderItem::where(function ($q) {
                // 包含預訂商品和需要進貨的訂製商品
                $q->where('is_backorder', true)
                  ->orWhere(function ($subQ) {
                      $subQ->where('is_stocked_sale', false)
                           ->where('is_backorder', false)
                           ->whereNotNull('product_variant_id');
                  });
            })
            ->whereNull('purchase_item_id')
            ->where('is_fulfilled', false)
            ->whereHas('order', function ($q) {
                $q->where('shipping_status', '!=', 'cancelled');
            });

        // 應用篩選條件
        if (!empty($filters['store_id'])) {
            $query->whereHas('order', function ($q) use ($filters) {
                $q->where('store_id', $filters['store_id']);
            });
        }

        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // 按商品變體分組統計
        return $query->with(['productVariant.product'])
            ->get()
            ->groupBy('product_variant_id')
            ->map(function ($items, $variantId) {
                $firstItem = $items->first();
                $variant = $firstItem->productVariant;
                
                return [
                    'product_variant_id' => $variantId,
                    'product_name' => $variant->product->name ?? '未知商品',
                    'sku' => $variant->sku,
                    'total_quantity' => $items->sum('quantity'),
                    'order_count' => $items->pluck('order_id')->unique()->count(),
                    'earliest_date' => $items->min('created_at'),
                    'latest_date' => $items->max('created_at'),
                    'estimated_cost' => $variant->cost * $items->sum('quantity'),
                    'item_ids' => $items->pluck('id')->toArray(),
                ];
            })
            ->values();
    }

    /**
     * 驗證狀態轉換的業務邏輯條件
     * 
     * @param Purchase $purchase 進貨單
     * @param string $oldStatus 原始狀態
     * @param string $newStatus 新狀態
     * @throws \InvalidArgumentException 當業務邏輯條件不滿足時
     */
    protected function validateBusinessLogicForStatusTransition(Purchase $purchase, string $oldStatus, string $newStatus): void
    {
        switch ($newStatus) {
            case Purchase::STATUS_COMPLETED:
                // 轉換到完成狀態時，需要確保已經收貨或部分收貨
                if (!in_array($oldStatus, [Purchase::STATUS_RECEIVED, Purchase::STATUS_PARTIALLY_RECEIVED])) {
                    throw new \InvalidArgumentException('只有已收貨或部分收貨的進貨單才能標記為完成');
                }
                
                // 檢查是否所有預訂商品都已處理
                // 注意：部分收貨的情況下，可能有些預訂商品無法履行，這是允許的
                $pendingBackorders = $purchase->items()
                    ->whereHas('orderItems', function ($query) {
                        $query->where('is_fulfilled', false)
                              ->where('is_backorder', true);
                    })
                    ->exists();
                
                // 只在已收貨狀態下才嚴格檢查預訂商品
                if ($oldStatus === Purchase::STATUS_RECEIVED && $pendingBackorders) {
                    throw new \InvalidArgumentException('存在未履行的預訂商品，無法完成進貨單');
                }
                break;
                
            case Purchase::STATUS_CANCELLED:
                // 已完成的進貨單不能取消
                if ($oldStatus === Purchase::STATUS_COMPLETED) {
                    throw new \InvalidArgumentException('已完成的進貨單無法取消');
                }
                
                // 檢查是否有已履行的預訂商品
                $fulfilledBackorders = $purchase->items()
                    ->whereHas('orderItems', function ($query) {
                        $query->where('is_fulfilled', true);
                    })
                    ->exists();
                
                if ($fulfilledBackorders) {
                    throw new \InvalidArgumentException('存在已履行的預訂商品，無法取消進貨單');
                }
                break;
                
            case Purchase::STATUS_RECEIVED:
                // 轉換到收貨狀態時，檢查是否處於運輸中或部分收貨
                if (!in_array($oldStatus, [Purchase::STATUS_IN_TRANSIT, Purchase::STATUS_PARTIALLY_RECEIVED])) {
                    throw new \InvalidArgumentException('只有運輸中或部分收貨的進貨單才能標記為已收貨');
                }
                break;
                
            case Purchase::STATUS_PARTIALLY_RECEIVED:
                // 🎯 放寬部分收貨狀態的業務邏輯檢查，支援多次調整
                if (!in_array($oldStatus, [Purchase::STATUS_IN_TRANSIT, Purchase::STATUS_PARTIALLY_RECEIVED])) {
                    throw new \InvalidArgumentException('只有運輸中或部分收貨的進貨單才能進行部分收貨操作');
                }
                break;
        }
    }

    /**
     * 加強的狀態轉換驗證（包含額外的業務檢查）
     * 
     * @param Purchase $purchase 進貨單
     * @param string $newStatus 新狀態
     * @param array $context 額外的上下文信息
     * @throws \InvalidArgumentException 當轉換條件不滿足時
     */
    public function validateStatusTransitionWithContext(Purchase $purchase, string $newStatus, array $context = []): void
    {
        // 基本的狀態轉換檢查
        $purchase->validateStatusTransition($newStatus);
        
        // 業務邏輯檢查
        $this->validateBusinessLogicForStatusTransition($purchase, $purchase->status, $newStatus);
        
        // 根據上下文進行額外檢查
        if (isset($context['check_stock']) && $context['check_stock']) {
            $this->validateStockAvailabilityForTransition($purchase, $newStatus);
        }
        
        if (isset($context['check_dependencies']) && $context['check_dependencies']) {
            $this->validateDependenciesForTransition($purchase, $newStatus);
        }
    }

    /**
     * 檢查庫存可用性（用於狀態轉換）
     * 
     * @param Purchase $purchase 進貨單
     * @param string $newStatus 新狀態
     */
    protected function validateStockAvailabilityForTransition(Purchase $purchase, string $newStatus): void
    {
        // 如果是要完成進貨單，檢查庫存空間是否足夠
        if ($newStatus === Purchase::STATUS_COMPLETED) {
            // 這裡可以添加庫存容量檢查邏輯
            // 例如：檢查倉庫是否有足夠空間存放商品
        }
    }

    /**
     * 檢查依賴關係（用於狀態轉換）
     * 
     * @param Purchase $purchase 進貨單
     * @param string $newStatus 新狀態
     */
    protected function validateDependenciesForTransition(Purchase $purchase, string $newStatus): void
    {
        // 檢查相關的訂單狀態
        if ($newStatus === Purchase::STATUS_CANCELLED) {
            // 檢查是否有相關訂單依賴這個進貨單
            $dependentOrders = \App\Models\OrderItem::where('purchase_item_id', 
                $purchase->items()->pluck('id'))
                ->whereHas('order', function ($query) {
                    $query->whereNotIn('shipping_status', ['cancelled', 'delivered']);
                })
                ->exists();
                
            if ($dependentOrders) {
                throw new \InvalidArgumentException('存在依賴此進貨單的活躍訂單，無法取消');
            }
        }
    }

    // ===== 測試輔助方法 =====

    /**
     * 檢查用戶是否有效認證（測試用）
     */
    public function hasValidAuth(): bool
    {
        return Auth::user() !== null;
    }

    /**
     * 獲取多個進貨單及其關聯（測試用）
     */
    public function getPurchasesWithRelations(array $purchaseIds): \Illuminate\Database\Eloquent\Collection
    {
        return Purchase::whereIn('id', $purchaseIds)
            ->with([
                'store',
                'items.productVariant'
                // TODO: 實現 Purchase 狀態歷史功能
                // 'statusHistories.user'
            ])
            ->get();
    }

    /**
     * 處理部分收貨
     * 
     * 根據實際收到的商品數量更新進貨項目，並自動處理庫存入庫和狀態更新
     * 
     * @param Purchase $purchase 進貨單實例
     * @param array $receiptData 收貨資料
     * @return Purchase 更新後的進貨單
     * @throws \InvalidArgumentException 當收貨資料不合法時
     * @throws \Exception 當庫存操作失敗時
     */
    public function processPartialReceipt(Purchase $purchase, array $receiptData): Purchase
    {
        return $this->executeInTransaction(function () use ($purchase, $receiptData) {
            $userId = $this->requireAuthentication('部分收貨處理');
            $items = $receiptData['items'];
            $notes = $receiptData['notes'] ?? '';

            // 1. 驗證所有項目都屬於此進貨單
            $purchaseItemIds = collect($items)->pluck('purchase_item_id');
            $validItems = $purchase->items()->whereIn('id', $purchaseItemIds)->get()->keyBy('id');
            
            if ($validItems->count() !== count($purchaseItemIds)) {
                throw new \InvalidArgumentException('部分項目不屬於此進貨單');
            }

            // 2. 逐項處理收貨
            $totalReceivedItems = 0;
            $totalPendingItems = 0;
            $inventoryUpdates = [];

            foreach ($items as $itemData) {
                $purchaseItemId = $itemData['purchase_item_id'];
                $receivedQuantity = $itemData['received_quantity'];
                $purchaseItem = $validItems[$purchaseItemId];
                
                // 驗證收貨數量
                if ($receivedQuantity > $purchaseItem->quantity) {
                    throw new \InvalidArgumentException(
                        "項目 {$purchaseItem->productVariant->sku} 的收貨數量 ({$receivedQuantity}) 不能超過訂購數量 ({$purchaseItem->quantity})"
                    );
                }

                // 計算新增收貨數量（增量）
                $previousReceived = $purchaseItem->received_quantity;
                $incrementalReceived = $receivedQuantity - $previousReceived;
                
                // 更新進貨項目收貨數量
                $purchaseItem->updateReceivedQuantity($receivedQuantity);

                // 如果有新增收貨，需要更新庫存
                if ($incrementalReceived > 0) {
                    $inventoryUpdates[] = [
                        'purchase_item' => $purchaseItem,
                        'incremental_quantity' => $incrementalReceived,
                    ];
                }

                // 統計整體收貨狀態
                if ($purchaseItem->isFullyReceived()) {
                    $totalReceivedItems++;
                } else {
                    $totalPendingItems++;
                }
            }

            // 3. 批量處理庫存更新
            foreach ($inventoryUpdates as $update) {
                $this->processInventoryForReceivedItem(
                    $update['purchase_item'], 
                    $update['incremental_quantity'], 
                    $purchase, 
                    $userId, 
                    $notes
                );
            }

            // 4. 更新進貨單整體狀態
            $newStatus = $this->calculatePurchaseStatusFromItems($purchase);
            if ($newStatus !== $purchase->status) {
                $purchase->update(['status' => $newStatus]);
                
                $this->logStatusChange(
                    $purchase, 
                    $purchase->getOriginal('status'), 
                    $newStatus, 
                    $userId, 
                    "部分收貨處理: $notes"
                );
            }

            // 5. 記錄部分收貨操作日誌
            Log::info('部分收貨處理完成', [
                'purchase_id' => $purchase->id,
                'order_number' => $purchase->order_number,
                'processed_items' => count($items),
                'total_received_items' => $totalReceivedItems,
                'total_pending_items' => $totalPendingItems,
                'new_status' => $newStatus,
                'user_id' => $userId,
                'notes' => $notes
            ]);

            return $purchase->fresh(['store', 'items.productVariant.product']);
        });
    }

    /**
     * 處理單個收貨項目的庫存入庫
     * 
     * @param PurchaseItem $purchaseItem 進貨項目
     * @param int $quantity 收貨數量
     * @param Purchase $purchase 進貨單
     * @param int $userId 操作用戶ID
     * @param string $notes 備註
     */
    private function processInventoryForReceivedItem(
        PurchaseItem $purchaseItem, 
        int $quantity, 
        Purchase $purchase, 
        int $userId, 
        string $notes
    ): void {
        if ($quantity <= 0) {
            return; // 沒有新增收貨，跳過庫存處理
        }

        // 更新或建立對應的庫存記錄
        $inventory = Inventory::firstOrCreate(
            [
                'store_id' => $purchase->store_id,
                'product_variant_id' => $purchaseItem->product_variant_id,
            ],
            ['quantity' => 0, 'low_stock_threshold' => 5]
        );

        // 增加庫存
        $inventory->addStock(
            $quantity, 
            $userId, 
            "部分收貨 - 進貨單 #{$purchase->order_number}" . ($notes ? " ($notes)" : ""),
            [
                'purchase_id' => $purchase->id,
                'purchase_item_id' => $purchaseItem->id,
                'operation_type' => 'partial_receipt'
            ]
        );

        // 更新商品變體的平均成本（按收貨數量計算）
        $productVariant = ProductVariant::find($purchaseItem->product_variant_id);
        if ($productVariant) {
            $allocatedShippingPerUnit = $purchaseItem->allocated_shipping_cost / $purchaseItem->quantity;
            $totalAllocatedShipping = $allocatedShippingPerUnit * $quantity;
            
            $productVariant->updateAverageCost(
                $quantity, 
                $purchaseItem->cost_price, 
                $totalAllocatedShipping
            );
        }
    }

    /**
     * 根據項目收貨情況計算進貨單整體狀態
     * 
     * @param Purchase $purchase 進貨單
     * @return string 新的狀態
     */
    private function calculatePurchaseStatusFromItems(Purchase $purchase): string
    {
        $items = $purchase->items()->get();
        
        $fullyReceivedCount = 0;
        $partiallyReceivedCount = 0;
        $pendingCount = 0;
        
        foreach ($items as $item) {
            if ($item->isFullyReceived()) {
                $fullyReceivedCount++;
            } elseif ($item->isPartiallyReceived()) {
                $partiallyReceivedCount++;
            } else {
                $pendingCount++;
            }
        }
        
        // 判斷整體狀態
        if ($fullyReceivedCount === $items->count()) {
            // 所有項目都已完全收貨
            return Purchase::STATUS_RECEIVED;
        } elseif ($pendingCount === $items->count()) {
            // 所有項目都還沒收貨，保持原狀態
            return $purchase->status;
        } else {
            // 部分項目已收貨
            return Purchase::STATUS_PARTIALLY_RECEIVED;
        }
    }

    /**
     * 綁定訂單項目到進貨單
     * 
     * @param Purchase $purchase 進貨單
     * @param array $orderItems 要綁定的訂單項目
     * @return array 綁定結果統計
     */
    public function bindOrdersToPurchase(Purchase $purchase, array $orderItems): array
    {
        return $this->executeInTransaction(function () use ($purchase, $orderItems) {
            $boundItemsCount = 0;
            $totalBoundQuantity = 0;


            foreach ($orderItems as $item) {
                $orderItem = OrderItem::findOrFail($item['order_item_id']);
                $purchaseQuantity = $item['purchase_quantity'];
                
                // 驗證商品變體和門市匹配
                if ($orderItem->order->store_id !== $purchase->store_id) {
                    throw new \InvalidArgumentException(
                        "訂單項目 {$orderItem->id} 的門市與進貨單門市不匹配"
                    );
                }

                // 總是創建新的進貨項目，不合併相同的 product_variant_id
                // 這樣可以保持不同來源/批次的成本追蹤
                // 使用前端提供的成本價格，如果沒有則使用產品變體的成本價格
                $costPrice = isset($item['cost_price']) && $item['cost_price'] !== null 
                    ? $item['cost_price'] 
                    : ($orderItem->productVariant->cost_price ?? 0);
                
                $createdItem = $purchase->items()->create([
                    'product_variant_id' => $orderItem->product_variant_id,
                    'quantity' => $purchaseQuantity,
                    'unit_price' => $costPrice,
                    'cost_price' => $costPrice,
                    'allocated_shipping_cost' => 0,
                    'order_item_id' => $orderItem->id,
                ]);

                $boundItemsCount++;
                $totalBoundQuantity += $purchaseQuantity;

                Log::info('訂單項目已綁定到進貨單', [
                    'purchase_id' => $purchase->id,
                    'order_item_id' => $orderItem->id,
                    'product_variant_id' => $orderItem->product_variant_id,
                    'purchase_quantity' => $purchaseQuantity,
                    'order_number' => $orderItem->order->order_number ?? 'N/A',
                    'purchase_order_number' => $purchase->order_number ?? 'N/A'
                ]);
            }

            // 重新計算進貨單總額
            $this->recalculatePurchaseTotal($purchase);

            return [
                'purchase_id' => $purchase->id,
                'bound_items_count' => $boundItemsCount,
                'total_bound_quantity' => $totalBoundQuantity,
            ];
        });
    }

    /**
     * 重新計算進貨單總額
     * 
     * @param Purchase $purchase 進貨單
     */
    private function recalculatePurchaseTotal(Purchase $purchase): void
    {
        $items = $purchase->items()->get();
        $itemSubtotal = $items->sum(function ($item) {
            return $item->quantity * $item->cost_price;
        });
        
        $totalAmount = $itemSubtotal + $purchase->shipping_cost;
        
        $purchase->update([
            'total_amount' => $totalAmount
        ]);

        Log::info('進貨單總額已重新計算', [
            'purchase_id' => $purchase->id,
            'item_subtotal' => $itemSubtotal,
            'shipping_cost' => $purchase->shipping_cost,
            'total_amount' => $totalAmount
        ]);
    }

    /**
     * 更新進貨單運費
     * 
     * @param Purchase $purchase 進貨單
     * @param float $newShippingCost 新的運費（元為單位）
     * @return Purchase 更新後的進貨單
     */
    public function updateShippingCost(Purchase $purchase, float $newShippingCost): Purchase
    {
        return $this->executeInTransaction(function () use ($purchase, $newShippingCost) {
            $oldShippingCost = $purchase->shipping_cost;
            
            // 更新運費（元轉分）
            $purchase->update([
                'shipping_cost' => (int) round($newShippingCost * 100) // 元轉分
            ]);
            
            // 重新分攤運費到各項目
            $this->reallocateShippingCost($purchase);
            
            // 重新計算總額
            $this->recalculatePurchaseTotal($purchase);
            
            Log::info('進貨單運費更新完成', [
                'purchase_id' => $purchase->id,
                'old_shipping_cost' => $oldShippingCost,
                'new_shipping_cost' => $newShippingCost,
                'items_count' => $purchase->items()->count()
            ]);
            
            return $purchase->fresh(['items', 'store']);
        });
    }

    /**
     * 重新分攤運費到各項目
     * 
     * @param Purchase $purchase 進貨單
     */
    private function reallocateShippingCost(Purchase $purchase): void
    {
        $items = $purchase->items()->get();
        $totalQuantity = $items->sum('quantity');
        
        if ($totalQuantity === 0) {
            return;
        }
        
        $accumulatedShippingCost = 0;
        $itemCount = $items->count();
        
        foreach ($items as $index => $item) {
            $isLastItem = ($index === $itemCount - 1);
            
            if ($isLastItem) {
                // 最後一項用總運費減去已分配的
                $allocatedShippingCost = $purchase->shipping_cost - $accumulatedShippingCost;
            } else {
                // 按數量比例分攤，使用整數計算（分為單位）
                $allocatedShippingCost = intval(($purchase->shipping_cost * $item->quantity) / $totalQuantity);
                $accumulatedShippingCost += $allocatedShippingCost;
            }
            
            $item->update([
                'allocated_shipping_cost' => $allocatedShippingCost
            ]);
        }
    }
}
