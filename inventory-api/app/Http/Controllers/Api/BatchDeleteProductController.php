<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

/**
 * BatchDeleteProductController - 商品批量刪除控制器
 * 
 * 負責處理商品的批量刪除操作：
 * 1. 驗證請求數據和權限
 * 2. 檢查業務約束（如是否有訂單）
 * 3. 清理關聯數據（變體、庫存、屬性關聯等）
 * 4. 執行批量刪除
 * 5. 返回操作結果
 */
class BatchDeleteProductController extends Controller
{
    /**
     * 執行批量刪除商品操作
     * 
     * @param Request $request HTTP 請求
     * @return JsonResponse JSON 響應
     */
    public function __invoke(Request $request): JsonResponse
    {
        try {
            // 1. 驗證請求數據
            $validator = $this->validateRequest($request);
            if ($validator->fails()) {
                return response()->json([
                    'error' => '請求數據驗證失敗',
                    'details' => $validator->errors()
                ], 422);
            }

            $productIds = $request->input('ids');

            // 2. 驗證商品存在性
            $existingProducts = Product::whereIn('id', $productIds)->get();
            if ($existingProducts->count() !== count($productIds)) {
                $missingIds = array_diff($productIds, $existingProducts->pluck('id')->toArray());
                return response()->json([
                    'error' => '部分商品不存在',
                    'missing_ids' => $missingIds
                ], 404);
            }

            // 3. 檢查業務約束
            $constraintCheck = $this->checkBusinessConstraints($productIds);
            if (!$constraintCheck['allowed']) {
                return response()->json([
                    'error' => $constraintCheck['message'],
                    'details' => $constraintCheck['details']
                ], 409);
            }

            // 4. 執行批量刪除
            $result = $this->performBatchDelete($productIds);

            // 5. 記錄操作日誌
            Log::info('Batch delete products completed', [
                'deleted_products' => $result['deleted_products'],
                'deleted_variants' => $result['deleted_variants'],
                'deleted_inventory_records' => $result['deleted_inventory_records'],
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => '批量刪除成功',
                'deleted_products' => $result['deleted_products'],
                'deleted_variants' => $result['deleted_variants'],
                'deleted_inventory_records' => $result['deleted_inventory_records']
            ], 200);

        } catch (Exception $e) {
            Log::error('Batch delete products failed', [
                'error' => $e->getMessage(),
                'product_ids' => $request->input('ids', []),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => '批量刪除失敗',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 驗證請求數據
     * 
     * @param Request $request HTTP 請求
     * @return \Illuminate\Contracts\Validation\Validator 驗證器
     */
    private function validateRequest(Request $request): \Illuminate\Contracts\Validation\Validator
    {
        return Validator::make($request->all(), [
            'ids' => [
                'required',
                'array',
                'min:1',
                'max:100' // 限制單次批量操作數量
            ],
            'ids.*' => [
                'required',
                'integer',
                'min:1'
            ]
        ], [
            'ids.required' => 'IDs 參數不能為空',
            'ids.array' => 'IDs 必須是陣列格式',
            'ids.min' => '至少需要選擇一個商品',
            'ids.max' => '單次最多只能刪除 100 個商品',
            'ids.*.required' => '商品 ID 不能為空',
            'ids.*.integer' => '商品 ID 必須是整數',
            'ids.*.min' => '商品 ID 必須大於 0'
        ]);
    }

    /**
     * 檢查業務約束
     * 
     * @param array $productIds 商品ID陣列
     * @return array 檢查結果
     */
    private function checkBusinessConstraints(array $productIds): array
    {
        // 檢查是否有關聯的訂單項目
        $productsWithOrders = Product::whereIn('id', $productIds)
            ->whereHas('variants.orderItems')
            ->with(['variants' => function ($query) {
                $query->whereHas('orderItems');
            }])
            ->get();

        if ($productsWithOrders->isNotEmpty()) {
            $productNames = $productsWithOrders->pluck('name')->toArray();
            return [
                'allowed' => false,
                'message' => '部分商品有關聯的訂單記錄，無法刪除',
                'details' => [
                    'products_with_orders' => $productNames,
                    'suggestion' => '請先處理相關訂單或取消訂單後再執行刪除操作'
                ]
            ];
        }

        // 檢查是否有關聯的進貨記錄
        $productsWithPurchases = Product::whereIn('id', $productIds)
            ->whereHas('variants.purchaseItems')
            ->with(['variants' => function ($query) {
                $query->whereHas('purchaseItems');
            }])
            ->get();

        if ($productsWithPurchases->isNotEmpty()) {
            $productNames = $productsWithPurchases->pluck('name')->toArray();
            Log::warning('Products with purchase records being deleted', [
                'product_names' => $productNames,
                'user_id' => auth()->id()
            ]);
            // 進貨記錄不阻止刪除，但會記錄警告
        }

        return [
            'allowed' => true,
            'message' => '檢查通過，可以執行刪除操作'
        ];
    }

    /**
     * 執行批量刪除操作
     * 
     * @param array $productIds 商品ID陣列
     * @return array 刪除結果統計
     */
    private function performBatchDelete(array $productIds): array
    {
        return DB::transaction(function () use ($productIds) {
            $deletedProducts = 0;
            $deletedVariants = 0;
            $deletedInventoryRecords = 0;

            foreach ($productIds as $productId) {
                $result = $this->deleteSingleProduct($productId);
                $deletedProducts += $result['deleted_products'];
                $deletedVariants += $result['deleted_variants'];
                $deletedInventoryRecords += $result['deleted_inventory_records'];
            }

            return [
                'deleted_products' => $deletedProducts,
                'deleted_variants' => $deletedVariants,
                'deleted_inventory_records' => $deletedInventoryRecords
            ];
        });
    }

    /**
     * 刪除單個商品及其關聯數據
     * 
     * @param int $productId 商品ID
     * @return array 刪除結果統計
     */
    private function deleteSingleProduct(int $productId): array
    {
        $product = Product::find($productId);
        if (!$product) {
            return [
                'deleted_products' => 0,
                'deleted_variants' => 0,
                'deleted_inventory_records' => 0
            ];
        }

        // 1. 獲取所有變體ID
        $variantIds = $product->variants()->pluck('id')->toArray();

        // 2. 刪除庫存記錄
        $deletedInventoryRecords = DB::table('inventories')
            ->whereIn('product_variant_id', $variantIds)
            ->delete();

        // 3. 刪除變體的屬性值關聯
        DB::table('attribute_value_product_variant')
            ->whereIn('product_variant_id', $variantIds)
            ->delete();

        // 4. 刪除變體
        $deletedVariants = ProductVariant::whereIn('id', $variantIds)->delete();

        // 5. 刪除商品的屬性關聯
        $product->attributes()->detach();

        // 6. 刪除商品的媒體文件
        $product->clearMediaCollection('images');

        // 7. 刪除商品
        $product->delete();

        return [
            'deleted_products' => 1,
            'deleted_variants' => $deletedVariants,
            'deleted_inventory_records' => $deletedInventoryRecords
        ];
    }
} 