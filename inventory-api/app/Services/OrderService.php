<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;

class OrderService
{
    // 假設 InventoryService 已被創建並可以注入
    // public function __construct(protected InventoryService $inventoryService) {}

    public function createOrder(array $validatedData): Order
    {
        return DB::transaction(function () use ($validatedData) {
            // 1. 從訂單項目中計算商品總價
            $subtotal = collect($validatedData['items'])->sum(function ($item) {
                return $item['price'] * $item['quantity'];
            });

            // 2. 計算最終總金額
            $grandTotal = $subtotal 
                        + ($validatedData['shipping_fee'] ?? 0) 
                        + ($validatedData['tax'] ?? 0) 
                        - ($validatedData['discount_amount'] ?? 0);

            // 3. 創建訂單主記錄
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

            // 4. 創建訂單項目，並觸發庫存扣減
            foreach ($validatedData['items'] as $itemData) {
                $order->items()->create($itemData);

                // 如果是庫存銷售，則扣減庫存
                if ($itemData['is_stocked_sale'] && isset($itemData['product_variant_id'])) {
                    // 這裡將調用庫存服務 (暫為偽代碼)
                    // $this->inventoryService->deductStock($itemData['product_variant_id'], $itemData['quantity']);
                }
            }

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
            
            foreach ($itemsToDelete as $item) {
                // 如果是庫存銷售，則返還庫存
                if ($item->is_stocked_sale && $item->product_variant_id) {
                    // TODO: 未來實作庫存返還
                    // $this->inventoryService->returnStock($item->product_variant_id, $item->quantity);
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
                    // $this->inventoryService->returnStock($originalVariantId, $originalQty);
                    // 扣減新商品的全部庫存
                    // $this->inventoryService->deductStock($item->product_variant_id, $item->quantity);
                } else {
                    // 商品變體沒變，只是數量變化
                    $qtyDifference = $item->quantity - $originalQty;
                    
                    if ($qtyDifference > 0) {
                        // 數量增加，需要額外扣減庫存
                        // $this->inventoryService->deductStock($item->product_variant_id, $qtyDifference);
                    } elseif ($qtyDifference < 0) {
                        // 數量減少，需要返還部分庫存
                        // $this->inventoryService->returnStock($item->product_variant_id, abs($qtyDifference));
                    }
                }
            } elseif ($originalIsStocked && $originalVariantId && !$item->is_stocked_sale) {
                // 從庫存銷售改為非庫存銷售，返還全部庫存
                // $this->inventoryService->returnStock($originalVariantId, $originalQty);
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
} 