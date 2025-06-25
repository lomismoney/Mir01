<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInstallationRequest extends FormRequest
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
        $installation = $this->route('installation');
        
        return [
            'installer_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'customer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'customer_phone' => ['sometimes', 'required', 'string', 'max:20'],
            'installation_address' => ['sometimes', 'required', 'string'],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'])
            ],
            'scheduled_date' => ['nullable', 'date', 'after_or_equal:today'],
            'actual_start_time' => ['nullable', 'date_format:Y-m-d H:i:s'],
            'actual_end_time' => [
                'nullable',
                'date_format:Y-m-d H:i:s',
                'after:actual_start_time'
            ],
            'notes' => ['nullable', 'string'],
            
            // 安裝項目（僅當提供時才驗證）
            'items' => ['sometimes', 'array'],
            'items.*.id' => ['nullable', 'integer', 'exists:installation_items,id'],
            'items.*.product_name' => ['required', 'string', 'max:255'],
            'items.*.sku' => ['required', 'string', 'max:100'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.specifications' => ['nullable', 'string'],
            'items.*.status' => ['sometimes', 'required', Rule::in(['pending', 'completed'])],
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
            'status.in' => '無效的安裝狀態',
            'scheduled_date.after_or_equal' => '預計安裝日期不能早於今天',
            'actual_start_time.date_format' => '開始時間格式不正確',
            'actual_end_time.date_format' => '結束時間格式不正確',
            'actual_end_time.after' => '結束時間必須晚於開始時間',
            'items.*.product_name.required' => '商品名稱為必填項目',
            'items.*.sku.required' => '商品編號為必填項目',
            'items.*.quantity.required' => '安裝數量為必填項目',
            'items.*.quantity.min' => '安裝數量必須至少為 1',
            'items.*.status.in' => '無效的項目狀態',
        ];
    }

    /**
     * 配置驗證器實例
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $installation = $this->route('installation');
            
            // 檢查狀態轉換的合法性
            if ($this->has('status')) {
                $currentStatus = $installation->status;
                $newStatus = $this->status;
                
                // 定義允許的狀態轉換
                $allowedTransitions = [
                    'pending' => ['scheduled', 'cancelled'],
                    'scheduled' => ['in_progress', 'cancelled'],
                    'in_progress' => ['completed', 'cancelled'],
                    'completed' => [], // 已完成不能轉換
                    'cancelled' => [], // 已取消不能轉換
                ];
                
                if (!in_array($newStatus, $allowedTransitions[$currentStatus] ?? [])) {
                    $validator->errors()->add('status', "無法從 {$currentStatus} 狀態轉換到 {$newStatus} 狀態");
                }
            }
            
            // 如果要更新為進行中，必須有開始時間
            if ($this->status === 'in_progress' && !$this->actual_start_time && !$installation->actual_start_time) {
                $validator->errors()->add('actual_start_time', '進行中狀態必須設定開始時間');
            }
            
            // 如果要更新為已完成，必須有結束時間
            if ($this->status === 'completed' && !$this->actual_end_time && !$installation->actual_end_time) {
                $validator->errors()->add('actual_end_time', '已完成狀態必須設定結束時間');
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
            'status' => [
                'description' => '安裝狀態（pending: 待處理, scheduled: 已排程, in_progress: 進行中, completed: 已完成, cancelled: 已取消）',
                'example' => 'scheduled',
            ],
            'scheduled_date' => [
                'description' => '預計安裝日期（可選，格式：Y-m-d）',
                'example' => '2025-06-25',
            ],
            'actual_start_time' => [
                'description' => '實際開始時間（可選，格式：Y-m-d H:i:s）',
                'example' => '2025-06-25 09:00:00',
            ],
            'actual_end_time' => [
                'description' => '實際結束時間（可選，格式：Y-m-d H:i:s）',
                'example' => '2025-06-25 12:00:00',
            ],
            'notes' => [
                'description' => '備註（可選）',
                'example' => '安裝順利完成',
            ],
            'items' => [
                'description' => '安裝項目陣列（可選）',
                'example' => [
                    [
                        'id' => 1,
                        'product_name' => '層架組合',
                        'sku' => 'SHELF-001',
                        'quantity' => 2,
                        'specifications' => '牆面安裝，高度 150cm',
                        'status' => 'completed',
                        'notes' => '已安裝完成',
                    ],
                ],
            ],
        ];
    }
} 