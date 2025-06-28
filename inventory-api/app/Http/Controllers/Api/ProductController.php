<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use App\Data\ProductData;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\ProductResource;
use App\Http\Resources\Api\ProductCollection;
use App\Http\Requests\Api\StoreProductRequest;

use App\Http\Requests\Api\UpdateProductRequest;
use App\Http\Requests\Api\DestroyMultipleProductsRequest;
use App\Filters\SearchFilter;
use Spatie\QueryBuilder\QueryBuilder;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\LaravelData\DataCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use App\Policies\ProductPolicy;
use Illuminate\Support\Facades\DB;
use App\Services\ProductService;
use App\Http\Requests\Api\UploadProductImageRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Access\AuthorizationException;

class ProductController extends Controller
{
    /**
     * 產品服務實例
     * 
     * @var ProductService
     */
    protected $productService;

    /**
     * 建構函式
     * 
     * 控制器初始化，注入 ProductService 依賴
     * 
     * @param ProductService $productService 商品服務
     */
    public function __construct(ProductService $productService)
    {
        $this->productService = $productService;
    }

    /**
     * 顯示所有商品列表，支援分頁、排序和篩選功能
     * 










     * 

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
     *     "first": "http://localhost/api/products?page=1",
     *     "last": "http://localhost/api/products?page=3",
     *     "prev": null,
     *     "next": "http://localhost/api/products?page=2"
     *   }
     * }
     */
    public function index(Request $request)
    {
        $query = QueryBuilder::for(Product::class)
            ->with([
                'category', // ✅ 預先加載分類關聯，根除 N+1 查詢問題
                'attributes', // ✅ 預先加載 SPU 的屬性關聯
                'variants.attributeValues.attribute', // ✅ 預先加載 SKU 變體及其屬性
                'variants.inventory.store', // ✅ 預先加載庫存資訊
                'variants.product.media', // 🎯 預先加載變體回到商品的關聯及其媒體，讓 ProductVariantResource 能夠輸出圖片 URL
                'media' // 📸 預先加載媒體關聯，讓 ProductResource 能夠輸出圖片 URL
            ])
            ->allowedFilters([
                'name', 
                // 移除 sku 篩選，因為 sku 屬於 variants
                // 使用自訂篩選器處理多欄位搜尋
                AllowedFilter::custom('search', new SearchFilter()),
            ])
            ->allowedSorts(['name', 'created_at']); // 移除 selling_price 排序

        // 🚀 新增庫存管理篩選功能 (TD-004 解決方案)
        
        // 商品名稱模糊搜尋
        if ($request->has('product_name') && !empty($request->product_name)) {
            $query->where('name', 'like', '%' . $request->product_name . '%');
        }

        // 按分類篩選
        if ($request->has('category_id') && !empty($request->category_id)) {
            $query->where('category_id', $request->category_id);
        }

        // 按門市篩選 - 只返回在指定門市有庫存記錄的商品
        if ($request->has('store_id') && !empty($request->store_id)) {
            $query->whereHas('variants.inventory', function ($q) use ($request) {
                $q->where('store_id', $request->store_id);
            });
        }

        // 低庫存篩選 - 庫存數量 <= 低庫存閾值
        if ($request->has('low_stock') && $request->boolean('low_stock')) {
            $query->whereHas('variants.inventory', function ($q) {
                $q->whereRaw('quantity <= low_stock_threshold');
            });
        }

        // 缺貨篩選 - 庫存數量 = 0
        if ($request->has('out_of_stock') && $request->boolean('out_of_stock')) {
            $query->whereHas('variants.inventory', function ($q) {
                $q->where('quantity', 0);
            });
        }

        $paginatedProducts = $query->paginate($request->input('per_page', 15));
        
        return new ProductCollection($paginatedProducts);
    }

