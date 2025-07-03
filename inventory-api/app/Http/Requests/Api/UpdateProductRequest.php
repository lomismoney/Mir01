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
                    // 解析陣列索引 - 更健壯的方式
                    $attributeParts = explode('.', $attribute);
                    if (count($attributeParts) < 3) {
                        $fail('無效的屬性路徑格式。');
                        return;
                    }
                    
                    $index = $attributeParts[1];
                    $currentVariantId = $this->input("variants.{$index}.id");
                    
                    // 1. 檢查同一請求中的重複 SKU
                    $allVariants = $this->input('variants', []);
                    $skuCount = 0;
                    foreach ($allVariants as $variantIndex => $variant) {
                        if (isset($variant['sku']) && $variant['sku'] === $value) {
                            $skuCount++;
                        }
                    }
                    
                    if ($skuCount > 1) {
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
            'variants.*.attribute_value_ids' => 'array', // 🎯 允許空陣列，支援單規格商品
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
                'description' => '商品的完整名稱。',
                'example' => '高階人體工學辦公椅',
            ],
            'sku' => [
                'description' => '商品的唯一庫存單位編號 (SKU)。',
                'example' => 'CHAIR-ERG-001',
            ],
            'description' => [
                'description' => '商品的詳細描述。',
                'example' => '具備可調節腰靠和 4D 扶手。',
            ],
            'selling_price' => [
                'description' => '商品的銷售價格。',
                'example' => 399.99,
            ],
            'cost_price' => [
                'description' => '商品的成本價格。',
                'example' => 150.00,
            ],
            'category_id' => [
                'description' => '商品所屬分類的 ID。可為空值表示不屬於任何分類。',
                'example' => 1,
            ],
        ];
    }
}
