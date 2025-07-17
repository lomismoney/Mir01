<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryTransferRequest;
use App\Http\Resources\Api\InventoryTransferResource;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransfer;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * @group 庫存轉移
 * @authenticated
 *
 * 庫存轉移 API 端點，用於在不同門市之間轉移庫存
 */
class InventoryTransferController extends Controller
{
    public function __construct()
    {
        // 授權中間件已在 api.php 路由中定義
    }

    /**
     * 獲取庫存轉移記錄列表
     * 
     * @summary 獲取庫存轉移列表
     * @queryParam from_store_id integer 來源門市ID. Example: 1
     * @queryParam to_store_id integer 目標門市ID. Example: 2
     * @queryParam status string 轉移狀態. Example: completed
     * @queryParam start_date string 起始日期 (格式: Y-m-d). Example: 2023-01-01
     * @queryParam end_date string 結束日期 (格式: Y-m-d). Example: 2023-12-31
     * @queryParam product_name string 按商品名稱搜尋. Example: T恤
     * @queryParam per_page integer 每頁項目數，預設 15
     * 
     * @apiResourceCollection \App\Http\Resources\Api\InventoryTransferResource
     * @apiResourceModel \App\Models\InventoryTransfer
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', InventoryTransfer::class);
        
        $query = InventoryTransfer::with([
            'fromStore', 
            'toStore', 
            'user',
            'productVariant.product',
            'productVariant.attributeValues.attribute',
        ]);
        
        // 按門市篩選
        if ($request->has('from_store_id')) {
            $query->where('from_store_id', $request->from_store_id);
        }
        
        if ($request->has('to_store_id')) {
            $query->where('to_store_id', $request->to_store_id);
        }
        
        // 按狀態篩選
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        // 按日期範圍篩選
        if ($request->filled(['start_date', 'end_date'])) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }
        
        // 按商品名稱搜尋
        if ($request->filled('product_name')) {
            $query->whereHas('productVariant.product', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->product_name . '%');
            });
        }
        
        // 應用排序和分頁
        $perPage = $request->input('per_page', 15);
        $transfers = $query->latest()->paginate($perPage);
        
        return InventoryTransferResource::collection($transfers);
    }

    /**
     * 獲取單筆庫存轉移記錄
     * 
     * @summary 獲取庫存轉移詳情
     * @urlParam transfer integer required 庫存轉移記錄的ID。 Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\InventoryTransferResource
     * @apiResourceModel \App\Models\InventoryTransfer
     */
    public function show(int $transfer): InventoryTransferResource
    {
        $transferModel = InventoryTransfer::with([
            'fromStore', 
            'toStore', 
            'user',
            'productVariant.product',
            'productVariant.attributeValues.attribute',
        ])->findOrFail($transfer);
        
        $this->authorize('view', $transferModel);
        
        return new InventoryTransferResource($transferModel);
    }

