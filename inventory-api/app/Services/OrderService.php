<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;

class OrderService
{
    /**
     * 注入庫存服務
     * 
     * @param InventoryService $inventoryService
     */
    public function __construct(protected InventoryService $inventoryService)
    {
    }

    public function createOrder(array $validatedData): Order
    {
        return DB::transaction(function () use ($validatedData) {
            // 1. 首先檢查所有商品的庫存是否足夠
            $stockCheckResults = $this->inventoryService->batchCheckStock($validatedData['items']);
            
            if (!empty($stockCheckResults)) {
                // 有商品庫存不足，組織錯誤訊息
                $errorMessage = "以下商品庫存不足：\n";
                foreach ($stockCheckResults as $result) {
                    $errorMessage .= "- {$result['product_name']} (SKU: {$result['sku']})：需求 {$result['requested_quantity']}，庫存 {$result['available_quantity']}\n";
                }
                throw new \Exception($errorMessage);
            }

            // 2. 從訂單項目中計算商品總價
            $subtotal = collect($validatedData['items'])->sum(function ($item) {
                return $item['price'] * $item['quantity'];
            });

            // 3. 計算最終總金額
            $grandTotal = $subtotal 
                        + ($validatedData['shipping_fee'] ?? 0) 
                        + ($validatedData['tax'] ?? 0) 
                        - ($validatedData['discount_amount'] ?? 0);

            // 4. 創建訂單主記錄
            $order = Order::create([
                'order_number'      => 'PO-' . now()->format('Ymd') . '-' . Str::random(4),
                'customer_id'       => $validatedData['customer_id'],
                'creator_user_id'   => auth()->id(), // 直接獲取當前登入用戶ID
                'shipping_status'   => $validatedData['shipping_status'],
                'payment_status'    => $validatedData['payment_status'],
                'subtotal'          => $subtotal,
                'shipping_fee'      => $validatedData['shipping_fee'] ?? 0,
                'tax'               => $validatedData['tax'] ?? 0,
                'discount_amount'   => $validatedData['discount_amount'] ?? 0,
                'grand_total'       => $grandTotal,
                'payment_method'    => $validatedData['payment_method'],
                'order_source'      => $validatedData['order_source'],
                'shipping_address'  => $validatedData['shipping_address'],
                'notes'             => $validatedData['notes'] ?? null,
            ]);

            // 5. 創建訂單項目
            foreach ($validatedData['items'] as $itemData) {
                $order->items()->create($itemData);
            }
            
            // 6. 批量扣減庫存（整個交易內執行，確保原子性）
            $this->inventoryService->batchDeductStock(
                $validatedData['items'],
                null, // 使用預設門市
                ['order_number' => $order->order_number, 'order_id' => $order->id]
            );

            // 5. 記錄初始狀態歷史
            $order->statusHistories()->create([
                'to_status' => $order->shipping_status,
                'status_type' => 'shipping',
                'user_id' => auth()->id(),
                'notes' => '訂單已創建',
            ]);
             $order->statusHistories()->create([
                'to_status' => $order->payment_status,
                'status_type' => 'payment',
                'user_id' => auth()->id(),
            ]);

            return $order->load(['items', 'customer', 'creator']);
        });
    }

    /**
     * 更新訂單
     *
     * @param Order $order 要更新的訂單
     * @param array $validatedData 已驗證的資料
     * @return Order
     */
    public function updateOrder(Order $order, array $validatedData): Order
    {
        return DB::transaction(function () use ($order, $validatedData) {
            // 1. 更新訂單主體信息（排除 items）
            $order->update(Arr::except($validatedData, ['items']));

            // 2. 如果請求中包含 'items'，則同步訂單項目
            if (isset($validatedData['items'])) {
                $this->syncOrderItems($order, $validatedData['items']);
            }

            // 3. 重新計算訂單總價 (因為項目可能已變更)
            $this->recalculateOrderTotals($order);
            
            // 4. 記錄狀態變更歷史 (如果狀態有變)
            // 檢查運送狀態是否變更
            if ($order->wasChanged('shipping_status')) {
                $order->statusHistories()->create([
                    'from_status' => $order->getOriginal('shipping_status'),
                    'to_status' => $order->shipping_status,
                    'status_type' => 'shipping',
                    'user_id' => auth()->id(),
                    'notes' => '運送狀態已更新',
                ]);
            }
            
            // 檢查付款狀態是否變更
            if ($order->wasChanged('payment_status')) {
                $order->statusHistories()->create([
                    'from_status' => $order->getOriginal('payment_status'),
                    'to_status' => $order->payment_status,
                    'status_type' => 'payment',
                    'user_id' => auth()->id(),
                    'notes' => '付款狀態已更新',
                ]);
            }

            return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories']);
        });
    }