    /**
     * 建立新商品 (SPU/SKU)









     *   "data": {
     *     "id": 1,
     *     "name": "經典棉質T-shirt",
     *     "description": "100% 純棉",
     *     "category_id": 1,
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
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

                // 2. 關聯 SPU 與其擁有的屬性 (attributes) - 只有非空時才關聯
                if (!empty($validatedData['attributes'])) {
                    $product->attributes()->attach($validatedData['attributes']);
                }

                // 3. 遍歷並建立每一個 SKU (ProductVariant)
                foreach ($validatedData['variants'] as $variantData) {
                    $variant = $product->variants()->create([
                        'sku' => $variantData['sku'],
                        'price' => $variantData['price'],
                    ]);

                    // 4. 關聯 SKU 與其對應的屬性值 (attribute_values) - 只有非空時才關聯
                    if (!empty($variantData['attribute_value_ids'])) {
                        $variant->attributeValues()->attach($variantData['attribute_value_ids']);
                    }

                    // 5. 為每一個 SKU 在所有門市建立初始庫存記錄
                    $stores = \App\Models\Store::all();
                    foreach ($stores as $store) {
                        \App\Models\Inventory::create([
                            'product_variant_id' => $variant->id,
                            'store_id' => $store->id,
                            'quantity' => 0, // 初始庫存預設為 0
                            'low_stock_threshold' => 0,
                        ]);
                    }
                }
                
                return $product;
            });

            // 回傳經過完整關聯加載的 SPU 資源
            return new ProductResource($product->load([
                'category',
                'attributes', // ✅ 建立後也要加載 SPU 的屬性關聯
                'variants.attributeValues.attribute', 
                'variants.inventory',
                'media' // 📸 建立後也要加載媒體關聯
            ]));

        } catch (\Exception $e) {
            // 如果事務中有任何錯誤發生，回傳伺服器錯誤
            return response()->json(['message' => '建立商品時發生錯誤', 'error' => $e->getMessage()], 500);
        }
    }



    /**
     * 顯示指定的商品
     * 


     *   "data": {
     *     "id": 1,
     *     "name": "商品名稱",
     *     "description": "商品描述",
     *     "category_id": 1,
     *     "created_at": "2025-01-01T10:00:00.000000Z",
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function show(Product $product)
    {
        return new ProductResource($product->load([
            'category',
            'attributes', // ✅ 加載 SPU 的屬性關聯
            'variants.attributeValues.attribute', 
            'variants.inventory.store',
            'media' // 📸 加載媒體關聯，輸出圖片 URL
        ]));
    }

    /**
     * 更新指定的商品及其變體
     * 











     *   "data": {
     *     "id": 1,
     *     "name": "經典棉質T-shirt",
     *     "description": "100% 純棉",
     *     "category_id": 1,
     *     "updated_at": "2025-01-01T10:00:00.000000Z"
     *   }
     * }
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        $this->authorize('update', $product); // 檢查是否有權限更新這個 $product
        
        try {
            $validatedData = $request->validated();
            
            // 使用 ProductService 處理複雜的更新邏輯
            $updatedProduct = $this->productService->updateProductWithVariants($product, $validatedData);
            
            // 重新載入完整的關聯資料
            $updatedProduct->load([
                'category',
                'attributes', // ✅ 更新後也要加載 SPU 的屬性關聯
                'variants.attributeValues.attribute', 
                'variants.inventory.store',
                'media' // 📸 更新後也要加載媒體關聯
            ]);
            
            return new ProductResource($updatedProduct);
            
        } catch (\Exception $e) {
            // 如果更新過程中有任何錯誤發生，回傳伺服器錯誤
            return response()->json([
                'message' => '更新商品時發生錯誤', 
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * 刪除指定的商品
     * 

     * 

     */
    public function destroy(Product $product)
    {
        $this->authorize('delete', $product); // 檢查是否有權限刪除這個 $product
        
        try {
            // 檢查是否有商品存在相關聯的進貨單或訂單
            $hasRelatedRecords = $product->variants()
                ->where(function ($query) {
                    $query->whereHas('purchaseItems')
                          ->orWhereHas('orderItems');
                })
                ->exists();
            
            if ($hasRelatedRecords) {
                throw new \Exception("無法刪除商品 [{$product->name}]，因為該商品已有相關的進貨單或訂單記錄。");
            }
            
            $product->delete();
            return response()->noContent();
            
        } catch (\Exception $e) {
            // 記錄錯誤日誌
            Log::error('刪除商品失敗', [
                'user_id' => Auth::id(),
                'product_id' => $product->id,
                'error' => $e->getMessage(),
            ]);
            
            // 返回友好的錯誤訊息
            return response()->json([
                'message' => $e->getMessage(),
                'error' => '刪除失敗'
            ], 422);
        }
    }

