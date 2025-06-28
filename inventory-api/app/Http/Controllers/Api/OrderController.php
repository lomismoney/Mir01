<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\OrderResource;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\Api\StoreOrderRequest;
use App\Http\Requests\Api\UpdateOrderRequest;
use App\Http\Requests\Api\AddPaymentRequest;
use App\Http\Requests\Api\CreateRefundRequest;
use App\Http\Requests\Api\BatchDeleteOrdersRequest;
use App\Http\Requests\Api\BatchUpdateStatusRequest;
use App\Services\OrderService;
use App\Services\RefundService;

class OrderController extends Controller
{
    public function __construct(
        protected OrderService $orderService,
        protected RefundService $refundService
    ) {
    }
    /**





     */
    public function index(Request $request)
    {
        // 1. 權限驗證
        $this->authorize('viewAny', Order::class);

        // 2. 驗證請求參數
        $request->validate([
            'search'          => 'nullable|string',
            'shipping_status' => 'nullable|string',
            'payment_status'  => 'nullable|string',
            'start_date'      => 'nullable|date_format:Y-m-d',
            'end_date'        => 'nullable|date_format:Y-m-d|after_or_equal:start_date',
            'page'            => 'sometimes|integer|min:1',
            'per_page'        => 'sometimes|integer|min:1|max:100', // 限制每頁最大數量以保護伺服器
        ]);

        // 3. 構建查詢
        $orders = Order::query()
            // 預加載客戶和創建者信息，防止 N+1 問題
            ->with(['customer', 'creator'])
            // 條件化查詢
            ->when($request->filled('search'), function ($query) use ($request) {
                $searchTerm = '%' . $request->input('search') . '%';
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('order_number', 'like', $searchTerm)
                      ->orWhereHas('customer', function ($customerQuery) use ($searchTerm) {
                          $customerQuery->where('name', 'like', $searchTerm);
                      });
                });
            })
            ->when($request->filled('shipping_status'), function ($query) use ($request) {
                $query->where('shipping_status', $request->input('shipping_status'));
            })
            ->when($request->filled('payment_status'), function ($query) use ($request) {
                $query->where('payment_status', $request->input('payment_status'));
            })
            ->when($request->filled('start_date'), function ($query) use ($request) {
                $query->whereDate('created_at', '>=', $request->input('start_date'));
            })
            ->when($request->filled('end_date'), function ($query) use ($request) {
                $query->whereDate('created_at', '<=', $request->input('end_date'));
            })
            // 4. 排序與分頁
            ->latest(); // 默認按創建時間倒序

        // 5. 動態分頁邏輯
        $perPage = $request->input('per_page', 15); // 從請求獲取 per_page，若無則預設 15
        $orders = $orders->paginate($perPage);

        // 6. 追加查詢參數到分頁連結中，保留其他篩選條件
        $orders->appends($request->except('page'));

        // 7. 返回標準化的 API 資源集合
        return OrderResource::collection($orders);
    }

    /**

     * 創建新訂單
     * 
     * 此端點用於創建新的訂單，包含訂單頭資訊和訂單項目明細。
     * 系統會自動生成訂單號、計算總金額，並記錄初始狀態歷史。
     * 
     * 🎯 預訂系統支援：當庫存不足時，會返回結構化錯誤資訊，
     * 前端可以基於此資訊引導用戶選擇預訂模式。
     * 




















     * 


     *   "message": "庫存不足",
     *   "stockCheckResults": [...],
     *   "insufficientStockItems": [
     *     {
     *       "product_name": "標準辦公桌",
     *       "sku": "DESK-001",
     *       "requested_quantity": 5,
     *       "available_quantity": 2,
     *       "shortage": 3
     *     }
     *   ]
     * }
     */
    public function store(StoreOrderRequest $request)
    {
        // 1. 權限驗證
        $this->authorize('create', Order::class);

        try {
            // 2. 將所有業務邏輯委派給 Service 層
            $order = $this->orderService->createOrder($request->validated());

            // 3. 返回標準化的 API 資源，並附帶 201 Created 狀態碼
            return (new OrderResource($order))
                ->response()
                ->setStatusCode(201);
        } catch (\Exception $e) {
            // 🎯 預訂系統：檢查是否為庫存不足的結構化異常
            if ($e->getMessage() === '庫存不足' && 
                property_exists($e, 'stockCheckResults') && 
                property_exists($e, 'insufficientStockItems')) {
                
                // 返回結構化的庫存不足錯誤響應
                return response()->json([
                    'message' => '庫存不足',
                    'stockCheckResults' => $e->stockCheckResults,
                    'insufficientStockItems' => $e->insufficientStockItems
                ], 422);
            }
            
            // 4. 其他異常則使用標準錯誤處理
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => [
                    'general' => [$e->getMessage()]
                ]
            ], 500);
        }
    }

    /**

     * 

     *   "data": {
     *     "id": 1,
     *     "order_number": "ORD-20250101-001",
     *     "customer_id": 1,
     *     "store_id": 1,
     *     "total_amount": 299.99,
     *     "status": "pending",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function show(Order $order)
    {
        // 1. 權限驗證
        $this->authorize('view', $order);

        // 2. 預加載所有需要的關聯數據，包括嵌套關聯，以優化性能
        $order->load([
            'items.productVariant', // 訂單項目及其關聯的商品變體
            'customer.defaultAddress', // 客戶及其預設地址
            'creator',              // 創建者
            'statusHistories.user', // 狀態歷史及其操作者
            'paymentRecords.creator' // 🎯 付款記錄及其創建者
        ]);

        // 3. 返回標準化的單一資源
        return new OrderResource($order);
    }

    /**

     * 更新訂單
     * 
     * 此端點用於更新現有訂單的資訊。支援部分更新（PATCH），
     * 只需提供要更新的欄位即可。當更新訂單項目時，
     * 系統會自動處理項目的新增、更新和刪除，並重新計算訂單總額。
 * 
     * 

     */
    public function update(UpdateOrderRequest $request, Order $order)
    {
        // 1. 權限驗證
        $this->authorize('update', $order);

        // 2. 將所有業務邏輯委派給 Service 層
        $updatedOrder = $this->orderService->updateOrder($order, $request->validated());

        // 3. 返回標準化的單一資源
        return new OrderResource($updatedOrder);
    }

    /**


     */
    public function destroy(Order $order)
    {
        // 1. 權限驗證
        $this->authorize('delete', $order);

        // 2. 委派給 Service 層處理，包含庫存返還邏輯
        $this->orderService->deleteOrder($order);

        // 3. 返回 204 No Content 響應，這是 RESTful API 中成功刪除操作的標準實踐
        return response()->noContent();
    }

    /**

     * 確認訂單付款
     * 
     * 此端點用於確認訂單的付款狀態，將付款狀態從「待付款」更新為「已付款」。
     * 系統會自動記錄狀態變更歷史，並更新相關時間戳。
     * 

     * 

     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250619-001",
     *     "payment_status": "paid",
     *     "updated_at": "2025-06-19T10:30:00.000000Z"
     *   }
     * }

     *   "message": "此訂單的付款狀態不允許確認付款操作",
     *   "errors": {
     *     "payment_status": ["訂單已付款，無法重複確認"]
     *   }
     * }
     */
    public function confirmPayment(Order $order)
    {
        // 1. 權限驗證
        $this->authorize('update', $order);

        // 2. 業務邏輯驗證
        if ($order->payment_status === 'paid') {
            return response()->json([
                'message' => '此訂單的付款狀態不允許確認付款操作',
                'errors' => [
                    'payment_status' => ['訂單已付款，無法重複確認']
                ]
            ], 422);
        }

        // 3. 委派給 Service 層處理業務邏輯
        $updatedOrder = $this->orderService->confirmPayment($order);

        // 4. 返回更新後的訂單資源
        return new OrderResource($updatedOrder);
    }

    /**

     * 新增部分付款記錄
     * 
     * 此端點用於為訂單新增部分付款記錄，支援訂金、分期付款等場景。
     * 系統會自動計算已付金額，並根據付款進度更新訂單的付款狀態。
     * 每次付款都會記錄詳細的付款歷史，便於追蹤和對帳。
 * 
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250619-001",
     *     "payment_status": "partial",
     *     "paid_amount": 1500.50,
     *     "grand_total": 5000.00,
     *     "payment_records": [
     *       {
     *         "id": 1,
     *         "amount": 1500.50,
     *         "payment_method": "cash",
     *         "payment_date": "2025-06-20T10:30:00.000000Z",
     *         "notes": "收到現金付款，找零 50 元",
     *         "creator": {
     *           "id": 1,
     *           "name": "管理員"
     *         }
     *       }
     *     ],
     *     "updated_at": "2025-06-20T10:30:00.000000Z"
     *   }
     * }

     *   "message": "收款金額不能超過剩餘未付金額：3499.50",
     *   "errors": {
     *     "amount": ["收款金額不能超過剩餘未付金額：3499.50"]
     *   }
     * }

     *   "message": "此訂單已全額付清，無法再新增付款記錄",
     *   "errors": {
     *     "payment_status": ["訂單已全額付清"]
     *   }
     * }
     */
    public function addPayment(AddPaymentRequest $request, Order $order)
    {
        // 1. 權限驗證
        $this->authorize('update', $order);

        // 2. 業務邏輯驗證：檢查訂單是否已全額付清
        if ($order->payment_status === 'paid') {
            return response()->json([
                'message' => '此訂單已全額付清，無法再新增付款記錄',
                'errors' => [
                    'payment_status' => ['訂單已全額付清']
                ]
            ], 422);
        }

        try {
            // 3. 委派給 Service 層處理業務邏輯
            $updatedOrder = $this->orderService->addPartialPayment($order, $request->validated());

            // 4. 返回更新後的訂單資源
            return new OrderResource($updatedOrder);
        } catch (\Exception $e) {
            // 5. 處理業務邏輯錯誤（如金額超出限制）
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => [
                    'amount' => [$e->getMessage()]
                ]
            ], 422);
        }
    }

    /**

     * 創建訂單出貨記錄
     * 
     * 此端點用於為訂單創建出貨記錄，將貨物狀態更新為「已出貨」。
     * 可以提供物流追蹤號碼等出貨相關資訊。
 * 
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250619-001",
     *     "shipping_status": "shipped",
     *     "tracking_number": "SF1234567890",
     *     "shipped_at": "2025-06-19T14:30:00.000000Z",
     *     "updated_at": "2025-06-19T14:30:00.000000Z"
     *   }
     * }

     *   "message": "此訂單的貨物狀態不允許出貨操作",
     *   "errors": {
     *     "shipping_status": ["訂單已出貨，無法重複操作"]
     *   }
     * }
     */
    public function createShipment(Request $request, Order $order)
    {
        // 1. 權限驗證
        $this->authorize('update', $order);

        // 2. 驗證請求參數
        $validated = $request->validate([
            'tracking_number' => 'required|string|max:100',
            'carrier' => 'nullable|string|max:100',
            'shipped_at' => 'nullable|date_format:Y-m-d H:i:s',
            'estimated_delivery_date' => 'nullable|date_format:Y-m-d|after_or_equal:today',
            'notes' => 'nullable|string|max:500',
        ]);

        // 3. 業務邏輯驗證
        if (in_array($order->shipping_status, ['shipped', 'delivered'])) {
            return response()->json([
                'message' => '此訂單的貨物狀態不允許出貨操作',
                'errors' => [
                    'shipping_status' => ['訂單已出貨，無法重複操作']
                ]
            ], 422);
        }

        // 4. 委派給 Service 層處理業務邏輯
        $updatedOrder = $this->orderService->createShipment($order, $validated);

        // 5. 返回更新後的訂單資源
        return new OrderResource($updatedOrder);
    }

    /**

     * 取消訂單
     * 
     * 此端點用於取消訂單，將訂單狀態更新為已取消，
     * 並自動返還所有庫存銷售商品的庫存數量。
     * 注意：已出貨或已交付的訂單無法取消。
 * 
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250619-001",
     *     "shipping_status": "cancelled",
     *     "payment_status": "cancelled",
     *     "updated_at": "2025-06-19T12:00:00.000000Z"
     *   }
     * }

     *   "message": "此訂單的狀態不允許取消操作",
     *   "errors": {
     *     "shipping_status": ["已出貨或已交付的訂單無法取消"]
     *   }
     * }
     */
    public function cancel(Request $request, Order $order)
    {
        // 1. 權限驗證
        $this->authorize('update', $order);

        // 2. 驗證請求參數
        $validated = $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            // 3. 委派給 Service 層處理業務邏輯
            $cancelledOrder = $this->orderService->cancelOrder($order, $validated['reason'] ?? null);
            
            // 4. 返回更新後的訂單資源
            return new OrderResource($cancelledOrder);
        } catch (\Exception $e) {
            // 5. 處理業務邏輯錯誤
            return response()->json([
                'message' => '此訂單的狀態不允許取消操作',
                'errors' => [
                    'shipping_status' => [$e->getMessage()]
                ]
            ], 422);
        }
    }

    /**

     * 創建訂單退款
     * 
     * 此端點用於為訂單創建品項級別的退款，支援部分品項退貨。
     * 系統會自動計算退款金額、更新訂單狀態，並可選擇性回補庫存。
     * 每筆退款都會記錄詳細的退貨明細和操作歷史。
 * 
     *   "data": {
     *     "id": 1,
     *     "order_id": 1,
     *     "total_refund_amount": 3000.00,
     *     "reason": "商品品質不符合要求，客戶要求退貨",
     *     "notes": "商品外觀無損，已檢查確認可回庫",
     *     "should_restock": true,
     *     "creator": {
     *       "id": 1,
     *       "name": "管理員"
     *     },
     *     "refund_items": [
     *       {
     *         "id": 1,
     *         "order_item_id": 1,
     *         "quantity": 2,
     *         "refund_subtotal": 3000.00,
     *         "order_item": {
     *           "id": 1,
     *           "product_name": "標準辦公桌",
     *           "sku": "DESK-001",
     *           "price": 1500.00
     *         }
     *       }
     *     ],
     *     "created_at": "2025-06-20T15:30:00.000000Z"
     *   }
     * }

     *   "message": "品項 DESK-001 的退貨數量 (5) 超過可退數量 (3)",
     *   "errors": {
     *     "items.0.quantity": ["品項 DESK-001 的退貨數量 (5) 超過可退數量 (3)"]
     *   }
     * }

     *   "message": "未付款的訂單無法退款",
     *   "errors": {
     *     "payment_status": ["未付款的訂單無法退款"]
     *   }
     * }
     */
    public function createRefund(CreateRefundRequest $request, Order $order)
    {
        // 1. 權限驗證
        $this->authorize('update', $order);

        try {
            // 2. 委派給 RefundService 處理所有業務邏輯
            $refund = $this->refundService->createRefund($order, $request->validated());

            // 3. 返回創建的退款記錄，使用 201 Created 狀態碼
            return response()->json([
                'data' => [
                    'id' => $refund->id,
                    'order_id' => $refund->order_id,
                    'total_refund_amount' => $refund->total_refund_amount,
                    'reason' => $refund->reason,
                    'notes' => $refund->notes,
                    'should_restock' => $refund->should_restock,
                    'creator' => [
                        'id' => $refund->creator->id,
                        'name' => $refund->creator->name,
                    ],
                    'refund_items' => $refund->refundItems->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'order_item_id' => $item->order_item_id,
                            'quantity' => $item->quantity,
                            'refund_subtotal' => $item->refund_subtotal,
                            'order_item' => [
                                'id' => $item->orderItem->id,
                                'product_name' => $item->orderItem->product_name,
                                'sku' => $item->orderItem->sku,
                                'price' => $item->orderItem->price,
                            ],
                        ];
                    }),
                    'created_at' => $refund->created_at,
                ]
            ], 201);

        } catch (\Exception $e) {
            // 4. 處理業務邏輯錯誤
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => [
                    'refund' => [$e->getMessage()]
                ]
            ], 422);
        }
    }

    /**

     * 批量刪除訂單
     * 
     * 此端點用於批量刪除多個訂單，同時處理庫存返還和相關清理操作。
     * 系統會在事務中執行所有操作，確保資料一致性。
     * 注意：只有管理員可以執行批量刪除，且已出貨或已交付的訂單不能刪除。
     * 


     * 

     *   "message": "訂單已成功批量刪除",
     *   "deleted_count": 3,
     *   "deleted_ids": [1, 2, 3]
     * }

     *   "message": "部分訂單無法刪除",
     *   "errors": {
     *     "orders": ["訂單 PO-20250619-001 已出貨，無法刪除", "訂單 PO-20250619-002 已交付，無法刪除"]
     *   }
     * }

     *   "message": "您沒有權限執行此操作"
     * }
     */
    public function destroyMultiple(BatchDeleteOrdersRequest $request)
    {
        // 1. 權限驗證 - 只有管理員可以批量刪除訂單
        $this->authorize('deleteMultiple', Order::class);

        $ids = $request->validated()['ids'];
        
        try {
            // 2. 事務處理，確保操作的原子性
            $result = DB::transaction(function () use ($ids) {
                // 2.1 預先檢查所有訂單的可刪除性
                $orders = Order::whereIn('id', $ids)->get();
                $undeletableOrders = [];
                
                foreach ($orders as $order) {
                    // 檢查訂單狀態，已出貨或已完成的訂單不能刪除
                    if (in_array($order->shipping_status, ['shipped', 'delivered'])) {
                        $undeletableOrders[] = "訂單 {$order->order_number} 狀態為「{$order->shipping_status}」，無法刪除";
                    }
                }
                
                // 2.2 如果有不可刪除的訂單，拋出異常
                if (!empty($undeletableOrders)) {
                    throw new \Exception(implode('；', $undeletableOrders));
                }
                
                // 2.3 委派給 OrderService 處理業務邏輯
                // 包含庫存返還、關聯資料清理等操作
                $deletedCount = 0;
                $deletedIds = [];
                
                foreach ($orders as $order) {
                    $this->orderService->deleteOrder($order);
                    $deletedCount++;
                    $deletedIds[] = $order->id;
                }
                
                return [
                    'deleted_count' => $deletedCount,
                    'deleted_ids' => $deletedIds
                ];
            });

            // 3. 返回成功響應
            return response()->json([
                'message' => '訂單已成功批量刪除',
                'deleted_count' => $result['deleted_count'],
                'deleted_ids' => $result['deleted_ids']
            ], 200);

        } catch (\Exception $e) {
            // 4. 處理業務邏輯錯誤
            return response()->json([
                'message' => '部分訂單無法刪除',
                'errors' => [
                    'orders' => [$e->getMessage()]
                ]
            ], 422);
        }
    }

    /**

     * 批量更新訂單狀態
     * 
     * 此端點用於批量更新多個訂單的狀態，支援付款狀態和貨物狀態的批量變更。
     * 系統會在事務中執行所有操作，確保資料一致性，並記錄每個訂單的狀態變更歷史。
     * 注意：只有管理員可以執行批量狀態更新。
     * 





     * 

     *   "message": "訂單狀態已成功批量更新",
     *   "updated_count": 3,
     *   "updated_ids": [1, 2, 3],
     *   "status_type": "payment_status",
     *   "status_value": "paid"
     * }

     *   "message": "驗證失敗",
     *   "errors": {
     *     "status_type": ["狀態類型必須是付款狀態或貨物狀態"],
     *     "status_value": ["請提供狀態值"]
     *   }
     * }

     *   "message": "您沒有權限執行此操作"
     * }
     */
    public function updateMultipleStatus(BatchUpdateStatusRequest $request)
    {
        // 1. 權限驗證 - 只有管理員可以批量更新訂單狀態
        $this->authorize('updateMultipleStatus', Order::class);

        $validated = $request->validated();
        
        try {
            // 2. 委派給 Service 層處理業務邏輯
            $this->orderService->batchUpdateStatus(
                $validated['ids'],
                $validated['status_type'],
                $validated['status_value'],
                $validated['notes'] ?? null
            );

            // 3. 返回成功響應
            return response()->json([
                'message' => '訂單狀態已成功批量更新',
                'updated_count' => count($validated['ids']),
                'updated_ids' => $validated['ids'],
                'status_type' => $validated['status_type'],
                'status_value' => $validated['status_value']
            ], 200);

        } catch (\Exception $e) {
            // 4. 處理業務邏輯錯誤
            return response()->json([
                'message' => '批量更新狀態失敗',
                'errors' => [
                    'status_update' => [$e->getMessage()]
                ]
            ], 422);
        }
    }
}
