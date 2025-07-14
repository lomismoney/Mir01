import React, { useEffect, useRef, useCallback } from 'react';

/**
 * 內存洩漏檢測和修復 Hook
 * 
 * 功能：
 * 1. 檢測常見的內存洩漏模式
 * 2. 自動清理事件監聽器
 * 3. 防止組件卸載後的狀態更新
 * 4. 管理定時器和間隔器
 * 5. 清理異步操作
 */

/**
 * 內存洩漏類型
 */
type LeakType = 
  | 'event-listener'
  | 'timer'
  | 'state-update'
  | 'subscription'
  | 'async-operation'
  | 'dom-reference';

/**
 * 內存洩漏記錄
 */
interface MemoryLeakRecord {
  type: LeakType;
  description: string;
  timestamp: number;
  cleaned: boolean;
}

/**
 * 清理函數類型
 */
type CleanupFunction = () => void;

/**
 * 內存洩漏檢測器
 */
class MemoryLeakDetector {
  private static instance: MemoryLeakDetector;
  private leaks: Map<string, MemoryLeakRecord> = new Map();
  private cleanupCallbacks: Map<string, CleanupFunction> = new Map();
  
  static getInstance(): MemoryLeakDetector {
    if (!this.instance) {
      this.instance = new MemoryLeakDetector();
    }
    return this.instance;
  }
  
  /**
   * 記錄潛在的內存洩漏
   */
  recordLeak(id: string, type: LeakType, description: string): void {
    this.leaks.set(id, {
      type,
      description,
      timestamp: Date.now(),
      cleaned: false,
    });
  }
  
  /**
   * 標記洩漏已清理
   */
  markCleaned(id: string): void {
    const leak = this.leaks.get(id);
    if (leak) {
      leak.cleaned = true;
    }
  }
  
  /**
   * 註冊清理函數
   */
  registerCleanup(id: string, cleanup: CleanupFunction): void {
    this.cleanupCallbacks.set(id, cleanup);
  }
  
  /**
   * 執行清理
   */
  cleanup(id: string): void {
    const cleanup = this.cleanupCallbacks.get(id);
    if (cleanup) {
      cleanup();
      this.cleanupCallbacks.delete(id);
      this.markCleaned(id);
    }
  }
  
  /**
   * 獲取洩漏統計
   */
  getLeakStats() {
    const all = Array.from(this.leaks.values());
    const active = all.filter(leak => !leak.cleaned);
    const byType = active.reduce((acc, leak) => {
      acc[leak.type] = (acc[leak.type] || 0) + 1;
      return acc;
    }, {} as Record<LeakType, number>);
    
    return {
      total: all.length,
      active: active.length,
      cleaned: all.length - active.length,
      byType,
      activeLeaks: active,
    };
  }
  
  /**
   * 清理所有記錄
   */
  clearAll(): void {
    // 執行所有未清理的清理函數
    this.cleanupCallbacks.forEach((cleanup, id) => {
      cleanup();
      this.markCleaned(id);
    });
    
    this.cleanupCallbacks.clear();
  }
}

/**
 * 安全的狀態更新 Hook
 * 防止組件卸載後的狀態更新造成內存洩漏
 */
export function useSafeState<T>(
  initialState: T | (() => T)
): [T, (newState: T | ((prev: T) => T)) => void] {
  const [state, setState] = React.useState(initialState);
  const isMountedRef = useRef(true);
  const componentId = useRef(`component-${Date.now()}-${Math.random()}`);
  
  useEffect(() => {
    isMountedRef.current = true;
    const currentComponentId = componentId.current;
    
    return () => {
      isMountedRef.current = false;
      const detector = MemoryLeakDetector.getInstance();
      detector.cleanup(currentComponentId);
    };
  }, []);
  
  const safeSetState = useCallback((newState: T | ((prev: T) => T)) => {
    if (isMountedRef.current) {
      setState(newState);
    } else {
      // 記錄潛在的內存洩漏
      const detector = MemoryLeakDetector.getInstance();
      detector.recordLeak(
        `${componentId.current}-state-update`,
        'state-update',
        'Attempted state update on unmounted component'
      );
    }
  }, []);
  
  return [state, safeSetState];
}

/**
 * 安全的事件監聽器 Hook
 */
export function useSafeEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | Document | Element = window,
  options?: boolean | AddEventListenerOptions
) {
  const savedHandler = useRef(handler);
  const componentId = useRef(`event-${Date.now()}-${Math.random()}`);
  
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);
  
  useEffect(() => {
    if (!element?.addEventListener) return;
    
    const detector = MemoryLeakDetector.getInstance();
    const eventListener = (event: WindowEventMap[K]) => savedHandler.current(event);
    const currentComponentId = componentId.current;
    
    element.addEventListener(eventName, eventListener as EventListener, options);
    
    // 記錄事件監聽器
    detector.recordLeak(
      currentComponentId,
      'event-listener',
      `Event listener for ${eventName}`
    );
    
    // 註冊清理函數
    detector.registerCleanup(currentComponentId, () => {
      element.removeEventListener(eventName, eventListener as EventListener, options);
    });
    
    return () => {
      element.removeEventListener(eventName, eventListener as EventListener, options);
      detector.cleanup(currentComponentId);
    };
  }, [eventName, element, options]);
}

