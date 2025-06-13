'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';

/**
 * 認證包裝器元件屬性介面
 */
interface AuthWrapperProps {
  /** 子元件 */
  children: ReactNode;
  /** 載入中的 fallback 元件 */
  fallback?: ReactNode;
  /** 重新導向的登入路徑 */
  redirectTo?: string;
}

/**
 * 認證包裝器元件
 * 
 * 功能特色：
 * 1. 自動檢查用戶認證狀態
 * 2. 未認證用戶自動重新導向至登入頁面
 * 3. 提供載入狀態的優雅處理
 * 4. 支援自定義載入 fallback 元件
 * 5. 符合 Next.js App Router 的最佳實踐
 * 
 * 使用方式：
 * ```tsx
 * <AuthWrapper fallback={<CustomSkeleton />}>
 *   <ProtectedComponent />
 * </AuthWrapper>
 * ```
 */
export function AuthWrapper({ 
  children, 
  fallback,
  redirectTo = '/login' 
}: AuthWrapperProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  /**
   * 認證狀態檢查和重新導向邏輯
   */
  useEffect(() => {
    // 如果還在載入中，不執行任何動作
    if (isLoading) return;

    // 如果用戶未認證，重新導向至登入頁面
    if (!user) {
      router.push(redirectTo);
      return;
    }
  }, [user, isLoading, router, redirectTo]);

  // 載入中狀態
  if (isLoading) {
    return fallback || <DataTableSkeleton showHeader={false} />;
  }

  // 未認證狀態（顯示載入中，等待重新導向）
  if (!user) {
    return fallback || <DataTableSkeleton showHeader={false} />;
  }

  // 已認證狀態，渲染子元件
  return <>{children}</>;
} 