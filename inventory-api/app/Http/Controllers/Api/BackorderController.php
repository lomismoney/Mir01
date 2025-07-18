<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OrderService;
use App\Services\PurchaseService;
use App\Models\Order;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * @group 預訂商品管理
 * 
 * 管理預訂商品的追蹤與轉換
 */
class BackorderController extends Controller
{
    protected OrderService $orderService;
    protected PurchaseService $purchaseService;

    public function __construct(OrderService $orderService, PurchaseService $purchaseService)
    {
        $this->orderService = $orderService;
        $this->purchaseService = $purchaseService;
    }

    /**
     * 取得待處理的預訂商品清單
     * 
     * 顯示所有尚未建立進貨單的預訂商品
     * 
     * @queryParam group_by_order boolean 是否按訂單分組. Example: true
     * @queryParam group_by_variant boolean 是否按商品變體分組. Example: false
     * @queryParam date_from string 開始日期. Example: 2024-01-01
     * @queryParam date_to string 結束日期. Example: 2024-12-31
     * @queryParam product_variant_id integer 商品變體ID. Example: 10
     * @queryParam for_purchase_only boolean 只返回需要進貨處理的項目（排除調貨項目）. Example: true
     * 
     * @response 200 scenario="grouped by order" {
     *   "data": [
     *     {
     *       "order_id": 100,
     *       "order_number": "SO-20250717-0005",
     *       "customer_name": "廖家慶",
     *       "total_items": 3,
     *       "total_quantity": 6,
     *       "created_at": "2025-07-17T04:35:00Z",
     *       "days_pending": 0,
     *       "summary_status": "mixed",
     *       "summary_status_text": "部分調撥中",
     *       "items": [
     *         {
     *           "id": 1,
     *           "product_name": "iPhone 15 Pro - 金色-512GB",
     *           "sku": "IPHONE-15-PRO-金色-512GB",
     *           "quantity": 1,
     *           "integrated_status": "transfer_in_transit",
     *           "integrated_status_text": "庫存調撥中",
     *           "transfer": {
     *             "id": 19,
     *             "status": "in_transit"
     *           }
     *         },
     *         {
     *           "id": 2,
     *           "product_name": "iPhone 15 Pro - 藍色-256GB",
     *           "sku": "IPHONE-15-PRO-藍色-256GB",
     *           "quantity": 2,
     *           "integrated_status": "purchase_ordered",
     *           "integrated_status_text": "已向供應商下單",
     *           "purchase_item_id": 101
     *         }
     *       ]
     *     }
     *   ]
     * }
     * 
     * @response 200 scenario="flat list" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "order_id": 100,
     *       "product_variant_id": 10,
     *       "product_name": "測試商品",
     *       "sku": "TEST-001",
     *       "quantity": 5,
     *       "is_backorder": true,
     *       "purchase_item_id": null,
     *       "purchase_status": "pending_purchase",
     *       "purchase_status_text": "待建立進貨單",
     *       "created_at": "2024-01-15T10:00:00Z",
     *       "order": {
     *         "order_number": "ORD-20240115-001",
     *         "customer": {
     *           "name": "張三"
     *         }
     *       },
     *       "productVariant": {
     *         "sku": "TEST-001",
     *         "cost": 100.00,
     *         "product": {
     *           "name": "測試商品"
     *         }
     *       }
     *     }
     *   ]
     * }
     * 
     * @response 200 scenario="grouped by variant" {
     *   "data": [
     *     {
     *       "product_variant_id": 10,
     *       "total_quantity": 25,
     *       "order_count": 5,
     *       "earliest_order_date": "2024-01-01T08:00:00Z",
     *       "latest_order_date": "2024-01-15T16:00:00Z",
     *       "order_ids": [100, 101, 102, 103, 104],
     *       "productVariant": {
     *         "sku": "TEST-001",
     *         "cost": 100.00,
     *         "product": {
     *           "name": "測試商品"
     *         }
     *       }
     *     }
     *   ]
     * }
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $filters = $request->validate([
            'group_by_variant' => 'boolean',
            'group_by_order' => 'boolean',
            'date_from' => 'date',
            'date_to' => 'date',
            'product_variant_id' => 'integer|exists:product_variants,id',
            'for_purchase_only' => 'boolean', // 新增：只返回需要進貨的項目
        ]);

        // 如果請求包含轉移資訊，使用新的整合方法
        if ($request->boolean('include_transfers', true)) {
            $data = $this->orderService->getPendingBackordersWithTransfers($filters);
            
            // 如果是按訂單分組，直接返回（已經格式化）
            if (!empty($filters['group_by_order']) && $filters['group_by_order']) {
                return response()->json(['data' => $data]);
            }
            
            // 格式化回應資料
            $formattedData = $data->map(function ($item) {
                $baseData = [
                    'id' => $item->id,
                    'order_id' => $item->order_id,
                    'product_variant_id' => $item->product_variant_id,
                    'product_name' => $item->product_name,
                    'sku' => $item->sku,
                    'quantity' => $item->quantity,
                    'is_backorder' => $item->is_backorder,
                    'purchase_item_id' => $item->purchase_item_id,
                    'purchase_status' => $item->purchase_status,
                    'purchase_status_text' => $item->purchase_status_text,
                    'integrated_status' => $item->integrated_status,
                    'integrated_status_text' => $item->integrated_status_text,
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
                
                // 如果有轉移資訊，加入回應
                if ($item->transfer) {
                    $baseData['transfer'] = [
                        'id' => $item->transfer->id,
                        'from_store_id' => $item->transfer->from_store_id,
                        'to_store_id' => $item->transfer->to_store_id,
                        'quantity' => $item->transfer->quantity,
                        'status' => $item->transfer->status,
                        'notes' => $item->transfer->notes,
                        'created_at' => $item->transfer->created_at->toIso8601String(),
                    ];
                }
                
                return $baseData;
            });
            
            return response()->json(['data' => $formattedData]);
        }
        
        // 舊的方法（保持向後相容）
        $data = $this->orderService->getPendingBackorders($filters);

        return response()->json(['data' => $data]);
    }

    /**
     * 取得預訂商品統計資訊
     * 
     * 顯示待處理預訂商品的整體統計
     * 
     * @response 200 {
     *   "data": {
     *     "total_items": 50,
     *     "unique_products": 12,
     *     "affected_orders": 25,
     *     "total_quantity": 180,
     *     "oldest_backorder_date": "2024-01-01T08:00:00Z",
     *     "days_pending": 15
     *   }
     * }
     */
    public function stats(): JsonResponse
    {
        $this->authorize('viewAny', Order::class);

        $stats = $this->orderService->getPendingBackordersStats();

        return response()->json(['data' => $stats]);
    }

