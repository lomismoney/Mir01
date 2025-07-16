<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Data\PurchaseData;
use App\Services\PurchaseService;
use App\Data\PurchaseResponseData;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use App\Http\Resources\Api\PurchaseResource;
use App\Http\Requests\Api\PartialReceiptRequest;

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
     * @summary 獲取進貨單詳情
     * @description 顯示指定進貨單的詳細資訊，包含進貨項目和相關資料。
     * 
     * @urlParam purchase integer required 進貨單ID。 Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\PurchaseResource
     * @apiResourceModel \App\Models\Purchase
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
     * @summary 更新進貨單
     * @description 更新指定進貨單的資訊和進貨項目，包含完整的業務邏輯處理。
     * 
     * **⚠️ 重要說明**：
     * - 此操作支援更新進貨單的所有資訊，包括狀態變更
     * - 如果狀態變更涉及庫存影響，會自動處理相關庫存操作
     * - 狀態變更為「已完成」時會自動執行庫存入庫操作
     * - 狀態從「已完成」變更為其他狀態時會自動回退庫存
     * - 所有操作在資料庫事務中執行，失敗時自動回滾
     * 
     * **🔄 業務邏輯副作用**（僅當狀態變更時）：
     * - 庫存數量變更：相關商品變體的庫存數量會增加或減少
     * - 庫存異動記錄：會自動生成詳細的庫存交易記錄
     * - 成本計算：可能更新商品變體的平均成本
     * - 狀態日誌：記錄狀態變更的審計日誌
     * 
     * **📊 資料影響範圍**：
     * - `purchases` 表：進貨單主要資訊和狀態
     * - `purchase_items` 表：進貨項目詳細資訊
     * - `inventories` 表：相關商品變體的庫存數量（狀態變更時）
     * - `inventory_transactions` 表：庫存異動記錄（狀態變更時）
     * - `product_variants` 表：平均成本更新（狀態變更時）
     * 
     * **🔒 事務保證**：
     * - 所有資料變更在同一資料庫事務中執行
     * - 任何步驟失敗都會導致完整回滾
     * - 確保資料一致性和完整性
     * 
     * @urlParam purchase integer required 進貨單ID。 Example: 1
     * @bodyParam store_id integer 門市ID Example: 1
     * @bodyParam order_number string 進貨單號 Example: PO-20240101-001
     * @bodyParam purchased_at string 進貨日期 Example: 2024-01-01T10:00:00+08:00
     * @bodyParam shipping_cost number 總運費成本 Example: 150.00
     * @bodyParam status string 進貨單狀態。可選值：pending,confirmed,in_transit,received,partially_received,completed,cancelled Example: confirmed
     * @bodyParam items object[] 進貨項目列表 
     * @bodyParam items[].product_variant_id integer 商品變體ID Example: 1
     * @bodyParam items[].quantity integer 數量 Example: 10
     * @bodyParam items[].cost_price number 成本價格 Example: 150.00
     * 
     * @response 200 scenario="成功更新進貨單" {
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250101-001",
     *     "status": "confirmed",
     *     "total_amount": 1500,
     *     "shipping_cost": 150,
     *     "purchased_at": "2025-01-01T10:00:00.000000Z",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T12:30:00.000000Z",
     *     "store": {...},
     *     "items": [...]
     *   }
     * }
     * 
     * @response 422 scenario="進貨單無法修改" {
     *   "message": "進貨單狀態為已取消，無法修改"
     * }
     * 
     * @response 422 scenario="狀態轉換不合法" {
     *   "message": "無法從已取消轉換到已完成"
     * }
     * 
     * @apiResource \App\Http\Resources\Api\PurchaseResource
     * @apiResourceModel \App\Models\Purchase
     */
    public function update(PurchaseData $purchaseData, Purchase $purchase, PurchaseService $purchaseService)
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理

        if (!$purchase->canBeModified()) {
            return response()->json(['message' => "進貨單狀態為 {$purchase->status_description}，無法修改"], 422);
        }

        try {
            $updatedPurchase = $purchaseService->updatePurchase($purchase, $purchaseData);
            return new PurchaseResource($updatedPurchase);
            
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('進貨單更新失敗', [
                'purchase_id' => $purchase->id,
                'update_data' => $purchaseData->toArray(),
                'current_status' => $purchase->status,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['message' => '進貨單更新失敗，請稍後再試'], 500);
        }
    }

    /**
     * Update the status of the specified purchase.
     * 
     * @group 進貨管理
     * @authenticated
     * @summary 更新進貨單狀態
     * @description 更新指定進貨單的狀態，執行完整的業務邏輯驗證和處理。
     * 
     * **⚠️ 重要說明**：
     * - 此操作會觸發複雜的業務邏輯，不僅僅是欄位更新
     * - 狀態更新為「已完成」時會自動執行庫存入庫操作
     * - 狀態從「已完成」變更為其他狀態時會自動回退庫存
     * - 所有操作在資料庫事務中執行，失敗時自動回滾
     * 
     * **🔄 業務邏輯副作用**：
     * - 庫存數量變更：相關商品變體的庫存數量會增加或減少
     * - 庫存異動記錄：會自動生成詳細的庫存交易記錄
     * - 成本計算：可能更新商品變體的平均成本
     * - 狀態日誌：記錄狀態變更的審計日誌
     * 
     * **📊 資料影響範圍**：
     * - `purchases` 表：狀態欄位和更新時間
     * - `inventories` 表：相關商品變體的庫存數量
     * - `inventory_transactions` 表：新增庫存異動記錄
     * - `product_variants` 表：可能更新平均成本
     * - 系統日誌：操作審計記錄
     * 
     * **🔒 事務保證**：
     * - 所有資料變更在同一資料庫事務中執行
     * - 任何步驟失敗都會導致完整回滾
     * - 確保資料一致性和完整性
     * 
     * @urlParam purchase integer required 進貨單ID。 Example: 1
     * @bodyParam status string required 新狀態。可選值：pending,confirmed,in_transit,received,partially_received,completed,cancelled Example: completed
     * 
     * @response 200 scenario="成功更新狀態" {
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250101-001",
     *     "status": "completed",
     *     "total_amount": 1500,
     *     "shipping_cost": 150,
     *     "purchased_at": "2025-01-01T10:00:00.000000Z",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T12:30:00.000000Z",
     *     "store": {...},
     *     "items": [...]
     *   }
     * }
     * 
     * @response 422 scenario="狀態轉換不合法" {
     *   "message": "無法從已取消轉換到已完成"
     * }
     * 
     * @response 422 scenario="庫存操作失敗" {
     *   "message": "庫存入庫失敗：商品變體不存在"
     * }
     * 
     * @response 500 scenario="系統錯誤" {
     *   "message": "狀態更新失敗，請稍後再試"
     * }
     * 
     * @apiResource \App\Http\Resources\Api\PurchaseResource
     * @apiResourceModel \App\Models\Purchase
     */
    public function updateStatus(Purchase $purchase, Request $request, PurchaseService $purchaseService)
    {
        $this->authorize('update', $purchase);

        $request->validate([
            'status' => 'required|in:' . implode(',', array_keys(Purchase::getStatusOptions()))
        ]);

        try {
            $updatedPurchase = $purchaseService->updatePurchaseStatus(
                $purchase, 
                $request->input('status')
            );
            
            return new PurchaseResource($updatedPurchase);
            
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('進貨單狀態更新失敗', [
                'purchase_id' => $purchase->id,
                'requested_status' => $request->input('status'),
                'current_status' => $purchase->status,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['message' => '狀態更新失敗，請稍後再試'], 500);
        }
    }

    /**
     * Cancel the specified purchase.
     * 
     * @group 進貨管理
     * @authenticated
     * @summary 取消進貨單
     * @description 取消指定的進貨單，只有特定狀態的進貨單才能被取消。
     * 
     * @urlParam purchase integer required 進貨單ID。 Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\PurchaseResource
     * @apiResourceModel \App\Models\Purchase
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
     * @summary 刪除進貨單
     * @description 刪除指定的進貨單，只有待處理狀態的進貨單才能被刪除。
     * 
     * @urlParam purchase integer required 進貨單ID。 Example: 1
     * 
     * @response 200 scenario="刪除成功" {"message": "進貨單已刪除"}
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
     * Process partial receipt for a purchase order.
     * 
     * @group 進貨管理
     * @authenticated
     * @summary 部分收貨處理
     * @description 處理進貨單的部分收貨，允許為每個項目指定實際收到的數量，並自動更新庫存和進貨單狀態。
     * 
     * **⚠️ 重要說明**：
     * - 此操作會根據實際收貨情況更新庫存
     * - 只有運輸中或部分收貨狀態的進貨單可以執行此操作
     * - 系統會自動計算進貨單的整體收貨狀態
     * - 所有操作在資料庫事務中執行，失敗時自動回滾
     * 
     * **🔄 業務邏輯副作用**：
     * - 庫存數量變更：根據實際收貨數量增加對應的庫存
     * - 庫存異動記錄：會自動生成詳細的庫存交易記錄
     * - 進貨單狀態更新：自動判斷並更新為部分收貨或已收貨狀態
     * - 成本計算：更新商品變體的平均成本
     * 
     * **📊 資料影響範圍**：
     * - `purchase_items` 表：更新 received_quantity 和 receipt_status
     * - `purchases` 表：可能更新整體狀態
     * - `inventories` 表：增加對應的庫存數量
     * - `inventory_transactions` 表：新增庫存異動記錄
     * - `product_variants` 表：更新平均成本
     * 
     * @urlParam purchase integer required 進貨單ID。 Example: 1
     * @bodyParam items object[] required 收貨項目列表，至少包含一個項目
     * @bodyParam items[].purchase_item_id integer required 進貨項目ID Example: 1
     * @bodyParam items[].received_quantity integer required 實際收到的數量 Example: 8
     * @bodyParam notes string nullable 收貨備註 Example: 部分商品有輕微包裝破損，但不影響使用
     * 
     * @response 200 scenario="部分收貨成功" {
     *   "data": {
     *     "id": 1,
     *     "order_number": "PO-20250101-001",
     *     "status": "partially_received",
     *     "total_amount": 1500,
     *     "shipping_cost": 150,
     *     "purchased_at": "2025-01-01T10:00:00.000000Z",
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-15T14:30:00.000000Z",
     *     "store": {...},
     *     "items": [
     *       {
     *         "id": 1,
     *         "quantity": 10,
     *         "received_quantity": 8,
     *         "receipt_status": "partial",
     *         "receipt_progress": 80.0,
     *         "pending_receipt_quantity": 2,
     *         "product_variant": {...}
     *       }
     *     ]
     *   }
     * }
     * 
     * @response 422 scenario="進貨單狀態不允許收貨" {
     *   "message": "只有運輸中或部分收貨狀態的進貨單才能執行收貨操作"
     * }
     * 
     * @response 422 scenario="收貨數量超過訂購數量" {
     *   "message": "收貨數量不能超過訂購數量"
     * }
     * 
     * @apiResource \App\Http\Resources\Api\PurchaseResource
     * @apiResourceModel \App\Models\Purchase
     */
    public function partialReceipt(Purchase $purchase, PartialReceiptRequest $request, PurchaseService $purchaseService)
    {
        // 權限檢查
        $this->authorize('update', $purchase);

        // 檢查進貨單狀態是否允許收貨
        if (!in_array($purchase->status, ['in_transit', 'partially_received'])) {
            return response()->json([
                'message' => '只有運輸中或部分收貨狀態的進貨單才能執行收貨操作'
            ], 422);
        }

        try {
            $updatedPurchase = $purchaseService->processPartialReceipt(
                $purchase, 
                $request->validated()
            );
            
            return new PurchaseResource($updatedPurchase);
            
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('部分收貨處理失敗', [
                'purchase_id' => $purchase->id,
                'request_data' => $request->validated(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json(['message' => '部分收貨處理失敗，請稍後再試'], 500);
        }
    }

    /**
     * Update the notes of the specified purchase.
     * 
     * @group 進貨管理
     * @authenticated
     * @summary 更新進貨單記事
     * @description 更新指定進貨單的記事內容，用於記錄進貨過程中的特殊情況
     * 
     * @bodyParam notes string required 記事內容 Example: 本批貨物有部分破損，已與供應商協調處理
     * 
     * @response 200 scenario="成功更新記事" {
     *   "id": 1,
     *   "order_number": "PO-20250101-001",
     *   "notes": "本批貨物有部分破損，已與供應商協調處理",
     *   "updated_at": "2025-01-15T14:30:00.000000Z"
     * }
     * 
     * @response 422 scenario="驗證失敗" {
     *   "message": "記事內容不能超過1000個字元"
     * }
     * 
     * @response 403 scenario="無權限" {
     *   "message": "無權限更新此進貨單"
     * }
     * 
     * @apiResource \App\Http\Resources\Api\PurchaseResource
     * @apiResourceModel \App\Models\Purchase
     */
    public function updateNotes(Purchase $purchase, Request $request)
    {
        $this->authorize('update', $purchase);

        $validated = $request->validate([
            'notes' => 'nullable|string|max:1000'
        ]);

        try {
            $purchase->update(['notes' => $validated['notes']]);
            
            Log::info('進貨單記事已更新', [
                'purchase_id' => $purchase->id,
                'user_id' => auth()->id(),
                'notes_length' => strlen($validated['notes'] ?? '')
            ]);

            return new PurchaseResource($purchase->fresh());
            
        } catch (\Exception $e) {
            Log::error('進貨單記事更新失敗', [
                'purchase_id' => $purchase->id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json(['message' => '記事更新失敗，請稍後再試'], 500);
        }
    }
}