    /**
     * 同步訂單項目（處理新增、更新、刪除）
     *
     * @param Order $order
     * @param array $itemsData
     */
    protected function syncOrderItems(Order $order, array $itemsData)
    {
        // 取得現有項目 ID 陣列
        $existingItemIds = $order->items()->pluck('id')->all();
        
        // 取得請求中包含 ID 的項目（表示要更新的現有項目）
        $incomingItemIds = Arr::pluck(
            Arr::where($itemsData, fn($item) => isset($item['id'])), 
            'id'
        );

        // 找出需要刪除的項目 ID（在現有項目中但不在請求中的）
        $idsToDelete = array_diff($existingItemIds, $incomingItemIds);
        
        // 刪除不再傳入的項目，並返還庫存
        if (!empty($idsToDelete)) {
            $itemsToDelete = $order->items()->whereIn('id', $idsToDelete)->get();
            
            // 先返還庫存，再刪除項目
            foreach ($itemsToDelete as $item) {
                // 如果是庫存銷售，則返還庫存
                if ($item->is_stocked_sale && $item->product_variant_id) {
                    $this->inventoryService->returnStock(
                        $item->product_variant_id, 
                        $item->quantity,
                        null, // 使用預設門市
                        "訂單編輯：移除商品 {$item->product_name}",
                        ['order_number' => $order->order_number, 'order_id' => $order->id]
                    );
                }
                $item->delete();
            }
        }

        // 更新或創建項目，並處理庫存變更
        foreach ($itemsData as $itemData) {
            // 如果有 ID，嘗試找到現有項目
            $originalItem = isset($itemData['id']) 
                ? $order->items()->find($itemData['id']) 
                : null;
            
            // 記錄原始數量（用於計算庫存差異）
            $originalQty = $originalItem ? $originalItem->quantity : 0;
            $originalIsStocked = $originalItem ? $originalItem->is_stocked_sale : false;
            $originalVariantId = $originalItem ? $originalItem->product_variant_id : null;
            
            // 更新或創建項目
            $item = $order->items()->updateOrCreate(
                ['id' => $itemData['id'] ?? null],
                Arr::except($itemData, ['id'])
            );

            // 處理庫存變更邏輯
            if ($item->is_stocked_sale && $item->product_variant_id) {
                // 如果商品變體改變了，需要處理舊商品的庫存返還
                if ($originalIsStocked && $originalVariantId && $originalVariantId != $item->product_variant_id) {
                    // 返還舊商品的全部庫存
                    $this->inventoryService->returnStock(
                        $originalVariantId, 
                        $originalQty,
                        null,
                        "訂單編輯：更換商品",
                        ['order_number' => $order->order_number, 'order_id' => $order->id]
                    );
                    // 扣減新商品的全部庫存
                    $this->inventoryService->deductStock(
                        $item->product_variant_id, 
                        $item->quantity,
                        null,
                        "訂單編輯：新增商品",
                        ['order_number' => $order->order_number, 'order_id' => $order->id]
                    );
                } else {
                    // 商品變體沒變，只是數量變化
                    $qtyDifference = $item->quantity - $originalQty;
                    
                    if ($qtyDifference > 0) {
                        // 數量增加，需要額外扣減庫存
                        $this->inventoryService->deductStock(
                            $item->product_variant_id, 
                            $qtyDifference,
                            null,
                            "訂單編輯：增加數量",
                            ['order_number' => $order->order_number, 'order_id' => $order->id]
                        );
                    } elseif ($qtyDifference < 0) {
                        // 數量減少，需要返還部分庫存
                        $this->inventoryService->returnStock(
                            $item->product_variant_id, 
                            abs($qtyDifference),
                            null,
                            "訂單編輯：減少數量",
                            ['order_number' => $order->order_number, 'order_id' => $order->id]
                        );
                    }
                }
            } elseif ($originalIsStocked && $originalVariantId && !$item->is_stocked_sale) {
                // 從庫存銷售改為非庫存銷售，返還全部庫存
                $this->inventoryService->returnStock(
                    $originalVariantId, 
                    $originalQty,
                    null,
                    "訂單編輯：改為非庫存銷售",
                    ['order_number' => $order->order_number, 'order_id' => $order->id]
                );
            }
        }
    }
    
