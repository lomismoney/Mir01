<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/**
 * @group 庫存預警
 * @authenticated
 *
 * 庫存預警 API 端點，提供低庫存、缺貨、積壓等預警功能
 */
class InventoryAlertController extends Controller
{
    /**
     * 獲取低庫存預警清單
     * 
     * @summary 獲取低庫存商品清單
     * 
     * 列出所有庫存數量低於或等於預警閾值的商品
     * 
     * @queryParam store_id integer 門市ID，不指定則查詢所有門市. Example: 1
     * @queryParam severity string 嚴重程度：critical(庫存為0)、low(低於閾值)、all(全部). Example: low
     * @queryParam per_page integer 每頁項目數，預設 15
     * 
     * @response {
     *   "data": [
     *     {
     *       "id": 1,
     *       "product_variant_id": 123,
     *       "store_id": 1,
     *       "store_name": "總店",
     *       "product_name": "經典T恤",
     *       "sku": "TS-001-M",
     *       "quantity": 3,
     *       "low_stock_threshold": 10,
     *       "shortage": 7,
     *       "severity": "low",
     *       "last_sale_date": "2025-07-08",
     *       "average_daily_sales": 2.5,
     *       "estimated_days_until_stockout": 1
     *     }
     *   ],
     *   "links": {...},
     *   "meta": {...}
     * }
     */
    public function lowStock(Request $request): JsonResponse
    {
        $request->validate([
            'store_id' => 'nullable|exists:stores,id',
            'severity' => 'nullable|in:critical,low,all',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $query = Inventory::with(['productVariant.product', 'store'])
            ->select('inventories.*')
            ->addSelect(DB::raw('
                CASE 
                    WHEN quantity = 0 THEN "critical"
                    WHEN quantity <= low_stock_threshold THEN "low"
                    ELSE "normal"
                END as severity
            '))
            ->addSelect(DB::raw('
                MAX(0, low_stock_threshold - quantity) as shortage
            '));

        // 按門市篩選
        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        // 按嚴重程度篩選
        $severity = $request->get('severity', 'all');
        if ($severity === 'critical') {
            $query->where('quantity', 0);
        } elseif ($severity === 'low') {
            $query->whereRaw('quantity <= low_stock_threshold');
        } elseif ($severity === 'all') {
            $query->whereRaw('quantity <= low_stock_threshold');
        }

        // 加入銷售統計（最近30天）
        $query->leftJoinSub(
            DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->select('order_items.product_variant_id')
                ->selectRaw('MAX(orders.created_at) as last_sale_date')
                ->selectRaw('SUM(order_items.quantity) / 30.0 as average_daily_sales')
                ->where('orders.created_at', '>=', now()->subDays(30))
                ->where('orders.shipping_status', '!=', 'cancelled')
                ->groupBy('order_items.product_variant_id'),
            'sales_stats',
            'inventories.product_variant_id',
            '=',
            'sales_stats.product_variant_id'
        );

        // 計算預估缺貨天數
        $query->selectRaw('
            CASE 
                WHEN sales_stats.average_daily_sales > 0 
                THEN FLOOR(inventories.quantity / sales_stats.average_daily_sales)
                ELSE NULL
            END as estimated_days_until_stockout
        ');

        // 排序：按嚴重程度和預估缺貨天數
        $query->orderByRaw('
            CASE severity
                WHEN "critical" THEN 1
                WHEN "low" THEN 2
                ELSE 3
            END
        ')
        ->orderBy('estimated_days_until_stockout')
        ->orderBy('shortage', 'desc');

        $perPage = $request->get('per_page', 15);
        $results = $query->paginate($perPage);

        // 格式化輸出
        $results->through(function ($inventory) {
            return [
                'id' => $inventory->id,
                'product_variant_id' => $inventory->product_variant_id,
                'store_id' => $inventory->store_id,
                'store_name' => $inventory->store->name ?? 'N/A',
                'product_name' => $inventory->productVariant->product->name ?? 'N/A',
                'sku' => $inventory->productVariant->sku ?? 'N/A',
                'quantity' => $inventory->quantity,
                'low_stock_threshold' => $inventory->low_stock_threshold,
                'shortage' => (int) $inventory->shortage,
                'severity' => $inventory->severity,
                'last_sale_date' => $inventory->last_sale_date,
                'average_daily_sales' => round((float) $inventory->average_daily_sales, 2),
                'estimated_days_until_stockout' => $inventory->estimated_days_until_stockout,
            ];
        });

        return response()->json($results);
    }

    /**
     * 獲取庫存預警統計摘要
     * 
     * @summary 獲取庫存預警摘要
     * 
     * 提供整體庫存健康狀況的統計資訊
     * 
     * @queryParam store_id integer 門市ID，不指定則統計所有門市. Example: 1
     * 
     * @response {
     *   "data": {
     *     "total_products": 150,
     *     "critical_stock_count": 5,
     *     "low_stock_count": 23,
     *     "normal_stock_count": 122,
     *     "total_inventory_value": 1250000,
     *     "alerts": {
     *       "critical_percentage": 3.33,
     *       "low_percentage": 15.33,
     *       "health_score": 81.34
     *     },
     *     "top_urgent_items": [
     *       {
     *         "product_name": "熱銷商品A",
     *         "sku": "PROD-001",
     *         "quantity": 0,
     *         "average_daily_sales": 5.2
     *       }
     *     ]
     *   }
     * }
     */
    public function summary(Request $request): JsonResponse
    {
        $request->validate([
            'store_id' => 'nullable|exists:stores,id',
        ]);

        $query = Inventory::query();
        
        if ($request->filled('store_id')) {
            $query->where('store_id', $request->store_id);
        }

        // 統計各類庫存數量
        $stats = $query->selectRaw('
            COUNT(*) as total_products,
            SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as critical_stock_count,
            SUM(CASE WHEN quantity > 0 AND quantity <= low_stock_threshold THEN 1 ELSE 0 END) as low_stock_count,
            SUM(CASE WHEN quantity > low_stock_threshold THEN 1 ELSE 0 END) as normal_stock_count
        ')->first();

        // 計算庫存總值
        $inventoryValue = $query->join('product_variants', 'inventories.product_variant_id', '=', 'product_variants.id')
            ->selectRaw('SUM(inventories.quantity * COALESCE(product_variants.cost_price, 0)) as total_value')
            ->first();

        // 獲取最緊急的商品（缺貨但有銷售記錄）
        $urgentItems = Inventory::with(['productVariant.product'])
            ->where('quantity', '<=', 5)
            ->when($request->filled('store_id'), function ($q) use ($request) {
                $q->where('store_id', $request->store_id);
            })
            ->leftJoinSub(
                DB::table('order_items')
                    ->join('orders', 'orders.id', '=', 'order_items.order_id')
                    ->select('order_items.product_variant_id')
                    ->selectRaw('SUM(order_items.quantity) / 30.0 as average_daily_sales')
                    ->where('orders.created_at', '>=', now()->subDays(30))
                    ->where('orders.shipping_status', '!=', 'cancelled')
                    ->groupBy('order_items.product_variant_id'),
                'sales',
                'inventories.product_variant_id',
                '=',
                'sales.product_variant_id'
            )
            ->whereNotNull('sales.average_daily_sales')
            ->orderByRaw('inventories.quantity / sales.average_daily_sales')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                return [
                    'product_name' => $item->productVariant->product->name ?? 'N/A',
                    'sku' => $item->productVariant->sku ?? 'N/A',
                    'quantity' => $item->quantity,
                    'average_daily_sales' => round((float) $item->average_daily_sales, 2),
                ];
            });

        // 計算健康分數（100分制）
        $totalProducts = max(1, $stats->total_products);
        $criticalPercentage = ($stats->critical_stock_count / $totalProducts) * 100;
        $lowPercentage = ($stats->low_stock_count / $totalProducts) * 100;
        $healthScore = 100 - ($criticalPercentage * 2) - $lowPercentage; // 缺貨扣2分，低庫存扣1分

        return response()->json([
            'data' => [
                'total_products' => (int) $stats->total_products,
                'critical_stock_count' => (int) $stats->critical_stock_count,
                'low_stock_count' => (int) $stats->low_stock_count,
                'normal_stock_count' => (int) $stats->normal_stock_count,
                'total_inventory_value' => (float) $inventoryValue->total_value,
                'alerts' => [
                    'critical_percentage' => round($criticalPercentage, 2),
                    'low_percentage' => round($lowPercentage, 2),
                    'health_score' => round(max(0, $healthScore), 2),
                ],
                'top_urgent_items' => $urgentItems,
            ],
        ]);
    }

    /**
     * 更新商品的庫存預警閾值
     * 
     * @summary 批量更新預警閾值
     * 
     * 允許批量更新多個商品的低庫存預警閾值
     * 
     * @bodyParam updates array required 更新項目陣列
     * @bodyParam updates.*.inventory_id integer required 庫存記錄ID. Example: 1
     * @bodyParam updates.*.low_stock_threshold integer required 新的預警閾值. Example: 20
     * 
     * @response {
     *   "message": "成功更新 3 個商品的預警閾值",
     *   "updated_count": 3
     * }
     */
    public function updateThresholds(Request $request): JsonResponse
    {
        $request->validate([
            'updates' => 'required|array|min:1',
            'updates.*.inventory_id' => 'required|exists:inventories,id',
            'updates.*.low_stock_threshold' => 'required|integer|min:0',
        ]);

        $updatedCount = 0;
        
        DB::transaction(function () use ($request, &$updatedCount) {
            foreach ($request->updates as $update) {
                $inventory = Inventory::find($update['inventory_id']);
                
                if ($inventory) {
                    $inventory->low_stock_threshold = $update['low_stock_threshold'];
                    $inventory->save();
                    $updatedCount++;
                }
            }
        });

        return response()->json([
            'message' => "成功更新 {$updatedCount} 個商品的預警閾值",
            'updated_count' => $updatedCount,
        ]);
    }
}