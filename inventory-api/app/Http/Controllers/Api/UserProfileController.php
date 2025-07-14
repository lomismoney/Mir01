<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class UserProfileController extends Controller
{
    /**
     * Get current user profile
     * 
     * @authenticated
     * @group User Profile
     * 
     * @response {
     *   "id": 1,
     *   "name": "John Doe",
     *   "email": "john@example.com",
     *   "is_admin": true,
     *   "created_at": "2024-01-01T00:00:00Z",
     *   "updated_at": "2024-01-01T00:00:00Z"
     * }
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * Update user profile
     * 
     * @authenticated
     * @group User Profile
     * 
     * @bodyParam name string required The user's name. Example: John Doe
     * 
     * @response {
     *   "id": 1,
     *   "name": "John Doe",
     *   "username": "johndoe",
     *   "is_admin": true,
     *   "created_at": "2024-01-01T00:00:00Z",
     *   "updated_at": "2024-01-01T00:00:00Z"
     * }
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
        ]);

        $request->user()->update($validated);

        return response()->json($request->user());
    }

    /**
     * Change user password
     * 
     * @authenticated
     * @group User Profile
     * 
     * @bodyParam current_password string required The current password. Example: oldpassword123
     * @bodyParam password string required The new password. Must be at least 8 characters. Example: newpassword123
     * @bodyParam password_confirmation string required Password confirmation. Example: newpassword123
     * 
     * @response {
     *   "message": "密碼已成功更新"
     * }
     * 
     * @response 422 {
     *   "message": "The given data was invalid.",
     *   "errors": {
     *     "current_password": ["當前密碼不正確"]
     *   }
     * }
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        return response()->json(['message' => '密碼已成功更新']);
    }
}
