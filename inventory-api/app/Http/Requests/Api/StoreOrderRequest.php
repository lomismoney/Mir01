<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
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
            'customer_id'          => 'required|exists:customers,id',
            'store_id'             => 'required|exists:stores,id',
            'shipping_status'      => 'required|string',
            'payment_status'       => 'required|string',
            'shipping_fee'         => 'nullable|numeric|min:0',
            'discount_amount'      => 'nullable|numeric|min:0',
            'is_tax_inclusive'     => 'required|boolean',
            'tax_rate'             => 'nullable|numeric|min:0|max:100',
            'payment_method'       => 'required|string',
            'order_source'         => 'required|string',
            'shipping_address'     => 'required|string',
            'notes'                => 'nullable|string',
            
            'force_create_despite_stock' => 'sometimes|boolean',
            
            // 🎯 修復：新增庫存決策驗證規則
            'stock_decisions'      => 'sometimes|array',
            'stock_decisions.*.product_variant_id' => 'required|integer|exists:product_variants,id',
            'stock_decisions.*.action' => 'required|string|in:transfer,purchase,mixed',
            'stock_decisions.*.transfers' => 'sometimes|array',
            'stock_decisions.*.transfers.*.from_store_id' => 'required|integer|exists:stores,id',
            'stock_decisions.*.transfers.*.quantity' => 'required|integer|min:1',
            'stock_decisions.*.purchase_quantity' => 'sometimes|integer|min:1',
            
            'items'                => 'required|array|min:1',
            'items.*.product_variant_id' => 'nullable|exists:product_variants,id',
            'items.*.is_stocked_sale'    => 'required|boolean',
            'items.*.status'             => 'required|string',
            'items.*.custom_specifications' => 'nullable|json',
            'items.*.product_name'       => 'required|string',
            'items.*.sku'                => 'required|string',
            'items.*.price'              => 'required|numeric|min:0',
            'items.*.quantity'           => 'required|integer|min:1',
        ];
    }

    /**
     * 在驗證前進行數據預處理
     * 1. 強制布林值轉換，確保多端一致
     * 2. 將金額從元轉換為分（前端傳元，後端處理分）
     */
    protected function prepareForValidation(): void
    {
        $data = [];
        
        // 處理布林值轉換
        if ($this->has('force_create_despite_stock')) {
            $data['force_create_despite_stock'] = filter_var(
                $this->input('force_create_despite_stock'),
                FILTER_VALIDATE_BOOLEAN
            );
        }
        
        // 處理金額轉換：元 -> 分
        if ($this->has('shipping_fee') && $this->input('shipping_fee') !== null) {
            $data['shipping_fee'] = round($this->input('shipping_fee') * 100);
        }
        
        if ($this->has('discount_amount') && $this->input('discount_amount') !== null) {
            $data['discount_amount'] = round($this->input('discount_amount') * 100);
        }
        
        // 處理訂單項目中的價格轉換
        if ($this->has('items') && is_array($this->input('items'))) {
            $items = $this->input('items');
            foreach ($items as $index => $item) {
                if (isset($item['price'])) {
                    $items[$index]['price'] = round($item['price'] * 100);
                }
            }
            $data['items'] = $items;
        }
        
        $this->merge($data);
    }

    /**
     * Define body parameters for Scribe documentation
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
            'store_id' => [
                'description' => '門市ID',
                'example' => 1,
            ],
            'shipping_status' => [
                'description' => '貨物狀態',
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
            'discount_amount' => [
                'description' => '折扣金額',
                'example' => 0.0,
            ],
            'is_tax_inclusive' => [
                'description' => '是否為含稅價格',
                'example' => true,
            ],
            'tax_rate' => [
                'description' => '稅率（百分比）',
                'example' => 5.0,
            ],
            'payment_method' => [
                'description' => '付款方式',
                'example' => '現金',
            ],
            'order_source' => [
                'description' => '訂單來源',
                'example' => '現場客戶',
            ],
            'shipping_address' => [
                'description' => '運送地址',
                'example' => '台北市信義區信義路五段7號',
            ],
            'notes' => [
                'description' => '備註',
                'example' => '請小心輕放',
            ],
            'force_create_despite_stock' => [
                'description' => '是否在庫存不足時強制建立訂單（預訂模式）',
                'example' => false,
            ],
            'items' => [
                'description' => '訂單項目清單',
                'example' => [
                    [
                        'product_variant_id' => 1,
                        'is_stocked_sale' => true,
                        'status' => 'pending',
                        'custom_specifications' => null,
                        'product_name' => '標準辦公桌',
                        'sku' => 'DESK-001',
                        'price' => 5000.0,
                        'quantity' => 2,
                    ]
                ],
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
            'items.*.custom_specifications' => [
                'description' => '訂製規格（僅訂製商品需要）',
                'example' => '{"寬度": "150cm"}',
            ],
            'items.*.product_name' => [
                'description' => '商品名稱',
                'example' => '標準辦公桌',
            ],
            'items.*.sku' => [
                'description' => 'SKU',
                'example' => 'DESK-001',
            ],
            'items.*.price' => [
                'description' => '單價',
                'example' => 5000.0,
            ],
            'items.*.quantity' => [
                'description' => '數量',
                'example' => 2,
            ],
        ];
    }
}
