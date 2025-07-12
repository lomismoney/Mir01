import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useCallback } from 'react';
import React from 'react';
import { queryKeys } from '@/hooks/queries/shared/queryKeys';
import { apiClient } from './apiClient';
import { getPreloadStrategyForRoute, sortByPriority } from './apiPreloadStrategies';

// 預加載配置
interface PreloadConfig {
  routes: Record<string, PreloadStrategy[]>;
  defaultStrategy?: PreloadStrategy;
  maxPreloads?: number; // 最大同時預加載數
  delay?: number; // 預加載延遲（毫秒）
}

// 預加載策略
interface PreloadStrategy {
  queryKey: readonly unknown[];
  queryFn: () => Promise<any>;
  staleTime?: number;
  priority?: 'high' | 'medium' | 'low';
}

// 默認預加載配置
const defaultPreloadConfig: PreloadConfig = {
  routes: {}, // 使用 apiPreloadStrategies.ts 中的策略
  maxPreloads: 3,
  delay: 100,
};

/**
 * API 預加載管理器
 */
class ApiPreloader {
  private config: PreloadConfig;
  private preloadQueue: Set<string> = new Set();
  private activePreloads = 0;

  constructor(config: PreloadConfig = defaultPreloadConfig) {
    this.config = { ...defaultPreloadConfig, ...config };
  }

  /**
   * 預加載路由資源
   */
  async preloadRoute(
    route: string,
    queryClient: any,
    options?: {
      force?: boolean; // 強制預加載，忽略緩存
      priority?: 'high' | 'medium' | 'low'; // 覆蓋預設優先級
    }
  ) {
    // 優先使用動態策略，否則使用配置中的策略
    const strategies = getPreloadStrategyForRoute(route) || this.config.routes[route] || [];
    
    if (strategies.length === 0) return;

    // 按優先級排序
    const sortedStrategies = strategies;

    // 執行預加載
    for (const strategy of sortedStrategies) {
      const key = JSON.stringify(strategy.queryKey);
      
      // 檢查是否已在隊列中
      if (this.preloadQueue.has(key) && !options?.force) {
        continue;
      }

      // 檢查是否已有緩存且未過期
      if (!options?.force) {
        const data = queryClient.getQueryData(strategy.queryKey);
        const state = queryClient.getQueryState(strategy.queryKey);
        
        if (data && state && !state.isInvalidated) {
          const dataAge = Date.now() - state.dataUpdatedAt;
          if (dataAge < (strategy.staleTime || 0)) {
            continue; // 數據還新鮮，跳過預加載
          }
        }
      }

      // 等待有空間執行
      while (this.activePreloads >= (this.config.maxPreloads || 3)) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // 執行預加載
      this.preloadQueue.add(key);
      this.activePreloads++;

      queryClient.prefetchQuery({
        queryKey: strategy.queryKey,
        queryFn: strategy.queryFn,
        staleTime: strategy.staleTime,
      }).finally(() => {
        this.activePreloads--;
        this.preloadQueue.delete(key);
      });

      // 延遲下一個請求
      if (this.config.delay) {
        await new Promise(resolve => setTimeout(resolve, this.config.delay));
      }
    }
  }

  /**
   * 預加載鄰近路由
   */
  async preloadAdjacentRoutes(
    currentRoute: string,
    queryClient: any,
    adjacentRoutes: string[]
  ) {
    // 低優先級預加載相鄰路由
    for (const route of adjacentRoutes) {
      if (route !== currentRoute && this.config.routes[route]) {
        // 延遲預加載鄰近路由
        setTimeout(() => {
          this.preloadRoute(route, queryClient, { priority: 'low' });
        }, 1000);
      }
    }
  }

  /**
   * 根據用戶行為預測預加載
   */
  predictivePreload(
    element: HTMLElement,
    route: string,
    queryClient: any
  ) {
    let preloadTimeout: NodeJS.Timeout;

    const handleMouseEnter = () => {
      // 鼠標懸停時預加載
      preloadTimeout = setTimeout(() => {
        this.preloadRoute(route, queryClient);
      }, 200); // 200ms 延遲避免誤觸
    };

    const handleMouseLeave = () => {
      clearTimeout(preloadTimeout);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    // 返回清理函數
    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(preloadTimeout);
    };
  }
}

// 創建默認實例
export const apiPreloader = new ApiPreloader();

/**
 * 路由預加載 Hook
 * 
 * 在路由變化時自動預加載相關資源
 */
export function useRoutePreloader() {
  const queryClient = useQueryClient();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentPath = window.location.pathname;
    
    // 預加載當前路由資源
    apiPreloader.preloadRoute(currentPath, queryClient);

    // 預加載可能的下一個路由
    const adjacentRoutes = getAdjacentRoutes(currentPath);
    apiPreloader.preloadAdjacentRoutes(currentPath, queryClient, adjacentRoutes);
  }, [queryClient]);
}

/**
 * 預測性預加載 Hook
 * 
 * 根據用戶行為預加載可能訪問的資源
 */
export function usePredictivePreloader() {
  const queryClient = useQueryClient();

  const setupLinkPreloader = useCallback((linkElement: HTMLAnchorElement) => {
    const href = linkElement.getAttribute('href');
    if (!href || !href.startsWith('/')) return;

    return apiPreloader.predictivePreload(linkElement, href, queryClient);
  }, [queryClient]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 為所有內部鏈接設置預加載
    const links = document.querySelectorAll('a[href^="/"]');
    const cleanups: (() => void)[] = [];

    links.forEach(link => {
      const cleanup = setupLinkPreloader(link as HTMLAnchorElement);
      if (cleanup) cleanups.push(cleanup);
    });

    return () => {
      cleanups.forEach(cleanup => cleanup());
    };
  }, [setupLinkPreloader]);
}

/**
 * 手動預加載 Hook
 * 
 * 提供手動觸發預加載的方法
 */
export function useManualPreloader() {
  const queryClient = useQueryClient();

  const preload = useCallback((route: string, force = false) => {
    return apiPreloader.preloadRoute(route, queryClient, { force });
  }, [queryClient]);

  const preloadMultiple = useCallback((routes: string[]) => {
    return Promise.all(
      routes.map(route => apiPreloader.preloadRoute(route, queryClient))
    );
  }, [queryClient]);

  return { preload, preloadMultiple };
}

// 輔助函數：獲取相鄰路由
function getAdjacentRoutes(currentPath: string): string[] {
  const routeMap: Record<string, string[]> = {
    '/dashboard': ['/orders', '/products'],
    '/products': ['/products/new', '/inventory'],
    '/orders': ['/orders/new', '/customers'],
    '/customers': ['/customers/new', '/orders'],
    '/inventory': ['/inventory/incoming', '/products'],
  };

  return routeMap[currentPath] || [];
}

/**
 * 智能預加載組件
 * 
 * 包裝組件以提供智能預加載功能
 */
export function SmartPreloadLink({
  href,
  children,
  className,
  preloadDelay = 200,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  preloadDelay?: number;
  [key: string]: any;
}) {
  const queryClient = useQueryClient();
  const preloadTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    preloadTimeoutRef.current = setTimeout(() => {
      apiPreloader.preloadRoute(href, queryClient);
    }, preloadDelay);
  };

  const handleMouseLeave = () => {
    if (preloadTimeoutRef.current) {
      clearTimeout(preloadTimeoutRef.current);
    }
  };

  React.useEffect(() => {
    return () => {
      if (preloadTimeoutRef.current) {
        clearTimeout(preloadTimeoutRef.current);
      }
    };
  }, []);

  return (
    <a
      href={href}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </a>
  );
}