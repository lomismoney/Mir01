<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\Product;

class StoreProductRequest extends FormRequest
{
    /**
     * 確定用戶是否有權限發出此請求
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', Product::class);
    }

    /**
     * 取得適用於此請求的驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string',
            'category_id'   => 'nullable|integer|exists:categories,id',
            'attributes'    => 'required|array',
            'attributes.*'  => 'integer|exists:attributes,id',
            
            'variants'      => 'required|array|min:1',
            'variants.*.sku' => 'required|string|unique:product_variants,sku|max:255',
            'variants.*.price' => 'required|numeric|min:0',
            'variants.*.attribute_value_ids' => 'required|array',
            'variants.*.attribute_value_ids.*' => 'integer|exists:attribute_values,id',
        ];
    }

    /**
     * 取得請求主體參數的描述，用於 API 文件生成
     *
     * @return array<string, \Knuckles\Scribe\Extracting\Strategies\BodyParameters\BodyParameter|string>
     */
    public function bodyParameters(): array
    {
        return [
            'name' => [
                'description' => 'SPU 商品的完整名稱。',
                'example' => '無線藍牙耳機',
            ],
            'description' => [
                'description' => 'SPU 商品的詳細描述。',
                'example' => '高品質無線藍牙耳機，支援主動降噪功能。',
            ],
            'category_id' => [
                'description' => 'SPU 商品所屬分類的 ID。可為空值表示不屬於任何分類。',
                'example' => 1,
            ],
            'attributes' => [
                'description' => 'SPU 商品使用的屬性 ID 陣列（如顏色、尺寸等）。',
                'example' => [1, 2],
            ],
            'variants' => [
                'description' => 'SKU 變體陣列，每個變體代表一種屬性組合。',
                'example' => [
                    [
                        'sku' => 'HEADPHONE-BT-RED-L',
                        'price' => 199.99,
                        'attribute_value_ids' => [1, 3]
                    ],
                    [
                        'sku' => 'HEADPHONE-BT-BLUE-L',
                        'price' => 199.99,
                        'attribute_value_ids' => [2, 3]
                    ]
                ],
            ],
            'variants.*.sku' => [
                'description' => '單一 SKU 變體的唯一庫存單位編號。',
                'example' => 'HEADPHONE-BT-RED-L',
            ],
            'variants.*.price' => [
                'description' => '單一 SKU 變體的價格。',
                'example' => 199.99,
            ],
            'variants.*.attribute_value_ids' => [
                'description' => '單一 SKU 變體對應的屬性值 ID 陣列。',
                'example' => [1, 3],
            ],
        ];
    }
}
