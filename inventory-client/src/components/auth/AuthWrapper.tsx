'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLoading from './AuthLoading';
import type { ReactNode } from 'react';

/**
 * 認證包裹元件
 * 
 * 專門用於在伺服器元件中包裹需要認證的內容
 * 解決 Next.js App Router 中伺服器元件無法使用客戶端 HOC 的問題
 */
interface AuthWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthWrapper({ children, fallback }: AuthWrapperProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 當初始載入結束，並且使用者未認證時，重導向到登入頁
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // 正在驗證 Token，顯示載入畫面
  if (isLoading) {
    return fallback || <AuthLoading />;
  }

  // 驗證成功，正常渲染子元件
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // 在重導向生效前，不渲染任何東西，防止畫面閃爍
  return null;
} 