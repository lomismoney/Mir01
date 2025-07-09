<?php

namespace App\Http\Requests\Api;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * 用戶創建請求驗證類別
 * 
 * 定義建立新用戶時需要驗證的規則，包含：
 * - 名稱：必填，字串，最大 255 字元
 * - 用戶名：必填，字串，最大 255 字元，在用戶表中必須唯一
 * - 密碼：必填，字串，最少 8 字元
 * - 角色：必填，必須是有效的角色值 (admin 或 viewer)
 *
 * @bodyParam name string required 用戶姓名。例如：張三
 * @bodyParam username string required 用戶名（唯一）。例如：zhangsan
 * @bodyParam password string required 用戶密碼（至少8個字元）。例如：password123
 * @bodyParam password_confirmation string required 確認密碼，必須與密碼欄位一致。例如：password123
 * @bodyParam roles array 角色陣列（可選）。例如：["admin"]
 * @bodyParam role string required 用戶角色，必須是 admin 或 viewer。例如：admin
 */
class StoreUserRequest extends FormRequest
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
     * 定義建立新用戶時所有必要欄位的驗證規則：
     * 1. name: 姓名必填且不超過 255 字元
     * 2. username: 用戶名必填且在系統中唯一
     * 3. password: 密碼必填且最少 8 字元（安全性考量）
     * 4. roles: 角色陣列（可選），必須是有效的角色
     * 
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
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
            'name.required' => '姓名為必填欄位',
            'name.string' => '姓名必須是文字格式',
            'name.max' => '姓名不能超過 255 個字元',
            
            'username.required' => '用戶名為必填欄位',
            'username.string' => '用戶名必須是文字格式',
            'username.max' => '用戶名不能超過 255 個字元',
            'username.unique' => '此用戶名已被使用，請選擇其他用戶名',
            
            'password.required' => '密碼為必填欄位',
            'password.string' => '密碼必須是文字格式',
            'password.min' => '密碼至少需要 8 個字元',
            'password.confirmed' => '兩次輸入的密碼不一致',
            
            'role.required' => '角色為必填欄位',
            'role.in' => '角色必須是管理員 (admin) 或檢視者 (viewer)',
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
            'password' => '密碼',
            'role' => '角色',
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
            'name' => [
                'description' => '用戶姓名',
                'example' => '張三',
                'required' => true,
            ],
            'username' => [
                'description' => '用戶名（唯一）',
                'example' => 'zhangsan',
                'required' => true,
            ],
            'password' => [
                'description' => '用戶密碼（至少8個字元）',
                'example' => 'password123',
                'required' => true,
            ],
            'password_confirmation' => [
                'description' => '確認密碼，必須與密碼欄位一致',
                'example' => 'password123',
                'required' => true,
            ],
            'roles' => [
                'description' => '用戶角色陣列',
                'example' => ['admin', 'staff'],
            ],
            'roles.*' => [
                'description' => '用戶角色，必須是有效的系統角色',
                'example' => 'admin',
            ],
            'role' => [
                'description' => '用戶角色，必須是 admin 或 viewer',
                'example' => 'admin',
                'required' => true,
            ],
        ];
    }
}
