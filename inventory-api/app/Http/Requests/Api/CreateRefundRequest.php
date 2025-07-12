<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 創建退款請求驗證類
 * 
 * 驗證退款創建的所有必要欄位和業務規則：
 * 1. 基本欄位驗證
 * 2. 退款品項陣列驗證
 * 3. 業務邏輯約束檢查
 */
class CreateRefundRequest extends FormRequest
{
    /**
     * 確定使用者是否被授權提出此請求
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        // 假設所有已驗證的使用者都可以創建退款
        // 實際權限檢查可以在控制器或政策中進行
        return $this->user() !== null;
    }

    /**
     * 獲取適用於請求的驗證規則
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // 📝 退款基本資訊
            'reason' => [
                'required',
                'string',
                'min:10',
                'max:500'
            ],
            
            'notes' => [
                'nullable',
                'string',
                'max:1000'
            ],
            
            // 📦 庫存處理選項
            'should_restock' => [
                'required',
                'boolean'
            ],
            
            // 🛒 退款品項陣列
            'items' => [
                'required',
                'array',
                'min:1',
                'max:50' // 限制最多 50 個品項
            ],
            
            // 🔍 退款品項明細驗證
            'items.*.order_item_id' => [
                'required',
                'integer',
                'exists:order_items,id'
            ],
            
            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:999'
            ],
        ];
    }

    /**
     * 獲取驗證錯誤的自定義訊息
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // 退款原因訊息
            'reason.required' => '退款原因是必填項目',
            'reason.min' => '退款原因至少需要 10 個字符',
            'reason.max' => '退款原因不能超過 500 個字符',
            
            // 備註訊息
            'notes.max' => '備註不能超過 1000 個字符',
            
            // 庫存處理訊息
            'should_restock.required' => '必須指定是否將商品加回庫存',
            'should_restock.boolean' => '庫存處理選項必須是 true 或 false',
            
            // 退款品項陣列訊息
            'items.required' => '必須指定至少一個退款品項',
            'items.array' => '退款品項必須是陣列格式',
            'items.min' => '必須選擇至少一個退款品項',
            'items.max' => '退款品項不能超過 50 個',
            
            // 品項詳細驗證訊息
            'items.*.order_item_id.required' => '訂單品項 ID 是必填項目',
            'items.*.order_item_id.integer' => '訂單品項 ID 必須是整數',
            'items.*.order_item_id.exists' => '指定的訂單品項不存在',
            
            'items.*.quantity.required' => '退貨數量是必填項目',
            'items.*.quantity.integer' => '退貨數量必須是整數',
            'items.*.quantity.min' => '退貨數量必須大於 0',
            'items.*.quantity.max' => '退貨數量不能超過 999',
        ];
    }

    /**
     * 獲取驗證欄位的自定義屬性名稱
     * 
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'reason' => '退款原因',
            'notes' => '備註',
            'should_restock' => '庫存處理',
            'items' => '退款品項',
            'items.*.order_item_id' => '訂單品項',
            'items.*.quantity' => '退貨數量',
        ];
    }

    /**
     * 配置驗證實例
     * 
     * 新增自定義驗證規則，檢查退款品項是否屬於當前訂單
     * 
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $this->validateRefundItems($validator);
        });
    }

    /**
     * 驗證退款品項的業務邏輯
     * 
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    protected function validateRefundItems($validator): void
    {
        $order = $this->route('order'); // 從路由獲取訂單
        $items = $this->input('items', []);
        
        if (!$order || empty($items)) {
            return;
        }
        
        // 獲取訂單的所有品項 ID
        $orderItemIds = $order->items->pluck('id')->toArray();
        
        foreach ($items as $index => $item) {
            $orderItemId = $item['order_item_id'] ?? null;
            
            // 檢查品項是否屬於當前訂單
            if (!in_array($orderItemId, $orderItemIds)) {
                $validator->errors()->add(
                    "items.{$index}.order_item_id",
                    "訂單品項 {$orderItemId} 不屬於當前訂單"
                );
                continue;
            }
            
            // 檢查重複的品項
            $duplicateCount = collect($items)->where('order_item_id', $orderItemId)->count();
            if ($duplicateCount > 1) {
                $validator->errors()->add(
                    "items.{$index}.order_item_id",
                    "不能對同一個品項重複申請退款"
                );
            }
        }
    }

    /**
     * 準備資料進行驗證
     * 
     * 在驗證之前清理和標準化資料
     * 
     * @return void
     */
    protected function prepareForValidation(): void
    {
        // 確保 should_restock 是布林值
        if ($this->has('should_restock')) {
            $this->merge([
                'should_restock' => filter_var($this->should_restock, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false
            ]);
        }
        
        // 清理和標準化品項資料
        if ($this->has('items') && is_array($this->items)) {
            $cleanedItems = [];
            
            foreach ($this->items as $item) {
                if (is_array($item) && isset($item['order_item_id'], $item['quantity'])) {
                    $cleanedItems[] = [
                        'order_item_id' => (int) $item['order_item_id'],
                        'quantity' => (int) $item['quantity']
                    ];
                }
            }
            
            $this->merge(['items' => $cleanedItems]);
        }
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
            'reason' => [
                'description' => '退款原因（至少 10 個字符）',
                'example' => '商品有瑕疵，客戶要求退貨',
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '客戶於 2025-06-24 來電申請退貨',
            ],
            'should_restock' => [
                'description' => '是否將退貨商品加回庫存',
                'example' => true,
            ],
            'items' => [
                'description' => '退款品項陣列',
                'example' => [
                    [
                        'order_item_id' => 1,
                        'quantity' => 2,
                    ],
                    [
                        'order_item_id' => 2,
                        'quantity' => 1,
                    ],
                ],
            ],
            'items.*.order_item_id' => [
                'description' => '要退款的訂單項目 ID',
                'example' => 1,
            ],
            'items.*.quantity' => [
                'description' => '退款數量',
                'example' => 2,
            ],
        ];
    }
}