    /**
     * 創建庫存轉移記錄並執行轉移
     * 
     * @summary 創建庫存轉移
     * @apiResource \App\Http\Resources\Api\InventoryTransferResource
     * @apiResourceModel \App\Models\InventoryTransfer
     */
    public function store(InventoryTransferRequest $request): InventoryTransferResource
    {
        $this->authorize('create', InventoryTransfer::class);
        
        return DB::transaction(function () use ($request) {
            $user = Auth::user();
            $fromStoreId = $request->from_store_id;
            $toStoreId = $request->to_store_id;
            $productVariantId = $request->product_variant_id;
            $quantity = $request->quantity;
            $notes = $request->notes;
            $status = $request->status ?? InventoryTransfer::STATUS_COMPLETED;
            
            // 檢查來源門市是否有足夠的庫存
            $fromInventory = Inventory::firstOrCreate(
                ['product_variant_id' => $productVariantId, 'store_id' => $fromStoreId],
                ['quantity' => 0, 'low_stock_threshold' => 5]
            );
            
            if ($fromInventory->quantity < $quantity) {
                abort(422, '來源門市庫存不足，無法完成轉移');
            }
            
            // 檢查或創建目標門市的庫存記錄
            $toInventory = Inventory::firstOrCreate(
                ['product_variant_id' => $productVariantId, 'store_id' => $toStoreId],
                ['quantity' => 0, 'low_stock_threshold' => 5]
            );
            
            // 創建庫存轉移記錄
            $transfer = InventoryTransfer::create([
                'from_store_id' => $fromStoreId,
                'to_store_id' => $toStoreId,
                'user_id' => $user->id,
                'product_variant_id' => $productVariantId,
                'quantity' => $quantity,
                'status' => $status,
                'notes' => $notes,
                'order_id' => $request->order_id ?? null,
            ]);
            
            // 轉移元數據
            $transferMetadata = ['transfer_id' => $transfer->id];
            
            // 執行庫存轉移
            if ($status === InventoryTransfer::STATUS_COMPLETED) {
                // 減少來源門市庫存
                if (!$fromInventory->reduceStock($quantity, $user->id, "轉出至門市 #{$toStoreId}: {$notes}", $transferMetadata)) {
                    abort(500, '減少來源門市庫存失敗');
                }
                
                // 增加目標門市庫存
                if (!$toInventory->addStock($quantity, $user->id, "轉入自門市 #{$fromStoreId}: {$notes}", $transferMetadata)) {
                    // 如果增加目標門市庫存失敗，需要恢復來源門市庫存
                    $fromInventory->addStock($quantity, $user->id, "庫存轉移失敗後回滾", $transferMetadata);
                    abort(500, '增加目標門市庫存失敗');
                }
                
                // 將庫存交易記錄更新為轉移類型
                $fromTransaction = $fromInventory->transactions()->latest()->first();
                $fromTransaction->update(['type' => InventoryTransaction::TYPE_TRANSFER_OUT]);
                
                $toTransaction = $toInventory->transactions()->latest()->first();
                $toTransaction->update(['type' => InventoryTransaction::TYPE_TRANSFER_IN]);
            }
            
            // 重新加載關聯數據
            $transfer->load([
                'fromStore',
                'toStore',
                'user',
                'productVariant.product'
            ]);
            
            return new InventoryTransferResource($transfer);
        });
    }

