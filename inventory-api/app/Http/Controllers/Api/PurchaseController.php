<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Data\PurchaseData;
use App\Services\PurchaseService;
use App\Data\PurchaseResponseData;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Resources\Api\PurchaseResource;

class PurchaseController extends Controller
{
    /**
     * 建構函式 - 設置資源授權
     */
    public function __construct()
    {
        // 🔐 使用 authorizeResource 自動將控制器方法與 PurchasePolicy 中的
        // viewAny、view、create、update、delete 方法進行映射
        $this->authorizeResource(Purchase::class, 'purchase');
    }

    /**
     * Display a listing of the resource.
     * 
     * @group 進貨管理
     * @authenticated
     * @queryParam filter[store_id] integer 門市ID篩選 Example: 1
     * @queryParam filter[status] string 狀態篩選 Example: pending
     * @queryParam filter[order_number] string 進貨單號篩選 Example: PO-20240101-001
     * @queryParam filter[start_date] string 開始日期篩選 Example: 2024-01-01
     * @queryParam filter[end_date] string 結束日期篩選 Example: 2024-12-31
     * @queryParam sort string 排序欄位 Example: -purchased_at
     * @queryParam page integer 頁數 Example: 1
     * @queryParam per_page integer 每頁筆數 Example: 20
     * 
     * @response 200 scenario="成功獲取進貨單列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "order_number": "PO-20250101-001",
     *       "store_id": 1,
     *       "purchased_at": "2025-01-01T10:00:00.000000Z",
     *       "shipping_cost": "150.00",
     *       "total_amount": "1500.00",
     *       "status": "pending",
     *       "notes": "進貨備註",
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z",
     *       "items_count": 5,
     *       "items_sum_quantity": 50,
     *       "store": {
     *         "id": 1,
     *         "name": "門市名稱"
     *       },
     *       "items": []
     *     }
     *   ],
     *   "meta": {
     *     "current_page": 1,
     *     "per_page": 20,
     *     "total": 100,
     *     "last_page": 5
     *   },
     *   "links": {
     *     "first": "http://localhost/api/purchases?page=1",
     *     "last": "http://localhost/api/purchases?page=5",
     *     "prev": null,
     *     "next": "http://localhost/api/purchases?page=2"
     *   }
     * }
     */
    public function index()
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        $purchases = QueryBuilder::for(Purchase::class)
            ->allowedFilters([
                'order_number',
                'status',
                AllowedFilter::exact('store_id'),
                AllowedFilter::scope('date_range', 'whereBetween'),
            ])
            ->allowedSorts(['order_number', 'purchased_at', 'total_amount', 'created_at'])
            ->defaultSort('-purchased_at')
            ->with(['store', 'items.productVariant.product'])
            ->withCount('items')
            ->withSum('items', 'quantity')
            ->paginate(request('per_page', 20));

