'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * 登入表單元件（內部元件）
 */
function LoginForm() {
  // 表單狀態管理
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 認證和路由 Hooks
  const { login, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 獲取 redirect 參數
  const redirectPath = searchParams.get('redirect') || '/dashboard';
  
  // 已登入用戶自動重定向
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectPath);
    }
  }, [isAuthenticated, redirectPath, router]);

  /**
   * 處理登入表單提交
   * 
   * @param e - 表單提交事件
   * 
   * 功能流程：
   * 1. 防止表單預設提交行為
   * 2. 設定提交中狀態
   * 3. 呼叫 AuthContext 的 login 方法
   * 4. 成功時重導向到原始請求頁面或儀表板
   * 5. 錯誤處理由 AuthContext 統一管理
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // 使用 AuthContext 的統一登入方法
      await login({ username, password });
      
      // 登入成功，重導向到原始請求頁面或儀表板
      router.push(redirectPath);
    } catch {
      // 錯誤處理已在 AuthContext 中統一管理
      // 錯誤已透過 toast 顯示給用戶，此處不需要額外處理
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">登入</CardTitle>
          <CardDescription>
            請輸入您的帳號密碼以登入系統。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-4">
              {/* 使用者名稱輸入欄位 */}
              <div className="grid gap-2">
                <Label htmlFor="username">帳號</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="superadmin"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              {/* 密碼輸入欄位 */}
              <div className="grid gap-2">
                <Label htmlFor="password">密碼</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              
              {/* 登入按鈕 - 根據提交狀態顯示不同文字和停用狀態 */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? '登入中...' : '登入'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 登入頁面元件
 * 
 * 功能特色：
 * 1. 響應式登入表單設計
 * 2. 即時表單驗證
 * 3. 整合 AuthContext 的統一認證邏輯
 * 4. 自動重導向功能
 * 5. 無障礙支援 (Label 關聯、鍵盤導航)
 * 6. 支援 redirect 參數，登入後跳轉到原始請求頁面
 * 7. 使用 Suspense 邊界包裝 useSearchParams
 */
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-muted/40">
        <Card className="w-full max-w-sm">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">載入中...</div>
          </CardContent>
        </Card>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
} 