<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryAdjustmentRequest;
use App\Http\Resources\Api\InventoryResource;
use App\Http\Resources\Api\ProductResource;
use App\Http\Resources\Api\InventoryTransactionResource;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Store;
use App\Models\InventoryTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * @group 庫存管理
 * @authenticated
 *
 * 庫存管理 API 端點，用於管理商品庫存
 */
class InventoryManagementController extends Controller
{
    /**
     * 獲取庫存列表
     * 
     * @summary 獲取商品庫存列表
     * @description 此端點返回的是商品列表，但每個商品都附帶了其在各門市的庫存資訊。
     * 
     * @queryParam store_id integer 門市ID，用於篩選特定門市的庫存. Example: 1
     * @queryParam low_stock boolean 是否只顯示低庫存商品. Example: true
     * @queryParam out_of_stock boolean 是否只顯示無庫存商品. Example: false
     * @queryParam product_name string 按商品名稱搜尋. Example: T恤
     * @queryParam paginate boolean 是否分頁. Example: true
     * @queryParam per_page integer 每頁顯示數量，預設15. Example: 25
     * 
     * @apiResourceCollection \App\Http\Resources\Api\ProductResource
     * @apiResourceModel \App\Models\Product
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Product::with([
            'category',
            'variants.attributeValues.attribute',
            'variants.inventory' => function ($query) use ($request) {
                $query->whereNotNull('product_variant_id');
                if ($request->has('store_id')) {
                    $query->where('store_id', $request->store_id);
                }
            },
            'variants.inventory.store',
        ]);

        // 只查詢有庫存記錄的商品
        $query->whereHas('variants.inventory', function ($q) use ($request) {
            $q->whereNotNull('product_variant_id');
        });

        // 按門市篩選 (如果請求中有 store_id，則 inventory 關聯已被限制)
        if ($request->has('store_id')) {
            $query->whereHas('variants.inventory', function ($q) use ($request) {
                $q->where('store_id', $request->store_id);
            });
        }
        
        // 按庫存狀態篩選
        if ($request->boolean('low_stock')) {
            $query->whereHas('variants.inventory', function ($q) {
                $q->lowStock();
            });
        } elseif ($request->boolean('out_of_stock')) {
            $query->whereHas('variants.inventory', function ($q) {
                $q->outOfStock();
            });
        }
        
        // 按商品名稱搜尋
        if ($request->filled('product_name')) {
            $query->where('name', 'like', '%' . $request->product_name . '%');
        }
        
        // 應用排序
        $query->orderBy('updated_at', 'desc');
        
        // 應用分頁或獲取所有
        if ($request->boolean('paginate', true)) {
            $perPage = $request->input('per_page', 15);
            $products = $query->paginate($perPage);
        } else {
            $products = $query->get();
        }
        
        return ProductResource::collection($products);
    }

    /**
     * 獲取單條庫存記錄詳情
     * 
     * @summary 獲取庫存詳情
     * @urlParam id integer required 庫存ID. Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\InventoryResource
     * @apiResourceModel \App\Models\Inventory
     */
    public function show(int $id): InventoryResource
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
        
