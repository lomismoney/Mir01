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
                'description' => '客戶 ID',
                'example' => 1,
            ],
            'shipping_status' => [
                'description' => '運送狀態（pending: 待處理, processing: 處理中, shipped: 已出貨, delivered: 已送達）',
                'example' => 'pending',
            ],
            'payment_status' => [
                'description' => '付款狀態（pending: 待付款, paid: 已付款, failed: 付款失敗, refunded: 已退款）',
                'example' => 'pending',
            ],
            'shipping_fee' => [
                'description' => '運費',
                'example' => 100,
            ],
            'tax' => [
                'description' => '稅額',
                'example' => 500,
            ],
            'discount_amount' => [
                'description' => '折扣金額',
                'example' => 200,
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
                'description' => '客戶地址 ID',
                'example' => 1,
            ],
            'notes' => [
                'description' => '訂單備註',
                'example' => '請小心處理',
            ],
            'po_number' => [
                'description' => '採購單號',
                'example' => 'PO-2025-001',
            ],
            'reference_number' => [
                'description' => '參考編號',
                'example' => 'REF-2025-001',
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
                    ],
                ],
            ],
        ];
    }
}
