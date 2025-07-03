<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCategoryRequest;
use App\Http\Requests\Api\UpdateCategoryRequest;
use App\Http\Requests\Api\ReorderCategoriesRequest;
use App\Http\Resources\Api\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * @group 分類管理
 * @authenticated
 * 
 * CategoryController 分類控制器
 * 
 * 處理分類相關的 API 請求，提供完整的 CRUD 操作
 * 所有操作都受到 CategoryPolicy 權限保護，僅管理員可執行
 * 支援階層式分類結構管理
 */
class CategoryController extends Controller
{
    /**
     * 分類服務層實例
     * 
     * @var CategoryService
     */
    protected $categoryService;

    /**
     * 控制器建構函數
     * 
     * 自動對所有資源路由方法應用 CategoryPolicy 權限檢查
     * 確保只有授權用戶（管理員）才能執行分類管理操作
     */
    public function __construct(CategoryService $categoryService)
    {
        $this->authorizeResource(Category::class, 'category');
        $this->categoryService = $categoryService;
    }

    /**
     * @summary 顯示所有分類列表
     * @description 返回一個扁平化的分類列表，已按 `sort_order` 排序。前端應根據 `parent_id` 自行構建樹狀結構。
     * @queryParam include string 可選的關聯，用逗號分隔。例如: products
     * 
     * @apiResourceCollection \App\Http\Resources\Api\CategoryResource
     * @apiResourceModel \App\Models\Category
     */
    public function index(): AnonymousResourceCollection
    {
        // 獲取所有分類，並預載入每個分類的直接商品數量
        // 按照 sort_order 排序，確保前端能正確顯示順序
        $categories = Category::withCount('products')
            ->orderBy('sort_order')
            ->orderBy('id') // 次要排序，確保穩定性
            ->get();
            
        // 計算每個分類的總商品數（包含後代）
        $categoryMap = $categories->keyBy('id');
        foreach ($categories as $category) {
            $this->calculateTotalProducts($category, $categoryMap);
        }

        return CategoryResource::collection($categories);
    }

    /**
     * 遞迴計算一個分類及其所有後代的商品總數
     *
     * @param \App\Models\Category $category 當前分類
     * @param \Illuminate\Support\Collection $categoryMap 所有分類的查找表
     * @return int 商品總數
     */
    private function calculateTotalProducts(Category $category, $categoryMap): int
    {
        // 記憶化：如果已經計算過，直接返回結果以提高效率
        if (isset($category->total_products_count)) {
            return $category->total_products_count;
        }

        // 從該分類自身的商品數量開始計算
        $total = $category->products_count;

        // 找到所有直接子分類，並遞迴地將它們的商品總數累加進來
        $children = $categoryMap->where('parent_id', $category->id);
        foreach ($children as $child) {
            $total += $this->calculateTotalProducts($child, $categoryMap);
        }

        // 將計算結果儲存在物件屬性中，以便記憶化和給父級使用
        $category->total_products_count = $total;

        return $total;
    }

    /**
     * @summary 儲存新建立的分類
     * @description 使用 StoreCategoryRequest 進行數據驗證。
     * 
     * @apiResource \App\Http\Resources\Api\CategoryResource
     * @apiResourceModel \App\Models\Category
     */
    public function store(StoreCategoryRequest $request): CategoryResource
    {
        $category = Category::create($request->validated());
        return new CategoryResource($category);
    }

    /**
     * @summary 顯示指定的分類
     * @description 返回單一分類的詳細資訊，包含該分類的商品數量統計。
     * 
     * @urlParam category integer required 分類ID。 Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\CategoryResource
     * @apiResourceModel \App\Models\Category
     * 
     * @param \App\Models\Category $category
     * @return \App\Http\Resources\Api\CategoryResource
     */
    public function show(Category $category): CategoryResource
    {
        // 載入該分類直接關聯的商品數量
        $category->loadCount('products');
        
        // 遞迴獲取所有後代分類
        $descendants = $category->descendants()->withCount('products')->get();
        
        // 計算總數
        $total = $category->products_count;
        $this->addDescendantCounts($descendants, $total);

        $category->total_products_count = $total;

        return new CategoryResource($category);
    }

    /**
     * 遞迴地將後代分類的商品數量加到總數中
     *
     * @param \Illuminate\Support\Collection $categories
     * @param int $total
     */
    private function addDescendantCounts($categories, int &$total)
    {
        foreach ($categories as $category) {
            $total += $category->products_count;
            if ($category->relationLoaded('descendants')) {
                $this->addDescendantCounts($category->descendants, $total);
            }
        }
    }

    /**
     * @summary 更新指定的分類
     * @description 使用 UpdateCategoryRequest 進行數據驗證。
     * 
     * @urlParam category integer required 分類ID。 Example: 1
     * 
     * @apiResource \App\Http\Resources\Api\CategoryResource
     * @apiResourceModel \App\Models\Category
     * 
     * @param \App\Http\Requests\Api\UpdateCategoryRequest $request
     * @param \App\Models\Category $category
     * @return \App\Http\Resources\Api\CategoryResource
     */
    public function update(UpdateCategoryRequest $request, Category $category): CategoryResource
    {
        $category->update($request->validated());
        return new CategoryResource($category);
    }

    /**
     * @summary 刪除指定的分類
     * @description 執行軟刪除操作，子分類將級聯刪除，商品關聯將設為 null。
     * 
     * @urlParam category integer required 分類ID。 Example: 1
     * 
     * @response 204 scenario="刪除成功"
     * 
     * @param \App\Models\Category $category
     * @return \Illuminate\Http\Response
     */
    public function destroy(Category $category): Response
    {
        $category->delete();
        return response()->noContent();
    }

    /**
     * @summary 批量重新排序分類
     * @description 處理前端拖曳排序功能的批量更新請求。
     * 
     * @response 204
     */
    public function reorder(ReorderCategoriesRequest $request): Response
    {
        // 3.2.1 權限驗證
        $this->authorize('reorder', Category::class);

        // 3.2.2 將核心邏輯委派給 Service 層
        $this->categoryService->reorder($request->validated()['items']);

        return response()->noContent();
    }
}
