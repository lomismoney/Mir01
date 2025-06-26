<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\StoreCategoryRequest;
use App\Http\Requests\Api\UpdateCategoryRequest;
use App\Http\Requests\Api\ReorderCategoriesRequest;
use App\Http\Resources\Api\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;

/**
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
     * 顯示分類列表
     * 
     * 優化策略：返回一個以 parent_id 分組的集合，讓前端可以極其方便地、
     * 高效地建構層級樹，而無需自己在前端進行複雜的遞迴或查找。
     * 
     * 範例：
     * - json[''] 或 json[null] 就是所有頂層分類
     * - json['1'] 就是 id 為 1 的分類下的所有子分類
     * 
     * @group 分類管理
     * @authenticated
     * @queryParam include string 可選的關聯，用逗號分隔。例如: products
     * 
     * @response 200 scenario="分類列表" {
     *   "data": [
     *     {
     *       "id": 1,
     *       "name": "分類名稱",
     *       "description": "分類描述",
     *       "created_at": "2025-01-01T10:00:00.000000Z",
     *       "updated_at": "2025-01-01T10:00:00.000000Z"
     *     }
     *   ]
     * }
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        // 獲取所有分類，並預載入每個分類的直接商品數量
        // 按照 sort_order 排序，確保拖曳排序的結果能正確顯示
        $categories = Category::withCount('products')
            ->orderBy('sort_order')
            ->orderBy('id') // 次要排序，確保穩定性
            ->get();
        $categoryMap = $categories->keyBy('id');

        // 為每個分類計算其包含所有後代的商品總數
        // 這個遞迴計算是安全的，因為它在一個已經載入的集合上操作，避免了 N+1 問題
        foreach ($categories as $category) {
            $this->calculateTotalProducts($category, $categoryMap);
        }

        // 按 parent_id 分組，以方便前端建構層級樹
        $grouped = $categories->groupBy(function ($category) {
            return $category->parent_id ?? '';
        });

        // 使用 CategoryResource 格式化並返回分組後的資料
        return response()->json($grouped->map(function ($group) {
            return CategoryResource::collection($group);
        }));
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
     * 儲存新建立的分類資源
     * 
     * 使用 StoreCategoryRequest 進行數據驗證，確保：
     * - 分類名稱必填且不超過255字符
     * - 父分類ID必須存在於資料表中
     * - 描述為可選欄位
     * 
     * @param \App\Http\Requests\Api\StoreCategoryRequest $request
     * @return \App\Http\Resources\Api\CategoryResource
     */
    public function store(StoreCategoryRequest $request)
    {
        $category = Category::create($request->validated());
        return new CategoryResource($category);
    }

    /**
     * 顯示指定的分類資源
     * 
     * 返回單一分類的詳細資訊，使用 CategoryResource 格式化輸出
     * 包含該分類的商品數量統計
     * 
     * @urlParam category integer required 分類 ID Example: 1
     * @param \App\Models\Category $category
     * @return \App\Http\Resources\Api\CategoryResource
     */
    public function show(Category $category)
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
     * 更新指定的分類資源
     * 
     * 使用 UpdateCategoryRequest 進行數據驗證，包含：
     * - 部分更新支援（sometimes 規則）
     * - 防止自我循環的業務邏輯保護
     * - 確保父分類存在性檢查
     * 
     * @urlParam category integer required 分類 ID Example: 1
     * @param \App\Http\Requests\Api\UpdateCategoryRequest $request
     * @param \App\Models\Category $category
     * @return \App\Http\Resources\Api\CategoryResource
     */
    public function update(UpdateCategoryRequest $request, Category $category)
    {
        $category->update($request->validated());
        return new CategoryResource($category);
    }

    /**
     * 刪除指定的分類資源
     * 
     * 執行軟刪除操作，根據資料表外鍵約束設定：
     * - 當分類被刪除時，其子分類也會被級聯刪除
     * - 關聯的商品 category_id 會被設為 null
     * 
     * @urlParam category integer required 分類 ID Example: 1
     * @param \App\Models\Category $category
     * @return \Illuminate\Http\Response
     */
    public function destroy(Category $category)
    {
        $category->delete();
        return response()->noContent();
    }

    /**
     * 批量重新排序分類
     * 
     * 處理前端拖曳排序功能的批量更新請求
     * 使用事務確保操作的原子性
     * 
     * @param \App\Http\Requests\Api\ReorderCategoriesRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function reorder(ReorderCategoriesRequest $request)
    {
        // 3.2.1 權限驗證
        $this->authorize('reorder', Category::class);

        // 3.2.2 將核心邏輯委派給 Service 層
        $this->categoryService->reorder($request->validated()['items']);

        return response()->json(['message' => '分類順序已成功更新。']);
    }
}
