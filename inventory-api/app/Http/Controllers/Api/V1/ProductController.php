<?php

namespace App\Http\Controllers\Api\V1;

use App\Models\Product;
use App\Data\ProductData;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\ProductResource;
use App\Http\Resources\Api\V1\ProductCollection;
use App\Http\Requests\Api\V1\StoreProductRequest;
use App\Http\Requests\Api\V1\UpdateProductRequest;
use App\Http\Requests\Api\V1\DestroyMultipleProductsRequest;
use App\Filters\V1\SearchFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\LaravelData\DataCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use App\Policies\ProductPolicy;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    /**
     * 建構函式
     * 
     * 控制器初始化，不再使用自動權限檢查，
     * 改為在每個方法中明確進行權限驗證
     */
    public function __construct()
    {
        // 移除自動權限檢查，改為手動檢查以提供更細粒度的控制
    }

    /**
     * 顯示所有商品列表，支援分頁、排序和篩選功能
     * 
     * @group 商品管理
     * @queryParam page integer 頁碼，預設為 1。 Example: 1
     * @queryParam per_page integer 每頁項目數，預設為 15。 Example: 15
     * @queryParam search string 搜尋商品名稱或 SKU。 Example: 椅子
     * @queryParam sort_by string 排序欄位 (name, sku, selling_price, cost_price, created_at)。 Example: selling_price
     * @queryParam sort_order string 排序方向 (asc, desc)，預設為 asc。 Example: desc
     * 
     * @response scenario="商品列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "高階人體工學辦公椅",
     *       "sku": "CHAIR-ERG-001",
     *       "description": "具備可調節腰靠和 4D 扶手，提供全天候舒適支撐。",
     *       "selling_price": 399.99,
     *       "cost_price": 150.00,
     *       "category_id": 1,
     *       "created_at": "2024-01-01T10:00:00.000000Z",
     *       "updated_at": "2024-01-01T10:00:00.000000Z"
     *     },
     *     {
     *       "id": 2,
     *       "name": "無線藍牙滑鼠",
     *       "sku": "MOUSE-BT-002",
     *       "description": "2.4GHz 無線連接，DPI 可調，適合辦公和遊戲。",
     *       "selling_price": 79.99,
     *       "cost_price": 25.00,
     *       "category_id": null,
     *       "created_at": "2024-01-01T11:30:00.000000Z",
     *       "updated_at": "2024-01-01T11:30:00.000000Z"
     *     }
     *   ],
     *   "meta": {
     *     "current_page": 1,
     *     "from": 1,
     *     "last_page": 3,
     *     "per_page": 15,
     *     "to": 2,
     *     "total": 45
     *   },
     *   "links": {
     *     "first": "http://localhost:8000/api/products?page=1",
     *     "last": "http://localhost:8000/api/products?page=3",
     *     "prev": null,
     *     "next": "http://localhost:8000/api/products?page=2"
     *   }
     * }
     */
    public function index(Request $request)
    {
        $query = QueryBuilder::for(Product::class)
            ->allowedFilters([
                'name', 
                'sku',
                // 使用自訂篩選器處理多欄位搜尋
                AllowedFilter::custom('search', new SearchFilter()),
            ])
            ->allowedSorts(['name', 'selling_price', 'created_at']);

        $paginatedProducts = $query->paginate(15);
        
        return new ProductCollection($paginatedProducts);
    }

    /**
     * 建立新商品 (SPU/SKU)
     * @group 商品管理
     * @authenticated
     * @bodyParam name string required SPU 的名稱。 Example: "經典棉質T-shirt"
     * @bodyParam description string SPU 的描述。 Example: "100% 純棉"
     * @bodyParam category_id integer 分類ID。 Example: 1
     * @bodyParam attributes integer[] required 該 SPU 擁有的屬性 ID 陣列。 Example: [1, 2]
     * @bodyParam variants object[] required SKU 變體陣列，至少需要一項。
     * @bodyParam variants.*.sku string required SKU 的唯一編號。 Example: "TSHIRT-RED-S"
     * @bodyParam variants.*.price number required SKU 的價格。 Example: 299.99
     * @bodyParam variants.*.attribute_value_ids integer[] required 組成此 SKU 的屬性值 ID 陣列。 Example: [10, 25]
     * @responseFile status=201 storage/responses/product.show.json
     */
    public function store(StoreProductRequest $request)
    {
        $this->authorize('create', Product::class);
        $validatedData = $request->validated();

        try {
            // 啟動資料庫事務，確保所有操作要麼全部成功，要麼全部失敗
            $product = DB::transaction(function () use ($validatedData) {
                // 1. 建立 SPU (Product)
                $product = Product::create([
                    'name' => $validatedData['name'],
                    'description' => $validatedData['description'],
                    'category_id' => $validatedData['category_id'],
                ]);

                // 2. 關聯 SPU 與其擁有的屬性 (attributes)
                $product->attributes()->attach($validatedData['attributes']);

                // 3. 遍歷並建立每一個 SKU (ProductVariant)
                foreach ($validatedData['variants'] as $variantData) {
                    $variant = $product->variants()->create([
                        'sku' => $variantData['sku'],
                        'price' => $variantData['price'],
                    ]);

                    // 4. 關聯 SKU 與其對應的屬性值 (attribute_values)
                    $variant->attributeValues()->attach($variantData['attribute_value_ids']);

                    // 5. 為每一個 SKU 建立初始庫存記錄
                    $variant->inventory()->create([
                        'quantity' => 0, // 初始庫存預設為 0
                        'low_stock_threshold' => 0,
                    ]);
                }
                
                return $product;
            });

            // 回傳經過完整關聯加載的 SPU 資源
            return new ProductResource($product->load(['variants.attributeValues.attribute', 'variants.inventory']));

        } catch (\Exception $e) {
            // 如果事務中有任何錯誤發生，回傳伺服器錯誤
            return response()->json(['message' => '建立商品時發生錯誤', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * 顯示指定的商品
     * 
     * @group 商品管理
     * @urlParam id integer required 商品的 ID。 Example: 1
     * 
     * @response scenario="商品詳細資料" {
     *   "data": {
     *     "id": 1,
     *     "name": "高階人體工學辦公椅",
     *     "sku": "CHAIR-ERG-001",
     *     "description": "具備可調節腰靠和 4D 扶手。",
     *     "selling_price": 399.99,
     *     "cost_price": 150.00,
     *     "category_id": 1,
     *     "created_at": "2024-01-01T10:00:00.000000Z",
     *     "updated_at": "2024-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function show(Product $product)
    {
        return new ProductResource($product);
    }

    /**
     * 更新指定的商品
     * 
     * @group 商品管理
     * @urlParam id integer required 商品的 ID。 Example: 1
     * @bodyParam name string required 商品的完整名稱。 Example: 高階人體工學辦公椅
     * @bodyParam sku string required 商品的唯一庫存單位編號 (SKU)。 Example: CHAIR-ERG-001
     * @bodyParam description string 商品的詳細描述。 Example: 具備可調節腰靠和 4D 扶手。
     * @bodyParam selling_price number required 商品的銷售價格。 Example: 399.99
     * @bodyParam cost_price number required 商品的成本價格。 Example: 150.00
     * @bodyParam category_id integer 商品所屬分類的 ID。可為空值表示不屬於任何分類。 Example: 1
     * 
     * @response scenario="商品更新成功" {
     *   "data": {
     *     "id": 1,
     *     "name": "高階人體工學辦公椅",
     *     "sku": "CHAIR-ERG-001",
     *     "description": "具備可調節腰靠和 4D 扶手。",
     *     "selling_price": 399.99,
     *     "cost_price": 150.00,
     *     "category_id": 1,
     *     "created_at": "2024-01-01T10:00:00.000000Z",
     *     "updated_at": "2024-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        $this->authorize('update', $product); // 檢查是否有權限更新這個 $product
        
        $product->update($request->validated());
        return new ProductResource($product);
    }

    /**
     * 刪除指定的商品
     * 
     * @group 商品管理
     * @urlParam id integer required 商品的 ID。 Example: 1
     * 
     * @response 204 scenario="商品刪除成功"
     */
    public function destroy(Product $product)
    {
        $this->authorize('delete', $product); // 檢查是否有權限刪除這個 $product
        
        $product->delete();
        return response()->noContent();
    }

    /**
     * 批量刪除商品
     *
     * 根據提供的商品 ID 陣列批量刪除商品。
     * @group 商品管理
     * @authenticated
     * @bodyParam ids integer[] required 要刪除的商品 ID 陣列。 Example: [1, 2, 3]
     * @response 204
     */
    public function destroyMultiple(DestroyMultipleProductsRequest $request)
    {
        $this->authorize('deleteMultiple', Product::class); // 檢查是否有'批量刪除'權限
        
        $productIds = $request->validated()['ids']; // 使用 'ids'
        
        Product::destroy($productIds);
        
        return response()->noContent();
    }
}
