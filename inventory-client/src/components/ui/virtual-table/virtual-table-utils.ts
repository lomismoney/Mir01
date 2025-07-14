import { useMemo, useCallback, useRef, useEffect } from 'react';
import type { VirtualizationConfig, PerformanceMetrics } from './types';

/**
 * 虛擬化表格的性能優化 Hook
 */
export function useVirtualizedTablePerformance<TData>(
  data: TData[],
  options: {
    enableMetrics?: boolean;
    onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  } = {}
) {
  const { enableMetrics = true, onMetricsUpdate } = options;
  const renderTimeRef = useRef<number>(0);
  
  // 數據記憶化
  const memoizedData = useMemo(() => data, [data]);
  
  // 計算性能指標
  const performanceMetrics = useMemo<PerformanceMetrics>(() => {
    const totalItems = data.length;
    const visibleItems = Math.min(20, totalItems); // 估計可見項目數
    const isLargeDataset = totalItems > 1000;
    const recommendVirtualization = totalItems > 100;
    
    // 計算記憶體節省百分比
    let estimatedMemorySaving = '0%';
    if (recommendVirtualization && totalItems > visibleItems) {
      const savingPercentage = Math.round(
        ((totalItems - visibleItems) / totalItems) * 100
      );
      estimatedMemorySaving = `${savingPercentage}%`;
    }
    
    return {
      totalItems,
      visibleItems,
      isLargeDataset,
      recommendVirtualization,
      estimatedMemorySaving,
      renderTime: renderTimeRef.current,
    };
  }, [data.length]);
  
  // 性能監控
  useEffect(() => {
    if (enableMetrics) {
      const startTime = performance.now();
      
      // 使用 requestAnimationFrame 確保在渲染後測量
      requestAnimationFrame(() => {
        renderTimeRef.current = performance.now() - startTime;
        
        if (onMetricsUpdate) {
          onMetricsUpdate({
            ...performanceMetrics,
            renderTime: renderTimeRef.current,
          });
        }
      });
    }
  }, [memoizedData, enableMetrics, onMetricsUpdate, performanceMetrics]);

  return {
    data: memoizedData,
    performanceMetrics,
  };
}

/**
 * 虛擬化配置工廠函數
 * 根據數據量自動調整配置以獲得最佳性能
 */
export function createVirtualizationConfig(
  dataLength: number,
  options: Partial<VirtualizationConfig> = {}
): VirtualizationConfig {
  // 基礎配置
  let config: VirtualizationConfig = {
    containerHeight: 600,
    estimateSize: 50,
    overscan: 5,
    enableDebug: false,
  };
  
  // 根據數據量自動調整配置
  if (dataLength > 50000) {
    // 超大數據集：最小化 overscan，增加容器高度
    config = {
      containerHeight: 800,
      estimateSize: 40,
      overscan: 2,
      enableDebug: true,
    };
  } else if (dataLength > 10000) {
    // 大數據集：平衡性能和用戶體驗
    config = {
      containerHeight: 700,
      estimateSize: 45,
      overscan: 3,
      enableDebug: false,
    };
  } else if (dataLength > 1000) {
    // 中等數據集：標準配置
    config = {
      containerHeight: 600,
      estimateSize: 50,
      overscan: 5,
      enableDebug: false,
    };
  } else if (dataLength > 100) {
    // 小數據集：提高 overscan 以改善體驗
    config = {
      containerHeight: 500,
      estimateSize: 55,
      overscan: 8,
      enableDebug: false,
    };
  } else {
    // 極小數據集：可能不需要虛擬化，但仍提供配置
    config = {
      containerHeight: 400,
      estimateSize: 60,
      overscan: 10,
      enableDebug: false,
    };
  }
  
  // 合併用戶自定義選項
  return { ...config, ...options };
}

/**
 * 計算最佳的容器高度
 * 基於視窗高度和其他UI元素
 */
export function calculateOptimalContainerHeight(
  windowHeight: number,
  options: {
    headerHeight?: number;
    footerHeight?: number;
    padding?: number;
    minHeight?: number;
    maxHeight?: number;
  } = {}
): number {
  const {
    headerHeight = 100,
    footerHeight = 50,
    padding = 40,
    minHeight = 400,
    maxHeight = 800,
  } = options;
  
  const availableHeight = windowHeight - headerHeight - footerHeight - padding;
  
  // 確保高度在合理範圍內
  return Math.max(minHeight, Math.min(maxHeight, availableHeight));
}

/**
 * 虛擬化滾動位置管理 Hook
 */
export function useVirtualScrollPosition(key: string) {
  const scrollPositions = useRef<Map<string, { top: number; left: number }>>(
    new Map()
  );
  
  const saveScrollPosition = useCallback((top: number, left: number) => {
    scrollPositions.current.set(key, { top, left });
  }, [key]);
  
  const restoreScrollPosition = useCallback(() => {
    return scrollPositions.current.get(key) || { top: 0, left: 0 };
  }, [key]);
  
  const clearScrollPosition = useCallback(() => {
    scrollPositions.current.delete(key);
  }, [key]);
  
  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollPosition,
  };
}