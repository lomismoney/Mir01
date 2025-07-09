<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 訂單主體欄位（使用 sometimes 支援部分更新）
            'customer_id'          => 'sometimes|required|exists:customers,id',
            'shipping_status'      => 'sometimes|required|string|in:pending,processing,shipped,delivered',
            'payment_status'       => 'sometimes|required|string|in:pending,paid,failed,refunded',
            'shipping_fee'         => 'sometimes|nullable|numeric|min:0',
            'tax'                  => 'sometimes|nullable|numeric|min:0',
            'discount_amount'      => 'sometimes|nullable|numeric|min:0',
            'payment_method'       => 'sometimes|nullable|string|max:50',
            'shipping_address'     => 'sometimes|nullable|string',
            'billing_address'      => 'sometimes|nullable|string',
            'customer_address_id'  => 'sometimes|nullable|exists:customer_addresses,id',
            'notes'                => 'sometimes|nullable|string',
            'po_number'            => 'sometimes|nullable|string|max:50',
            'reference_number'     => 'sometimes|nullable|string|max:50',
            'subtotal'             => 'sometimes|nullable|numeric|min:0',
            'grand_total'          => 'sometimes|nullable|numeric|min:0',
            
            // 訂單項目陣列（當提供時必須至少有一項）
            'items'                => 'sometimes|required|array|min:1',
            
            // 訂單項目驗證規則
            'items.*.id'                     => 'sometimes|integer|exists:order_items,id', // 用於標識已存在的項目
            'items.*.product_variant_id'     => 'nullable|exists:product_variants,id',
            'items.*.is_stocked_sale'        => 'required_with:items|boolean',
            'items.*.status'                 => 'required_with:items|string|in:pending,confirmed,processing,completed,cancelled',
            'items.*.quantity'               => 'required_with:items|integer|min:1',
            'items.*.price'                  => 'required_with:items|numeric|min:0',
            'items.*.cost'                   => 'required_with:items|numeric|min:0',
            'items.*.tax_rate'               => 'required_with:items|numeric|min:0|max:100',
            'items.*.discount_amount'        => 'required_with:items|numeric|min:0',
            
            // 訂製商品欄位（當非庫存銷售時使用）
            'items.*.custom_product_name'     => 'required_with:items|nullable|string|max:255',
            'items.*.custom_specifications'   => 'nullable|json',
            'items.*.custom_product_image'    => 'nullable|string|max:2048',
            'items.*.custom_product_category' => 'nullable|string|max:100',
            'items.*.custom_product_brand'    => 'nullable|string|max:100',
        ];
    }

    /**
     * 自定義錯誤訊息
     */
    public function messages(): array
    {
        return [
            'items.required' => '訂單必須至少包含一個商品項目',
            'items.*.quantity.min' => '商品數量必須至少為 1',
            'items.*.is_stocked_sale.required_with' => '必須指定是否為庫存銷售',
            'shipping_status.in' => '運送狀態必須是：pending、processing、shipped 或 delivered',
            'payment_status.in' => '付款狀態必須是：pending、paid、failed 或 refunded',
            'items.*.status.in' => '訂單項目狀態必須是：pending、confirmed、processing、completed 或 cancelled',
        ];
    }
    
    /**
     * 取得請求體參數的文檔
     * 
     * 用於 Scribe API 文檔生成
     * 
     * @return array
     */
    public function bodyParameters(): array
    {
        return [
            'customer_id' => [
                'description' => '客戶ID',
                'example' => 1,
            ],
            'shipping_status' => [
                'description' => '運送狀態',
                'example' => 'pending',
            ],
            'payment_status' => [
                'description' => '付款狀態',
                'example' => 'pending',
            ],
            'shipping_fee' => [
                'description' => '運費',
                'example' => 100.0,
            ],
            'tax' => [
                'description' => '稅金',
                'example' => 50.0,
            ],
            'discount_amount' => [
                'description' => '折扣金額',
                'example' => 0.0,
            ],
            'payment_method' => [
                'description' => '付款方式',
                'example' => '現金',
            ],
            'shipping_address' => [
                'description' => '運送地址',
                'example' => '台北市信義區信義路五段7號',
            ],
            'billing_address' => [
                'description' => '帳單地址',
                'example' => '台北市信義區信義路五段7號',
            ],
            'customer_address_id' => [
                'description' => '客戶地址ID',
                'example' => 1,
            ],
            'notes' => [
                'description' => '備註',
                'example' => '請小心輕放',
            ],
            'po_number' => [
                'description' => '採購訂單號',
                'example' => 'PO-2025-001',
            ],
            'reference_number' => [
                'description' => '參考號碼',
                'example' => 'REF-123',
            ],
            'subtotal' => [
                'description' => '小計金額',
                'example' => 5000.0,
            ],
            'grand_total' => [
                'description' => '總金額',
                'example' => 5250.0,
            ],
            'items' => [
                'description' => '訂單項目陣列',
                'example' => [
                    [
                        'id' => 1,
                        'product_variant_id' => 1,
                        'is_stocked_sale' => true,
                        'status' => 'pending',
                        'quantity' => 2,
                        'price' => 1000,
                        'cost' => 800,
                        'tax_rate' => 5,
                        'discount_amount' => 100,
                        'custom_product_name' => '訂製辦公桌',
                        'custom_specifications' => '{"寬度": "180cm", "高度": "75cm"}',
                        'custom_product_image' => 'https://example.com/image.jpg',
                        'custom_product_category' => '辦公家具',
                        'custom_product_brand' => '自訂品牌',
                    ],
                ],
            ],
            'items.*.id' => [
                'description' => '訂單項目ID（用於更新現有項目）',
                'example' => 1,
            ],
            'items.*.product_variant_id' => [
                'description' => '商品變體ID（訂製商品可為空）',
                'example' => 1,
            ],
            'items.*.is_stocked_sale' => [
                'description' => '是否為庫存銷售',
                'example' => true,
            ],
            'items.*.status' => [
                'description' => '項目狀態',
                'example' => 'pending',
            ],
            'items.*.quantity' => [
                'description' => '數量',
                'example' => 2,
            ],
            'items.*.price' => [
                'description' => '單價',
                'example' => 1000.0,
            ],
            'items.*.cost' => [
                'description' => '成本價',
                'example' => 800.0,
            ],
            'items.*.tax_rate' => [
                'description' => '稅率（百分比）',
                'example' => 5.0,
            ],
            'items.*.discount_amount' => [
                'description' => '折扣金額',
                'example' => 100.0,
            ],
            'items.*.custom_product_name' => [
                'description' => '訂製商品名稱',
                'example' => '訂製辦公桌',
            ],
            'items.*.custom_specifications' => [
                'description' => '訂製規格（JSON 格式）',
                'example' => '{"寬度": "180cm", "高度": "75cm"}',
            ],
            'items.*.custom_product_image' => [
                'description' => '訂製商品圖片URL',
                'example' => 'https://example.com/image.jpg',
            ],
            'items.*.custom_product_category' => [
                'description' => '訂製商品分類',
                'example' => '辦公家具',
            ],
            'items.*.custom_product_brand' => [
                'description' => '訂製商品品牌',
                'example' => '自訂品牌',
            ],
        ];
    }
}
