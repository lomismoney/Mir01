<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
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

        return response()->json($variants);
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
}
