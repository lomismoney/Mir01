<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductVariant;
use App\Enums\OrderItemType;
use App\Services\BaseService;
use App\Services\Traits\HandlesInventoryOperations;
use App\Services\Traits\HandlesStatusHistory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;

class OrderService extends BaseService
{
    use HandlesInventoryOperations, HandlesStatusHistory;
    /**
     * 注入庫存服務和訂單編號生成器
     * 
     * @param InventoryService $inventoryService
     * @param OrderNumberGenerator $orderNumberGenerator
     */
    public function __construct(
        protected InventoryService $inventoryService,
        protected OrderNumberGenerator $orderNumberGenerator
    ) {
    }

    /**
     * 創建新訂單
     * 
     * 🎯 預訂系統支援：智能處理庫存不足場景
     * - 當庫存充足時：正常扣減庫存建立訂單
     * - 當庫存不足時：拋出結構化異常，前端可選擇強制建單
     * - 當強制建單時：忽略庫存限制，直接建立預訂訂單
     *
     * @param array $validatedData 已驗證的訂單資料
     * @return Order
     * @throws \Exception 一般錯誤
     * @throws \App\Exceptions\InsufficientStockException 庫存不足結構化異常
     */
    public function createOrder(array $validatedData): Order
    {
        return $this->executeInTransaction(function () use ($validatedData) {
            return $this->processCreateOrder($validatedData);
        });
    }
    
    /**
     * 處理創建訂單的實際邏輯
     */
    /**
     * 處理創建訂單的實際邏輯
     * 
     * 🎯 智能預訂系統：前端已通過智能判斷設定商品類型
     * 1. 直接使用前端傳入的 is_stocked_sale 標記
     * 2. 根據商品類型進行相應的庫存處理
     * 3. 無需額外的庫存檢查和異常拋出
     */
    private function processCreateOrder(array $data): Order
    {
        $validatedData = collect($data);
        $items = collect($validatedData->get('items'));
        $storeId = $validatedData->get('store_id');

        // 1. 生成訂單編號
        $orderNumber = $this->orderNumberGenerator->generateNextNumber();

        // 2. 計算訂單金額
        $subtotal = $items->sum(fn($item) => ($item['price'] ?? 0) * ($item['quantity'] ?? 0));
        $grandTotal = $subtotal 
            + ($validatedData->get('shipping_fee', 0))
            + ($validatedData->get('tax', 0))
            - ($validatedData->get('discount_amount', 0));
        
        // 3. 創建訂單主記錄
        $order = Order::create([
            'order_number' => $orderNumber,
            'customer_id' => $validatedData->get('customer_id'),
            'store_id' => $storeId,
            'creator_user_id' => $this->requireAuthentication('創建訂單'),
            'shipping_status' => $validatedData->get('shipping_status'),
            'payment_status' => $validatedData->get('payment_status'),
            'subtotal' => $subtotal,
            'shipping_fee' => $validatedData->get('shipping_fee', 0),
            'tax' => $validatedData->get('tax', 0),
            'discount_amount' => $validatedData->get('discount_amount', 0),
            'grand_total' => $grandTotal,
            'payment_method' => $validatedData->get('payment_method'),
            'order_source' => $validatedData->get('order_source'),
            'shipping_address' => $validatedData->get('shipping_address'),
            'notes' => $validatedData->get('notes'),
        ]);

        // 4. 創建訂單項目（使用前端智能判斷的結果）
        $orderItems = $items->map(function ($itemData) use ($order) {
            // 🎯 直接使用前端傳入的 is_stocked_sale 判斷
            $itemType = OrderItemType::determineType($itemData);
            
            // 準備訂單項目資料
            $orderItemData = array_merge($itemData, [
                'order_id' => $order->id,
                'is_stocked_sale' => $itemType === OrderItemType::STOCK,
                'is_backorder' => $itemType === OrderItemType::BACKORDER,
                // 只有 STOCK 類型的商品才被視為已履行
                'is_fulfilled' => $itemType === OrderItemType::STOCK,
                'fulfilled_at' => $itemType === OrderItemType::STOCK ? now() : null,
                'fulfilled_quantity' => $itemType === OrderItemType::STOCK ? $itemData['quantity'] : 0,
            ]);
            
            // 訂製商品的特殊處理
            if ($itemType === OrderItemType::CUSTOM && empty($itemData['product_variant_id'])) {
                $orderItemData['custom_product_name'] = $itemData['custom_product_name'] ?? $itemData['product_name'];
                $orderItemData['custom_specifications'] = $itemData['custom_specifications'] ?? null;
            }
            
            return new OrderItem($orderItemData);
        });
        
        // 批量保存訂單項目
        $order->items()->saveMany($orderItems);

        // 5. 處理庫存扣減 (只會扣減 STOCK 類型的商品)
        $this->processInventoryByItemType($order, $items->all());
        
        // 6. 記錄狀態歷史
        $order->statusHistories()->create([
            'to_status' => $order->shipping_status,
            'status_type' => 'shipping',
            'user_id' => $this->requireAuthentication('狀態記錄'),
            'notes' => '訂單已創建',
        ]);
        
        $order->statusHistories()->create([
            'to_status' => $order->payment_status,
            'status_type' => 'payment',
            'user_id' => $this->requireAuthentication('狀態記錄'),
        ]);

        // 7. 記錄操作日誌
        $this->logOperation('訂單創建成功', [
            'order_id' => $order->id,
            'order_number' => $order->order_number,
            'customer_id' => $order->customer_id,
            'grand_total' => $order->grand_total,
            'backorder_items_count' => $orderItems->where('is_backorder', true)->count()
        ]);
        
        // 載入關聯資料並返回
        $order->load(['items.productVariant.product', 'customer']);
        return $order;
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
        return $this->executeInTransaction(function () use ($order, $validatedData) {
            return $this->processUpdateOrder($order, $validatedData);
        });
    }
    
