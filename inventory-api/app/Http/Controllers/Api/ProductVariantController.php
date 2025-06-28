<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ProductVariantResource;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;

/**

 *
 * 商品變體 API 端點，用於管理商品的各種變體（SKU）
 */
class ProductVariantController extends Controller
{
    /**
     * 獲取商品變體列表
     * 






     * 

     *   "data": [
     *     {
     *       "id": 1,
     *       "sku": "PRODUCT-001",
     *       "price": 299.99,
     *       "product_id": 1,
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ]
     * }
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
}
