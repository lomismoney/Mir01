'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AuthLoading from './AuthLoading';
import type { ComponentType } from 'react';

export default function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  const WithAuthComponent = (props: P) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      // 當初始載入結束，並且使用者未認證時，重導向到登入頁
      if (!isLoading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, isLoading, router]);

    // 正在驗證 Token，顯示全頁載入畫面
    if (isLoading) {
      return <AuthLoading />;
    }

    // 驗證成功，正常渲染被包裹的頁面元件
    if (isAuthenticated) {
      return <WrappedComponent {...props} />;
    }

    // 在重導向生效前，不渲染任何東西，防止畫面閃爍
    return null;
  };

  // 為 HOC 提供一個顯示名稱，方便在 React DevTools 中除錯
  WithAuthComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
} 