<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Order;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @group 全局搜索
 * 
 * 跨模塊全局搜索功能
 */
class GlobalSearchController extends Controller
{
    /**
     * 全局搜索
     * 
     * 跨產品、訂單、客戶進行搜索，返回分組結果
     * 
     * @bodyParam query string required 搜索關鍵詞，最少 2 個字符. Example: 測試
     * @bodyParam limit int 每個分類的最大結果數，預設 5. Example: 5
     * 
     * @response {
     *   "products": [
     *     {
     *       "id": 1,
     *       "name": "測試產品",
     *       "sku": "TEST001",
     *       "price": "100.00",
     *       "stock": 50,
     *       "image_url": "http://example.com/image.jpg"
     *     }
     *   ],
     *   "orders": [
     *     {
     *       "id": 1,
     *       "order_number": "ORD001",
     *       "customer_name": "張三",
     *       "total_amount": "1000.00",
     *       "status": "pending",
     *       "created_at": "2024-01-01 10:00:00"
     *     }
     *   ],
     *   "customers": [
     *     {
     *       "id": 1,
     *       "name": "張三",
     *       "phone": "0912345678",
     *       "email": "test@example.com",
     *       "total_orders": 5,
     *       "total_spent": "5000.00"
     *     }
     *   ]
     * }
     */
    public function search(Request $request)
    {
        $validated = $request->validate([
            'query' => 'required|string|min:2',
            'limit' => 'integer|min:1|max:20',
        ]);

        $query = $validated['query'];
        $limit = $validated['limit'] ?? 5;

        // 搜索產品
        $products = Product::query()
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('description', 'LIKE', "%{$query}%")
                  // 搜尋 SKU 需要透過 variants 關聯
                  ->orWhereHas('variants', function ($q) use ($query) {
                      $q->where('sku', 'LIKE', "%{$query}%");
                  });
            })
            ->with(['variants' => function ($q) {
                $q->select('id', 'product_id', 'sku', 'price')
                  ->with(['inventories' => function ($q) {
                      $q->select('id', 'product_variant_id', 'quantity');
                  }]);
            }])
            ->select('id', 'name', 'description')
            ->limit($limit)
            ->get()
            ->map(function ($product) {
                // 使用第一個變體的資訊作為預設值
                $firstVariant = $product->variants->first();
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $firstVariant ? $firstVariant->sku : null,
                    'price' => $firstVariant ? $firstVariant->price : null,
                    'stock' => $product->variants->sum(function ($variant) {
                        // 需要加載庫存關聯才能計算總庫存
                        return $variant->inventories->sum('quantity');
                    }),
                    'image_url' => $product->getImageUrl(),
                ];
            });

        // 搜索訂單
        $orders = Order::query()
            ->where(function ($q) use ($query) {
                $q->where('order_number', 'LIKE', "%{$query}%")
                  ->orWhereHas('customer', function ($q) use ($query) {
                      $q->where('name', 'LIKE', "%{$query}%");
                  });
            })
            ->with('customer:id,name')
            ->select('id', 'order_number', 'customer_id', 'total_amount', 'status', 'created_at')
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'customer_name' => $order->customer->name ?? '未知客戶',
                    'total_amount' => $order->total_amount,
                    'status' => $order->status,
                    'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                ];
            });

        // 搜索客戶
        $customers = Customer::query()
            ->where(function ($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('phone', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%");
            })
            ->withCount('orders')
            ->withSum('orders', 'total_amount')
            ->select('id', 'name', 'phone', 'email')
            ->limit($limit)
            ->get()
            ->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'phone' => $customer->phone,
                    'email' => $customer->email,
                    'total_orders' => $customer->orders_count,
                    'total_spent' => $customer->orders_sum_total_amount ?? '0.00',
                ];
            });

        return response()->json([
            'products' => $products,
            'orders' => $orders,
            'customers' => $customers,
        ]);
    }
}