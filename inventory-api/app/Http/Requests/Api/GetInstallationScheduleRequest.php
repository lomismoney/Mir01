<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class GetInstallationScheduleRequest extends FormRequest
{
    /**
     * 判斷用戶是否有權限執行此請求
     *
     * @return bool
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 取得驗證規則
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'installer_user_id' => ['required', 'integer', 'exists:users,id'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date']
        ];
    }

    /**
     * 定義查詢參數
     * 
     * @return array
     */
    public function queryParameters(): array
    {
        return [
            'installer_user_id' => [
                'description' => '安裝師傅的用戶ID',
                'example' => 1,
            ],
            'start_date' => [
                'description' => '起始日期（格式：Y-m-d）',
                'example' => '2025-06-01',
            ],
            'end_date' => [
                'description' => '結束日期（格式：Y-m-d）',
                'example' => '2025-06-30',
            ],
        ];
    }
} 