    /**
     * 更新庫存轉移記錄狀態
     * 
     * @summary 更新轉移狀態
     * @urlParam transfer integer required 轉移記錄ID. Example: 1
     * @bodyParam status string required 新狀態. Example: completed
     * @bodyParam notes string 備註. Example: 已確認收到貨品
     *
     * @apiResource \App\Http\Resources\Api\InventoryTransferResource
     * @apiResourceModel \App\Models\InventoryTransfer
     */
    public function updateStatus(Request $request, int $transfer): InventoryTransferResource
    {
        $request->validate([
            'status' => ['required', 'string', 'in:pending,in_transit,completed,cancelled'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        
        return DB::transaction(function () use ($request, $transfer) {
            $user = Auth::user();
            $transferModel = InventoryTransfer::findOrFail($transfer);
            
            $this->authorize('update', $transferModel);
            
            $oldStatus = $transferModel->status;
            $newStatus = $request->status;
            
            // 如果狀態沒有變化，直接返回
            if ($oldStatus === $newStatus) {
                return new InventoryTransferResource($transferModel->load(['fromStore', 'toStore', 'user', 'productVariant.product']));
            }
            
            // 如果已經是完成或取消狀態，不允許更改
            if ($oldStatus === InventoryTransfer::STATUS_COMPLETED || $oldStatus === InventoryTransfer::STATUS_CANCELLED) {
                abort(422, '已完成或已取消的轉移記錄不能更改狀態');
            }
            
            // 更新轉移記錄的狀態
            $transferModel->status = $newStatus;
            if ($request->has('notes')) {
                $transferModel->notes = $request->notes;
            }
            $transferModel->save();
            
            try {
                // 處理庫存實際轉移
                if ($newStatus === InventoryTransfer::STATUS_IN_TRANSIT && $oldStatus === InventoryTransfer::STATUS_PENDING) {
                    // 從 pending 轉為 in_transit：只扣減來源門市庫存
                    $this->handleInTransitTransfer($transferModel, $user);
                } elseif ($newStatus === InventoryTransfer::STATUS_COMPLETED) {
                    if ($oldStatus === InventoryTransfer::STATUS_PENDING) {
                        // 從 pending 直接轉為 completed：扣減來源庫存並增加目標庫存
                        $this->handleCompletedTransfer($transferModel, $user);
                    } elseif ($oldStatus === InventoryTransfer::STATUS_IN_TRANSIT) {
                        // 從 in_transit 轉為 completed：只增加目標門市庫存（來源已扣減）
                        $this->handleCompletedFromInTransit($transferModel, $user);
                    }
                }
            } catch (\Exception $e) {
                // 如果庫存操作失敗，回滾狀態
                $transferModel->status = $oldStatus;
                $transferModel->save();
                
                abort(400, $e->getMessage());
            }
            
            // 重新加載關聯數據
            $transferModel->load([
                'fromStore',
                'toStore',
                'user',
                'productVariant.product'
            ]);
            
            return new InventoryTransferResource($transferModel);
        });
    }

    /**
     * 批量建立庫存轉移
     * 
     * @summary 批量建立庫存轉移單
     * 
     * 用於一次建立多筆庫存轉移記錄，主要用於智慧庫存調配。
     * 所有轉移將在一個事務中執行，確保資料一致性。
     * 
     * @bodyParam transfers array required 轉移項目列表
     * @bodyParam transfers.*.from_store_id integer required 來源門市ID. Example: 1
     * @bodyParam transfers.*.to_store_id integer required 目標門市ID. Example: 2
     * @bodyParam transfers.*.product_variant_id integer required 商品變體ID. Example: 5
     * @bodyParam transfers.*.quantity integer required 轉移數量. Example: 10
     * @bodyParam transfers.*.notes string 備註. Example: 訂單庫存調配
     * @bodyParam transfers.*.status string 轉移狀態，預設為 pending. Example: completed
     * @bodyParam order_id integer 關聯的訂單ID. Example: 123
     * 
     * @response 201 scenario="批量建立成功" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "from_store": {"id": 1, "name": "總店"},
     *       "to_store": {"id": 2, "name": "分店"},
     *       "product_variant": {...},
     *       "quantity": 10,
     *       "status": "pending",
     *       "notes": "訂單庫存調配"
     *     }
     *   ],
     *   "message": "成功建立 2 筆庫存轉移單"
     * }
     * 
     * @response 422 scenario="驗證失敗" {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "transfers.0.quantity": ["來源門市庫存不足"]
     *   }
     * }
     */
    public function batchStore(Request $request)
    {
        $this->authorize('create', InventoryTransfer::class);
        
        $validated = $request->validate([
            'transfers' => 'required|array|min:1',
            'transfers.*.from_store_id' => 'required|exists:stores,id',
            'transfers.*.to_store_id' => 'required|exists:stores,id|different:transfers.*.from_store_id',
            'transfers.*.product_variant_id' => 'required|exists:product_variants,id',
            'transfers.*.quantity' => 'required|integer|min:1',
            'transfers.*.notes' => 'nullable|string|max:500',
            'transfers.*.status' => 'nullable|in:pending,completed',
            'order_id' => 'nullable|exists:orders,id'
        ]);
        
        $transfers = DB::transaction(function () use ($validated) {
            $createdTransfers = [];
            $userId = Auth::id();
            $orderId = $validated['order_id'] ?? null;
            
            foreach ($validated['transfers'] as $transferData) {
                // 檢查來源庫存
                $fromInventory = Inventory::where('store_id', $transferData['from_store_id'])
                    ->where('product_variant_id', $transferData['product_variant_id'])
                    ->lockForUpdate()
                    ->first();
                    
                if (!$fromInventory || $fromInventory->quantity < $transferData['quantity']) {
                    $variant = ProductVariant::find($transferData['product_variant_id']);
                    throw new \Exception("商品 {$variant->sku} 在來源門市的庫存不足");
                }
                
                // 建立轉移記錄
                $transfer = InventoryTransfer::create([
                    'from_store_id' => $transferData['from_store_id'],
                    'to_store_id' => $transferData['to_store_id'],
                    'user_id' => $userId,
                    'product_variant_id' => $transferData['product_variant_id'],
                    'quantity' => $transferData['quantity'],
                    'status' => $transferData['status'] ?? 'pending',
                    'notes' => $transferData['notes'] ?? ($orderId ? "訂單 #{$orderId} 庫存調配" : null),
                    'order_id' => $orderId
                ]);
                
                // 如果狀態是 completed，立即執行轉移
                if ($transfer->status === 'completed') {
                    $this->executeTransfer($transfer, $fromInventory);
                }
                
                $createdTransfers[] = $transfer;
            }
            
            return $createdTransfers;
        });
        
        // 載入關聯資料
        $transfers = InventoryTransfer::with(['fromStore', 'toStore', 'user', 'productVariant.product'])
            ->whereIn('id', collect($transfers)->pluck('id'))
            ->get();
        
        return response()->json([
            'data' => InventoryTransferResource::collection($transfers),
            'message' => sprintf('成功建立 %d 筆庫存轉移單', count($transfers))
        ], 201);
    }
    
    /**
     * 執行庫存轉移（內部方法）
     */
    private function executeTransfer(InventoryTransfer $transfer, Inventory $fromInventory)
    {
        // 扣減來源庫存
        $fromInventory->decrement('quantity', $transfer->quantity);
        
        // 記錄來源交易
        InventoryTransaction::create([
            'inventory_id' => $fromInventory->id,
            'type' => 'transfer_out',
            'quantity' => -$transfer->quantity,
            'reference_type' => InventoryTransfer::class,
            'reference_id' => $transfer->id,
            'user_id' => $transfer->user_id,
            'description' => "轉移至 {$transfer->toStore->name}",
            'metadata' => ['transfer_id' => $transfer->id]
        ]);
        
        // 增加目標庫存
        $toInventory = Inventory::firstOrCreate(
            [
                'store_id' => $transfer->to_store_id,
                'product_variant_id' => $transfer->product_variant_id
            ],
            ['quantity' => 0]
        );
        
        $toInventory->increment('quantity', $transfer->quantity);
        
        // 記錄目標交易
        InventoryTransaction::create([
            'inventory_id' => $toInventory->id,
            'type' => 'transfer_in',
            'quantity' => $transfer->quantity,
            'reference_type' => InventoryTransfer::class,
            'reference_id' => $transfer->id,
            'user_id' => $transfer->user_id,
            'description' => "從 {$transfer->fromStore->name} 轉入",
            'metadata' => ['transfer_id' => $transfer->id]
        ]);
    }

    /**
     * 取消庫存轉移
     * 
     * @summary 取消庫存轉移
     * @urlParam transfer integer required 轉移記錄ID. Example: 1
     * @bodyParam reason string required 取消原因. Example: 商品損壞，不需要轉移
     * 
     * @apiResource \App\Http\Resources\Api\InventoryTransferResource
     * @apiResourceModel \App\Models\InventoryTransfer
     */
    public function cancel(Request $request, int $transfer): InventoryTransferResource
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);
        
        return DB::transaction(function () use ($request, $transfer) {
            $transferModel = InventoryTransfer::findOrFail($transfer);
            
            $this->authorize('cancel', $transferModel);
            
            // 如果已經是完成或取消狀態，不允許再取消
            if ($transferModel->status === InventoryTransfer::STATUS_COMPLETED || $transferModel->status === InventoryTransfer::STATUS_CANCELLED) {
                abort(422, '已完成或已取消的轉移記錄不能再次取消');
            }
            
            $oldStatus = $transferModel->status;
            
            // 如果是 in_transit 狀態，需要恢復來源門市庫存
            if ($oldStatus === InventoryTransfer::STATUS_IN_TRANSIT) {
                try {
                    $this->restoreInventoryFromInTransit($transferModel, Auth::user(), $request->reason);
                } catch (\Exception $e) {
                    abort(400, '取消轉移失敗：' . $e->getMessage());
                }
            }
            
            // 更新轉移記錄為已取消
            $transferModel->status = InventoryTransfer::STATUS_CANCELLED;
            $transferModel->notes = "已取消。原因：{$request->reason}" . ($transferModel->notes ? "\n原始備註：{$transferModel->notes}" : '');
            $transferModel->save();
            
            // 重新加載關聯數據
            $transferModel->load([
                'fromStore',
                'toStore',
                'user',
                'productVariant.product'
            ]);
            
            return new InventoryTransferResource($transferModel);
        });
    }
    
    /**
     * 處理轉移狀態變更為運輸中時的庫存扣減
     */
    private function handleInTransitTransfer(InventoryTransfer $transfer, $user): void
    {
        $fromInventory = Inventory::firstOrCreate(
            ['product_variant_id' => $transfer->product_variant_id, 'store_id' => $transfer->from_store_id],
            ['quantity' => 0, 'low_stock_threshold' => 5]
        );
        
        // 檢查來源庫存是否足夠
        if ($fromInventory->quantity < $transfer->quantity) {
            throw new \Exception('來源門市庫存不足，無法開始轉移');
        }
        
        // 轉移元數據
        $transferMetadata = ['transfer_id' => $transfer->id];
        
        // 減少來源門市庫存
        if (!$fromInventory->reduceStock($transfer->quantity, $user->id, "轉移至門市 #{$transfer->to_store_id} - 運輸中", $transferMetadata)) {
            throw new \Exception('減少來源門市庫存失敗');
        }
        
        // 將庫存交易記錄更新為轉移類型
        $fromTransaction = $fromInventory->transactions()->latest()->first();
        $fromTransaction->update(['type' => InventoryTransaction::TYPE_TRANSFER_OUT]);
    }
    
    /**
     * 處理從 pending 直接轉為 completed 的完整轉移
     */
    private function handleCompletedTransfer(InventoryTransfer $transfer, $user): void
    {
        $fromInventory = Inventory::firstOrCreate(
            ['product_variant_id' => $transfer->product_variant_id, 'store_id' => $transfer->from_store_id],
            ['quantity' => 0, 'low_stock_threshold' => 5]
        );
        
        $toInventory = Inventory::firstOrCreate(
            ['product_variant_id' => $transfer->product_variant_id, 'store_id' => $transfer->to_store_id],
            ['quantity' => 0, 'low_stock_threshold' => 5]
        );
        
        // 檢查來源庫存是否足夠
        if ($fromInventory->quantity < $transfer->quantity) {
            throw new \Exception('來源門市庫存不足，轉移狀態更新失敗');
        }
        
        // 轉移元數據
        $transferMetadata = ['transfer_id' => $transfer->id];
        
        // 減少來源門市庫存
        if (!$fromInventory->reduceStock($transfer->quantity, $user->id, "轉出至門市 #{$transfer->to_store_id}", $transferMetadata)) {
            throw new \Exception('減少來源門市庫存失敗');
        }
        
        // 增加目標門市庫存
        if (!$toInventory->addStock($transfer->quantity, $user->id, "轉入自門市 #{$transfer->from_store_id}", $transferMetadata)) {
            // 如果增加目標門市庫存失敗，需要恢復來源門市庫存
            $fromInventory->addStock($transfer->quantity, $user->id, "庫存轉移失敗後回滾", $transferMetadata);
            throw new \Exception('增加目標門市庫存失敗');
        }
        
        // 將庫存交易記錄更新為轉移類型
        $fromTransaction = $fromInventory->transactions()->latest()->first();
        $fromTransaction->update(['type' => InventoryTransaction::TYPE_TRANSFER_OUT]);
        
        $toTransaction = $toInventory->transactions()->latest()->first();
        $toTransaction->update(['type' => InventoryTransaction::TYPE_TRANSFER_IN]);
    }
    
    /**
     * 處理從 in_transit 轉為 completed 的轉移完成
     */
    private function handleCompletedFromInTransit(InventoryTransfer $transfer, $user): void
    {
        $toInventory = Inventory::firstOrCreate(
            ['product_variant_id' => $transfer->product_variant_id, 'store_id' => $transfer->to_store_id],
            ['quantity' => 0, 'low_stock_threshold' => 5]
        );
        
        // 轉移元數據
        $transferMetadata = ['transfer_id' => $transfer->id];
        
        // 增加目標門市庫存（來源門市在 in_transit 時已扣減）
        if (!$toInventory->addStock($transfer->quantity, $user->id, "轉入自門市 #{$transfer->from_store_id}", $transferMetadata)) {
            throw new \Exception('增加目標門市庫存失敗');
        }
        
        // 將庫存交易記錄更新為轉移類型
        $toTransaction = $toInventory->transactions()->latest()->first();
        $toTransaction->update(['type' => InventoryTransaction::TYPE_TRANSFER_IN]);
    }
    
    /**
     * 恢復因取消 in_transit 轉移而需要回滾的庫存
     */
    private function restoreInventoryFromInTransit(InventoryTransfer $transfer, $user, string $reason): void
    {
        $fromInventory = Inventory::firstOrCreate(
            ['product_variant_id' => $transfer->product_variant_id, 'store_id' => $transfer->from_store_id],
            ['quantity' => 0, 'low_stock_threshold' => 5]
        );
        
        // 轉移元數據
        $transferMetadata = ['transfer_id' => $transfer->id];
        
        // 恢復來源門市庫存
        if (!$fromInventory->addStock($transfer->quantity, $user->id, "取消轉移恢復庫存：{$reason}", $transferMetadata)) {
            throw new \Exception('恢復來源門市庫存失敗');
        }
        
        // 建立取消轉移的交易記錄
        $transaction = $fromInventory->transactions()->latest()->first();
        $transaction->update(['type' => InventoryTransaction::TYPE_TRANSFER_CANCEL]);
    }
}
