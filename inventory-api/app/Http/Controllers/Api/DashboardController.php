<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Inventory;
use App\Models\Purchase;
use App\Models\InventoryTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * @group 儀表板
 * @authenticated
 *
 * 儀表板 API 端點，提供系統統計數據和概覽資訊
 */
class DashboardController extends Controller
{
    /**
     * 獲取儀表板統計數據
     * 
     * @summary 獲取系統整體統計概覽
     * 
     * 提供系統主要指標的統計數據，包含：
     * - 訂單統計（總數、今日、本月、待處理）
     * - 商品統計（總數、低庫存、缺貨、分類數）
     * - 客戶統計（總數、今日新增、本月新增）
     * - 庫存統計（總庫存值、庫存筆數、最近異動）
     * - 進貨統計（本月進貨、待處理進貨）
     * - 營收統計（今日、本月、本年）
     * 
     * @response 200 {
     *   "data": {
     *     "orders": {
     *       "total": 1250,
     *       "today": 12,
     *       "this_month": 89,
     *       "pending": 15,
     *       "completed": 1180,
     *       "revenue_today": 45000.00,
     *       "revenue_this_month": 890000.00,
     *       "revenue_this_year": 5600000.00
     *     },
     *     "products": {
     *       "total": 350,
     *       "low_stock": 23,
     *       "out_of_stock": 5,
     *       "categories": 12,
     *       "variants": 1250
     *     },
     *     "customers": {
     *       "total": 456,
     *       "today": 3,
     *       "this_month": 24,
     *       "companies": 123,
     *       "individuals": 333
     *     },
     *     "inventory": {
     *       "total_value": 2340000.00,
     *       "total_items": 5670,
     *       "recent_transactions": 45,
     *       "low_stock_alerts": 23,
     *       "transfers_pending": 3
     *     },
     *     "purchases": {
     *       "this_month": 12,
     *       "pending": 4,
     *       "total_amount_this_month": 567000.00,
     *       "completed_this_month": 8
     *     },
     *     "recent_activities": [
     *       {
     *         "type": "order",
     *         "message": "新訂單 #ORD-2025-001 已建立",
     *         "time": "2 分鐘前",
     *         "link": "/orders/123"
     *       },
     *       {
     *         "type": "inventory",
     *         "message": "商品 iPhone 15 庫存不足",
     *         "time": "15 分鐘前",
     *         "link": "/inventory/alerts"
     *       }
     *     ]
     *   }
     * }
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            // 獲取日期範圍
            $today = Carbon::today();
            $thisMonth = Carbon::now()->startOfMonth();
            $thisYear = Carbon::now()->startOfYear();

            // 訂單統計
            $orderStats = $this->getOrderStats($today, $thisMonth, $thisYear);
            
            // 商品統計
            $productStats = $this->getProductStats();
            
            // 客戶統計
            $customerStats = $this->getCustomerStats($today, $thisMonth);
            
            // 庫存統計
            $inventoryStats = $this->getInventoryStats();
            
            // 進貨統計
            $purchaseStats = $this->getPurchaseStats($thisMonth);
            
            // 最近活動
            $recentActivities = $this->getRecentActivities();

            return response()->json([
                'data' => [
                    'orders' => $orderStats,
                    'products' => $productStats,
                    'customers' => $customerStats,
                    'inventory' => $inventoryStats,
                    'purchases' => $purchaseStats,
                    'recent_activities' => $recentActivities,
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Dashboard stats error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => '儀表板數據獲取失敗',
                'error' => '服務暫時不可用，請稍後再試'
            ], 500);
        }
    }

    /**
     * 獲取訂單統計數據
     */
    private function getOrderStats(Carbon $today, Carbon $thisMonth, Carbon $thisYear): array
    {
        $orders = Order::query();

        return [
            'total' => $orders->count(),
            'today' => $orders->whereDate('created_at', $today)->count(),
            'this_month' => $orders->where('created_at', '>=', $thisMonth)->count(),
            'pending' => $orders->where('shipping_status', 'pending')->count(),
            'completed' => $orders->where('shipping_status', 'completed')->count(),
            'revenue_today' => (float) $orders->whereDate('created_at', $today)
                ->where('payment_status', 'paid')
                ->sum('total_amount'),
            'revenue_this_month' => (float) $orders->where('created_at', '>=', $thisMonth)
                ->where('payment_status', 'paid')
                ->sum('total_amount'),
            'revenue_this_year' => (float) $orders->where('created_at', '>=', $thisYear)
                ->where('payment_status', 'paid')
                ->sum('total_amount'),
        ];
    }

