"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { PerformanceDashboard } from '@/components/dev/PerformanceDashboard';
import { PerformanceIndicator } from '@/components/ui/PerformanceMonitor';

// 性能監控上下文
interface PerformanceContextType {
  isDevMode: boolean;
  showDashboard: boolean;
  showIndicator: boolean;
  toggleDashboard: () => void;
  toggleIndicator: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

// 檢查是否為開發模式
const isDevelopment = process.env.NODE_ENV === 'development';
const isDebugMode = typeof window !== 'undefined' && 
  (window.location.search.includes('debug=true') || 
   localStorage.getItem('performance-debug') === 'true');

/**
 * 性能監控提供者
 * 
 * 在應用根層級提供性能監控功能
 * 只在開發模式或調試模式下啟用
 */
export function PerformanceProvider({ children }: { children: React.ReactNode }) {
  const [showDashboard, setShowDashboard] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);

  useEffect(() => {
    // 設定開發模式
    setIsDevMode(isDevelopment || isDebugMode);
    
    // 如果是開發模式，預設顯示性能指示器
    if (isDevelopment || isDebugMode) {
      setShowIndicator(true);
    }

    // 監聽鍵盤快捷鍵
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + P 開啟性能面板
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setShowDashboard(prev => !prev);
      }
      
      // Ctrl/Cmd + Shift + I 切換性能指示器
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        setShowIndicator(prev => !prev);
      }
    };

    if (isDevMode) {
      window.addEventListener('keydown', handleKeyDown);
      
      // 全局錯誤計數器（用於性能監控）
      let errorCount = 0;
      const originalConsoleError = console.error;
      console.error = (...args) => {
        errorCount++;
        (window as any).__performanceErrorCount = errorCount;
        originalConsoleError(...args);
      };

      window.addEventListener('error', () => {
        errorCount++;
        (window as any).__performanceErrorCount = errorCount;
      });

      window.addEventListener('unhandledrejection', () => {
        errorCount++;
        (window as any).__performanceErrorCount = errorCount;
      });

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        console.error = originalConsoleError;
      };
    }
  }, [isDevelopment, isDebugMode]);

  const toggleDashboard = () => setShowDashboard(prev => !prev);
  const toggleIndicator = () => setShowIndicator(prev => !prev);

  const contextValue: PerformanceContextType = {
    isDevMode,
    showDashboard,
    showIndicator,
    toggleDashboard,
    toggleIndicator,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      
      {/* 性能監控組件 - 只在開發模式顯示 */}
      {isDevMode && (
        <>
          {showDashboard && <PerformanceDashboard />}
          {showIndicator && <PerformanceIndicator />}
        </>
      )}
      
      {/* 開發模式提示 */}
      {isDevMode && !showDashboard && (
        <div className="fixed bottom-2 left-2 z-40 text-xs text-muted-foreground bg-black/60 text-white px-2 py-1 rounded">
          Dev Mode | Ctrl+Shift+P 性能面板 | Ctrl+Shift+I 指示器
        </div>
      )}
    </PerformanceContext.Provider>
  );
}

/**
 * 使用性能監控上下文的 Hook
 */
export function usePerformanceContext() {
  const context = useContext(PerformanceContext);
  if (context === undefined) {
    throw new Error('usePerformanceContext must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * 性能監控 HOC
 * 
 * 為組件包裝性能追蹤功能
 */
export function withPerformanceTracking<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  const WithPerformanceTracking = (props: P) => {
    const { isDevMode } = usePerformanceContext();
    
    useEffect(() => {
      if (!isDevMode) return;
      
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        
        // 記錄到性能數據中
        if (renderTime > 16) { // 超過一幀的時間
          console.log(`[Performance] ${displayName} render time: ${renderTime.toFixed(2)}ms`);
        }
      };
    });
    
    return <WrappedComponent {...props} />;
  };
  
  WithPerformanceTracking.displayName = `withPerformanceTracking(${displayName})`;
  
  return WithPerformanceTracking;
}