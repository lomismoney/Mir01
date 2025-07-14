import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { useLoadingState, LoadingState } from './useLoadingState';

/**
 * 全局載入狀態管理接口
 */
interface GlobalLoadingState {
  [key: string]: LoadingState;
}

/**
 * 全局載入狀態管理器
 */
class GlobalLoadingManager {
  private listeners: Set<(state: GlobalLoadingState) => void> = new Set();
  private state: GlobalLoadingState = {};

  subscribe(listener: (state: GlobalLoadingState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState() {
    return this.state;
  }

  setState(key: string, loadingState: LoadingState) {
    this.state = { ...this.state, [key]: loadingState };
    this.listeners.forEach(listener => listener(this.state));
  }

  removeState(key: string) {
    const { [key]: _, ...rest } = this.state;
    this.state = rest;
    this.listeners.forEach(listener => listener(this.state));
  }

  isAnyLoading() {
    return Object.values(this.state).some(state => state === 'loading');
  }

  getLoadingKeys() {
    return Object.entries(this.state)
      .filter(([_, state]) => state === 'loading')
      .map(([key]) => key);
  }
}

// 單例全局載入管理器
const globalLoadingManager = new GlobalLoadingManager();

/**
 * 增強版載入狀態管理 Hook
 * 
 * 特性：
 * - 支持全局載入狀態追蹤
 * - 自動防止重複請求
 * - 優雅的錯誤重試機制
 * - 載入進度追蹤
 * - 批量操作支持
 */
export function useEnhancedLoadingState(
  key?: string,
  options?: {
    preventDuplicate?: boolean;
    retryLimit?: number;
    progressTracking?: boolean;
    globalTracking?: boolean;
  }
) {
  const {
    preventDuplicate = true,
    retryLimit = 3,
    progressTracking = false,
    globalTracking = true,
  } = options || {};

  const baseLoadingState = useLoadingState({
    showLoadingToast: false,
    showSuccessToast: false,
    showErrorToast: true,
  });

  const [progress, setProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 全局狀態追蹤
  useEffect(() => {
    if (key && globalTracking) {
      globalLoadingManager.setState(key, baseLoadingState.state);
      return () => globalLoadingManager.removeState(key);
    }
  }, [key, baseLoadingState.state, globalTracking]);

  // 取消請求
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    baseLoadingState.reset();
    setProgress(0);
  }, [baseLoadingState]);

  // 執行異步操作（增強版）
  const executeWithProgress = useCallback(
    async <T>(
      asyncFn: (signal: AbortSignal) => Promise<T>,
      options?: {
        onProgress?: (progress: number) => void;
        successMessage?: string;
        errorMessage?: string;
      }
    ): Promise<T | null> => {
      // 防止重複請求
      if (preventDuplicate && baseLoadingState.isLoading) {
        toast.warning('請求正在進行中，請稍候...');
        return null;
      }

      // 創建新的 AbortController
      abortControllerRef.current = new AbortController();
      const signal = abortControllerRef.current.signal;

      try {
        baseLoadingState.setLoading();
        setProgress(0);

        // 執行異步操作
        const result = await asyncFn(signal);

        if (!signal.aborted) {
          baseLoadingState.setSuccess();
          setProgress(100);
          setRetryCount(0);
          
          if (options?.successMessage) {
            toast.success(options.successMessage);
          }
        }

        return result;
      } catch (error: any) {
        if (!signal.aborted) {
          baseLoadingState.setError(error);
          
          // 自動重試邏輯
          if (retryCount < retryLimit && !error.message?.includes('取消')) {
            setRetryCount(prev => prev + 1);
            toast.error(`操作失敗，正在重試 (${retryCount + 1}/${retryLimit})...`);
            
            // 延遲重試
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return executeWithProgress(asyncFn, options);
          }
          
          if (options?.errorMessage) {
            toast.error(options.errorMessage);
          }
        }
        
        throw error;
      } finally {
        abortControllerRef.current = null;
      }
    },
    [baseLoadingState, preventDuplicate, retryCount, retryLimit]
  );

  // 批量執行異步操作
  const executeBatch = useCallback(
    async <T>(
      asyncFns: Array<() => Promise<T>>,
      options?: {
        parallel?: boolean;
        stopOnError?: boolean;
        onItemComplete?: (index: number, result: T) => void;
        onItemError?: (index: number, error: any) => void;
      }
    ): Promise<T[]> => {
      const { parallel = true, stopOnError = false, onItemComplete, onItemError } = options || {};
      
      baseLoadingState.setLoading();
      setProgress(0);
      
      const results: T[] = [];
      const errors: any[] = [];
      
      try {
        if (parallel) {
          // 並行執行
          const promises = asyncFns.map(async (fn, index) => {
            try {
              const result = await fn();
              onItemComplete?.(index, result);
              setProgress((index + 1) / asyncFns.length * 100);
              return result;
            } catch (error) {
              onItemError?.(index, error);
              if (stopOnError) throw error;
              errors.push({ index, error });
              return null;
            }
          });
          
          const batchResults = await Promise.all(promises);
          results.push(...batchResults.filter((r): r is T => r !== null && r !== undefined));
        } else {
          // 順序執行
          for (let i = 0; i < asyncFns.length; i++) {
            try {
              const result = await asyncFns[i]();
              results.push(result);
              onItemComplete?.(i, result);
              setProgress((i + 1) / asyncFns.length * 100);
            } catch (error) {
              onItemError?.(i, error);
              errors.push({ index: i, error });
              if (stopOnError) throw error;
            }
          }
        }
        
        if (errors.length === 0) {
          baseLoadingState.setSuccess();
          toast.success(`批量操作成功完成 (${results.length}/${asyncFns.length})`);
        } else if (errors.length < asyncFns.length) {
          baseLoadingState.setSuccess();
          toast.warning(`批量操作部分成功 (${results.length}/${asyncFns.length})`);
        } else {
          baseLoadingState.setError(new Error('批量操作全部失敗'));
        }
        
        return results;
      } catch (error) {
        baseLoadingState.setError(error);
        throw error;
      }
    },
    [baseLoadingState]
  );

  return {
    ...baseLoadingState,
    
    // 進度追蹤
    progress: progressTracking ? progress : undefined,
    setProgress: progressTracking ? setProgress : undefined,
    
    // 重試相關
    retryCount,
    canRetry: retryCount < retryLimit,
    
    // 取消操作
    cancel,
    isAbortable: !!abortControllerRef.current,
    
    // 增強的執行函數
    executeWithProgress,
    executeBatch,
  };
}

/**
 * 使用全局載入狀態
 */
export function useGlobalLoadingState() {
  const [state, setState] = useState<GlobalLoadingState>(globalLoadingManager.getState());

  useEffect(() => {
    const unsubscribe = globalLoadingManager.subscribe(setState);
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return {
    state,
    isAnyLoading: globalLoadingManager.isAnyLoading(),
    loadingKeys: globalLoadingManager.getLoadingKeys(),
  };
}

/**
 * 頁面級載入狀態 Hook
 * 
 * 自動管理頁面切換的載入狀態
 */
export function usePageLoadingState() {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startTransition = useCallback(() => {
    setIsTransitioning(true);
    
    // 設置最小載入時間，避免閃爍
    timeoutRef.current = setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  }, []);

  const endTransition = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsTransitioning(false);
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isTransitioning,
    startTransition,
    endTransition,
  };
}