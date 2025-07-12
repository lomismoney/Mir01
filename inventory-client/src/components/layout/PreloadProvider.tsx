"use client";

import React, { createContext, useContext, useEffect } from 'react';
import { useRoutePreloader, usePredictivePreloader } from '@/lib/apiPreloader';
import { usePathname } from 'next/navigation';

interface PreloadContextType {
  isPreloading: boolean;
  preloadedRoutes: Set<string>;
}

const PreloadContext = createContext<PreloadContextType>({
  isPreloading: false,
  preloadedRoutes: new Set(),
});

/**
 * API 預加載提供者
 * 
 * 在應用層級提供智能預加載功能
 */
export function PreloadProvider({ children }: { children: React.ReactNode }) {
  const [isPreloading, setIsPreloading] = React.useState(false);
  const [preloadedRoutes, setPreloadedRoutes] = React.useState<Set<string>>(new Set());
  const pathname = usePathname();

  // 啟用路由預加載
  useRoutePreloader();
  
  // 啟用預測性預加載
  usePredictivePreloader();

  // 追蹤當前路由
  useEffect(() => {
    if (pathname) {
      setPreloadedRoutes(prev => new Set(prev).add(pathname));
    }
  }, [pathname]);

  // 監聽預加載狀態（可選）
  useEffect(() => {
    // 可以在這裡添加全局預加載指示器邏輯
    const checkPreloadStatus = () => {
      // 檢查是否有正在進行的預加載
      setIsPreloading(false); // 實際實現需要與 apiPreloader 集成
    };

    const interval = setInterval(checkPreloadStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <PreloadContext.Provider value={{ isPreloading, preloadedRoutes }}>
      {children}
      
      {/* 預加載指示器（可選） */}
      {isPreloading && (
        <div className="fixed bottom-2 right-2 z-50">
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            預加載中...
          </div>
        </div>
      )}
    </PreloadContext.Provider>
  );
}

/**
 * 使用預加載上下文
 */
export function usePreloadContext() {
  return useContext(PreloadContext);
}