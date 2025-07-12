import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

/**
 * 載入狀態類型
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 載入配置選項
 */
interface LoadingConfig {
  // 顯示選項
  showLoadingToast?: boolean;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  
  // 訊息設定
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  
  // 時間設定
  minLoadingTime?: number; // 最小載入時間（毫秒）
  autoResetDelay?: number; // 自動重設延遲（毫秒）
  
  // 回調函式
  onStateChange?: (state: LoadingState) => void;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

/**
 * 載入狀態管理 Hook
 * 
 * 提供統一的載入狀態管理，包括：
 * - 標準化的載入狀態
 * - 一致的使用者回饋
 * - 防抖動機制
 * - 自動重設功能
 * 
 * @param config 載入配置選項
 * @returns 載入狀態管理器
 */
export function useLoadingState(config: LoadingConfig = {}) {
  const {
    showLoadingToast = false,
    showSuccessToast = false,
    showErrorToast = true,
    loadingMessage = '載入中...',
    successMessage = '操作成功',
    errorMessage = '操作失敗',
    minLoadingTime = 300,
    autoResetDelay = 2000,
    onStateChange,
    onSuccess,
    onError,
  } = config;

  const [state, setState] = useState<LoadingState>('idle');
  const [error, setError] = useState<any>(null);
  const startTimeRef = useRef<number>(0);
  const toastIdRef = useRef<string | number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定時器
  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 關閉當前 toast
  const dismissCurrentToast = useCallback(() => {
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
      toastIdRef.current = null;
    }
  }, []);

  // 設定載入狀態
  const setLoading = useCallback(() => {
    clearTimeouts();
    dismissCurrentToast();
    
    setState('loading');
    setError(null);
    startTimeRef.current = Date.now();
    
    if (showLoadingToast) {
      toastIdRef.current = toast.loading(loadingMessage);
    }
    
    onStateChange?.('loading');
  }, [
    showLoadingToast,
    loadingMessage,
    onStateChange,
    clearTimeouts,
    dismissCurrentToast,
  ]);

  // 設定成功狀態
  const setSuccess = useCallback((successData?: any) => {
    const elapsed = Date.now() - startTimeRef.current;
    const remainingTime = Math.max(0, minLoadingTime - elapsed);

    const finishSuccess = () => {
      dismissCurrentToast();
      setState('success');
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      onStateChange?.('success');
      onSuccess?.();
      
      // 自動重設到 idle 狀態
      if (autoResetDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          setState('idle');
          onStateChange?.('idle');
        }, autoResetDelay);
      }
    };

    if (remainingTime > 0) {
      setTimeout(finishSuccess, remainingTime);
    } else {
      finishSuccess();
    }
  }, [
    minLoadingTime,
    showSuccessToast,
    successMessage,
    autoResetDelay,
    onStateChange,
    onSuccess,
    dismissCurrentToast,
  ]);

  // 設定錯誤狀態
  const setErrorState = useCallback((errorData: any) => {
    const elapsed = Date.now() - startTimeRef.current;
    const remainingTime = Math.max(0, minLoadingTime - elapsed);

    const finishError = () => {
      dismissCurrentToast();
      setState('error');
      setError(errorData);
      
      if (showErrorToast) {
        const message = errorData?.message || errorMessage;
        toast.error(message);
      }
      
      onStateChange?.('error');
      onError?.(errorData);
      
      // 自動重設到 idle 狀態
      if (autoResetDelay > 0) {
        timeoutRef.current = setTimeout(() => {
          setState('idle');
          setError(null);
          onStateChange?.('idle');
        }, autoResetDelay);
      }
    };

    if (remainingTime > 0) {
      setTimeout(finishError, remainingTime);
    } else {
      finishError();
    }
  }, [
    minLoadingTime,
    showErrorToast,
    errorMessage,
    autoResetDelay,
    onStateChange,
    onError,
    dismissCurrentToast,
  ]);

  // 重設狀態
  const reset = useCallback(() => {
    clearTimeouts();
    dismissCurrentToast();
    setState('idle');
    setError(null);
    onStateChange?.('idle');
  }, [clearTimeouts, dismissCurrentToast, onStateChange]);

  // 執行異步操作的包裝函式
  const execute = useCallback(
    async <T>(
      asyncFn: () => Promise<T>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
      }
    ): Promise<T> => {
      try {
        setLoading();
        const result = await asyncFn();
        setSuccess(result);
        return result;
      } catch (error) {
        setErrorState(error);
        throw error;
      }
    },
    [setLoading, setSuccess, setErrorState]
  );

  // 清理副作用
  useEffect(() => {
    return () => {
      clearTimeouts();
      dismissCurrentToast();
    };
  }, [clearTimeouts, dismissCurrentToast]);

  // 計算屬性
  const isIdle = state === 'idle';
  const isLoading = state === 'loading';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const canRetry = isError || isIdle;

  return {
    // 狀態
    state,
    error,
    
    // 狀態檢查
    isIdle,
    isLoading,
    isSuccess,
    isError,
    canRetry,
    
    // 狀態設定
    setLoading,
    setSuccess,
    setError: setErrorState,
    reset,
    
    // 工具函式
    execute,
  };
}

