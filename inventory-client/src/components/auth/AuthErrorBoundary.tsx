"use client";

import React, { Component, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, LogIn } from "lucide-react";

interface AuthErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface AuthErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 身份驗證錯誤邊界組件（客戶端異常防護版本）
 * 
 * 🛡️ 功能特性：
 * 1. 捕獲身份驗證相關的客戶端錯誤
 * 2. 優雅的錯誤顯示和用戶引導
 * 3. 智能錯誤分類和處理建議
 * 4. 一鍵重試和重新登入功能
 * 5. 詳細的錯誤記錄供開發調試
 * 6. 防止錯誤傳播到上層組件
 * 
 * 🎯 主要處理的錯誤類型：
 * - useSession 相關錯誤
 * - 身份驗證狀態不一致
 * - NextAuth.js 客戶端異常
 * - 權限驗證失敗
 * - 網絡連接問題導致的認證錯誤
 * 
 * 使用方式：
 * ```tsx
 * <AuthErrorBoundary>
 *   <ProtectedComponent />
 * </AuthErrorBoundary>
 * ```
 */
export class AuthErrorBoundary extends Component<
  AuthErrorBoundaryProps,
  AuthErrorBoundaryState
> {
  constructor(props: AuthErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): AuthErrorBoundaryState {
    // 更新狀態，以便下一次渲染會顯示錯誤 UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 記錄錯誤詳情
    this.setState({
      error,
      errorInfo,
    });

    // 🔍 錯誤分析和記錄
    this.logError(error, errorInfo);
  }

  /**
   * 錯誤記錄和分析
   */
  private logError = (error: Error, errorInfo: React.ErrorInfo) => {
    // 組織錯誤資料用於記錄，確保所有值都是可序列化的
    const errorData = {
      message: error.message || "Unknown error",
      stack: error.stack || "No stack trace available",
      componentStack: errorInfo.componentStack || "No component stack available",
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== "undefined" ? (window.navigator?.userAgent || "unknown") : "unknown",
      url: typeof window !== "undefined" ? (window.location?.href || "unknown") : "unknown",
    };

    // 🔍 判斷是否為身份驗證相關錯誤
    const isAuthError = 
      error.message.includes("useSession") ||
      error.message.includes("auth") ||
      error.message.includes("session") ||
      error.message.includes("unauthorized") ||
      error.message.includes("unauthenticated");

    // 記錄錯誤資訊
    try {
      if (isAuthError) {
        console.error("Auth Error:", JSON.stringify(errorData, null, 2));
      } else {
        console.error("App Error:", JSON.stringify(errorData, null, 2));
      }
    } catch (logError) {
      // 如果序列化失敗，使用基本的日誌記錄
      try {
        console.error("Error logging failed, using basic log:", {
          message: error.message,
          name: error.name,
          timestamp: new Date().toISOString()
        });
      } catch (finalError) {
        console.error("Critical error logging failure:", error.message);
      }
    }
  };

  /**
   * 重試處理
   */
  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * 重新載入頁面
   */
  private handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  /**
   * 跳轉到登入頁
   */
  private handleGoToLogin = () => {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
  };

  /**
   * 錯誤類型分析
   */
  private analyzeError = () => {
    const { error } = this.state;
    if (!error) return "unknown";

    const message = error.message.toLowerCase();

    if (message.includes("usesession") || message.includes("session")) {
      return "session";
    }
    if (message.includes("auth") || message.includes("unauthorized")) {
      return "auth";
    }
    if (message.includes("network") || message.includes("fetch")) {
      return "network";
    }
    if (message.includes("permission") || message.includes("forbidden")) {
      return "permission";
    }

    return "general";
  };

  render() {
    if (this.state.hasError) {
      // 如果有自定義 fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorType = this.analyzeError();
      const { error } = this.state;

      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background">
          <div className="w-full max-w-md space-y-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>應用程式發生錯誤</AlertTitle>
              <AlertDescription>
                {errorType === "session" && "身份驗證狀態異常，請重新登入。"}
                {errorType === "auth" && "認證失敗，請檢查您的登入狀態。"}
                {errorType === "network" && "網路連接異常，請檢查網路連接。"}
                {errorType === "permission" && "權限不足，請確認您的訪問權限。"}
                {errorType === "general" && "應用程式發生未預期的錯誤。"}
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                重試
              </Button>

              {(errorType === "session" || errorType === "auth") && (
                <Button
                  onClick={this.handleGoToLogin}
                  className="w-full"
                  variant="outline"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  重新登入
                </Button>
              )}

              <Button
                onClick={this.handleReload}
                className="w-full"
                variant="secondary"
              >
                重新載入頁面
              </Button>
            </div>

            {process.env.NODE_ENV === "development" && error && (
              <Alert>
                <AlertTitle>開發者信息</AlertTitle>
                <AlertDescription className="text-xs font-mono">
                  <details>
                    <summary>錯誤詳情 (僅開發環境顯示)</summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words">
                      {error.message}
                      {error.stack && (
                        <>
                          <br />
                          <br />
                          堆疊追蹤：
                          <br />
                          {error.stack}
                        </>
                      )}
                    </pre>
                  </details>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * 身份驗證錯誤邊界的 Hook 版本（函數組件使用）
 * 
 * 由於 React 的錯誤邊界必須是類組件，這個 Hook 提供了
 * 程式化的錯誤處理功能。
 * 
 * @returns 錯誤處理相關的函數
 */
export function useAuthErrorHandler() {
  const handleAuthError = React.useCallback((error: Error) => {
    console.error("🔐 身份驗證錯誤:", error);
    
    // 如果是認證相關錯誤，重定向到登入頁
    if (
      error.message.includes("auth") ||
      error.message.includes("session") ||
      error.message.includes("unauthorized")
    ) {
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }, []);

  return { handleAuthError };
} 