<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

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
            'customer_phone' => ['sometimes', 'nullable', 'string', 'max:20'],
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
                // 移除 after:actual_start_time，改為在 withValidator 中處理
            ],
            'notes' => ['nullable', 'string'],
            
            // 安裝項目（僅當提供時才驗證）
            'items' => ['sometimes', 'array'],
            'items.*.id' => ['nullable', 'integer', 'exists:installation_items,id'],
            'items.*.product_variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
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
            
            // 驗證 actual_end_time 必須在 actual_start_time 之後
            if ($this->has('actual_end_time') && $this->actual_end_time) {
                // 決定要使用的 actual_start_time：優先使用請求中的值，否則使用資料庫中的值
                $startTime = null;
                
                if ($this->has('actual_start_time') && $this->actual_start_time) {
                    // 使用請求中的 actual_start_time
                    $startTime = \Carbon\Carbon::parse($this->actual_start_time);
                } elseif ($installation->actual_start_time) {
                    // 使用資料庫中已存在的 actual_start_time
                    $startTime = \Carbon\Carbon::parse($installation->actual_start_time);
                }
                
                // 如果有開始時間，檢查結束時間是否在開始時間之後
                if ($startTime) {
                    $endTime = \Carbon\Carbon::parse($this->actual_end_time);
                    
                    if ($endTime->lte($startTime)) {
                        $validator->errors()->add(
                            'actual_end_time', 
                            '結束時間必須晚於開始時間（' . $startTime->format('Y-m-d H:i:s') . '）'
                        );
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
            'installer_user_id' => [
                'description' => '負責安裝的師傅用戶 ID',
                'example' => 1,
            ],
            'customer_name' => [
                'description' => '客戶姓名',
                'example' => '王大明(更新)',
            ],
            'customer_phone' => [
                'description' => '客戶聯絡電話',
                'example' => '0987654321',
            ],
            'installation_address' => [
                'description' => '安裝地址',
                'example' => '新北市板橋區文化路一段1號',
            ],
            'status' => [
                'description' => '安裝狀態 (pending, scheduled, in_progress, completed, cancelled)',
                'example' => 'scheduled',
            ],
            'scheduled_date' => [
                'description' => '預計安裝日期 (Y-m-d)',
                'example' => now()->addDays(5)->toDateString(),
            ],
            'actual_start_time' => [
                'description' => '實際開始時間 (Y-m-d H:i:s)',
                'example' => null,
            ],
            'actual_end_time' => [
                'description' => '實際結束時間 (Y-m-d H:i:s)',
                'example' => null,
            ],
            'notes' => [
                'description' => '安裝單備註',
                'example' => '客戶更改安裝地址',
            ],
            'items' => [
                'description' => '安裝項目列表 (提供此參數時會同步所有項目)',
            ],
            'items.*.id' => [
                'description' => '要更新的安裝項目 ID (新項目則不提供)',
                'example' => 1,
            ],
            'items.*.product_name' => [
                'description' => '商品名稱',
                'example' => 'A500 智能電子鎖 (維修品)',
            ],
            'items.*.sku' => [
                'description' => '商品 SKU',
                'example' => 'LOCK-A500-BLK-R',
            ],
            'items.*.quantity' => [
                'description' => '安裝數量',
                'example' => 1,
            ],
            'items.*.specifications' => [
                'description' => '商品規格描述',
                'example' => '黑色，右手開門，已更換零件',
            ],
            'items.*.status' => [
                'description' => '項目狀態 (pending, completed)',
                'example' => 'pending',
            ],
            'items.*.notes' => [
                'description' => '單項目的備註',
                'example' => '此為維修後更換的項目',
            ],
        ];
    }
} 