<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class StoreInstallationRequest extends FormRequest
{
    /**
     * 判斷用戶是否有權限發出此請求
     */
    public function authorize(): bool
    {
        return true; // 實際權限檢查在 Controller 中進行
    }

    /**
     * 獲取適用於該請求的驗證規則
     */
    public function rules(): array
    {
        return [
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
            'installer_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'customer_name' => ['required', 'string', 'max:255'],
            'customer_phone' => ['required', 'string', 'max:20'],
            'installation_address' => ['required', 'string'],
            'scheduled_date' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string'],
            
            // 安裝項目
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['nullable', 'integer', 'exists:order_items,id'],
            'items.*.product_name' => ['required', 'string', 'max:255'],
            'items.*.sku' => ['required', 'string', 'max:100'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.specifications' => ['nullable', 'string'],
            'items.*.notes' => ['nullable', 'string'],
        ];
    }

    /**
     * 獲取已定義驗證規則的錯誤訊息
     */
    public function messages(): array
    {
        return [
            'customer_name.required' => '客戶姓名為必填項目',
            'customer_phone.required' => '客戶電話為必填項目',
            'installation_address.required' => '安裝地址為必填項目',
            'scheduled_date.after_or_equal' => '預計安裝日期不能早於今天',
            'items.required' => '至少需要一個安裝項目',
            'items.min' => '至少需要一個安裝項目',
            'items.*.product_name.required' => '商品名稱為必填項目',
            'items.*.sku.required' => '商品編號為必填項目',
            'items.*.quantity.required' => '安裝數量為必填項目',
            'items.*.quantity.min' => '安裝數量必須至少為 1',
        ];
    }

    /**
     * 配置驗證器實例
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // 如果指定了 order_id，檢查安裝項目是否與訂單項目對應
            if ($this->order_id && $this->items) {
                foreach ($this->items as $index => $item) {
                    if (isset($item['order_item_id'])) {
                        // 驗證 order_item_id 是否屬於指定的訂單
                        $belongsToOrder = \App\Models\OrderItem::where('id', $item['order_item_id'])
                            ->where('order_id', $this->order_id)
                            ->exists();
                        
                        if (!$belongsToOrder) {
                            $validator->errors()->add(
                                "items.{$index}.order_item_id",
                                '指定的訂單項目不屬於該訂單'
                            );
                        }
                    }
                }
            }
        });
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
            'order_id' => [
                'description' => '關聯的訂單 ID（可選）',
                'example' => 1,
            ],
            'installer_user_id' => [
                'description' => '安裝師傅的用戶 ID（可選）',
                'example' => 3,
            ],
            'customer_name' => [
                'description' => '客戶姓名',
                'example' => '王小明',
            ],
            'customer_phone' => [
                'description' => '客戶電話',
                'example' => '0912345678',
            ],
            'installation_address' => [
                'description' => '安裝地址',
                'example' => '台北市大安區信義路四段1號',
            ],
            'scheduled_date' => [
                'description' => '預計安裝日期（可選，格式：Y-m-d）',
                'example' => '2025-06-25',
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '客戶希望下午安裝',
            ],
            'items' => [
                'description' => '安裝項目陣列',
                'example' => [
                    [
                        'order_item_id' => 1,
                        'product_name' => '層架組合',
                        'sku' => 'SHELF-001',
                        'quantity' => 2,
                        'specifications' => '牆面安裝，高度 150cm',
                        'notes' => '需要特殊固定器',
                    ],
                ],
            ],
        ];
    }
} 