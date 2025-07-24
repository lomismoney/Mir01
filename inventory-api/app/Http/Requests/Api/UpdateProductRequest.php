<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
            'variants.*.id' => 'sometimes|integer|exists:product_variants,id',
            'variants.*.sku' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) {
                    // 解析陣列索引
                    preg_match('/variants\.(\d+)\.sku/', $attribute, $matches);
                    if (!isset($matches[1])) {
                        $fail('無效的屬性路徑格式。');
                        return;
                    }
                    
                    $currentIndex = (int)$matches[1];
                    $currentVariantId = $this->input("variants.{$currentIndex}.id");
                    
                    // 1. 檢查同一請求中的重複 SKU
                    $allVariants = $this->input('variants', []);
                    $duplicateFound = false;
                    
                    foreach ($allVariants as $index => $variant) {
                        if ($index != $currentIndex && 
                            isset($variant['sku']) && 
                            $variant['sku'] === $value) {
                            $duplicateFound = true;
                            break;
                        }
                    }
                    
                    if ($duplicateFound) {
                        $fail("SKU「{$value}」在此次請求中重複出現，每個變體必須有唯一的 SKU。");
                        return;
                    }
                    
                    // 2. 檢查資料庫中的 SKU 唯一性
                    $query = \App\Models\ProductVariant::where('sku', $value);
                    
                    // 如果當前變體有 ID（編輯模式），排除它自己
                    if ($currentVariantId && is_numeric($currentVariantId)) {
                        $query->where('id', '!=', $currentVariantId);
                    }
                    
                    if ($query->exists()) {
                        $existingVariant = $query->first();
                        $fail("SKU「{$value}」已被其他商品變體使用（ID: {$existingVariant->id}），請使用不同的 SKU。");
                    }
                }
            ],
            'variants.*.price' => 'required|numeric|min:0',
            // 支援兩種格式：舊格式的 attribute_value_ids 和新格式的 attribute_values
            'variants.*.attribute_value_ids' => 'array', // 🎯 允許空陣列，支援單規格商品
            'variants.*.attribute_value_ids.*' => 'integer|exists:attribute_values,id',
            'variants.*.attribute_values' => 'array',
            'variants.*.attribute_values.*.attribute_id' => 'required_with:variants.*.attribute_values|integer|exists:attributes,id',
            'variants.*.attribute_values.*.value' => 'required_with:variants.*.attribute_values|string|max:255',
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
                'description' => '商品的完整名稱。',
                'example' => '高階人體工學辦公椅',
            ],
            'description' => [
                'description' => '商品的詳細描述。',
                'example' => '具備可調節腰靠和 4D 扶手。',
            ],
            'category_id' => [
                'description' => '商品所屬分類的 ID。可為空值表示不屬於任何分類。',
                'example' => 1,
            ],
            'attributes' => [
                'description' => '商品使用的屬性 ID 陣列（如顏色、尺寸等）。',
                'example' => [1, 2],
            ],
            'attributes.*' => [
                'description' => '屬性 ID，必須存在於系統中。',
                'example' => 1,
            ],
            'variants' => [
                'description' => '商品變體陣列，每個變體代表一種屬性組合。',
                'example' => [
                    [
                        'id' => 1,
                        'sku' => 'CHAIR-ERG-RED-L',
                        'price' => 399.99,
                        'attribute_value_ids' => [1, 3]
                    ]
                ],
            ],
            'variants.*.id' => [
                'description' => '變體 ID（更新現有變體時提供）。',
                'example' => 1,
            ],
            'variants.*.sku' => [
                'description' => '變體的唯一庫存單位編號。',
                'example' => 'CHAIR-ERG-RED-L',
            ],
            'variants.*.price' => [
                'description' => '變體的價格。',
                'example' => 399.99,
            ],
            'variants.*.attribute_value_ids' => [
                'description' => '變體對應的屬性值 ID 陣列。',
                'example' => [1, 3],
            ],
            'variants.*.attribute_value_ids.*' => [
                'description' => '屬性值 ID，必須存在於系統中。',
                'example' => 1,
            ],
        ];
    }
}
