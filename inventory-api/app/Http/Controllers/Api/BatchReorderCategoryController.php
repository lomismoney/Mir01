<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

/**
 * 批量重排序分類控制器
 * 
 * 處理分類的批量排序操作
 */
class BatchReorderCategoryController extends Controller
{
    /**
     * 處理批量重排序請求
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function __invoke(Request $request): JsonResponse
    {
        // 權限檢查
        Gate::authorize('update', Category::class);
        
        // 驗證請求數據
        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer|exists:categories,id',
            'items.*.sort_order' => 'required|integer|min:0'
        ]);
        
        // 額外驗證：確保所有分類屬於同一父分類
        $categoryIds = collect($validated['items'])->pluck('id');
        $categories = Category::whereIn('id', $categoryIds)->get();
        
        // 檢查是否所有分類都存在
        if ($categories->count() !== $categoryIds->count()) {
            throw ValidationException::withMessages([
                'items' => ['部分分類不存在']
            ]);
        }
        
        // 檢查是否所有分類屬於同一父分類
        $parentIds = $categories->pluck('parent_id')->unique();
        if ($parentIds->count() > 1) {
            throw ValidationException::withMessages([
                'items' => ['只能對同一層級的分類進行排序']
            ]);
        }
        
        // 使用事務確保數據一致性
        DB::transaction(function () use ($validated) {
            foreach ($validated['items'] as $item) {
                Category::where('id', $item['id'])
                    ->update(['sort_order' => $item['sort_order']]);
            }
        });
        
        // 返回成功響應
        return response()->json([
            'message' => '分類排序更新成功',
            'updated_count' => count($validated['items'])
        ], 200);
    }
}
