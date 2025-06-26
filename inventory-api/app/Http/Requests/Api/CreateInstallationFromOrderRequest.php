<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class CreateInstallationFromOrderRequest extends FormRequest
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
            'order_id' => ['required', 'integer', 'exists:orders,id'],
            'installer_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'installation_address' => ['nullable', 'string'], // 可選，如果不提供則使用訂單地址
            'scheduled_date' => ['nullable', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string'],
            
            // 選擇要安裝的訂單項目
            'order_item_ids' => ['required', 'array', 'min:1'],
            'order_item_ids.*' => ['required', 'integer', 'exists:order_items,id'],
            
            // 可選的安裝規格（按訂單項目ID）
            'specifications' => ['nullable', 'array'],
            'specifications.*' => ['nullable', 'string'],
        ];
    }

    /**
     * 獲取已定義驗證規則的錯誤訊息
     */
    public function messages(): array
    {
        return [
            'order_id.required' => '訂單ID為必填項目',
            'order_id.exists' => '指定的訂單不存在',
            'scheduled_date.after_or_equal' => '預計安裝日期不能早於今天',
            'order_item_ids.required' => '請選擇要安裝的訂單項目',
            'order_item_ids.min' => '至少需要選擇一個訂單項目',
            'order_item_ids.*.exists' => '指定的訂單項目不存在',
        ];
    }

    /**
     * 配置驗證器實例
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            // 檢查所有選擇的訂單項目是否屬於指定的訂單
            if ($this->order_id && $this->order_item_ids) {
                $validItemIds = \App\Models\OrderItem::where('order_id', $this->order_id)
                    ->whereIn('id', $this->order_item_ids)
                    ->pluck('id')
                    ->toArray();
                
                $invalidIds = array_diff($this->order_item_ids, $validItemIds);
                
                if (!empty($invalidIds)) {
                    $validator->errors()->add(
                        'order_item_ids',
                        '部分訂單項目不屬於指定的訂單：' . implode(', ', $invalidIds)
                    );
                }
            }
            
            // 檢查訂單是否已經有相關的安裝單
            if ($this->order_id) {
                $existingInstallation = \App\Models\Installation::where('order_id', $this->order_id)
                    ->whereNotIn('status', ['cancelled'])
                    ->exists();
                
                if ($existingInstallation) {
                    $validator->errors()->add(
                        'order_id',
                        '此訂單已有相關的安裝單'
                    );
                }
            }
        });
    }
    

} 