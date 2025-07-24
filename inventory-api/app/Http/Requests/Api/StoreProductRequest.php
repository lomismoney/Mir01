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
            'attributes'    => 'array', // 🎯 允許空陣列，支援單規格商品
            'attributes.*'  => 'integer|exists:attributes,id',
            
            'variants'      => 'required|array|min:1',
            'variants.*.sku' => 'required|string|unique:product_variants,sku|max:255',
            'variants.*.price' => 'required|numeric|min:0',
            // 支援舊格式
            'variants.*.attribute_value_ids' => 'array', // 🎯 允許空陣列，支援單規格商品
            'variants.*.attribute_value_ids.*' => 'integer|exists:attribute_values,id',
            // 支援新格式
            'variants.*.attribute_values' => 'array',
            'variants.*.attribute_values.*.attribute_id' => 'integer|exists:attributes,id',
            'variants.*.attribute_values.*.value' => 'required|string|max:255',
        ];
    }

    /**
     * 取得驗證錯誤的自訂屬性名稱
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => '商品名稱',
            'description' => '商品描述',
            'category_id' => '商品分類',
            'variants.*.sku' => 'SKU 編號',
            'variants.*.price' => '商品價格',
        ];
    }

    /**
     * 取得驗證錯誤的自訂訊息
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'variants.*.sku.unique' => 'SKU 編號 ":value" 已存在，每個 SKU 必須是唯一的。請修改 SKU 編號後重試。',
            'variants.*.sku.required' => 'SKU 編號為必填欄位',
            'variants.*.price.required' => '商品價格為必填欄位',
            'variants.*.price.numeric' => '商品價格必須為數字',
            'variants.*.price.min' => '商品價格不能小於 0',
        ];
    }

    /**
     * 準備驗證資料
     * 
     * 將金額欄位從元轉換為分
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        // 轉換商品變體中的價格欄位
        if ($this->has('variants') && is_array($this->input('variants'))) {
            $variants = $this->input('variants');
            foreach ($variants as $index => $variant) {
                if (isset($variant['price']) && $variant['price'] !== null && is_numeric($variant['price'])) {
                    $variants[$index]['price'] = round($variant['price'] * 100);
                }
            }
            $data['variants'] = $variants;
        }

        $this->merge($data);
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
            'attributes.*' => [
                'description' => '屬性 ID，必須存在於系統中。',
                'example' => 1,
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
            'variants.*.attribute_value_ids.*' => [
                'description' => '屬性值 ID，必須存在於系統中。',
                'example' => 1,
            ],
        ];
    }
}