    /**
     * 批量刪除商品
     *
     * 根據提供的商品 ID 陣列批量刪除商品。


     */
    public function destroyMultiple(DestroyMultipleProductsRequest $request)
    {
        $this->authorize('deleteMultiple', Product::class); // 檢查是否有'批量刪除'權限
        
        $validatedData = $request->validated();
        
        // 獲取要刪除的 ID 並轉換為整數陣列
        $ids = array_map('intval', $validatedData['ids']);
        
        try {
            // 使用事務確保操作的原子性
            DB::transaction(function () use ($ids) {
                // 檢查是否有商品存在相關聯的進貨單或訂單
                $productsWithDependencies = Product::whereIn('id', $ids)
                    ->where(function ($query) {
                        $query->whereHas('variants.purchaseItems')
                              ->orWhereHas('variants.orderItems');
                    })
                    ->pluck('name', 'id');
                
                if ($productsWithDependencies->isNotEmpty()) {
                    $productNames = $productsWithDependencies->values()->implode('、');
                    throw new \Exception("無法刪除商品 [{$productNames}]，因為這些商品已有相關的進貨單或訂單記錄。");
                }
                
                // 批量刪除所有指定 ID 的商品
                Product::whereIn('id', $ids)->delete();
            });
            
            // 返回 204 No Content
            return response()->noContent();
            
        } catch (\Exception $e) {
            // 記錄錯誤日誌
            Log::error('批量刪除商品失敗', [
                'user_id' => Auth::id(),
                'product_ids' => $ids,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // 返回友好的錯誤訊息
            return response()->json([
                'message' => $e->getMessage(),
                'error' => '批量刪除失敗'
            ], 422);
        }
    }

    /**
     * 上傳商品圖片
     * 
     * 遵循 Spatie Media Library v11 官方最佳實踐：
     * - 使用專用的 FormRequest 進行驗證
     * - 實施完整的錯誤處理和日誌記錄
     * - 使用 singleFile 行為自動替換現有圖片
     * - 返回所有轉換版本的 URL
 * 
     *   "success": true,
     *   "message": "圖片上傳成功",
     *   "data": {
     *     "id": 1,
     *     "name": "商品名稱",
     *     "has_image": true,
     *     "image_urls": {
     *       "original": "http://localhost/storage/1/product-image.jpg",
     *       "thumb": "http://localhost/storage/1/conversions/product-image-thumb.jpg",
     *       "medium": "http://localhost/storage/1/conversions/product-image-medium.jpg",
     *       "large": "http://localhost/storage/1/conversions/product-image-large.jpg"
     *     }
     *   }
     * }
     * 

     *   "success": false,
     *   "message": "找不到指定的商品"
     * }
     * 

     *   "success": false,
     *   "message": "圖片上傳驗證失敗",
     *   "errors": {
     *     "image": ["圖片格式必須是：JPEG、JPG、PNG、GIF 或 WebP。"]
     *   }
     * }
     * 

     *   "success": false,
     *   "message": "圖片上傳失敗",
     *   "error": "詳細錯誤訊息"
     * }
     */
    public function uploadImage(UploadProductImageRequest $request, Product $product)
    {
        try {
            // 授權檢查
            $this->authorize('update', $product);

            // 記錄開始上傳
            Log::info('開始上傳商品圖片', [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'user_id' => Auth::id(),
                'file_info' => [
                    'original_name' => $request->file('image')->getClientOriginalName(),
                    'mime_type' => $request->file('image')->getMimeType(),
                    'size' => $request->file('image')->getSize(),
                ]
            ]);

            // 獲取上傳的檔案
            $uploadedFile = $request->file('image');
            
            // 檢查是否已有圖片（用於日誌記錄）
            $hadPreviousImage = $product->hasImage();
            $previousImageId = $hadPreviousImage ? $product->getFirstMedia('images')->id : null;

            // 使用 Context7 推薦的 addMediaFromRequest 方法
            // singleFile() 配置會自動替換現有圖片
            $media = $product
                ->addMediaFromRequest('image')
                ->usingName($product->name . ' 主圖')
                ->usingFileName('product-' . $product->id . '-' . time() . '.' . $uploadedFile->getClientOriginalExtension())
                ->toMediaCollection('images');

            // 等待轉換完成（因為使用 nonQueued()）
            // 驗證所有轉換是否成功生成
            $conversions = ['thumb', 'medium', 'large'];
            $conversionResults = [];
            
            foreach ($conversions as $conversion) {
                $hasConversion = $media->hasGeneratedConversion($conversion);
                $conversionResults[$conversion] = [
                    'generated' => $hasConversion,
                    'url' => $hasConversion ? $media->getUrl($conversion) : null,
                    'path' => $hasConversion ? $media->getPath($conversion) : null,
                    'file_exists' => $hasConversion ? file_exists($media->getPath($conversion)) : false,
                ];
            }

            // 記錄上傳成功
            Log::info('商品圖片上傳成功', [
                'product_id' => $product->id,
                'media_id' => $media->id,
                'media_file_name' => $media->file_name,
                'media_size' => $media->size,
                'had_previous_image' => $hadPreviousImage,
                'previous_image_id' => $previousImageId,
                'conversion_results' => $conversionResults,
                'user_id' => Auth::id(),
            ]);

            // 檢查是否有轉換失敗
            $failedConversions = array_filter($conversionResults, function($result) {
                return !$result['generated'] || !$result['file_exists'];
            });

            if (!empty($failedConversions)) {
                Log::warning('部分圖片轉換失敗', [
                    'product_id' => $product->id,
                    'media_id' => $media->id,
                    'failed_conversions' => array_keys($failedConversions),
                    'conversion_details' => $failedConversions,
                ]);
            }

            // 重新載入產品以獲取最新的媒體關聯
            $product->refresh();

            // 準備回應資料
            $responseData = [
                'media_id' => $media->id,
                'file_name' => $media->file_name,
                'file_size' => $media->size,
                'mime_type' => $media->mime_type,
                'image_urls' => $product->getImageUrls(),
                'conversions_generated' => [
                    'thumb' => $media->hasGeneratedConversion('thumb'),
                    'medium' => $media->hasGeneratedConversion('medium'),
                    'large' => $media->hasGeneratedConversion('large'),
                ],
                'conversion_results' => $conversionResults,
            ];

            return response()->json([
                'success' => true,
                'message' => '商品圖片上傳成功',
                'data' => $responseData,
            ], 201);

        } catch (AuthorizationException $e) {
            Log::warning('圖片上傳授權失敗', [
                'product_id' => $product->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '您沒有權限上傳此商品的圖片',
            ], 403);

        } catch (\Exception $e) {
            Log::error('圖片上傳失敗', [
                'product_id' => $product->id,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'message' => '圖片上傳失敗',
                'error' => config('app.debug') ? $e->getMessage() : '內部伺服器錯誤',
            ], 500);
        }
    }
}
