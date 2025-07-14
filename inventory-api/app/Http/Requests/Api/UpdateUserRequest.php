<?php

namespace App\Http\Requests\Api;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 用戶更新請求驗證類別
 * 
 * 定義更新用戶時需要驗證的規則，包含：
 * - 名稱：可選更新，字串，最大 255 字元
 * - 用戶名：可選更新，字串，最大 255 字元，在用戶表中必須唯一（排除當前用戶）
 * - 密碼：可選更新，字串，最少 8 字元
 * - 角色：可選更新，必須是有效的角色值 (admin 或 viewer)
 * 
 * 所有欄位都使用 'sometimes' 規則，表示只有在請求中包含該欄位時才進行驗證
 */
class UpdateUserRequest extends FormRequest
{
    /**
     * 決定用戶是否有權限進行此請求
     * 
     * 返回 true 因為權限檢查已在 UserController 中透過 UserPolicy 處理
     * 此方法僅處理表單驗證，不負責業務邏輯權限控制
     * 
     * @return bool
     */
    public function authorize(): bool
    {
        return true; // 權限已在控制器中由 Policy 處理
    }

    /**
     * 取得適用於此請求的驗證規則
     * 
     * 定義更新用戶時的驗證規則，所有欄位都是可選的（部分更新支援）：
     * 1. name: 如果提供則必須是字串且不超過 255 字元
     * 2. username: 如果提供則必須是字串且在系統中唯一（排除當前用戶）
     * 3. password: 如果提供則必須是字串且最少 8 字元
     * 4. roles: 如果提供則必須是有效的角色陣列
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',
            // 驗證 username 唯一性時，必須忽略當前正在更新的用戶
            'username' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users')->ignore($this->user)],
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255', Rule::unique('users')->ignore($this->user)],
            'password' => 'sometimes|required|string|min:8|confirmed', // 密碼為可選更新，但一旦提供，則必須通過驗證
            'roles' => ['sometimes', 'array'],
            'roles.*' => ['string', Rule::in(array_keys(User::getAvailableRoles()))],
        ];
    }

    /**
     * 取得驗證錯誤的自定義訊息
     * 
     * 提供更友善的中文錯誤訊息，便於前端顯示給使用者
     * 
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => '姓名不能為空',
            'name.string' => '姓名必須是文字格式',
            'name.max' => '姓名不能超過 255 個字元',
            
            'username.required' => '用戶名不能為空',
            'username.string' => '用戶名必須是文字格式',
            'username.max' => '用戶名不能超過 255 個字元',
            'username.unique' => '此用戶名已被其他用戶使用，請選擇其他用戶名',
            
            'email.string' => '電子郵件必須是文字格式',
            'email.email' => '請輸入有效的電子郵件地址',
            'email.max' => '電子郵件不能超過 255 個字元',
            'email.unique' => '此電子郵件已被其他用戶使用',
            
            'password.required' => '密碼不能為空',
            'password.string' => '密碼必須是文字格式',
            'password.min' => '密碼至少需要 8 個字元',
            'password.confirmed' => '兩次輸入的密碼不一致',
            
            'roles.array' => '角色必須是陣列格式',
            'roles.*.in' => '角色必須是有效的系統角色',
        ];
    }

    /**
     * 取得驗證屬性的自定義名稱
     * 
     * 定義欄位的中文名稱，用於錯誤訊息顯示
     * 
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => '姓名',
            'username' => '用戶名',
            'email' => '電子郵件',
            'password' => '密碼',
            'roles' => '角色',
        ];
    }
    
    /**
     * 定義 API 文檔中的請求參數
     * 
     * 為 Scribe 提供詳細的參數說明，所有參數都是可選的
     * 
     * @return array<string, array<string, mixed>>
     */
    public function bodyParameters(): array
    {
        return [
            'name' => [
                'description' => '用戶姓名（可選更新）',
                'example' => 'John Doe',
            ],
            'username' => [
                'description' => '用戶帳號（可選更新）',
                'example' => 'johndoe',
            ],
            'email' => [
                'description' => '電子郵件地址（可選更新）',
                'example' => 'john@example.com',
                'required' => false,
            ],
            'password' => [
                'description' => '用戶密碼（可選更新，如不提供則保持原密碼）',
                'example' => 'newpassword123',
                'required' => false,
            ],
            'password_confirmation' => [
                'description' => '確認密碼，如果提供新密碼，此欄位為必填',
                'example' => 'newpassword123',
                'required' => false,
            ],
            'roles' => [
                'description' => '用戶角色陣列（可選更新）',
                'example' => ['admin', 'staff'],
                'type' => 'array',
            ],
            'roles.*' => [
                'description' => '用戶角色，必須是有效的系統角色',
                'example' => 'admin',
            ],
        ];
    }
}
