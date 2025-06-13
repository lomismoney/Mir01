<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreCategoryRequest;
use App\Http\Requests\Api\V1\UpdateCategoryRequest;
use App\Http\Resources\Api\V1\CategoryResource;
use App\Models\Category;

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
     * 控制器建構函數
     * 
     * 自動對所有資源路由方法應用 CategoryPolicy 權限檢查
     * 確保只有授權用戶（管理員）才能執行分類管理操作
     */
    public function __construct()
    {
        $this->authorizeResource(Category::class, 'category');
    }

    /**
     * 顯示分類列表
     * 
     * 返回所有分類的扁平化列表，並進行排序以維持層級關係。
     * @group 分類管理
     * @authenticated
     * @responseFile storage/responses/categories.index.json
     */
    public function index()
    {
        // 授權檢查已由 __construct 中的 authorizeResource 處理
        
        // 返回一個扁平但有序的列表，讓前端可以輕易地自行建構樹狀結構
        $categories = Category::orderBy('parent_id')->orderBy('id')->get();
        
        return CategoryResource::collection($categories);
    }

    /**
     * 儲存新建立的分類資源
     * 
     * 使用 StoreCategoryRequest 進行數據驗證，確保：
     * - 分類名稱必填且不超過255字符
     * - 父分類ID必須存在於資料表中
     * - 描述為可選欄位
     * 
     * @param \App\Http\Requests\Api\V1\StoreCategoryRequest $request
     * @return \App\Http\Resources\Api\V1\CategoryResource
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
     * 
     * @urlParam category integer required 分類的 ID。 Example: 1
     * @responseFile storage/responses/category.show.json
     * @param \App\Models\Category $category
     * @return \App\Http\Resources\Api\V1\CategoryResource
     */
    public function show(Category $category)
    {
        return new CategoryResource($category);
    }

    /**
     * 更新指定的分類資源
     * 
     * 使用 UpdateCategoryRequest 進行數據驗證，包含：
     * - 部分更新支援（sometimes 規則）
     * - 防止自我循環的業務邏輯保護
     * - 確保父分類存在性檢查
     * 
     * @param \App\Http\Requests\Api\V1\UpdateCategoryRequest $request
     * @param \App\Models\Category $category
     * @return \App\Http\Resources\Api\V1\CategoryResource
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
     * @param \App\Models\Category $category
     * @return \Illuminate\Http\Response
     */
    public function destroy(Category $category)
    {
        $category->delete();
        return response()->noContent();
    }
}