    /**
     * 取得預訂商品彙總（準備轉換為進貨單）
     * 
     * 按商品變體分組顯示預訂商品，便於批量轉換為進貨單
     * 
     * @queryParam store_id integer 門市ID. Example: 1
     * @queryParam date_from string 開始日期. Example: 2024-01-01
     * @queryParam date_to string 結束日期. Example: 2024-12-31
     * 
     * @response 200 {
     *   "data": [
     *     {
     *       "product_variant_id": 10,
     *       "product_name": "測試商品",
     *       "sku": "TEST-001",
     *       "total_quantity": 25,
     *       "order_count": 5,
     *       "earliest_date": "2024-01-01T08:00:00Z",
     *       "latest_date": "2024-01-15T16:00:00Z",
     *       "estimated_cost": 2500.00,
     *       "item_ids": [1, 2, 3, 4, 5]
     *     }
     *   ]
     * }
     */
    public function summary(Request $request): JsonResponse
    {
        $this->authorize('create', Purchase::class);

        $filters = $request->validate([
            'store_id' => 'integer|exists:stores,id',
            'date_from' => 'date',
            'date_to' => 'date',
        ]);

        $summary = $this->purchaseService->getBackordersSummaryForPurchase($filters);

        return response()->json(['data' => $summary]);
    }

    /**
     * 批量轉換預訂商品為進貨單
     * 
     * 將選中的預訂商品批量轉換為進貨單
     * 
     * @bodyParam item_ids array required 預訂商品項目ID陣列. Example: [1, 2, 3, 4, 5]
     * @bodyParam store_id integer 指定門市ID（可選）. Example: 1
     * 
     * @response 201 {
     *   "message": "成功創建 2 張進貨單",
     *   "data": [
     *     {
     *       "id": 100,
     *       "order_number": "PO-20240115-001",
     *       "store_id": 1,
     *       "total_amount": 1500.00,
     *       "status": "pending",
     *       "notes": "從客戶預訂單自動生成 - 包含 3 個預訂項目",
     *       "items": [...]
     *     }
     *   ]
     * }
     * 
     * @response 422 {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "item_ids": ["The item ids field is required."]
     *   }
     * }
     */
    public function convertToPurchase(Request $request): JsonResponse
    {
        $this->authorize('create', Purchase::class);

        $validated = $request->validate([
            'item_ids' => 'required|array|min:1',
            'item_ids.*' => 'integer|exists:order_items,id',
            'store_id' => 'nullable|integer|exists:stores,id',
        ]);

        try {
            $purchases = $this->purchaseService->createFromBackorders(
                $validated['item_ids'],
                ['store_id' => $validated['store_id'] ?? null]
            );

            return response()->json([
                'message' => '成功創建 ' . count($purchases) . ' 張進貨單',
                'data' => $purchases
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => '轉換失敗',
                'error' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * 更新待進貨商品的轉移狀態
     * 
     * 允許從待進貨商品管理頁面直接更新相關的庫存轉移狀態
     * 
     * @bodyParam item_id integer required 訂單項目ID. Example: 1
     * @bodyParam status string required 新的轉移狀態. Example: in_transit
     * @bodyParam notes string 狀態變更備註. Example: 貨品已從門市A出發
     * 
     * @response 200 {
     *   "message": "轉移狀態更新成功",
     *   "data": {
     *     "item_id": 1,
     *     "transfer_id": 10,
     *     "new_status": "in_transit",
     *     "integrated_status": "transfer_in_transit",
     *     "integrated_status_text": "庫存調撥中"
     *   }
     * }
     * 
     * @response 422 {
     *   "message": "此訂單項目沒有相關的庫存轉移記錄"
     * }
     */
    public function updateTransferStatus(Request $request): JsonResponse
    {
        $this->authorize('update', Order::class);

        $validated = $request->validate([
            'item_id' => 'required|integer|exists:order_items,id',
            'status' => 'required|string|in:pending,in_transit,completed,cancelled',
            'notes' => 'nullable|string|max:500',
        ]);

        try {
            $result = $this->orderService->updateBackorderTransferStatus(
                $validated['item_id'],
                $validated['status'],
                $validated['notes'] ?? null
            );

            if ($result) {
                // 重新獲取項目資訊以回傳最新狀態
                $orderItem = \App\Models\OrderItem::with('transfer')->find($validated['item_id']);
                
                return response()->json([
                    'message' => '轉移狀態更新成功',
                    'data' => [
                        'item_id' => $orderItem->id,
                        'transfer_id' => $orderItem->transfer->id ?? null,
                        'new_status' => $validated['status'],
                        'integrated_status' => $orderItem->integrated_status,
                        'integrated_status_text' => $orderItem->integrated_status_text,
                    ]
                ]);
            }

            return response()->json([
                'message' => '更新失敗'
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }
}