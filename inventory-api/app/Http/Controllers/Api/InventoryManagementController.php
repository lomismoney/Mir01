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

 *
 * 庫存管理 API 端點，用於管理商品庫存
 */
class InventoryManagementController extends Controller
{
    /**
     * 獲取庫存列表
     * 






     * 

     *   "data": [
     *     {
     *       "id": 1,
     *       "product_variant_id": 1,
     *       "store_id": 1,
     *       "quantity": 100,
     *       "low_stock_threshold": 10,
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ],
     *   "meta": {
     *     "current_page": 1,
     *     "per_page": 15,
     *     "total": 100
     *   }
     * }
     * 
     * @param Request $request
     * @return AnonymousResourceCollection
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





     * 

     *   "current_page": 1,
     *   "data": [
     *     {
     *       "id": 1,
     *       "inventory_id": 1,
     *       "user_id": 1,
     *       "type": "addition",
     *       "quantity": 10,
     *       "before_quantity": 0,
     *       "after_quantity": 10,
     *       "notes": "初始庫存",
     *       "metadata": {},
     *       "created_at": "2023-01-01T10:00:00.000000Z",
     *       "updated_at": "2023-01-01T10:00:00.000000Z",
     *       "user": {
     *         "name": "Admin User"
     *       }
     *     }
     *   ],
     *   "first_page_url": "http://localhost/api/inventory/1/history?page=1",
     *   "from": 1,
     *   "last_page": 1,
     *   "last_page_url": "http://localhost/api/inventory/1/history?page=1",
     *   "per_page": 15,
     *   "to": 1,
     *   "total": 1
     * }
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
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        
        // 應用排序和分頁
        $perPage = $request->input('per_page', 15);
        $transactions = $query->latest()->paginate($perPage);
        
        // 確保即使沒有記錄也返回一個有效的響應結構
        return response()->json($transactions);
    }

    /**
     * 批量獲取多個商品變體的庫存情況
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

    /**
     * 獲取特定 SKU 的所有庫存歷史記錄
     * 
     * 查詢指定 SKU 在所有門市的庫存變動歷史，支援多種篩選條件
 * 
     *   "data": [
     *     {
     *       "id": 1,
     *       "type": "purchase",
     *       "quantity_change": 10,
     *       "quantity_after": 110,
     *       "reference_type": "purchase",
     *       "reference_id": 1,
     *       "created_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ]
     * }
     * 
     * @param Request $request
     * @param string $sku
     * @return JsonResponse
     */
    public function getSkuHistory(Request $request, string $sku): JsonResponse
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
            return response()->json([
                'message' => "找不到 SKU 為 '{$sku}' 的庫存項目",
                'data' => [],
                'inventories' => [],
                'pagination' => [
                    'current_page' => 1,
                    'per_page' => $request->input('per_page', 20),
                    'total' => 0,
                    'last_page' => 1,
                ]
            ]);
        }

        $inventoryIds = $inventories->pluck('id');

        // 建立交易記錄查詢
        $query = DB::table('inventory_transactions')
            ->join('inventories', 'inventory_transactions.inventory_id', '=', 'inventories.id')
            ->join('stores', 'inventories.store_id', '=', 'stores.id')
            ->join('users', 'inventory_transactions.user_id', '=', 'users.id')
            ->join('product_variants', 'inventories.product_variant_id', '=', 'product_variants.id')
            ->join('products', 'product_variants.product_id', '=', 'products.id')
            ->whereIn('inventory_transactions.inventory_id', $inventoryIds)
            ->select([
                'inventory_transactions.*',
                'stores.name as store_name',
                'stores.id as store_id',
                'users.name as user_name',
                'products.name as product_name',
                'product_variants.sku as product_sku'
            ]);

        // 應用篩選條件
        if ($request->filled('store_id')) {
            $query->where('inventories.store_id', $request->store_id);
        }

        if ($request->filled('type')) {
            $query->where('inventory_transactions.type', $request->type);
        }

        if ($request->filled('start_date')) {
            $query->where('inventory_transactions.created_at', '>=', $request->start_date);
        }

        if ($request->filled('end_date')) {
            $query->where('inventory_transactions.created_at', '<=', $request->end_date . ' 23:59:59');
        }

        // 排序和分頁
        $perPage = $request->input('per_page', 20);
        $transactions = $query->orderBy('inventory_transactions.created_at', 'desc')
            ->paginate($perPage);

        // 格式化交易記錄
        $formattedTransactions = $transactions->getCollection()->map(function($transaction) {
            return [
                'id' => $transaction->id,
                'inventory_id' => $transaction->inventory_id,
                'user_id' => $transaction->user_id,
                'type' => $transaction->type,
                'quantity' => $transaction->quantity,
                'before_quantity' => $transaction->before_quantity,
                'after_quantity' => $transaction->after_quantity,
                'notes' => $transaction->notes,
                'metadata' => json_decode($transaction->metadata, true),
                'created_at' => $transaction->created_at,
                'updated_at' => $transaction->updated_at,
                'store' => [
                    'id' => $transaction->store_id,
                    'name' => $transaction->store_name,
                ],
                'user' => [
                    'name' => $transaction->user_name,
                ],
                'product' => [
                    'name' => $transaction->product_name,
                    'sku' => $transaction->product_sku,
                ]
            ];
        });

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

        return response()->json([
            'message' => '成功獲取 SKU 歷史記錄',
            'data' => $formattedTransactions,
            'inventories' => $inventoryData,
            'pagination' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'last_page' => $transactions->lastPage(),
            ]
        ]);
    }

    /**
     * 獲取所有庫存交易歷史記錄
     * 







     * 

     *   "message": "成功獲取庫存交易記錄",
     *   "data": [
     *     {
     *       "id": 1,
     *       "inventory_id": 1,
     *       "user_id": 1,
     *       "type": "addition",
     *       "quantity": 10,
     *       "before_quantity": 0,
     *       "after_quantity": 10,
     *       "notes": "初始庫存",
     *       "metadata": {},
     *       "created_at": "2023-01-01T10:00:00.000000Z",
     *       "updated_at": "2023-01-01T10:00:00.000000Z",
     *       "store": {
     *         "id": 1,
     *         "name": "台中店"
     *       },
     *       "user": {
     *         "name": "Admin User"
     *       },
     *       "product": {
     *         "name": "商品名稱",
     *         "sku": "T001-M-RED"
     *       }
     *     }
     *   ],
     *   "pagination": {
     *     "current_page": 1,
     *     "per_page": 20,
     *     "total": 100,
     *     "last_page": 5
     *   }
     * }
     * 
     * @param Request $request
     * @return JsonResponse
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