    /**
     * 重新計算訂單總額
     *
     * @param Order $order
     */
    protected function recalculateOrderTotals(Order $order)
    {
        // 重新從資料庫加載最新的 items 關聯，確保計算準確
        $order->refresh()->load('items');
        
        // 計算商品小計
        $subtotal = $order->items->sum(fn($item) => $item->price * $item->quantity);
        
        // 計算總金額
        $grandTotal = $subtotal 
                    + $order->shipping_fee
                    + $order->tax
                    - $order->discount_amount;
                    
        // 更新訂單金額
        $order->update([
            'subtotal' => $subtotal,
            'grand_total' => $grandTotal,
        ]);
    }

    /**
     * 確認訂單付款
     * 
     * 將訂單的付款狀態從 pending 更新為 paid，
     * 並記錄狀態變更歷史。
     * 
     * @param Order $order 要確認付款的訂單
     * @return Order 更新後的訂單
     */
    public function confirmPayment(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            // 1. 記錄原始狀態（用於歷史記錄）
            $originalStatus = $order->payment_status;
            
            // 2. 更新付款狀態和相關時間戳
            $order->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
            ]);
            
            // 3. 記錄狀態變更歷史
            $order->statusHistories()->create([
                'from_status' => $originalStatus,
                'to_status' => 'paid',
                'status_type' => 'payment',
                'user_id' => auth()->id(),
                'notes' => '付款已確認',
            ]);
            
            // 4. 預載入關聯並返回
            return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories.user']);
        });
    }

    /**
     * 新增部分付款記錄
     * 
     * 依據藍圖三實現的核心業務邏輯：
     * 1. 驗證金額不超過剩餘未付金額
     * 2. 建立付款記錄
     * 3. 更新訂單的已付金額和付款狀態
     * 4. 寫入狀態變更歷史
     * 
     * @param Order $order 要新增付款記錄的訂單
     * @param array $paymentData 付款資料
     * @return Order 更新後的訂單
     */
    public function addPartialPayment(Order $order, array $paymentData): Order
    {
        return DB::transaction(function () use ($order, $paymentData) {
            // 1. 驗證金額：確認傳入的 amount 不大於剩餘未付金額
            $remainingAmount = $order->grand_total - $order->paid_amount;
            if ($paymentData['amount'] > $remainingAmount) {
                throw new \Exception("收款金額不能超過剩餘未付金額：{$remainingAmount}");
            }
            
            // 2. 建立收款記錄：在 payment_records 資料表中創建新紀錄
            $paymentRecord = $order->paymentRecords()->create([
                'amount' => $paymentData['amount'],
                'payment_method' => $paymentData['payment_method'],
                'payment_date' => $paymentData['payment_date'] ?? now(),
                'notes' => $paymentData['notes'] ?? null,
                'creator_id' => auth()->id(),
            ]);
            
            // 3. 更新訂單主體：重新計算並更新已付金額和付款狀態
            $newPaidAmount = $order->paid_amount + $paymentData['amount'];
            
            // 記錄原始付款狀態（用於歷史記錄）
            $originalPaymentStatus = $order->payment_status;
            
            // 根據新的已付金額更新付款狀態
            $newPaymentStatus = 'partial'; // 預設為部分付款
            if ($newPaidAmount >= $order->grand_total) {
                $newPaymentStatus = 'paid';
                $paidAt = now(); // 全額付清時設定付清時間
            } else {
                $paidAt = null; // 部分付款時不設定付清時間
            }
            
            // 更新訂單
            $updateData = [
                'paid_amount' => $newPaidAmount,
                'payment_status' => $newPaymentStatus,
            ];
            
            if ($paidAt) {
                $updateData['paid_at'] = $paidAt;
            }
            
            $order->update($updateData);
            
            // 4. 寫入歷史記錄：描述此次收款事件
            $paymentMethodText = [
                'cash' => '現金',
                'transfer' => '轉帳',
                'credit_card' => '信用卡',
            ][$paymentData['payment_method']] ?? $paymentData['payment_method'];
            
            $historyNotes = "記錄一筆 {$paymentData['amount']} 元的{$paymentMethodText}付款";
            if (!empty($paymentData['notes'])) {
                $historyNotes .= "，備註：{$paymentData['notes']}";
            }
            
            // 如果付款狀態有變更，則記錄狀態歷史
            if ($originalPaymentStatus !== $newPaymentStatus) {
                $order->statusHistories()->create([
                    'from_status' => $originalPaymentStatus,
                    'to_status' => $newPaymentStatus,
                    'status_type' => 'payment',
                    'user_id' => auth()->id(),
                    'notes' => $historyNotes,
                ]);
            }
            
            // 5. 返回結果：返回更新後的 Order 物件
            return $order->load([
                'items.productVariant', 
                'customer', 
                'creator', 
                'statusHistories.user',
                'paymentRecords.creator' // 載入付款記錄
            ]);
        });
    }

    /**
     * 創建訂單出貨記錄
     * 
     * 為訂單創建出貨記錄，更新貨物狀態為 shipped，
     * 並記錄物流相關資訊。
     * 
     * @param Order $order 要創建出貨記錄的訂單
     * @param array $shipmentData 出貨相關資料
     * @return Order 更新後的訂單
     */
    public function createShipment(Order $order, array $shipmentData): Order
    {
        return DB::transaction(function () use ($order, $shipmentData) {
            // 1. 記錄原始狀態（用於歷史記錄）
            $originalStatus = $order->shipping_status;
            
            // 2. 準備更新資料
            $updateData = [
                'shipping_status' => 'shipped',
                'tracking_number' => $shipmentData['tracking_number'],
                'shipped_at' => $shipmentData['shipped_at'] ?? now(),
            ];
            
            // 3. 添加可選欄位
            if (isset($shipmentData['carrier'])) {
                $updateData['carrier'] = $shipmentData['carrier'];
            }
            
            if (isset($shipmentData['estimated_delivery_date'])) {
                $updateData['estimated_delivery_date'] = $shipmentData['estimated_delivery_date'];
            }
            
            // 4. 更新訂單
            $order->update($updateData);
            
            // 5. 記錄狀態變更歷史
            $order->statusHistories()->create([
                'from_status' => $originalStatus,
                'to_status' => 'shipped',
                'status_type' => 'shipping',
                'user_id' => auth()->id(),
                'notes' => $shipmentData['notes'] ?? '商品已出貨，追蹤號碼：' . $shipmentData['tracking_number'],
            ]);
            
            // 6. 預載入關聯並返回
            return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories.user']);
        });
    }

    /**
     * 刪除訂單並返還庫存
     * 
     * 在刪除訂單前，會先返還所有庫存銷售商品的庫存數量
     * 
     * @param Order $order 要刪除的訂單
     * @return bool
     */
    public function deleteOrder(Order $order): bool
    {
        return DB::transaction(function () use ($order) {
            // 1. 獲取所有訂單項目
            $items = $order->items;
            
            // 2. 返還庫存（在刪除前執行，確保數據完整性）
            $this->inventoryService->batchReturnStock(
                $items,
                null, // 使用預設門市
                ['order_number' => $order->order_number, 'order_id' => $order->id, 'reason' => '訂單刪除']
            );
            
            // 3. 刪除訂單（會級聯刪除訂單項目和狀態歷史）
            $order->delete();
            
            return true;
        });
    }

    /**
     * 取消訂單並返還庫存
     * 
     * 將訂單狀態更新為已取消，並返還所有庫存
     * 
     * @param Order $order 要取消的訂單
     * @param string|null $reason 取消原因
     * @return Order
     */
    public function cancelOrder(Order $order, ?string $reason = null): Order
    {
        return DB::transaction(function () use ($order, $reason) {
            // 1. 檢查訂單是否可以取消
            if (in_array($order->shipping_status, ['shipped', 'delivered'])) {
                throw new \Exception('已出貨或已交付的訂單無法取消');
            }
            
            // 2. 記錄原始狀態
            $originalShippingStatus = $order->shipping_status;
            $originalPaymentStatus = $order->payment_status;
            
            // 3. 更新訂單狀態
            $order->update([
                'shipping_status' => 'cancelled',
                'payment_status' => $order->payment_status === 'paid' ? 'refunded' : 'cancelled',
            ]);
            
            // 4. 返還庫存
            $this->inventoryService->batchReturnStock(
                $order->items,
                null, // 使用預設門市
                [
                    'order_number' => $order->order_number, 
                    'order_id' => $order->id, 
                    'reason' => $reason ?? '訂單取消'
                ]
            );
            
            // 5. 記錄狀態變更歷史
            if ($originalShippingStatus !== 'cancelled') {
                $order->statusHistories()->create([
                    'from_status' => $originalShippingStatus,
                    'to_status' => 'cancelled',
                    'status_type' => 'shipping',
                    'user_id' => auth()->id(),
                    'notes' => $reason ?? '訂單已取消',
                ]);
            }
            
            if ($originalPaymentStatus !== $order->payment_status) {
                $order->statusHistories()->create([
                    'from_status' => $originalPaymentStatus,
                    'to_status' => $order->payment_status,
                    'status_type' => 'payment',
                    'user_id' => auth()->id(),
                    'notes' => '付款狀態已更新',
                ]);
            }
            
            // 6. 預載入關聯並返回
            return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories.user']);
        });
    }
} 