    /**
     * 獲取商品統計數據
     */
    private function getProductStats(): array
    {
        // 計算低庫存和缺貨商品
        $lowStockCount = Inventory::whereRaw('quantity <= low_stock_threshold')->count();
        $outOfStockCount = Inventory::where('quantity', 0)->count();

        return [
            'total' => Product::count(),
            'low_stock' => $lowStockCount,
            'out_of_stock' => $outOfStockCount,
            'categories' => DB::table('categories')->count(),
            'variants' => DB::table('product_variants')->count(),
        ];
    }

    /**
     * 獲取客戶統計數據
     */
    private function getCustomerStats(Carbon $today, Carbon $thisMonth): array
    {
        $customers = Customer::query();

        return [
            'total' => $customers->count(),
            'today' => $customers->whereDate('created_at', $today)->count(),
            'this_month' => $customers->where('created_at', '>=', $thisMonth)->count(),
            'companies' => $customers->where('type', 'company')->count(),
            'individuals' => $customers->where('type', 'individual')->count(),
        ];
    }

    /**
     * 獲取庫存統計數據
     */
    private function getInventoryStats(): array
    {
        // 計算庫存總值
        $totalValue = DB::table('inventories')
            ->join('product_variants', 'inventories.product_variant_id', '=', 'product_variants.id')
            ->sum(DB::raw('inventories.quantity * COALESCE(product_variants.cost_price, 0)'));

        // 最近7天的庫存異動筆數
        $recentTransactions = InventoryTransaction::where('created_at', '>=', Carbon::now()->subDays(7))->count();

        return [
            'total_value' => (float) $totalValue,
            'total_items' => Inventory::sum('quantity'),
            'recent_transactions' => $recentTransactions,
            'low_stock_alerts' => Inventory::whereRaw('quantity <= low_stock_threshold')->count(),
            'transfers_pending' => DB::table('inventory_transfers')->where('status', 'pending')->count(),
        ];
    }

    /**
     * 獲取進貨統計數據
     */
    private function getPurchaseStats(Carbon $thisMonth): array
    {
        $purchases = Purchase::where('purchased_at', '>=', $thisMonth);

        return [
            'this_month' => $purchases->count(),
            'pending' => Purchase::where('status', 'pending')->count(),
            'total_amount_this_month' => (float) $purchases->sum('total_amount'),
            'completed_this_month' => $purchases->where('status', 'completed')->count(),
        ];
    }

    /**
     * 獲取最近活動
     */
    private function getRecentActivities(): array
    {
        $activities = [];

        // 最近的訂單活動
        $recentOrders = Order::with('customer')
            ->latest()
            ->limit(3)
            ->get();

        foreach ($recentOrders as $order) {
            $activities[] = [
                'type' => 'order',
                'message' => "新訂單 #{$order->order_number} 已建立",
                'time' => $order->created_at->diffForHumans(),
                'link' => "/orders/{$order->id}",
            ];
        }

        // 最近的庫存預警
        $lowStockItems = Inventory::with(['productVariant.product', 'store'])
            ->whereRaw('quantity <= low_stock_threshold')
            ->where('quantity', '>', 0)
            ->orderBy('quantity')
            ->limit(2)
            ->get();

        foreach ($lowStockItems as $item) {
            $productName = $item->productVariant->product->name ?? '未知商品';
            $activities[] = [
                'type' => 'inventory',
                'message' => "商品 {$productName} 庫存不足",
                'time' => $item->updated_at->diffForHumans(),
                'link' => '/inventory/alerts',
            ];
        }

        // 按時間排序
        usort($activities, function ($a, $b) {
            return strtotime($b['time']) - strtotime($a['time']);
        });

        return array_slice($activities, 0, 5);
    }
} 