    /**
     * 處理更新訂單的實際邏輯
     */
    private function processUpdateOrder(Order $order, array $validatedData): Order
    {
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
                    'user_id' => $this->requireAuthentication('狀態記錄'),
                    'notes' => '運送狀態已更新',
                ]);
            }
            
            // 檢查付款狀態是否變更
            if ($order->wasChanged('payment_status')) {
                $order->statusHistories()->create([
                    'from_status' => $order->getOriginal('payment_status'),
                    'to_status' => $order->payment_status,
                    'status_type' => 'payment',
                    'user_id' => $this->requireAuthentication('狀態記錄'),
                    'notes' => '付款狀態已更新',
                ]);
            }

            return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories']);
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
                        $order->store_id, // 使用訂單的門市
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
            
            // 記錄原始數量和類型（用於計算庫存差異）
            $originalQty = $originalItem ? $originalItem->quantity : 0;
            $originalIsStocked = $originalItem ? $originalItem->is_stocked_sale : false;
            $originalVariantId = $originalItem ? $originalItem->product_variant_id : null;
            $originalType = null;
            if ($originalItem) {
                if ($originalItem->is_stocked_sale) {
                    $originalType = OrderItemType::STOCK;
                } elseif ($originalItem->is_backorder) {
                    $originalType = OrderItemType::BACKORDER;
                } else {
                    $originalType = OrderItemType::CUSTOM;
                }
            }
            
            // 判斷新的商品類型
            $newType = OrderItemType::determineType($itemData);
            
            // 準備更新數據，包含類型相關的欄位
            $updateData = array_merge($itemData, [
                'is_stocked_sale' => $newType === OrderItemType::STOCK,
                'is_backorder' => $newType === OrderItemType::BACKORDER,
            ]);
            
            // 處理履行狀態變更
            if (!$originalItem || $originalType !== $newType) {
                // 新項目或類型變更時，根據新類型設定履行狀態
                $updateData['is_fulfilled'] = OrderItemType::shouldMarkFulfilledOnCreate($newType);
                $updateData['fulfilled_at'] = OrderItemType::shouldMarkFulfilledOnCreate($newType) ? now() : null;
            }
            
            // 更新或創建項目
            $item = $order->items()->updateOrCreate(
                ['id' => $itemData['id'] ?? null],
                Arr::except($updateData, ['id'])
            );

            // 處理庫存變更邏輯
            if ($item->is_stocked_sale && $item->product_variant_id) {
                // 如果商品變體改變了，需要處理舊商品的庫存返還
                if ($originalIsStocked && $originalVariantId && $originalVariantId != $item->product_variant_id) {
                    // 返還舊商品的全部庫存
                    $this->inventoryService->returnStock(
                        $originalVariantId, 
                        $originalQty,
                        $order->store_id,
                        "訂單編輯：更換商品",
                        ['order_number' => $order->order_number, 'order_id' => $order->id]
                    );
                    // 扣減新商品的全部庫存
                    $this->inventoryService->deductStock(
                        $item->product_variant_id, 
                        $item->quantity,
                        $order->store_id,
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
                            $order->store_id,
                            "訂單編輯：增加數量",
                            ['order_number' => $order->order_number, 'order_id' => $order->id]
                        );
                    } elseif ($qtyDifference < 0) {
                        // 數量減少，需要返還部分庫存
                        $this->inventoryService->returnStock(
                            $item->product_variant_id, 
                            abs($qtyDifference),
                            $order->store_id,
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
                    $order->store_id,
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
        return $this->executeInTransaction(function () use ($order) {
            return $this->processConfirmPayment($order);
        });
    }
    
    /**
     * 處理確認付款的實際邏輯
     */
    private function processConfirmPayment(Order $order): Order
    {
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
            'user_id' => $this->requireAuthentication('狀態記錄'),
            'notes' => '付款已確認',
        ]);
        
        // 4. 預載入關聯並返回
        return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories.user']);
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
        return $this->executeInTransaction(function () use ($order, $paymentData) {
            return $this->processAddPartialPayment($order, $paymentData);
        });
    }
    
    /**
     * 處理新增部分付款的實際邏輯
     */
    private function processAddPartialPayment(Order $order, array $paymentData): Order
    {
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
            'creator_id' => $this->requireAuthentication('創建付款記錄'),
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
                'user_id' => $this->requireAuthentication('狀態記錄'),
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
        return $this->executeInTransaction(function () use ($order, $shipmentData) {
            return $this->processCreateShipment($order, $shipmentData);
        });
    }
    
    /**
     * 處理創建出貨記錄的實際邏輯
     */
    private function processCreateShipment(Order $order, array $shipmentData): Order
    {
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
            'user_id' => $this->requireAuthentication('狀態記錄'),
            'notes' => $shipmentData['notes'] ?? '商品已出貨，追蹤號碼：' . $shipmentData['tracking_number'],
        ]);
        
        // 6. 預載入關聯並返回
        return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories.user']);
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
        return $this->executeInTransaction(function () use ($order) {
            return $this->processDeleteOrder($order);
        });
    }
    
    /**
     * 處理刪除訂單的實際邏輯
     */
    private function processDeleteOrder(Order $order): bool
    {
        // 1. 獲取所有訂單項目
        $items = $order->items;
        
        // 2. 返還庫存（在刪除前執行，確保數據完整性）
        // 使用統一的庫存返還邏輯
        $this->returnInventoryOnCancel($order, '訂單刪除');
        
        // 3. 刪除訂單（會級聯刪除訂單項目和狀態歷史）
        $order->delete();
        
        return true;
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
        return $this->executeInTransaction(function () use ($order, $reason) {
            return $this->processCancelOrder($order, $reason);
        });
    }
    
    /**
     * 處理取消訂單的實際邏輯
     */
    private function processCancelOrder(Order $order, ?string $reason = null): Order
    {
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
        
        // 4. 智能返還庫存：只返還現貨商品的庫存
        $this->returnInventoryOnCancel($order, $reason);
        
        // 5. 更新訂單項目的履行狀態
        // 取消訂單時，將所有未完成的訂單項目標記為未履行
        $order->items()
            ->where('is_fulfilled', true)
            ->where(function($q) {
                // 只更新預訂商品和訂製商品的履行狀態
                // 現貨商品的履行狀態保持不變（它們在創建時就已履行）
                $q->where('is_backorder', true)
                  ->orWhere(function($subQ) {
                      $subQ->where('is_stocked_sale', false)
                           ->where('is_backorder', false)
                           ->whereNotNull('product_variant_id');
                  });
            })
            ->update([
                'is_fulfilled' => false,
                'fulfilled_at' => null,
            ]);
        
        // 5. 記錄狀態變更歷史
        if ($originalShippingStatus !== 'cancelled') {
            $order->statusHistories()->create([
                'from_status' => $originalShippingStatus,
                'to_status' => 'cancelled',
                'status_type' => 'shipping',
                'user_id' => $this->requireAuthentication('狀態記錄'),
                'notes' => $reason ?? '訂單已取消',
            ]);
        }
        
        if ($originalPaymentStatus !== $order->payment_status) {
            $order->statusHistories()->create([
                'from_status' => $originalPaymentStatus,
                'to_status' => $order->payment_status,
                'status_type' => 'payment',
                'user_id' => $this->requireAuthentication('狀態記錄'),
                'notes' => '付款狀態已更新',
            ]);
        }
        
        // 6. 預載入關聯並返回
        return $order->load(['items.productVariant', 'customer', 'creator', 'statusHistories.user']);
    }

    /**
     * 批量更新訂單狀態
     * 
     * 批量更新多個訂單的狀態，支援付款狀態和貨物狀態的批量變更。
     * 系統會在事務中執行所有操作，確保資料一致性，並記錄每個訂單的狀態變更歷史。
     * 
     * @param array $ids 要更新的訂單 ID 陣列
     * @param string $statusType 狀態類型 (payment_status 或 shipping_status)
     * @param string $statusValue 目標狀態值
     * @param string|null $notes 可選的批量操作備註
     * @return void
     * @throws \Exception 當更新失敗時拋出異常
     */
    public function batchUpdateStatus(array $ids, string $statusType, string $statusValue, ?string $notes): void
    {
        $this->executeInTransaction(function () use ($ids, $statusType, $statusValue, $notes) {
            $this->processBatchUpdateStatus($ids, $statusType, $statusValue, $notes);
        });
    }
    
    /**
     * 處理批量更新狀態的實際邏輯
     */
    private function processBatchUpdateStatus(array $ids, string $statusType, string $statusValue, ?string $notes): void
    {
        // 1. 獲取所有要更新的訂單
        $orders = Order::whereIn('id', $ids)->get();
        
        // 2. 檢查是否找到所有訂單
        if ($orders->count() !== count($ids)) {
            $foundIds = $orders->pluck('id')->toArray();
            $missingIds = array_diff($ids, $foundIds);
            throw new \Exception("找不到以下訂單 ID：" . implode(', ', $missingIds));
        }
        
        // 3. 逐一更新每個訂單
        foreach ($orders as $order) {
            // 記錄原始狀態
            $originalStatus = $order->{$statusType};
            
            // 只有在狀態確實發生變更時才進行更新
            if ($originalStatus !== $statusValue) {
                // 更新訂單狀態
                $order->update([
                    $statusType => $statusValue,
                ]);
                
                // 記錄狀態變更歷史
                $this->addStatusHistory(
                    $order,
                    $originalStatus,
                    $statusValue,
                    $statusType,
                    "批量操作：狀態更新為 {$statusValue}。" . ($notes ? " 備註：{$notes}" : "")
                );
            }
        }
    }

    /**
     * 添加訂單狀態歷史記錄
     * 
     * 為訂單添加狀態變更歷史記錄，用於追蹤訂單狀態的變更軌跡。
     * 
     * @param Order $order 訂單實例
     * @param string|null $fromStatus 原始狀態
     * @param string $toStatus 目標狀態
     * @param string $statusType 狀態類型 (payment_status 或 shipping_status)
     * @param string $notes 變更備註
     * @return void
     */
    protected function addStatusHistory(Order $order, ?string $fromStatus, string $toStatus, string $statusType, string $notes): void
    {
        // 確定狀態類型的簡化名稱
        $statusTypeMap = [
            'payment_status' => 'payment',
            'shipping_status' => 'shipping',
        ];
        
        $historyStatusType = $statusTypeMap[$statusType] ?? $statusType;
        
        // 創建狀態歷史記錄
        $order->statusHistories()->create([
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'status_type' => $historyStatusType,
            'user_id' => $this->requireAuthentication('狀態記錄'),
            'notes' => $notes,
        ]);
    }

    /**
     * 🎯 智能預訂模式：部分庫存扣減處理
     * 
     * 當訂單中有些商品有庫存、有些商品無庫存時，
     * 智能地只扣減有庫存的商品，無庫存的商品標記為預訂
     * 
     * @param Order $order 訂單實例
     * @param array $standardItems 標準商品項目
     * @param array $stockCheckResults 庫存檢查結果
     * @return void
     */
    /**
     * 根據商品類型處理庫存扣減
     * 
     * 商品類型分類：
     * 1. 現貨商品：立即扣減庫存（已在創建時標記為已履行）
     * 2. 預訂商品：不扣減庫存，等待進貨
     * 3. 訂製商品：不涉及庫存，等待製作
     */
    protected function processInventoryByItemType(Order $order, array $itemsData): void
    {
        $stockedItems = [];      // 需要立即扣減庫存的現貨商品
        $backorderItems = [];    // 預訂商品，不扣減庫存
        $customItems = [];       // 訂製商品，不涉及庫存
        
        // 分類處理每個訂單項目
        foreach ($order->items as $orderItem) {
            // 根據商品屬性判斷類型
            $itemType = null;
            if ($orderItem->is_stocked_sale) {
                $itemType = OrderItemType::STOCK;
            } elseif ($orderItem->is_backorder) {
                $itemType = OrderItemType::BACKORDER;
            } else {
                $itemType = OrderItemType::CUSTOM;
            }
            
            $itemData = [
                'product_variant_id' => $orderItem->product_variant_id,
                'quantity' => $orderItem->quantity,
                'product_name' => $orderItem->product_name,
                'sku' => $orderItem->sku,
                'is_stocked_sale' => $orderItem->is_stocked_sale,
                'is_backorder' => $orderItem->is_backorder,
            ];
            
            if ($itemType === OrderItemType::STOCK) {
                // 現貨商品：需要立即扣減庫存
                $stockedItems[] = $itemData;
            } elseif ($itemType === OrderItemType::BACKORDER) {
                // 預訂商品：不扣減庫存，記錄用於後續處理
                $backorderItems[] = $itemData;
            } elseif ($itemType === OrderItemType::CUSTOM) {
                // 訂製商品：不涉及庫存管理
                $customItems[] = $itemData;
            }
        }
        
        // 處理現貨商品：立即扣減庫存
        if (!empty($stockedItems)) {
            // 注意：庫存檢查已經在 createOrder 方法中完成，這裡直接扣減
            // 執行庫存扣減
            $this->inventoryService->batchDeductStock(
                $stockedItems,
                $order->store_id, // 使用訂單指定的門市
                [
                    'order_number' => $order->order_number, 
                    'order_id' => $order->id,
                    'reason' => '現貨商品庫存扣減'
                ]
            );
        }
        
        // 記錄各類商品統計
        if (!empty($backorderItems) || !empty($customItems)) {
            $notes = [];
            if (!empty($backorderItems)) {
                $notes[] = "包含 " . count($backorderItems) . " 項預訂商品";
            }
            if (!empty($customItems)) {
                $notes[] = "包含 " . count($customItems) . " 項訂製商品";
            }
            
            if (!empty($notes)) {
                $order->update([
                    'notes' => ($order->notes ? $order->notes . ' | ' : '') . implode('，', $notes)
                ]);
            }
        }
        
        // 記錄詳細日誌
        \Log::info("訂單庫存處理完成", [
            'order_number' => $order->order_number,
            'stocked_items' => count($stockedItems),
            'backorder_items' => count($backorderItems),
            'custom_items' => count($customItems)
        ]);
    }

    /**
     * 取得待處理的預訂商品（尚未建立進貨單的）
     * 
     * @param array $filters 篩選條件
     * @return \Illuminate\Support\Collection
     */
    public function getPendingBackorders(array $filters = [])
    {
        $query = OrderItem::where(function ($q) {
                // 包含預訂商品和需要進貨的訂製商品
                $q->where('is_backorder', true)
                  ->orWhere(function ($subQ) {
                      // 訂製商品：非現貨、非預訂、但有 product_variant_id（表示需要向供應商訂購）
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
            ->with(['order.customer', 'productVariant.product']);

        // 可選：按日期範圍篩選
        if (!empty($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        // 可選：按商品變體篩選
        if (!empty($filters['product_variant_id'])) {
            $query->where('product_variant_id', $filters['product_variant_id']);
        }

        // 按商品變體分組統計
        if (!empty($filters['group_by_variant']) && $filters['group_by_variant']) {
            return $query->select(
                'product_variant_id',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('COUNT(DISTINCT order_id) as order_count'),
                DB::raw('MIN(created_at) as earliest_order_date'),
                DB::raw('MAX(created_at) as latest_order_date'),
                DB::raw('GROUP_CONCAT(DISTINCT order_id) as order_ids')
            )
            ->groupBy('product_variant_id')
            ->get()
            ->map(function ($item) {
                // 載入商品變體資訊
                $item->productVariant = ProductVariant::with('product')->find($item->product_variant_id);
                $item->order_ids = explode(',', $item->order_ids);
                return $item;
            });
        }

        // 返回詳細清單，加入格式轉換
        return $query->orderBy('created_at', 'asc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'order_id' => $item->order_id,
                'product_variant_id' => $item->product_variant_id,
                'product_name' => $item->product_name,
                'sku' => $item->sku,
                'quantity' => $item->quantity,
                'is_backorder' => $item->is_backorder,
                'purchase_item_id' => $item->purchase_item_id,
                'purchase_status' => $this->getPurchaseStatus($item),
                'purchase_status_text' => $this->getPurchaseStatusText($item),
                'created_at' => $item->created_at->toIso8601String(),
                'order' => [
                    'order_number' => $item->order->order_number ?? '',
                    'customer' => $item->order->customer ? [
                        'name' => $item->order->customer->name,
                    ] : null,
                ],
                'productVariant' => $item->productVariant ? [
                    'sku' => $item->productVariant->sku,
                    'cost' => $item->productVariant->cost_price ?? 0,
                    'product' => $item->productVariant->product ? [
                        'name' => $item->productVariant->product->name,
                    ] : null,
                ] : null,
            ];
        });
    }

    /**
     * 取得待處理預訂商品的統計資訊
     * 
     * @return array
     */
    public function getPendingBackordersStats(): array
    {
        $stats = \App\Models\OrderItem::where(function ($q) {
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
            })
            ->selectRaw('
                COUNT(*) as total_items,
                COUNT(DISTINCT product_variant_id) as unique_products,
                COUNT(DISTINCT order_id) as affected_orders,
                SUM(quantity) as total_quantity,
                MIN(created_at) as oldest_backorder_date
            ')
            ->first();

        return [
            'total_items' => $stats->total_items ?? 0,
            'unique_products' => $stats->unique_products ?? 0,
            'affected_orders' => $stats->affected_orders ?? 0,
            'total_quantity' => $stats->total_quantity ?? 0,
            'oldest_backorder_date' => $stats->oldest_backorder_date,
            'days_pending' => $stats->oldest_backorder_date 
                ? now()->diffInDays($stats->oldest_backorder_date) 
                : 0
        ];
    }

    /**
     * 獲取購買狀態
     * 
     * @param OrderItem $item
     * @return string
     */
    private function getPurchaseStatus(OrderItem $item): string
    {
        if ($item->purchase_item_id) {
            return 'purchase_created';
        }
        return 'pending_purchase';
    }

    /**
     * 獲取購買狀態文字
     * 
     * @param OrderItem $item
     * @return string
     */
    private function getPurchaseStatusText(OrderItem $item): string
    {
        if ($item->purchase_item_id) {
            return '已建立進貨單';
        }
        return '待建立進貨單';
    }

    /**
     * 取消訂單時智能返還庫存
     * 
     * 只返還現貨商品的庫存，預訂商品和訂製商品不涉及庫存返還
     */
    protected function returnInventoryOnCancel(Order $order, ?string $reason = null): void
    {
        $stockedItems = [];
        $skippedItems = [];
        
        // 分類處理訂單項目
        foreach ($order->items as $orderItem) {
            if ($orderItem->is_stocked_sale && !$orderItem->is_backorder) {
                // 只有現貨商品才需要返還庫存
                $stockedItems[] = [
                    'product_variant_id' => $orderItem->product_variant_id,
                    'quantity' => $orderItem->quantity,
                    'product_name' => $orderItem->product_name,
                    'sku' => $orderItem->sku,
                    'is_stocked_sale' => true,
                    'is_backorder' => false,
                ];
            } else {
                // 預訂商品和訂製商品不返還庫存
                $skippedItems[] = $orderItem->product_name;
            }
        }
        
        // 返還現貨商品庫存
        if (!empty($stockedItems)) {
            $this->inventoryService->batchReturnStock(
                $stockedItems,
                $order->store_id, // 使用訂單的門市
                [
                    'order_number' => $order->order_number, 
                    'order_id' => $order->id, 
                    'reason' => $reason ?? '訂單取消'
                ]
            );
        }
        
        // 記錄返還庫存的詳細資訊
        \Log::info("訂單取消庫存返還", [
            'order_number' => $order->order_number,
            'returned_items' => count($stockedItems),
            'skipped_items' => count($skippedItems),
            'skipped_item_names' => $skippedItems,
            'reason' => $reason ?? '訂單取消'
        ]);
    }

    // ===== 測試輔助方法 =====

    /**
     * 檢查用戶是否有效認證（測試用）
     */
    public function hasValidAuth(): bool
    {
        return \Illuminate\Support\Facades\Auth::user() !== null;
    }

    /**
     * 獲取多個訂單及其關聯（測試用）
     */
    public function getOrdersWithRelations(array $orderIds): \Illuminate\Database\Eloquent\Collection
    {
        return Order::whereIn('id', $orderIds)
            ->with([
                'customer',
                'items.productVariant',
                'statusHistories.user'
            ])
            ->get();
    }
} 