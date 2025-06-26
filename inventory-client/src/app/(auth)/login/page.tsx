"use client";

import { useActionState, useEffect } from "react";
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
import { loginAction } from "@/actions/auth";
import { toast } from "sonner";

/**
 * 登入頁面元件 (Auth.js + React 19 現代化版本)
 *
 * 使用 Auth.js 和 Server Actions 重構的登入頁面
 *
 * 核心特色：
 * 1. Server Actions - 伺服器端表單處理
 * 2. useActionState - React 19 現代化表單狀態管理
 * 3. Auth.js 整合 - 統一認證流程
 * 4. 自動重導向 - 登入成功後自動跳轉
 * 5. 錯誤處理 - 友善的錯誤訊息顯示
 * 6. 內建 Pending 狀態 - 自動載入中狀態管理
 *
 * 技術優勢：
 * - 內建 isPending 狀態，無需手動管理
 * - 無需 useState 儲存表單資料
 * - 伺服器端驗證，安全性更高
 * - 與 Auth.js 生態系統完美整合
 * - 符合 React 19 最佳實踐
 */
export default function LoginPage() {
  // 使用 useActionState Hook 處理 Server Action 的狀態 (React 19+)
  // state 包含從 Server Action 回傳的資料（如錯誤訊息）
  // formAction 是包裝後的 action 函式，會自動處理表單提交
  // isPending 提供內建的載入中狀態，無需手動管理
  const [state, formAction, isPending] = useActionState(loginAction, undefined);

  // 監聽 Server Action 的回傳狀態，顯示錯誤訊息
  useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">登入</CardTitle>
          <CardDescription>請輸入您的帳號密碼以登入系統。</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 
                            使用 Server Action 的表單
                            - action={formAction}: 將 Server Action 直接綁定到表單
                            - Next.js 會自動處理表單提交和資料傳遞
                            - 無需 onSubmit 事件處理器
                           */}
          <form action={formAction}>
            <div className="grid gap-4">
              {/* 使用者名稱輸入欄位 */}
              <div className="grid gap-2">
                <Label htmlFor="username">帳號</Label>
                <Input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="superadmin"
                  required
                />
              </div>

              {/* 密碼輸入欄位 */}
              <div className="grid gap-2">
                <Label htmlFor="password">密碼</Label>
                <Input id="password" type="password" name="password" required />
              </div>

              {/* 登入按鈕 - 使用 isPending 狀態控制載入中顯示 */}
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "登入中..." : "登入"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
