<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

/**
 * 認證需求 Trait
 * 
 * 提供統一的用戶認證檢查功能，
 * 確保操作前用戶已登入並取得用戶ID。
 */
trait AuthenticationRequired
{
    /**
     * 取得當前認證用戶ID
     * 
     * @param string|null $customMessage 自定義錯誤訊息
     * @return int 用戶ID
     * @throws \InvalidArgumentException 當用戶未認證時
     */
    protected function requireAuthentication(?string $customMessage = null): int
    {
        $userId = Auth::id();
        
        if (!$userId) {
            $message = $customMessage ?? '用戶必須經過認證才能執行此操作';
            throw new \InvalidArgumentException($message);
        }
        
        return $userId;
    }
    
    /**
     * 檢查是否已認證（不拋出異常）
     * 
     * @return bool
     */
    protected function isAuthenticated(): bool
    {
        return Auth::check();
    }
    
    /**
     * 取得當前用戶或null
     * 
     * @return \Illuminate\Contracts\Auth\Authenticatable|null
     */
    protected function getCurrentUser()
    {
        return Auth::user();
    }
    
    /**
     * 取得當前用戶ID或預設值
     * 
     * @param int|null $default 預設值
     * @return int|null
     */
    protected function getUserIdOrDefault(?int $default = null): ?int
    {
        return Auth::id() ?? $default;
    }
    
    /**
     * 執行需要認證的操作
     * 
     * @param callable $callback 需要執行的回調函數
     * @param string|null $customMessage 自定義錯誤訊息
     * @return mixed 回調函數的返回值
     * @throws \InvalidArgumentException 當用戶未認證時
     */
    protected function executeAuthenticated(callable $callback, ?string $customMessage = null)
    {
        $userId = $this->requireAuthentication($customMessage);
        
        return $callback($userId);
    }
    
    /**
     * 檢查用戶是否有特定權限
     * 
     * @param string $permission 權限名稱
     * @param string|null $customMessage 自定義錯誤訊息
     * @return void
     * @throws \InvalidArgumentException 當用戶未認證或無權限時
     */
    protected function requirePermission(string $permission, ?string $customMessage = null): void
    {
        $user = $this->getCurrentUser();
        
        if (!$user) {
            throw new \InvalidArgumentException('用戶必須經過認證才能檢查權限');
        }
        
        if (!$user->can($permission)) {
            $message = $customMessage ?? "用戶沒有執行此操作的權限：{$permission}";
            throw new \InvalidArgumentException($message);
        }
    }
}