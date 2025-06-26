<?php

namespace App\Services;

use App\Models\Category;
use Illuminate\Support\Facades\DB;

/**
 * CategoryService 分類服務層
 * 
 * 處理分類相關的業務邏輯，包括：
 * - 批量重新排序
 * - 複雜的分類操作
 */
class CategoryService
{
    /**
     * 批量重新排序分類
     * 
     * 使用資料庫事務確保操作的原子性
     * 
     * @param array $items 包含分類 ID 和新排序值的陣列
     * @return void
     */
    public function reorder(array $items): void
    {
        // 使用資料庫事務確保操作的原子性
        DB::transaction(function () use ($items) {
            foreach ($items as $item) {
                Category::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
            }
        });
    }
}
