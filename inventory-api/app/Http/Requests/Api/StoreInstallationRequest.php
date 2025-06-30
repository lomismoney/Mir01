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
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
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
     * 為 Scribe 提供 API 文件所需的 body 參數
     */
    public function bodyParameters(): array
    {
        return [
            'order_id' => [
                'description' => '關聯的訂單 ID',
                'example' => null,
            ],
            'installer_user_id' => [
                'description' => '負責安裝的師傅用戶 ID',
                'example' => null,
            ],
            'customer_name' => [
                'description' => '客戶姓名',
                'example' => '王大明',
            ],
            'customer_phone' => [
                'description' => '客戶聯絡電話',
                'example' => '0912345678',
            ],
            'installation_address' => [
                'description' => '安裝地址',
                'example' => '台北市信義區信義路五段7號',
            ],
            'scheduled_date' => [
                'description' => '預計安裝日期 (Y-m-d)',
                'example' => now()->addDays(3)->toDateString(),
            ],
            'notes' => [
                'description' => '安裝單備註',
                'example' => '客戶希望下午時段安裝',
            ],
            'items' => [
                'description' => '安裝項目列表',
            ],
            'items.*.order_item_id' => [
                'description' => '關聯的訂單項目 ID (如果從訂單轉入)',
                'example' => null,
            ],
            'items.*.product_name' => [
                'description' => '商品名稱',
                'example' => 'A500 智能電子鎖',
            ],
            'items.*.sku' => [
                'description' => '商品 SKU',
                'example' => 'LOCK-A500-BLK',
            ],
            'items.*.quantity' => [
                'description' => '安裝數量',
                'example' => 1,
            ],
            'items.*.specifications' => [
                'description' => '商品規格描述',
                'example' => '黑色，右手開門',
            ],
            'items.*.notes' => [
                'description' => '單項目的備註',
                'example' => '需要特殊工具',
            ],
        ];
    }
} 