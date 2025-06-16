<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\UpdateProductVariantRequest;
use App\Http\Resources\Api\ProductVariantResource;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

/**
 * @group 商品變體管理
 *
 * 商品變體 API 端點，用於管理商品的各種變體（SKU）
 */
class ProductVariantController extends Controller
{
    /**
     * 獲取商品變體列表
     * 
     * @queryParam product_id integer 按商品ID篩選變體. Example: 1
     * @queryParam product_name string 按商品名稱搜尋變體. Example: T恤
     * @queryParam sku string 按SKU搜尋變體. Example: TSHIRT-RED-S
     * @queryParam page integer 頁碼，預設為 1. Example: 1
     * @queryParam per_page integer 每頁項目數，預設為 15. Example: 15
     * 
     * @authenticated
     * @responseFile storage/responses/product_variants.index.json
     * 
     * @param Request $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = QueryBuilder::for(ProductVariant::class)
            ->with([
                'product',
                'attributeValues.attribute',
                'inventory.store'
            ])
            ->allowedFilters([
                'product_id',
                'sku',
                AllowedFilter::partial('product_name', 'product.name'),
            ])
            ->orderBy('created_at', 'desc');

        // 應用分頁
        $perPage = $request->input('per_page', 15);
        $variants = $query->paginate($perPage);

        return ProductVariantResource::collection($variants);
    }

    /**
     * 獲取單個商品變體詳情
     * 
     * @authenticated
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $variant = ProductVariant::with([
            'product',
            'attributeValues.attribute',
            'inventory.store'
        ])->findOrFail($id);

        return response()->json($variant);
    }

    /**
     * 更新商品變體資訊
     * 
     * @description
     * 更新指定商品變體的資訊，包含 SKU 編碼、價格、成本、啟用狀態等
     * 
     * @authenticated
     * 
     * @bodyParam sku string 變體的 SKU 編碼，必須是唯一的. Example: TSHIRT-RED-L
     * @bodyParam price numeric required 變體的售價，最多兩位小數. Example: 299.99
     * @bodyParam cost numeric 變體的成本價，最多兩位小數. Example: 150.00
     * @bodyParam stock_alert_threshold integer 庫存預警數量. Example: 10
     * @bodyParam is_active boolean 變體是否啟用. Example: true
     * @bodyParam weight numeric 重量（公克）. Example: 250
     * @bodyParam length numeric 長度（公分）. Example: 30
     * @bodyParam width numeric 寬度（公分）. Example: 20
     * @bodyParam height numeric 高度（公分）. Example: 5
     * 
     * @response 200 {
     *   "id": 1,
     *   "product_id": 1,
     *   "sku": "TSHIRT-RED-L",
     *   "price": "299.99",
     *   "cost": "150.00",
     *   "stock_alert_threshold": 10,
     *   "is_active": true,
     *   "weight": 250,
     *   "length": 30,
     *   "width": 20,
     *   "height": 5,
     *   "created_at": "2024-01-15T10:30:00.000000Z",
     *   "updated_at": "2024-01-15T14:45:00.000000Z",
     *   "product": {...},
     *   "attribute_values": [...],
     *   "inventory": [...]
     * }
     * 
     * @response 404 {
     *   "message": "No query results for model [App\\Models\\ProductVariant] 999"
     * }
     * 
     * @response 422 {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "sku": ["此 SKU 編碼已被使用"],
     *     "price": ["價格為必填欄位"]
     *   }
     * }
     * 
     * @param UpdateProductVariantRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateProductVariantRequest $request, int $id): JsonResponse
    {
        $variant = ProductVariant::findOrFail($id);
        
        // 使用 Policy 進行權限檢查
        $this->authorize('update', $variant);
        
        // 更新變體資料
        $variant->update($request->validated());
        
        // 重新載入關聯資料
        $variant->load([
            'product',
            'attributeValues.attribute',
            'inventory.store'
        ]);
        
        return response()->json($variant);
    }

    /**
     * 刪除商品變體
     * 
     * @description
     * 刪除指定的商品變體。注意：刪除變體會同時刪除相關的庫存記錄。
     * 如果變體有庫存記錄，建議先將變體設為停用狀態而非直接刪除。
     * 
     * @authenticated
     * 
     * @response 200 {
     *   "message": "變體已成功刪除"
     * }
     * 
     * @response 404 {
     *   "message": "No query results for model [App\\Models\\ProductVariant] 999"
     * }
     * 
     * @response 403 {
     *   "message": "This action is unauthorized."
     * }
     * 
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $variant = ProductVariant::findOrFail($id);
        
        // 使用 Policy 進行權限檢查
        $this->authorize('delete', $variant);
        
        // 軟刪除變體（如果模型有使用 SoftDeletes trait）
        // 或直接刪除（根據業務需求決定）
        $variant->delete();
        
        return response()->json([
            'message' => '變體已成功刪除'
        ]);
    }
}
