<?php

namespace App\Http\Requests\Api\V1;

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
        // 從路由中獲取 product 參數，這可能是模型實例或 ID
        $product = $this->route('product');
        
        // 確保我們獲取到的是 ID
        $productId = $product instanceof \App\Models\Product ? $product->id : $product;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:200'],
            'sku' => ['sometimes', 'required', 'string', 'max:100', Rule::unique('products')->ignore($productId)],
            'description' => ['sometimes', 'nullable', 'string'],
            'selling_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'cost_price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'category_id' => 'sometimes|nullable|integer|exists:categories,id',
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