        return PurchaseResource::collection($purchases);
    }

    /**
     * Store a newly created resource in storage.
     * 
     * @group 進貨管理
     * @authenticated
     * @bodyParam store_id integer required 門市ID Example: 1
     * @bodyParam order_number string 進貨單號（選填，系統會自動生成） Example: PO-20240101-001
     * @bodyParam purchased_at string 進貨日期 Example: 2024-01-01T10:00:00+08:00
     * @bodyParam shipping_cost number required 總運費成本 Example: 150.00
     * @bodyParam status string 進貨單狀態 Example: pending
     * @bodyParam items object[] required 進貨項目列表 
     * @bodyParam items[].product_variant_id integer required 商品變體ID Example: 1
     * @bodyParam items[].quantity integer required 數量 Example: 10
     * @bodyParam items[].cost_price number required 成本價格 Example: 150.00
     * @bodyParam notes string 進貨備註
     * 
     * @response 201 scenario="進貨單創建成功" {
     *   "data": {
     *     "id": 1,
     *     "purchase_number": "PO-20250101-001",
     *     "supplier": "供應商名稱",
     *     "total_amount": 1500.00,
     *     "status": "pending",
     *     "notes": "進貨備註",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function store(PurchaseData $purchaseData, PurchaseService $purchaseService)
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理
        $purchase = $purchaseService->createPurchase($purchaseData);
        return new PurchaseResource($purchase->load(['store', 'items.productVariant.product']));
    }

    /**
     * Display the specified resource.
     * 
     * @group 進貨管理
     * @authenticated
     */
    public function show(Purchase $purchase)
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理
        $purchase->load(['store', 'items.productVariant.product']);
        return new PurchaseResource($purchase);
    }

    /**
     * Update the specified resource in storage.
     * 
     * @group 進貨管理
     * @authenticated
     * @bodyParam store_id integer 門市ID Example: 1
     * @bodyParam order_number string 進貨單號 Example: PO-20240101-001
     * @bodyParam purchased_at string 進貨日期 Example: 2024-01-01T10:00:00+08:00
     * @bodyParam shipping_cost number 總運費成本 Example: 150.00
     * @bodyParam status string 進貨單狀態 Example: confirmed
     * @bodyParam items object[] 進貨項目列表 
     * @bodyParam items[].product_variant_id integer 商品變體ID Example: 1
     * @bodyParam items[].quantity integer 數量 Example: 10
     * @bodyParam items[].cost_price number 成本價格 Example: 150.00
     */
    public function update(PurchaseData $purchaseData, Purchase $purchase, PurchaseService $purchaseService)
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        if (!$purchase->canBeModified()) {
            return response()->json(['message' => "進貨單狀態為 {$purchase->status_description}，無法修改"], 422);
        }

        $updatedPurchase = $purchaseService->updatePurchase($purchase, $purchaseData);
        return new PurchaseResource($updatedPurchase->load(['store', 'items.productVariant.product']));
    }

    /**
     * Update the status of the specified purchase.
     * 
     * @group 進貨管理
     * @authenticated
     * @bodyParam status string required 新狀態 Example: in_transit
     */
    public function updateStatus(Purchase $purchase, Request $request)
    {
        $this->authorize('update', $purchase);

        $request->validate([
            'status' => 'required|in:' . implode(',', array_keys(Purchase::getStatusOptions()))
        ]);

        $newStatus = $request->input('status');

        if (!$this->isValidStatusTransition($purchase->status, $newStatus)) {
            return response()->json([
                'message' => "無法從 {$purchase->status_description} 轉換到 " . Purchase::getStatusOptions()[$newStatus]
            ], 422);
        }

        $purchase->update(['status' => $newStatus]);
        return new PurchaseResource($purchase->fresh()->load('store', 'items.productVariant.product'));
    }

    /**
     * Cancel the specified purchase.
     * 
     * @group 進貨管理
     * @authenticated
     */
    public function cancel(Purchase $purchase)
    {
        $this->authorize('update', $purchase);

        if (!$purchase->canBeCancelled()) {
            return response()->json(['message' => "進貨單狀態為 {$purchase->status_description}，無法取消"], 422);
        }

        $purchase->update(['status' => Purchase::STATUS_CANCELLED]);
        return new PurchaseResource($purchase->fresh()->load('store', 'items.productVariant.product'));
    }

    /**
     * Remove the specified resource from storage.
     * 
     * @group 進貨管理
     * @authenticated
     */
    public function destroy(Purchase $purchase)
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        if ($purchase->status !== Purchase::STATUS_PENDING) {
            return response()->json([
                'message' => "只有待處理狀態的進貨單可以刪除"
            ], 422);
        }

        $purchase->delete();

        return response()->json(['message' => '進貨單已刪除']);
    }

    /**
     * 檢查狀態轉換是否合法
     */
    private function isValidStatusTransition(string $currentStatus, string $newStatus): bool
    {
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
            ],
        ];

        return in_array($newStatus, $validTransitions[$currentStatus] ?? []);
    }
}
