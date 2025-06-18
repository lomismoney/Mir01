<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\InventoryResource;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * @group 庫存管理
 * 
 * 庫存管理相關的 API 端點
 */
class InventoryController extends Controller
{
    /**
     * 取得庫存列表
     * 
     * @queryParam store_id integer 按門市篩選庫存。 Example: 1
     * @queryParam product_variant_id integer 按商品變體篩選庫存。 Example: 1
     * @queryParam low_stock boolean 僅顯示低庫存商品。 Example: true
     * @queryParam search string 搜尋商品名稱或SKU。 Example: T-shirt
     * 
     * @responseFile 200 storage/responses/inventory-index.json
     */
    public function index(Request $request)
    {
        $query = QueryBuilder::for(Inventory::class)
            ->with([
                'productVariant.product',
                'productVariant.attributeValues.attribute',
                'store'
            ])
            ->allowedFilters([
                'store_id',
                'product_variant_id',
            ])
            ->allowedSorts([
                'quantity',
                'created_at',
                'updated_at'
            ])
            ->defaultSort('-updated_at');

        // 低庫存篩選
        if ($request->boolean('low_stock')) {
            $query->whereRaw('quantity <= low_stock_threshold');
        }

        // 搜尋功能
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->whereHas('productVariant', function ($q) use ($search) {
                $q->where('sku', 'like', "%{$search}%")
                  ->orWhereHas('product', function ($q2) use ($search) {
                      $q2->where('name', 'like', "%{$search}%");
                  });
            });
        }

        $inventories = $query->paginate($request->get('per_page', 15));

        return InventoryResource::collection($inventories);
    }

    /**
     * 取得特定庫存詳情
     * 
     * @urlParam id integer required 庫存記錄的 ID。 Example: 1
     * 
     * @response scenario="庫存詳情" {
     *   "data": {
     *     "id": 1,
     *     "product_variant_id": 1,
     *     "store_id": 1,
     *     "quantity": 50,
     *     "low_stock_threshold": 10,
     *     "created_at": "2024-01-01T10:00:00.000000Z",
     *     "updated_at": "2024-01-01T10:00:00.000000Z",
     *     "product_variant": {
     *       "id": 1,
     *       "sku": "T-SHIRT-RED-S",
     *       "price": 299.00,
     *       "cost_price": 150.00,
     *       "average_cost": 165.50,
     *       "profit_margin": 44.65,
     *       "profit_amount": 133.50,
     *       "product": {
     *         "id": 1,
     *         "name": "經典棉質T-shirt",
     *         "description": "100%純棉製作"
     *       }
     *     },
     *     "store": {
     *       "id": 1,
     *       "name": "主門市",
     *       "address": "台北市信義區"
    /**
     * 取得單一庫存項目詳細資訊
     * 
     * @urlParam id integer required 庫存ID。 Example: 1
     * 
     * @responseFile 200 storage/responses/inventory-show.json
     */
    public function show(Inventory $inventory)
    {
        $inventory->load([
            'productVariant.product',
            'productVariant.attributeValues.attribute',
            'store',
            'transactions.user'
        ]);

        return new InventoryResource($inventory);
    }
}
