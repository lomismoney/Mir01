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
     * @queryParam group_by_variant boolean 是否按商品變體分組. Example: true
     * @queryParam date_from string 開始日期. Example: 2024-01-01
     * @queryParam date_to string 結束日期. Example: 2024-12-31
     * @queryParam product_variant_id integer 商品變體ID. Example: 10
     * 
     * @response 200 {
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
            'date_from' => 'date',
            'date_to' => 'date',
            'product_variant_id' => 'integer|exists:product_variants,id',
        ]);

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
}