/**
 * 安全的定時器 Hook
 */
export function useSafeInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const componentId = useRef(`interval-${Date.now()}-${Math.random()}`);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    const detector = MemoryLeakDetector.getInstance();
    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    const currentComponentId = componentId.current;
    
    // 記錄定時器
    detector.recordLeak(
      currentComponentId,
      'timer',
      `Interval with delay ${delay}ms`
    );
    
    // 註冊清理函數
    detector.registerCleanup(currentComponentId, () => {
      clearInterval(id);
    });
    
    return () => {
      clearInterval(id);
      detector.cleanup(currentComponentId);
    };
  }, [delay]);
}

/**
 * 安全的超時 Hook
 */
export function useSafeTimeout(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  const componentId = useRef(`timeout-${Date.now()}-${Math.random()}`);
  
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  
  useEffect(() => {
    if (delay === null) return;
    
    const detector = MemoryLeakDetector.getInstance();
    const tick = () => savedCallback.current();
    const id = setTimeout(tick, delay);
    const currentComponentId = componentId.current;
    
    // 記錄超時
    detector.recordLeak(
      currentComponentId,
      'timer',
      `Timeout with delay ${delay}ms`
    );
    
    // 註冊清理函數
    detector.registerCleanup(currentComponentId, () => {
      clearTimeout(id);
    });
    
    return () => {
      clearTimeout(id);
      detector.cleanup(currentComponentId);
    };
  }, [delay]);
}

/**
 * 安全的異步操作 Hook
 */
export function useSafeAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const [state, setState] = useSafeState<{
    data: T | null;
    loading: boolean;
    error: Error | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });
  
  const isMountedRef = useRef(true);
  const componentId = useRef(`async-${Date.now()}-${Math.random()}`);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const execute = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setState({ data: null, loading: true, error: null });
    
    try {
      const result = await asyncFunction();
      
      if (isMountedRef.current) {
        setState({ data: result, loading: false, error: null });
      } else {
        // 記錄潛在的內存洩漏
        const detector = MemoryLeakDetector.getInstance();
        detector.recordLeak(
          componentId.current,
          'async-operation',
          'Async operation completed after component unmount'
        );
      }
    } catch (error) {
      if (isMountedRef.current) {
        setState({ data: null, loading: false, error: error as Error });
      }
    }
  }, [asyncFunction, setState, ...dependencies]);
  
  return {
    ...state,
    execute,
    isActive: isMountedRef.current,
  };
}

/**
 * DOM 引用清理 Hook
 */
export function useDOMRefCleanup<T extends Element>() {
  const ref = useRef<T | null>(null);
  const componentId = useRef(`dom-ref-${Date.now()}-${Math.random()}`);
  
  useEffect(() => {
    const detector = MemoryLeakDetector.getInstance();
    const currentComponentId = componentId.current;
    
    if (ref.current) {
      detector.recordLeak(
        currentComponentId,
        'dom-reference',
        'DOM reference held'
      );
      
      detector.registerCleanup(currentComponentId, () => {
        ref.current = null;
      });
    }
    
    return () => {
      detector.cleanup(currentComponentId);
      ref.current = null;
    };
  }, []);
  
  return ref;
}

/**
 * 組件內存洩漏檢測 Hook
 */
export function useMemoryLeakDetector(componentName?: string) {
  const detector = MemoryLeakDetector.getInstance();
  const componentId = useRef(`${componentName || 'component'}-${Date.now()}`);
  
  useEffect(() => {
    // 組件掛載時開始監控
    const startTime = Date.now();
    
    return () => {
      // 組件卸載時檢查是否有未清理的資源
      const stats = detector.getLeakStats();
      
      if (stats.active > 0) {
        console.warn(`Component ${componentName} has ${stats.active} potential memory leaks:`, stats.activeLeaks);
      }
      
      // 強制清理組件相關的所有資源
      detector.clearAll();
    };
  }, [componentName, detector]);
  
  return {
    getStats: () => detector.getLeakStats(),
    recordLeak: (type: LeakType, description: string) => {
      detector.recordLeak(`${componentId.current}-${type}`, type, description);
    },
    cleanup: () => detector.clearAll(),
  };
}

/**
 * 全局內存洩漏監控
 */
export function useGlobalMemoryMonitor() {
  const detector = MemoryLeakDetector.getInstance();
  
  useEffect(() => {
    const monitorInterval = setInterval(() => {
      const stats = detector.getLeakStats();
      
      if (stats.active > 10) {
        console.warn('High number of potential memory leaks detected:', stats);
      }
      
      // 在開發環境中記錄統計
      if (process.env.NODE_ENV === 'development') {
        (window as any).__memoryLeakStats = stats;
      }
    }, 5000);
    
    return () => {
      clearInterval(monitorInterval);
    };
  }, [detector]);
  
  return {
    getStats: () => detector.getLeakStats(),
    clearAll: () => detector.clearAll(),
  };
}

// 導出檢測器實例供外部使用
export { MemoryLeakDetector };

// 在開發環境中暴露到全局
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__MemoryLeakDetector = MemoryLeakDetector.getInstance();
}