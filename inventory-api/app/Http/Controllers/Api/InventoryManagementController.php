<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryAdjustmentRequest;
use App\Http\Resources\Api\InventoryResource;
use App\Models\Inventory;
use App\Models\ProductVariant;
use App\Models\Store;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * @group 庫存管理
 *
 * 庫存管理 API 端點，用於管理商品庫存
 */
class InventoryManagementController extends Controller
{
    /**
     * 獲取庫存列表
     * 
     * @queryParam store_id integer 門市ID，用於篩選特定門市的庫存. Example: 1
     * @queryParam low_stock boolean 是否只顯示低庫存商品. Example: true
     * @queryParam out_of_stock boolean 是否只顯示無庫存商品. Example: false
     * @queryParam product_name string 按商品名稱搜尋. Example: T恤
     * @queryParam paginate boolean 是否分頁. Example: true
     * @queryParam per_page integer 每頁顯示數量，預設15. Example: 25
     * 
     * @authenticated
     * @responseFile storage/responses/inventory_management.index.json
     * 
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Inventory::with([
            'productVariant.product',
            'productVariant.attributeValues.attribute',
            'store'
        ]);
        
        // 按門市篩選
        if ($request->has('store_id')) {
            $query->where('store_id', $request->store_id);
        }
        
        // 按庫存狀態篩選
        if ($request->boolean('low_stock')) {
            $query->lowStock();
        } elseif ($request->boolean('out_of_stock')) {
            $query->outOfStock();
        }
        
        // 按商品名稱搜尋
        if ($request->filled('product_name')) {
            $query->whereHas('productVariant.product', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->product_name . '%');
            });
        }
        
        // 應用排序
        $query->orderBy('updated_at', 'desc');
        
        // 應用分頁或獲取所有
        if ($request->boolean('paginate', true)) {
            $perPage = $request->input('per_page', 15);
            $inventories = $query->paginate($perPage);
        } else {
            $inventories = $query->get();
        }
        
        return InventoryResource::collection($inventories);
    }

    /**
     * 獲取單條庫存記錄詳情
     * 
     * @authenticated
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $inventory = Inventory::with([
            'productVariant.product', 
            'productVariant.attributeValues.attribute',
            'store',
            'transactions' => function($query) {
                $query->latest()->limit(10);
            },
            'transactions.user'
        ])->findOrFail($id);
        
        return response()->json($inventory);
    }

    /**
     * 調整庫存
     * 
     * @bodyParam product_variant_id integer required 商品變體ID. Example: 1
     * @bodyParam store_id integer required 門市ID. Example: 1
     * @bodyParam action string required 操作類型 (add: 添加, reduce: 減少, set: 設定). Example: add
     * @bodyParam quantity integer required 數量. Example: 10
     * @bodyParam notes string 備註. Example: 週末促銷活動增加庫存
     * 
     * @authenticated
     * 
     * @param InventoryAdjustmentRequest $request
     * @return JsonResponse
     */
    public function adjust(InventoryAdjustmentRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $user = Auth::user();
            $productVariantId = $request->product_variant_id;
            $storeId = $request->store_id;
            $action = $request->action;
            $quantity = $request->quantity;
            $notes = $request->notes;
            $metadata = $request->metadata ?? [];
            
            // 檢查商品和門市是否存在
            $productVariant = ProductVariant::findOrFail($productVariantId);
            $store = Store::findOrFail($storeId);
            
            // 獲取或創建庫存記錄
            $inventory = Inventory::firstOrCreate(
                ['product_variant_id' => $productVariantId, 'store_id' => $storeId],
                ['quantity' => 0, 'low_stock_threshold' => 5]
            );
            
            $result = false;
            
            // 根據操作類型執行庫存調整
            switch ($action) {
                case 'add':
                    $result = $inventory->addStock($quantity, $user->id, $notes, $metadata);
                    break;
                case 'reduce':
                    $result = $inventory->reduceStock($quantity, $user->id, $notes, $metadata);
                    break;
                case 'set':
                    $result = $inventory->setStock($quantity, $user->id, $notes, $metadata);
                    break;
            }
            
            if (!$result) {
                return response()->json([
                    'message' => '庫存調整失敗，請檢查操作是否有效',
                ], 400);
            }
            
            // 重新加載最新庫存狀態和交易記錄
            $inventory->load([
                'productVariant.product',
                'store',
                'transactions' => function($query) {
                    $query->latest()->first();
                },
                'transactions.user'
            ]);
            
            return response()->json([
                'message' => '庫存調整成功',
                'inventory' => $inventory
            ]);
        });
    }

    /**
     * 獲取庫存交易歷史
     * 
     * @urlParam id integer required 庫存ID. Example: 1
     * @queryParam start_date date 起始日期. Example: 2023-01-01
     * @queryParam end_date date 結束日期. Example: 2023-12-31
     * @queryParam type string 交易類型. Example: addition
     * @queryParam per_page integer 每頁顯示數量，預設15. Example: 20
     * 
     * @authenticated
     * 
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function history(Request $request, int $id): JsonResponse
    {
        $inventory = Inventory::findOrFail($id);
        
        $query = $inventory->transactions()->with('user');
        
        // 按日期範圍篩選
        if ($request->filled(['start_date', 'end_date'])) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date]);
        }
        
        // 按交易類型篩選
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }
        
        // 應用排序和分頁
        $perPage = $request->input('per_page', 15);
        $transactions = $query->latest()->paginate($perPage);
        
        return response()->json($transactions);
    }

    /**
     * 批量獲取多個商品變體的庫存情況
     * 
     * @bodyParam product_variant_ids array required 要查詢的商品變體ID數組. Example: [1, 2, 3]
     * @bodyParam store_id integer 門市ID，如果提供則只返回該門市的庫存. Example: 1
     * 
     * @authenticated
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function batchCheck(Request $request): JsonResponse
    {
        $request->validate([
            'product_variant_ids' => 'required|array',
            'product_variant_ids.*' => 'integer|exists:product_variants,id',
            'store_id' => 'sometimes|integer|exists:stores,id',
        ]);
        
        $query = Inventory::whereIn('product_variant_id', $request->product_variant_ids)
            ->with(['productVariant', 'store']);
            
        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }
        
        $inventories = $query->get();
        
        return response()->json($inventories);
    }
}
