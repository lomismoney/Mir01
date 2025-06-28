<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * 認證控制器
 * 
 * 負責處理使用者的登入、登出等認證相關功能
 * 使用 Laravel Sanctum 進行 API Token 管理
 */
class AuthController extends Controller
{
    /**
     * 處理使用者登入請求
     * 
     * 功能說明：
     * 1. 驗證輸入的使用者名稱和密碼
     * 2. 查找對應的使用者帳號
     * 3. 驗證密碼正確性
     * 4. 生成 Sanctum API Token
     * 5. 回傳使用者資訊和 Token
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        try {
            // 驗證輸入欄位
            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ]);

            // 根據使用者名稱查找使用者
            $user = User::where('username', $request->username)->first();

            // 檢查使用者是否存在且密碼正確
            if (! $user || ! Hash::check($request->password, $user->password)) {
                return new JsonResponse([
                    'message' => 'The given data was invalid.',
                    'errors' => [
                        'username' => ['您提供的憑證不正確。']
                    ]
                ], 422);
            }

            // 生成新的 API Token
            $token = $user->createToken('api-token')->plainTextToken;

            // 回傳使用者資訊和 Token
            return new JsonResponse([
                'user' => new UserResource($user),
                'token' => $token,
            ], 200);

        } catch (ValidationException $e) {
            // 處理驗證錯誤
            return new JsonResponse([
                'message' => 'The given data was invalid.',
                'errors' => $e->errors()
            ], 422);

        } catch (\Throwable $th) {
            // 記錄詳細錯誤供內部除錯
            Log::error('Authentication error: ' . $th->getMessage(), [
                'trace' => $th->getTraceAsString(),
                'request_data' => $request->only(['username'])
            ]);

            // 回傳一個標準化的、Scramble 可以理解的 JSON 響應
            return new JsonResponse([
                'message' => '伺服器內部錯誤，請稍後再試。'
            ], 500);
        }
    }

    /**
     * 處理使用者登出請求
     * 
     * 功能說明：
     * 1. 獲取當前認證的使用者
     * 2. 刪除當前請求使用的 API Token
     * 3. 回傳空內容響應 (204 No Content)
     * 
     * 安全特性：
     * - 僅刪除當前 Token，不影響使用者的其他活動 Token
     * - 確保精準的登出控制
     * 
     * @param Request $request
     * @return Response
     */
    public function logout(Request $request): Response
    {
        try {
            // 刪除當前使用的 Access Token
            $request->user()->currentAccessToken()->delete();

            // 回傳無內容響應，表示成功登出
            return response()->noContent();

        } catch (\Throwable $th) {
            // 記錄錯誤
            Log::error('Logout error: ' . $th->getMessage(), [
                'user_id' => $request->user()?->id,
                'trace' => $th->getTraceAsString()
            ]);

            // 即使登出失敗，也回傳成功（因為 Token 可能已經無效）
            return response()->noContent();
        }
    }
}
