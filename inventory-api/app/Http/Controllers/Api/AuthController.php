<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * @group 認證管理
 * 
 * 認證控制器
 * 
 * 負責處理使用者的登入、登出等認證相關功能
 * 使用 Laravel Sanctum 進行 API Token 管理
 */
class AuthController extends Controller
{
    /**
     * @summary 處理使用者登入請求
     * @description 驗證使用者憑證，成功後返回使用者資訊和 API Token。
     *
     * @bodyParam username string required 使用者名稱 Example: superadmin
     * @bodyParam password string required 密碼 Example: password
     * 
     * @response 200 {
     *   "user": {
     *     "id": 1,
     *     "name": "Super Admin",
     *     "username": "superadmin",
     *     "email": "super@admin.com",
     *     "roles": ["admin"],
     *     "created_at": "2024-01-01T00:00:00.000000Z",
     *     "updated_at": "2024-01-01T00:00:00.000000Z",
     *     "stores": []
     *   },
     *   "token": "1|abcdefghijklmnopqrstuvwxyz"
     * }
     * 
     * @response 422 scenario="驗證失敗" {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "username": ["您提供的憑證不正確。"]
     *   }
     * }
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Illuminate\Validation\ValidationException
     * 
     * 功能說明：
     * 1. 驗證輸入的使用者名稱和密碼
     * 2. 查找對應的使用者帳號
     * 3. 驗證密碼正確性
     * 4. 生成 Sanctum API Token
     * 5. 回傳使用者資訊和 Token
     */
    public function login(Request $request)
    {
        // 驗證輸入欄位
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        // 根據使用者名稱查找使用者
        $user = User::where('username', $request->username)->first();

        // 檢查使用者是否存在且密碼正確
        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'username' => ['您提供的憑證不正確。'],
            ]);
        }

        // 生成新的 API Token
        $token = $user->createToken('api-token')->plainTextToken;

        // 回傳使用者資訊和 Token
        return response()->json([
            // 使用 UserResource 來格式化 user 物件
            'user' => new UserResource($user->load('stores')),
            'token' => $token,
        ]);
    }

    /**
     * @summary 處理使用者登出請求
     * @description 讓當前認證的使用者登出，並使其 API Token 失效。
     * 
     * @authenticated
     * 
     * @response 204 scenario="成功登出"
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     * 
     * 功能說明：
     * 1. 獲取當前認證的使用者
     * 2. 刪除當前請求使用的 API Token
     * 3. 回傳空內容響應 (204 No Content)
     * 
     * 安全特性：
     * - 僅刪除當前 Token，不影響使用者的其他活動 Token
     * - 確保精準的登出控制
     */
    public function logout(Request $request): Response
    {
        // 刪除當前使用的 Access Token
        $request->user()->currentAccessToken()->delete();

        // 回傳無內容響應，表示成功登出
        return response()->noContent();
    }
}
