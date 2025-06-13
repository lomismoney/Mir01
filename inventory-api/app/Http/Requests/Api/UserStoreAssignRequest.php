<?php

namespace App\Http\Requests\Api;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;

/**
 * 用戶分店分配請求驗證類別
 * 
 * @bodyParam store_ids array required 要分配給用戶的分店ID列表。例如：[1, 2, 3]
 * @bodyParam store_ids.* integer required 分店ID，必須存在於系統中。例如：1
 */
class UserStoreAssignRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // 只有管理員可以分配用戶到分店
        return $this->user() && $this->user()->isAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'store_ids' => ['required', 'array'],
            'store_ids.*' => ['required', 'exists:stores,id'],
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
            'store_ids.required' => '請選擇至少一間分店',
            'store_ids.array' => '分店必須以陣列形式提供',
            'store_ids.*.required' => '請提供有效的分店ID',
            'store_ids.*.exists' => '選擇的分店不存在',
        ];
    }

    /**
     * 取得請求的參數說明，用於 API 文檔生成
     *
     * @return array<string, array>
     */
    public function bodyParameters()
    {
        return [
            'store_ids' => [
                'description' => '要分配給用戶的分店ID列表',
                'example' => [1, 2, 3],
                'required' => true,
            ],
            'store_ids.*' => [
                'description' => '分店ID，必須存在於系統中',
                'example' => 1,
                'required' => true,
            ],
        ];
    }
}