/**
 * 批量載入狀態管理 Hook
 * 
 * 管理多個併發載入操作的狀態
 */
export function useBatchLoadingState() {
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, any>>(new Map());

  const addLoading = useCallback((key: string) => {
    setLoadingItems(prev => new Set([...prev, key]));
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(key);
      return newErrors;
    });
  }, []);

  const removeLoading = useCallback((key: string) => {
    setLoadingItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  }, []);

  const setError = useCallback((key: string, error: any) => {
    removeLoading(key);
    setErrors(prev => new Map([...prev, [key, error]]));
  }, [removeLoading]);

  const clearError = useCallback((key: string) => {
    setErrors(prev => {
      const newErrors = new Map(prev);
      newErrors.delete(key);
      return newErrors;
    });
  }, []);

  const reset = useCallback(() => {
    setLoadingItems(new Set());
    setErrors(new Map());
  }, []);

  const isAnyLoading = loadingItems.size > 0;
  const hasAnyError = errors.size > 0;
  const loadingCount = loadingItems.size;
  const errorCount = errors.size;

  return {
    // 狀態
    loadingItems,
    errors,
    
    // 計算屬性
    isAnyLoading,
    hasAnyError,
    loadingCount,
    errorCount,
    
    // 操作函式
    addLoading,
    removeLoading,
    setError,
    clearError,
    reset,
    
    // 檢查函式
    isLoading: (key: string) => loadingItems.has(key),
    getError: (key: string) => errors.get(key),
    hasError: (key: string) => errors.has(key),
  };
}

/**
 * 載入狀態組合 Hook
 * 
 * 整合多個載入狀態的管理
 */
export function useCombinedLoadingState(keys: string[]) {
  const [states, setStates] = useState<Map<string, LoadingState>>(
    new Map(keys.map(key => [key, 'idle']))
  );

  const updateState = useCallback((key: string, state: LoadingState) => {
    setStates(prev => new Map([...prev, [key, state]]));
  }, []);

  const getState = useCallback((key: string): LoadingState => {
    return states.get(key) || 'idle';
  }, [states]);

  const isAnyLoading = Array.from(states.values()).some(state => state === 'loading');
  const isAllSuccess = Array.from(states.values()).every(state => state === 'success');
  const hasAnyError = Array.from(states.values()).some(state => state === 'error');

  return {
    states,
    updateState,
    getState,
    isAnyLoading,
    isAllSuccess,
    hasAnyError,
  };
}

/**
 * 載入狀態工具函式
 */
export const LoadingStateUtils = {
  /**
   * 創建載入狀態的顯示文字
   */
  getStateText: (state: LoadingState, customMessages?: Partial<Record<LoadingState, string>>) => {
    const defaultMessages = {
      idle: '就緒',
      loading: '載入中...',
      success: '成功',
      error: '錯誤',
    };
    
    return customMessages?.[state] || defaultMessages[state];
  },

  /**
   * 獲取載入狀態的樣式類別
   */
  getStateClassName: (state: LoadingState) => {
    const classMap = {
      idle: 'text-gray-500',
      loading: 'text-blue-500',
      success: 'text-green-500',
      error: 'text-red-500',
    };
    
    return classMap[state];
  },

  /**
   * 檢查是否應該顯示載入指示器
   */
  shouldShowLoader: (state: LoadingState) => state === 'loading',

  /**
   * 檢查是否應該禁用操作
   */
  shouldDisableAction: (state: LoadingState) => state === 'loading',
};