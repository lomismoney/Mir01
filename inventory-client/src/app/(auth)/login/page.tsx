"use client";

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { loginAction } from "@/actions/auth";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";

// 提交按鈕組件（需要在表單內使用 useFormStatus）
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type="submit"
      className="w-full relative"
      disabled={pending}
      size="lg"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          登入中...
        </>
      ) : (
        "登入"
      )}
    </Button>
  );
}

/**
 * 簡化版登入頁面
 * 
 * 使用標準的 Server Action 流程：
 * 1. 表單使用 action 屬性
 * 2. Server Action 處理驗證和重定向
 * 3. 使用 useActionState 處理錯誤狀態
 * 4. 使用 useFormStatus 處理載入狀態
 */
export default function LoginPage() {
  const [state, formAction] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-muted/20 to-muted/40">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-[1000px] h-[1000px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-[1000px] h-[1000px] rounded-full bg-primary/5 blur-3xl" />
      </div>
      
      <Card className="w-full max-w-sm relative z-10 shadow-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">
            歡迎回來
          </CardTitle>
          <CardDescription>
            請輸入您的帳號密碼以登入系統
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 錯誤訊息顯示 */}
          {state?.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          
          <form action={formAction}>
            <div className="grid gap-4">
              {/* 帳號輸入欄位 */}
              <div className="grid gap-2">
                <Label htmlFor="username">帳號</Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    name="username"
                    placeholder="請輸入您的帳號"
                    required
                    className="pr-10"
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* 密碼輸入欄位 */}
              <div className="grid gap-2">
                <Label htmlFor="password">密碼</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="請輸入您的密碼"
                    required
                    className="pr-10"
                    autoComplete="current-password"
                  />
                  {/* 密碼顯示/隱藏切換按鈕 */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "隱藏密碼" : "顯示密碼"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>

              {/* 記住我選項 */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  name="rememberMe"
                  value="true"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  aria-label="記住我的登入狀態"
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                >
                  記住我
                </Label>
              </div>

              {/* 登入按鈕 */}
              <SubmitButton />
            </div>
          </form>

          {/* 友善提示 */}
          <div className="mt-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              預設帳號：superadmin
            </p>
            <p className="text-xs text-muted-foreground">
              提示：勾選「記住我」可保持登入狀態 30 天
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}