        return new InventoryResource($inventory);
    }

    /**
     * 調整庫存
     * 
     * @summary 調整庫存數量
     * @description 提供 `add`, `reduce`, `set` 三種操作模式來調整指定門市中特定商品變體的庫存。
     * 
     * @apiResource \App\Http\Resources\Api\InventoryResource
     * @apiResourceModel \App\Models\Inventory
     */
    public function adjust(InventoryAdjustmentRequest $request): InventoryResource
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
                // 使用 HTTP 422 狀態碼表示業務邏輯驗證失敗
                abort(422, '庫存調整失敗，請檢查操作是否有效。');
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
            
            return new InventoryResource($inventory);
        });
    }

    /**
     * 獲取庫存交易歷史
     * 
     * @summary 獲取單個庫存項目的交易歷史
     * @urlParam id integer required 庫存ID. Example: 1
     * @queryParam start_date string 起始日期 (格式: Y-m-d). Example: 2023-01-01
     * @queryParam end_date string 結束日期 (格式: Y-m-d). Example: 2023-12-31
     * @queryParam type string 交易類型. Example: addition
     * @queryParam per_page integer 每頁顯示數量，預設15. Example: 20
     * 
     * @apiResourceCollection \App\Http\Resources\Api\InventoryTransactionResource
     * @apiResourceModel \App\Models\InventoryTransaction
     */
    public function history(Request $request, Inventory $inventory): AnonymousResourceCollection
    {
        $query = $inventory->transactions()->with('user');
        
        // 按日期範圍篩選
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('created_at', [$request->start_date, $request->end_date . ' 23:59:59']);
        } elseif ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        } elseif ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }
        
        // 按交易類型篩選
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        
        // 應用排序和分頁
        $perPage = $request->input('per_page', 15);
        $transactions = $query->latest()->paginate($perPage);
        
        return InventoryTransactionResource::collection($transactions);
    }

    /**
     * 批量獲取多個商品變體的庫存情況
     * 
     * @summary 批量檢查庫存
     * @description 根據提供的商品變體ID列表，批量獲取其庫存資訊。
     * 
     * @bodyParam product_variant_ids array required 要查詢的商品變體ID數組. Example: [1, 2, 3]
     * @bodyParam store_id integer 門市ID，如果提供則只返回該門市的庫存. Example: 1
     * 
     * @apiResourceCollection \App\Http\Resources\Api\InventoryResource
     * @apiResourceModel \App\Models\Inventory
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
        
        // 返回簡化的格式以符合測試期望
        $data = $inventories->map(function($inventory) {
            return [
                'id' => $inventory->id,
                'product_variant_id' => $inventory->product_variant_id,
                'store_id' => $inventory->store_id,
                'quantity' => $inventory->quantity,
                'low_stock_threshold' => $inventory->low_stock_threshold,
                'product_variant' => [
                    'id' => $inventory->productVariant->id,
                    'sku' => $inventory->productVariant->sku,
                ],
                'store' => [
                    'id' => $inventory->store->id,
                    'name' => $inventory->store->name,
                ]
            ];
        });
        
        return response()->json($data);
    }

    /**
     * 獲取特定 SKU 的所有庫存歷史記錄
     * 
     * @summary 獲取 SKU 庫存歷史
     * @description 查詢指定 SKU 在所有門市的庫存變動歷史，支援多種篩選條件。
     * 
     * @urlParam sku string required 商品SKU編號. Example: T001-M-RED
     * @queryParam store_id integer 門市ID，用於篩選特定門市的歷史記錄. Example: 1
     * @queryParam type string 交易類型篩選 (addition, reduction, adjustment, transfer_in, transfer_out, transfer_cancel). Example: transfer_in
     * @queryParam start_date string 起始日期 (格式: Y-m-d). Example: 2023-01-01
     * @queryParam end_date string 結束日期 (格式: Y-m-d). Example: 2023-12-31
     * @queryParam per_page integer 每頁顯示數量，預設20，最大100. Example: 50
     * @queryParam page integer 頁碼. Example: 1
     * 
     * @apiResourceCollection \App\Http\Resources\Api\InventoryTransactionResource
     * @apiResourceModel \App\Models\InventoryTransaction
     */
    public function getSkuHistory(Request $request, string $sku): AnonymousResourceCollection
    {
        $request->validate([
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'type' => ['nullable', 'string', 'in:addition,reduction,adjustment,transfer_in,transfer_out,transfer_cancel'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        // 找到所有該 SKU 的庫存項目
        $inventories = Inventory::with(['store', 'productVariant.product'])
            ->whereHas('productVariant', function($query) use ($sku) {
                $query->where('sku', $sku);
            })
            ->get();

        if ($inventories->isEmpty()) {
            // 當找不到 SKU 時，返回一個空的資源集合，並附帶元數據
            return InventoryTransactionResource::collection(collect())->additional([
                'message' => "找不到 SKU 為 '{$sku}' 的庫存項目",
                'inventories' => []
            ]);
        }

        $inventoryIds = $inventories->pluck('id');

        // 使用Eloquent查詢而不是原始SQL，這樣可以正確地與Resource配合
        $query = InventoryTransaction::with([
            'user',
            'inventory.store',
            'inventory.productVariant.product'
        ])->whereIn('inventory_id', $inventoryIds);

        // 應用篩選條件
        if ($request->filled('store_id')) {
            $query->whereHas('inventory', function ($q) use ($request) {
                $q->where('store_id', $request->store_id);
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }

        // 排序和分頁
        $perPage = $request->input('per_page', 20);
        $transactions = $query->orderBy('created_at', 'desc')
            ->paginate($perPage);

        // 格式化庫存項目資訊
        $inventoryData = $inventories->map(function($inventory) {
            return [
                'id' => $inventory->id,
                'quantity' => $inventory->quantity,
                'low_stock_threshold' => $inventory->low_stock_threshold,
                'store' => [
                    'id' => $inventory->store->id,
                    'name' => $inventory->store->name,
                ],
                'product_variant' => [
                    'sku' => $inventory->productVariant->sku,
                    'product' => [
                        'name' => $inventory->productVariant->product->name,
                    ]
                ]
            ];
        });

        // 使用 Resource Collection 並附加額外資訊
        return InventoryTransactionResource::collection($transactions)
            ->additional([
                'message' => '成功獲取 SKU 歷史記錄',
                'inventories' => $inventoryData
            ]);
    }

    /**
     * 獲取所有庫存交易歷史記錄
     * 
     * @summary 獲取所有庫存交易記錄
     * @queryParam store_id integer 門市ID，用於篩選特定門市的歷史記錄. Example: 1
     * @queryParam type string 交易類型篩選. Example: transfer_in
     * @queryParam start_date string 起始日期 (格式: Y-m-d). Example: 2023-01-01
     * @queryParam end_date string 結束日期 (格式: Y-m-d). Example: 2023-12-31
     * @queryParam product_name string 商品名稱搜尋. Example: T恤
     * @queryParam per_page integer 每頁顯示數量，預設20. Example: 50
     * @queryParam page integer 頁碼. Example: 1
     * 
     * @apiResourceCollection \App\Http\Resources\Api\InventoryTransactionResource
     * @apiResourceModel \App\Models\InventoryTransaction
     */
    public function getAllTransactions(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'store_id' => ['nullable', 'integer', 'exists:stores,id'],
            'type' => ['nullable', 'string', 'in:addition,reduction,adjustment,transfer_in,transfer_out,transfer_cancel'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'product_name' => ['nullable', 'string'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $query = InventoryTransaction::with([
            'user', 
            'inventory.store', 
            'inventory.productVariant.product'
        ]);

        // 應用篩選條件
        if ($request->filled('store_id')) {
            $query->whereHas('inventory', function ($q) use ($request) {
                $q->where('store_id', $request->store_id);
            });
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('start_date')) {
            $query->where('created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('created_at', '<=', $request->end_date . ' 23:59:59');
        }

        if ($request->filled('product_name')) {
            $query->whereHas('inventory.productVariant.product', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->product_name . '%');
            });
        }

        // 排序和分頁
        $perPage = $request->input('per_page', 20);
        $transactions = $query->latest()->paginate($perPage);

        return InventoryTransactionResource::collection($transactions);
    }
}
