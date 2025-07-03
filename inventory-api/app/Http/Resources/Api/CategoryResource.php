<?php

namespace App\Http\Resources\Api;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * CategoryResource 分類 API 資源
 * 
 * 標準化分類數據的輸出格式，確保 API 響應的一致性
 * 支援階層式分類結構的數據輸出
 */
class CategoryResource extends JsonResource
{
    /**
     * 將資源轉換為陣列格式
     * 
     * 定義分類數據的標準輸出結構：
     * - id: 分類唯一識別碼
     * - name: 分類名稱
     * - description: 分類描述
     * - parent_id: 父分類ID（用於階層結構）
     * - products_count: 該分類的商品數量（當有載入統計時）
     *
     * @param Request $request HTTP 請求實例
     * @return array<string, mixed> 標準化的分類數據陣列
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'parent_id' => $this->parent_id,
            'sort_order' => $this->sort_order,
            'products_count' => $this->whenCounted('products'),
            'total_products_count' => $this->total_products_count ?? $this->whenCounted('products', $this->products_count),
        ];
    }
}
