<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryTransferRequest;
use App\Http\Resources\Api\InventoryTransferResource;
use App\Models\Inventory;
use App\Models\InventoryTransaction;
use App\Models\InventoryTransfer;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * @group 庫存轉移
 *
 * 庫存轉移 API 端點，用於在不同門市之間轉移庫存
 */
class InventoryTransferController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }
    /**
     * 獲取庫存轉移記錄列表
     * 
     * @queryParam from_store_id integer 來源門市ID. Example: 1
     * @queryParam to_store_id integer 目標門市ID. Example: 2
     * @queryParam status string 轉移狀態. Example: completed
     * @queryParam start_date date 起始日期. Example: 2023-01-01
     * @queryParam end_date date 結束日期. Example: 2023-12-31
     * @queryParam product_name string 按商品名稱搜尋. Example: T恤
     * @queryParam per_page integer 每頁顯示數量，預設15. Example: 20
     * 
     * @authenticated
     * @responseFile storage/responses/inventory_transfers.index.json
     * 
     * @param Request $request
     * @return AnonymousResourceCollection
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
     * @authenticated
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $transfer = InventoryTransfer::with([
            'fromStore', 
            'toStore', 
            'user',
            'productVariant.product',
            'productVariant.attributeValues.attribute',
        ])->findOrFail($id);
        
        $this->authorize('view', $transfer);
        
        return response()->json($transfer);
    }

    /**
     * 創建庫存轉移記錄並執行轉移
     * 
     * @bodyParam from_store_id integer required 來源門市ID. Example: 1
     * @bodyParam to_store_id integer required 目標門市ID. Example: 2
     * @bodyParam product_variant_id integer required 商品變體ID. Example: 1
     * @bodyParam quantity integer required 轉移數量. Example: 5
     * @bodyParam notes string 備註. Example: 調配門市庫存
     * @bodyParam status string 狀態，預設為 completed. Example: completed
     * 
     * @authenticated
     * 
     * @param InventoryTransferRequest $request
     * @return JsonResponse
     */
    public function store(InventoryTransferRequest $request): JsonResponse
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
                return response()->json([
                    'message' => '來源門市庫存不足，無法完成轉移',
                ], 400);
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
            ]);
            
            // 轉移元數據
            $transferMetadata = ['transfer_id' => $transfer->id];
            
            // 執行庫存轉移
            if ($status === InventoryTransfer::STATUS_COMPLETED) {
                // 減少來源門市庫存
                if (!$fromInventory->reduceStock($quantity, $user->id, "轉出至門市 #{$toStoreId}: {$notes}", $transferMetadata)) {
                    return response()->json([
                        'message' => '減少來源門市庫存失敗',
                    ], 400);
                }
                
                // 增加目標門市庫存
                if (!$toInventory->addStock($quantity, $user->id, "轉入自門市 #{$fromStoreId}: {$notes}", $transferMetadata)) {
                    // 如果增加目標門市庫存失敗，需要恢復來源門市庫存
                    $fromInventory->addStock($quantity, $user->id, "庫存轉移失敗後回滾", $transferMetadata);
                    return response()->json([
                        'message' => '增加目標門市庫存失敗',
                    ], 400);
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
            
            return response()->json([
                'message' => '庫存轉移成功',
                'transfer' => $transfer
            ], 201);
        });
    }

    /**
     * 更新庫存轉移記錄狀態
     * 
     * @urlParam id integer required 轉移記錄ID. Example: 1
     * @bodyParam status string required 新狀態. Example: completed
     * @bodyParam notes string 備註. Example: 已確認收到貨品
     * 
     * @authenticated
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:pending,in_transit,completed,cancelled'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);
        
        return DB::transaction(function () use ($request, $id) {
            $user = Auth::user();
            $transfer = InventoryTransfer::findOrFail($id);
            
            $this->authorize('update', $transfer);
            
            $oldStatus = $transfer->status;
            $newStatus = $request->status;
            
            // 如果狀態沒有變化，直接返回
            if ($oldStatus === $newStatus) {
                return response()->json(['message' => '狀態未變更']);
            }
            
            // 如果已經是完成或取消狀態，不允許更改
            if ($oldStatus === InventoryTransfer::STATUS_COMPLETED || $oldStatus === InventoryTransfer::STATUS_CANCELLED) {
                return response()->json([
                    'message' => '已完成或已取消的轉移記錄不能更改狀態',
                ], 400);
            }
            
            // 更新轉移記錄的狀態
            $transfer->status = $newStatus;
            if ($request->has('notes')) {
                $transfer->notes = $request->notes;
            }
            $transfer->save();
            
            try {
                // 處理庫存實際轉移
                if ($newStatus === InventoryTransfer::STATUS_IN_TRANSIT && $oldStatus === InventoryTransfer::STATUS_PENDING) {
                    // 從 pending 轉為 in_transit：只扣減來源門市庫存
                    $this->handleInTransitTransfer($transfer, $user);
                } elseif ($newStatus === InventoryTransfer::STATUS_COMPLETED) {
                    if ($oldStatus === InventoryTransfer::STATUS_PENDING) {
                        // 從 pending 直接轉為 completed：扣減來源庫存並增加目標庫存
                        $this->handleCompletedTransfer($transfer, $user);
                    } elseif ($oldStatus === InventoryTransfer::STATUS_IN_TRANSIT) {
                        // 從 in_transit 轉為 completed：只增加目標門市庫存（來源已扣減）
                        $this->handleCompletedFromInTransit($transfer, $user);
                    }
                }
            } catch (\Exception $e) {
                // 如果庫存操作失敗，回滾狀態
                $transfer->status = $oldStatus;
                $transfer->save();
                
                return response()->json([
                    'message' => $e->getMessage(),
                ], 400);
            }
            
            // 重新加載關聯數據
            $transfer->load([
                'fromStore',
                'toStore',
                'user',
                'productVariant.product'
            ]);
            
            return response()->json([
                'message' => '庫存轉移狀態更新成功',
                'transfer' => $transfer
            ]);
        });
    }

    /**
     * 取消庫存轉移
     * 
     * @urlParam id integer required 轉移記錄ID. Example: 1
     * @bodyParam reason string required 取消原因. Example: 商品損壞，不需要轉移
     * 
     * @authenticated
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);
        
        return DB::transaction(function () use ($request, $id) {
            $transfer = InventoryTransfer::findOrFail($id);
            
            $this->authorize('cancel', $transfer);
            
            // 如果已經是完成或取消狀態，不允許再取消
            if ($transfer->status === InventoryTransfer::STATUS_COMPLETED || $transfer->status === InventoryTransfer::STATUS_CANCELLED) {
                return response()->json([
                    'message' => '已完成或已取消的轉移記錄不能再次取消',
                ], 400);
            }
            
            $oldStatus = $transfer->status;
            
            // 如果是 in_transit 狀態，需要恢復來源門市庫存
            if ($oldStatus === InventoryTransfer::STATUS_IN_TRANSIT) {
                try {
                    $this->restoreInventoryFromInTransit($transfer, Auth::user(), $request->reason);
                } catch (\Exception $e) {
                    return response()->json([
                        'message' => '取消轉移失敗：' . $e->getMessage(),
                    ], 400);
                }
            }
            
            // 更新轉移記錄為已取消
            $transfer->status = InventoryTransfer::STATUS_CANCELLED;
            $transfer->notes = "已取消。原因：{$request->reason}" . ($transfer->notes ? "\n原始備註：{$transfer->notes}" : '');
            $transfer->save();
            
            // 重新加載關聯數據
            $transfer->load([
                'fromStore',
                'toStore',
                'user',
                'productVariant.product'
            ]);
            
            return response()->json([
                'message' => '庫存轉移已取消',
                'transfer' => $transfer
            ]);
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
