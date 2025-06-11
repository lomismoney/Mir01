<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;

/**
 * 商品集合資源轉換器
 * 
 * 負責將 Product 集合轉換為分頁 API 響應格式
 * 保持與 Laravel 分頁器的兼容性
 */
class ProductCollection extends ResourceCollection
{
    /**
     * 指定集合中每個項目使用的資源類別
     */
    public $collects = ProductResource::class;

    /**
     * 將資源集合轉換為陣列格式
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'data' => $this->collection,
        ];
    }
} 