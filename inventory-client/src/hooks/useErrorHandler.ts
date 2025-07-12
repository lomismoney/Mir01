import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { 
  convertToFriendlyError, 
  FriendlyErrorMessage,
  ErrorTracker 
} from '@/lib/friendlyErrorMessages';

/**
 * API 錯誤響應結構
 */
interface ApiError {
  message?: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

/**
 * 錯誤處理配置
 */
interface ErrorHandlerConfig {
  showToast?: boolean;
  showFriendlyMessage?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  onError?: (error: any, friendlyMessage?: FriendlyErrorMessage) => void;
}

/**
 * 錯誤狀態
 */
interface ErrorState {
  error: any;
  friendlyMessage: FriendlyErrorMessage;
  timestamp: Date;
}

/**
 * 錯誤類型映射
 */
const ERROR_TYPE_MESSAGES = {
  // 網路錯誤
  NETWORK_ERROR: '網路連線異常，請檢查網路設定',
  TIMEOUT: '請求超時，請稍後再試',
  
  // 認證錯誤
  UNAUTHORIZED: '請重新登入後再試',
  FORBIDDEN: '您沒有權限執行此操作',
  
  // 客戶端錯誤
  BAD_REQUEST: '請求參數有誤，請檢查輸入內容',
  NOT_FOUND: '找不到相關資料',
  VALIDATION_ERROR: '輸入資料驗證失敗',
  
  // 伺服器錯誤
  INTERNAL_SERVER_ERROR: '伺服器發生錯誤，請稍後再試',
  SERVICE_UNAVAILABLE: '服務暫時無法使用，請稍後再試',
  
  // 業務邏輯錯誤
  INSUFFICIENT_INVENTORY: '庫存不足，無法完成操作',
  DUPLICATE_ENTRY: '資料重複，請檢查後重新輸入',
  INVALID_OPERATION: '此操作在當前狀態下不被允許',
} as const;

/**
 * 根據 HTTP 狀態碼獲取錯誤類型
 */
function getErrorTypeByStatus(status: number): keyof typeof ERROR_TYPE_MESSAGES {
  switch (status) {
    case 400: return 'BAD_REQUEST';
    case 401: return 'UNAUTHORIZED';
    case 403: return 'FORBIDDEN';
    case 404: return 'NOT_FOUND';
    case 422: return 'VALIDATION_ERROR';
    case 500: return 'INTERNAL_SERVER_ERROR';
    case 503: return 'SERVICE_UNAVAILABLE';
    default: return 'INTERNAL_SERVER_ERROR';
  }
}

/**
 * 統一錯誤處理 Hook
 * 
 * 提供一致的錯誤處理機制，包括：
 * - 友善的錯誤訊息顯示
 * - 統一的錯誤日誌記錄
 * - 特定錯誤類型的處理邏輯
 * 
 * @param defaultConfig 預設配置
 * @returns 錯誤處理器函式
 */
export function useErrorHandler(defaultConfig: ErrorHandlerConfig = {}) {
  const {
    showToast = true,
    showFriendlyMessage = true,
    logError = true,
    fallbackMessage = '操作失敗，請稍後再試',
    onError,
  } = defaultConfig;

  // 錯誤狀態管理
  const [currentError, setCurrentError] = useState<ErrorState | null>(null);

  /**
   * 解析錯誤對象，提取友善的錯誤訊息
   */
  const parseError = useCallback((error: any): string => {
    // 如果是字符串，直接返回
    if (typeof error === 'string') {
      return error;
    }

    // 處理 API 響應錯誤
    if (error?.response?.data) {
      const apiError = error.response.data as ApiError;
      
      // 優先使用 API 返回的錯誤訊息
      if (apiError.message) {
        return apiError.message;
      }

      // 處理驗證錯誤
      if (apiError.errors) {
        const firstError = Object.values(apiError.errors)[0];
        if (firstError && firstError.length > 0) {
          return firstError[0];
        }
      }

      // 根據狀態碼獲取友善訊息
      if (error.response.status) {
        const errorType = getErrorTypeByStatus(error.response.status);
        return ERROR_TYPE_MESSAGES[errorType];
      }
    }

    // 處理網路錯誤
    if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Network Error')) {
      return ERROR_TYPE_MESSAGES.NETWORK_ERROR;
    }

    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return ERROR_TYPE_MESSAGES.TIMEOUT;
    }

    // 處理一般錯誤對象
    if (error?.message) {
      return error.message;
    }

    return fallbackMessage;
  }, [fallbackMessage]);

  /**
   * 處理錯誤的主要函式（增強版）
   */
  const handleError = useCallback((
    error: any, 
    customConfig: Partial<ErrorHandlerConfig> = {}
  ) => {
    const config = { 
      showToast, 
      showFriendlyMessage,
      logError, 
      fallbackMessage, 
      onError,
      ...customConfig 
    };

    // 轉換為友善錯誤訊息
    const friendlyMessage = convertToFriendlyError(error);
    
    // 設置當前錯誤狀態
    const errorState: ErrorState = {
      error,
      friendlyMessage,
      timestamp: new Date(),
    };
    setCurrentError(errorState);

    // 追蹤錯誤
    ErrorTracker.track(error, friendlyMessage);

    // 顯示錯誤訊息
    if (config.showToast) {
      if (config.showFriendlyMessage) {
        // 使用友善訊息
        toast.error(friendlyMessage.title, {
          description: friendlyMessage.message,
          duration: friendlyMessage.severity === 'critical' ? 10000 : 5000,
          action: friendlyMessage.actions?.[0] ? {
            label: friendlyMessage.actions[0].label,
            onClick: friendlyMessage.actions[0].action,
          } : undefined,
        });
      } else {
        // 使用原始訊息
        const errorMessage = parseError(error);
        toast.error(errorMessage);
      }
    }

    // 記錄錯誤
    if (config.logError) {
      console.group('🚨 Enhanced Error Handler');
      console.error('Original Error:', error);
      console.info('Friendly Message:', friendlyMessage);
      console.info('Error State:', errorState);
      console.groupEnd();
    }

    // 執行自定義錯誤處理
    config.onError?.(error, friendlyMessage);

    return friendlyMessage;
  }, [parseError, showToast, showFriendlyMessage, logError, fallbackMessage, onError]);

  /**
   * 處理表單驗證錯誤
   */
  const handleValidationError = useCallback((error: any) => {
    const apiError = error?.response?.data as ApiError;
    
    if (apiError?.errors) {
      // 返回驗證錯誤的詳細資訊
      return apiError.errors;
    }

    // 如果不是驗證錯誤，使用一般錯誤處理
    handleError(error);
    return null;
  }, [handleError]);

  /**
   * 處理操作成功的回饋
   */
  const handleSuccess = useCallback((
    message: string = '操作成功',
    customConfig: { showToast?: boolean } = {}
  ) => {
    const { showToast: shouldShowToast = true } = customConfig;
    
    if (shouldShowToast) {
      toast.success(message);
    }
  }, []);

  /**
   * 處理載入狀態的錯誤
   */
  const handleLoadingError = useCallback((error: any) => {
    return handleError(error, {
      fallbackMessage: '載入資料失敗，請重新整理頁面',
    });
  }, [handleError]);

  /**
   * 處理提交操作的錯誤
   */
  const handleSubmitError = useCallback((error: any) => {
    return handleError(error, {
      fallbackMessage: '提交失敗，請檢查輸入資料後重試',
    });
  }, [handleError]);

  /**
   * 處理刪除操作的錯誤
   */
  const handleDeleteError = useCallback((error: any) => {
    return handleError(error, {
      fallbackMessage: '刪除失敗，請稍後再試',
    });
  }, [handleError]);

  /**
   * 清除當前錯誤狀態
   */
  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  /**
   * 獲取錯誤統計
   */
  const getErrorStats = useCallback(() => {
    return ErrorTracker.getErrorStats();
  }, []);

  return {
    // 基礎錯誤處理
    handleError,
    parseError,
    
    // 特定場景的錯誤處理
    handleValidationError,
    handleLoadingError,
    handleSubmitError,
    handleDeleteError,
    
    // 成功訊息處理
    handleSuccess,
    
    // 錯誤狀態管理
    currentError,
    clearError,
    
    // 錯誤分析
    getErrorStats,
  };
}

/**
 * 專用的 API 錯誤處理 Hook
 * 
 * 針對 API 呼叫提供更專門的錯誤處理
 */
export function useApiErrorHandler() {
  const errorHandler = useErrorHandler({
    showToast: true,
    logError: true,
  });

  /**
   * 為 React Query 的 mutation 提供統一的錯誤處理
   */
  const getMutationErrorHandler = useCallback((
    successMessage?: string,
    customErrorHandler?: (error: any) => void
  ) => ({
    onSuccess: () => {
      if (successMessage) {
        errorHandler.handleSuccess(successMessage);
      }
    },
    onError: (error: any) => {
      customErrorHandler?.(error) || errorHandler.handleError(error);
    },
  }), [errorHandler]);

  /**
   * 為 React Query 的 query 提供統一的錯誤處理
   */
  const getQueryErrorHandler = useCallback(() => ({
    onError: (error: any) => {
      errorHandler.handleLoadingError(error);
    },
  }), [errorHandler]);

  return {
    ...errorHandler,
    getMutationErrorHandler,
    getQueryErrorHandler,
  };
}