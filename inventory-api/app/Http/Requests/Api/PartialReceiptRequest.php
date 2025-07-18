<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 部分收貨請求驗證
 * 
 * 驗證部分收貨操作的請求資料，確保收貨數量的有效性
 */
class PartialReceiptRequest extends FormRequest
{
    /**
     * 確定用戶是否有權限執行此請求
     * 
     * @return bool
     */
    public function authorize()
    {
        // 權限驗證由 PurchaseController 的 authorize 方法處理
        return true;
    }

    /**
     * 獲取適用於該請求的驗證規則
     * 
     * @return array
     */
    public function rules()
    {
        return [
            'items' => ['required', 'array', 'min:1'],
            'items.*.purchase_item_id' => [
                'required',
                'integer',
                'exists:purchase_items,id'
            ],
            'items.*.received_quantity' => [
                'required',
                'integer',
                'min:0'
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * 獲取驗證錯誤的自定義訊息
     * 
     * @return array
     */
    public function messages()
    {
        return [
            'items.required' => '必須提供收貨項目',
            'items.min' => '至少需要一個收貨項目',
            'items.*.purchase_item_id.required' => '進貨項目ID是必需的',
            'items.*.purchase_item_id.exists' => '指定的進貨項目不存在',
            'items.*.received_quantity.required' => '收貨數量是必需的',
            'items.*.received_quantity.min' => '收貨數量不能為負數',
            'notes.max' => '備註不能超過1000個字符',
        ];
    }

    /**
     * 獲取自定義的屬性名稱
     * 
     * @return array
     */
    public function attributes()
    {
        return [
            'items' => '收貨項目',
            'items.*.purchase_item_id' => '進貨項目ID',
            'items.*.received_quantity' => '收貨數量',
            'notes' => '收貨備註',
        ];
    }

    /**
     * 配置驗證器實例
     * 
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $items = $this->input('items', []);
            
            foreach ($items as $index => $item) {
                if (!isset($item['purchase_item_id']) || !isset($item['received_quantity'])) {
                    continue;
                }
                
                // 驗證收貨數量不能超過訂購數量
                $purchaseItem = \App\Models\PurchaseItem::find($item['purchase_item_id']);
                
                if ($purchaseItem && $item['received_quantity'] > $purchaseItem->quantity) {
                    $validator->errors()->add(
                        "items.{$index}.received_quantity", 
                        "收貨數量不能超過訂購數量 ({$purchaseItem->quantity})"
                    );
                }
                
                // 檢查是否屬於同一個進貨單
                if ($purchaseItem && $purchaseItem->purchase_id !== $this->route('purchase')->id) {
                    $validator->errors()->add(
                        "items.{$index}.purchase_item_id", 
                        "該項目不屬於指定的進貨單"
                    );
                }
            }
        });
    }

    /**
     * 為 API 文檔提供請求體參數說明
     * 
     * @return array
     */
    public function bodyParameters()
    {
        return [
            'items' => [
                'description' => '收貨項目列表',
                'example' => [
                    [
                        'purchase_item_id' => 1,
                        'received_quantity' => 5
                    ],
                    [
                        'purchase_item_id' => 2,
                        'received_quantity' => 3
                    ]
                ]
            ],
            'items.*.purchase_item_id' => [
                'description' => '進貨項目ID',
                'example' => 1
            ],
            'items.*.received_quantity' => [
                'description' => '實際收貨數量',
                'example' => 5
            ],
            'notes' => [
                'description' => '收貨備註（可選）',
                'example' => '商品狀況良好，已完成驗收'
            ]
        ];
    }
} 