<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Data\CategoryData;
use App\Http\Requests\Api\ReorderCategoriesRequest;
use App\Http\Resources\Api\CategoryResource;
use App\Models\Category;
use App\Services\CategoryService;

/**
 * CategoryController 分類控制器
 * 
 * 【DTO 驅動遷移】已重構為使用 CategoryData DTO 進行數據處理
 * 處理分類相關的 API 請求，提供完整的 CRUD 操作
 * 所有操作都受到 CategoryPolicy 權限保護，僅管理員可執行
 * 支援階層式分類結構管理和拖曳排序功能
 * 
 * 重構內容：
 * - 使用 CategoryData DTO 替代 FormRequest 驗證
 * - 自動處理自我循環檢查
 * - 支援 sort_order 排序欄位
 * - 簡化控制器邏輯，提升類型安全性
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
     * 【完美架構重構】返回標準的扁平分類結構
     * 遵循 RESTful 設計原則，分離關注點：
     * - 後端職責：提供完整、準確的數據
     * - 前端職責：處理展示邏輯（樹狀結構建構）
     * 
     * 架構優勢：
     * 1. Scramble PRO 完美支援標準 ResourceCollection
     * 2. 符合 RESTful 最佳實踐
     * 3. 前後端職責清晰分離
     * 4. 更好的快取和擴展性
     * 
     * @return \Illuminate\Http\Resources\Json\AnonymousResourceCollection<\App\Http\Resources\Api\CategoryResource>
     */
    public function index()
    {
        // 🚀 【架構重構】獲取所有分類，返回標準的扁平結構
        $categories = Category::withCount('products')
            ->orderBy('sort_order')
            ->orderBy('id') // 次要排序，確保穩定性
            ->get();
        
        // 計算包含子分類的商品總數（保持原有業務邏輯）
        $categoryMap = $categories->keyBy('id');
        foreach ($categories as $category) {
            $this->calculateTotalProducts($category, $categoryMap);
        }
        
        // 🎯 【完美架構】返回標準的 ResourceCollection
        // Scramble PRO 將生成完美的 OpenAPI 契約
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
     * 儲存新建立的分類資源
     * 
     * 【DTO 驅動遷移】使用 CategoryData DTO 進行數據驗證和轉換
     * 驗證邏輯已遷移至 CategoryData，支援：
     * - 分類名稱必填且不超過255字符
     * - 父分類ID必須存在於資料表中
     * - 描述為可選欄位
     * - 排序順序支援
     * 
     * @param \App\Data\CategoryData $categoryData
     * @return \App\Http\Resources\Api\CategoryResource
     */
    public function store(CategoryData $categoryData)
    {
        // 直接使用 DTO 數據創建分類，無需手動驗證
        $category = Category::create($categoryData->toArray());
        
        return new CategoryResource($category);
    }

    /**
     * 顯示指定的分類資源
     * 
     * 返回單一分類的詳細資訊，使用 CategoryResource 格式化輸出
     * 包含該分類的商品數量統計
     * 
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
     * 【DTO 驅動遷移】使用 CategoryData DTO 進行數據驗證和轉換
     * 驗證邏輯已遷移至 CategoryData，支援：
     * - 部分更新支援（sometimes 規則）
     * - 防止自我循環的業務邏輯保護
     * - 確保父分類存在性檢查
     * - 排序順序支援
     * 
     * @param \App\Data\CategoryData $categoryData
     * @param \App\Models\Category $category
     * @return \App\Http\Resources\Api\CategoryResource
     */
    public function update(CategoryData $categoryData, Category $category)
    {
        // 直接使用 DTO 數據更新分類，自我循環檢查已在 CategoryData 中處理
        $category->update($categoryData->toArray());
        
        return new CategoryResource($category);
    }

    /**
     * 刪除指定的分類資源
     * 
     * 執行軟刪除操作，根據資料表外鍵約束設定：
     * - 當分類被刪除時，其子分類也會被級聯刪除
     * - 關聯的商品 category_id 會被設為 null
     * 
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
