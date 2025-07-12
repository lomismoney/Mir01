/**
 * 共享查詢工具函數庫
 * 統一處理快取失效、錯誤處理等重複邏輯
 */

import { QueryClient } from '@tanstack/react-query';
import { parseApiError } from '@/lib/errorHandler';

/**
 * 統一的緩存失效工具
 * 提供精確且高效的緩存失效機制
 */
export const createCacheInvalidation = (queryClient: QueryClient) => ({
  /**
   * 失效並重新獲取指定查詢
   * @param queryKey - 查詢鍵
   * @param options - 失效選項
   */
  invalidateAndRefetch: async (
    queryKey: readonly unknown[],
    options: {
      exact?: boolean;
      refetchType?: 'active' | 'inactive' | 'all';
    } = {}
  ) => {
    const { exact = false, refetchType = 'active' } = options;
    
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey,
        exact,
        refetchType,
      }),
      queryClient.refetchQueries({
        queryKey,
        exact,
      })
    ]);
  },

  /**
   * 僅失效查詢（不重新獲取）
   * 適用於需要延遲刷新的場景
   */
  invalidateOnly: async (
    queryKey: readonly unknown[],
    options: {
      exact?: boolean;
      refetchType?: 'active' | 'inactive' | 'all';
    } = {}
  ) => {
    const { exact = false, refetchType = 'active' } = options;
    
    await queryClient.invalidateQueries({
      queryKey,
      exact,
      refetchType,
    });
  },

  /**
   * 移除指定查詢的緩存
   * 適用於需要完全清除緩存的場景
   */
  removeQueries: async (
    queryKey: readonly unknown[],
    options: { exact?: boolean } = {}
  ) => {
    const { exact = false } = options;
    
    await queryClient.removeQueries({
      queryKey,
      exact,
    });
  }
});

/**
 * 統一的錯誤處理工具
 * 提供標準化的錯誤處理邏輯
 */
export const createErrorHandler = (operation: string) => ({
  /**
   * 標準錯誤處理函數
   * 解析 API 錯誤並顯示適當的提示訊息
   */
  onError: (error: any) => {
    const errorMessage = parseApiError(error);
    
    // 僅在客戶端環境顯示 toast
    if (typeof window !== 'undefined') {
      import('sonner').then(({ toast }) => {
        toast.error(`${operation}失敗`, { 
          description: errorMessage,
          duration: 5000,
        });
      });
    }
    
    // 記錄錯誤到控制台（開發環境）
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${operation}] Error:`, error);
    }
  },

  /**
   * 自定義錯誤處理函數
   * 允許自定義錯誤處理邏輯
   */
  onCustomError: (
    error: any, 
    customHandler?: (error: any, message: string) => void
  ) => {
    const errorMessage = parseApiError(error);
    
    if (customHandler) {
      customHandler(error, errorMessage);
    } else {
      // 預設處理邏輯
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => {
          toast.error(`${operation}發生錯誤`, { 
            description: errorMessage,
            duration: 5000,
          });
        });
      }
    }
  }
});

/**
 * 統一的成功處理工具
 * 提供標準化的成功提示邏輯
 */
export const createSuccessHandler = (operation: string) => ({
  /**
   * 標準成功處理函數
   */
  onSuccess: (data?: any, customMessage?: string) => {
    const message = customMessage || `${operation}成功`;
    
    if (typeof window !== 'undefined') {
      import('sonner').then(({ toast }) => {
        toast.success(message, {
          duration: 3000,
        });
      });
    }
  }
});

/**
 * 創建標準化的 mutation 選項
 * 結合錯誤處理和成功處理
 */
export const createMutationOptions = (
  operation: string,
  queryClient: QueryClient,
  options: {
    onSuccessMessage?: string;
    invalidateQueries?: readonly unknown[][];
    customSuccessHandler?: (data: any) => void;
    customErrorHandler?: (error: any) => void;
  } = {}
) => {
  const errorHandler = createErrorHandler(operation);
  const successHandler = createSuccessHandler(operation);
  const cacheInvalidation = createCacheInvalidation(queryClient);

  return {
    onSuccess: async (data: any) => {
      // 執行自定義成功處理
      if (options.customSuccessHandler) {
        options.customSuccessHandler(data);
      } else {
        successHandler.onSuccess(data, options.onSuccessMessage);
      }

      // 失效相關查詢
      if (options.invalidateQueries) {
        await Promise.all(
          options.invalidateQueries.map(queryKey =>
            cacheInvalidation.invalidateAndRefetch(queryKey)
          )
        );
      }
    },
    onError: (error: any) => {
      if (options.customErrorHandler) {
        options.customErrorHandler(error);
      } else {
        errorHandler.onError(error);
      }
    }
  };
};

/**
 * 創建樂觀更新工具
 * 提供標準化的樂觀更新邏輯
 */
export const createOptimisticUpdate = <TData, TVariables>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  updater: (oldData: TData | undefined, variables: TVariables) => TData | undefined
) => ({
  onMutate: async (variables: TVariables) => {
    // 取消任何進行中的重新獲取
    await queryClient.cancelQueries({ queryKey });

    // 快照當前值
    const previousData = queryClient.getQueryData<TData>(queryKey);

    // 樂觀更新
    queryClient.setQueryData<TData>(queryKey, oldData => 
      updater(oldData, variables)
    );

    // 返回快照以供回滾使用
    return { previousData };
  },
  onError: (err: any, variables: TVariables, context?: { previousData: TData }) => {
    // 回滾到之前的值
    if (context?.previousData) {
      queryClient.setQueryData(queryKey, context.previousData);
    }
  },
  onSettled: () => {
    // 總是重新獲取以確保資料同步
    queryClient.invalidateQueries({ queryKey });
  }
});

/**
 * 查詢配置預設值
 */
export const DEFAULT_QUERY_OPTIONS = {
  staleTime: 5 * 60 * 1000, // 5分鐘
  gcTime: 30 * 60 * 1000,   // 30分鐘垃圾回收
  refetchOnMount: false,
  refetchOnWindowFocus: false,
  retry: 2,
};

/**
 * 分頁查詢預設配置
 */
export const PAGINATED_QUERY_OPTIONS = {
  ...DEFAULT_QUERY_OPTIONS,
  placeholderData: (previousData: any) => previousData,
  staleTime: 2 * 60 * 1000, // 分頁數據2分鐘過期
};