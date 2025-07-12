import { useState, useEffect, useCallback, useRef } from 'react';

// 性能追蹤數據介面
interface PerformanceData {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// 性能追蹤配置
interface PerformanceTrackingConfig {
  enabled: boolean;
  autoTrack: boolean;
  maxEntries: number;
  categories: string[];
}

// 預設配置
const defaultConfig: PerformanceTrackingConfig = {
  enabled: true,
  autoTrack: true,
  maxEntries: 100,
  categories: ['component', 'api', 'render', 'interaction'],
};

/**
 * 性能追蹤 Hook
 * 
 * 提供細粒度的性能追蹤功能，可以追蹤：
 * - 組件渲染時間
 * - API 調用時間
 * - 用戶互動響應時間
 * - 自定義操作時間
 */
export function usePerformanceTracking(config: Partial<PerformanceTrackingConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };
  const [entries, setEntries] = useState<PerformanceData[]>([]);
  const [isTracking, setIsTracking] = useState(finalConfig.enabled);
  const activeTracking = useRef<Map<string, PerformanceData>>(new Map());

  // 開始追蹤
  const startTracking = useCallback((name: string, category = 'general', metadata?: Record<string, any>) => {
    if (!isTracking) return '';

    const id = `${category}_${name}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const performanceData: PerformanceData = {
      id,
      name: `[${category}] ${name}`,
      startTime: performance.now(),
      metadata,
    };

    activeTracking.current.set(id, performanceData);
    return id;
  }, [isTracking]);

  // 結束追蹤
  const endTracking = useCallback((id: string, additionalMetadata?: Record<string, any>) => {
    if (!isTracking || !id) return;

    const trackingData = activeTracking.current.get(id);
    if (!trackingData) return;

    const endTime = performance.now();
    const completedData: PerformanceData = {
      ...trackingData,
      endTime,
      duration: endTime - trackingData.startTime,
      metadata: {
        ...trackingData.metadata,
        ...additionalMetadata,
      },
    };

    activeTracking.current.delete(id);

    setEntries(prev => {
      const updated = [...prev, completedData];
      return updated.slice(-finalConfig.maxEntries);
    });

    return completedData.duration;
  }, [isTracking, finalConfig.maxEntries]);

  // 追蹤函數執行時間
  const trackFunction = useCallback(async <T>(
    name: string,
    fn: () => T | Promise<T>,
    category = 'function',
    metadata?: Record<string, any>
  ): Promise<T> => {
    const trackingId = startTracking(name, category, metadata);
    
    try {
      const result = await fn();
      endTracking(trackingId, { success: true });
      return result;
    } catch (error) {
      endTracking(trackingId, { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }, [startTracking, endTracking]);

  // 追蹤 API 調用
  const trackApiCall = useCallback(async <T>(
    apiName: string,
    apiCall: () => Promise<T>,
    additionalMetadata?: Record<string, any>
  ): Promise<T> => {
    return trackFunction(
      apiName,
      apiCall,
      'api',
      {
        type: 'api_call',
        ...additionalMetadata,
      }
    );
  }, [trackFunction]);

  // 追蹤組件渲染
  const trackRender = useCallback((componentName: string, metadata?: Record<string, any>) => {
    return startTracking(componentName, 'render', {
      type: 'component_render',
      ...metadata,
    });
  }, [startTracking]);

  // 追蹤用戶互動
  const trackInteraction = useCallback((interactionName: string, metadata?: Record<string, any>) => {
    return startTracking(interactionName, 'interaction', {
      type: 'user_interaction',
      ...metadata,
    });
  }, [startTracking]);

  // 獲取統計數據
  const getStatistics = useCallback(() => {
    const completed = entries.filter(entry => entry.duration !== undefined);
    
    if (completed.length === 0) {
      return {
        totalEntries: 0,
        averageDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        byCategory: {},
      };
    }

    const durations = completed.map(entry => entry.duration!);
    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    
    // 按類別分組
    const byCategory = completed.reduce((acc, entry) => {
      const category = entry.name.match(/\[(.*?)\]/)?.[1] || 'unknown';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalDuration: 0,
          averageDuration: 0,
          entries: [],
        };
      }
      
      acc[category].count++;
      acc[category].totalDuration += entry.duration!;
      acc[category].entries.push(entry);
      acc[category].averageDuration = acc[category].totalDuration / acc[category].count;
      
      return acc;
    }, {} as Record<string, any>);

    return {
      totalEntries: completed.length,
      averageDuration: totalDuration / completed.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      byCategory,
    };
  }, [entries]);

  // 清除所有數據
  const clearData = useCallback(() => {
    setEntries([]);
    activeTracking.current.clear();
  }, []);

  // 獲取最近的條目
  const getRecentEntries = useCallback((count = 10) => {
    return entries.slice(-count).reverse();
  }, [entries]);

  // 獲取慢查詢
  const getSlowOperations = useCallback((threshold = 1000) => {
    return entries.filter(entry => 
      entry.duration !== undefined && entry.duration > threshold
    ).sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }, [entries]);

  // 自動追蹤 React 渲染（如果啟用）
  useEffect(() => {
    if (!finalConfig.autoTrack || !isTracking) return;

    // 自動追蹤頁面載入時間
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigationEntry) {
      const loadTime = navigationEntry.loadEventEnd - navigationEntry.fetchStart;
      setEntries(prev => [...prev, {
        id: 'page_load',
        name: '[navigation] Page Load',
        startTime: navigationEntry.fetchStart,
        endTime: navigationEntry.loadEventEnd,
        duration: loadTime,
        metadata: {
          type: 'page_load',
          domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
          firstPaint: navigationEntry.responseEnd - navigationEntry.fetchStart,
        },
      }]);
    }
  }, [finalConfig.autoTrack, isTracking]);

  return {
    // 狀態
    isTracking,
    setIsTracking,
    entries,
    activeCount: activeTracking.current.size,
    
    // 追蹤方法
    startTracking,
    endTracking,
    trackFunction,
    trackApiCall,
    trackRender,
    trackInteraction,
    
    // 數據分析
    getStatistics,
    getRecentEntries,
    getSlowOperations,
    clearData,
  };
}

/**
 * React 組件性能追蹤 Hook
 * 
 * 專門用於追蹤 React 組件的渲染性能
 */
export function useComponentPerformanceTracking(componentName: string) {
  const { trackRender, endTracking } = usePerformanceTracking();
  const renderTrackingId = useRef<string | null>(null);

  // 開始追蹤渲染
  const startRenderTracking = useCallback((props?: any) => {
    renderTrackingId.current = trackRender(componentName, {
      props: props ? Object.keys(props).length : 0,
      timestamp: Date.now(),
    });
  }, [trackRender, componentName]);

  // 結束追蹤渲染
  const endRenderTracking = useCallback((metadata?: Record<string, any>) => {
    if (renderTrackingId.current) {
      endTracking(renderTrackingId.current, metadata);
      renderTrackingId.current = null;
    }
  }, [endTracking]);

  // 自動追蹤每次渲染
  useEffect(() => {
    startRenderTracking();
    return () => {
      endRenderTracking();
    };
  });

  return {
    startRenderTracking,
    endRenderTracking,
  };
}

/**
 * API 性能追蹤 Hook
 * 
 * 包裝 API 調用以自動追蹤性能
 */
export function useApiPerformanceTracking() {
  const { trackApiCall } = usePerformanceTracking();

  // 包裝 fetch 調用
  const trackFetch = useCallback(async (
    url: string,
    options?: RequestInit,
    metadata?: Record<string, any>
  ) => {
    return trackApiCall(
      `fetch ${url}`,
      () => fetch(url, options),
      {
        url,
        method: options?.method || 'GET',
        ...metadata,
      }
    );
  }, [trackApiCall]);

  // 包裝任意異步函數
  const trackAsync = useCallback(async <T>(
    name: string,
    asyncFn: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    return trackApiCall(name, asyncFn, metadata);
  }, [trackApiCall]);

  return {
    trackFetch,
    trackAsync,
    trackApiCall,
  };
}