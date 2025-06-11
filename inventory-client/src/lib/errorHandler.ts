import { toast } from 'sonner';

/**
 * 統一錯誤處理工具
 * 
 * 提供一致的錯誤處理邏輯和用戶友好的錯誤訊息
 */

/**
 * 未知錯誤類型
 */
type UnknownError = unknown;

/**
 * API 錯誤類型定義
 */
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * 錯誤代碼映射表
 */
const ERROR_MESSAGES = {
  // 認證相關錯誤
  401: '登入已過期，請重新登入',
  403: '您沒有權限執行此操作',
  
  // 客戶端錯誤
  400: '請求參數有誤',
  404: '找不到請求的資源',
  422: '資料驗證失敗',
  
  // 服務器錯誤
  500: '服務器發生錯誤，請稍後再試',
  502: '服務暫時無法使用',
  503: '服務維護中，請稍後再試',
  
  // 網絡錯誤
  NETWORK_ERROR: '網絡連接失敗，請檢查網絡設置',
  TIMEOUT: '請求超時，請重試',
} as const;

/**
 * 解析 API 錯誤
 * 
 * @param error - 錯誤對象
 * @returns 格式化的錯誤訊息
 */
export function parseApiError(error: UnknownError): string {
  // 類型保護：檢查是否為對象
  if (typeof error !== 'object' || error === null) {
    return '發生未知錯誤，請聯繫系統管理員';
  }

  const errorObj = error as Record<string, unknown>;

  // 如果是自定義的 ApiError
  if (typeof errorObj.message === 'string') {
    return errorObj.message;
  }
  
  // 如果有 HTTP 狀態碼
  if (typeof errorObj.status === 'number' && ERROR_MESSAGES[errorObj.status as keyof typeof ERROR_MESSAGES]) {
    return ERROR_MESSAGES[errorObj.status as keyof typeof ERROR_MESSAGES];
  }
  
  // 網絡錯誤
  if (errorObj.name === 'TypeError' && typeof errorObj.message === 'string' && errorObj.message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  
  // 超時錯誤
  if (errorObj.name === 'AbortError') {
    return ERROR_MESSAGES.TIMEOUT;
  }
  
  // 預設錯誤訊息
  return '發生未知錯誤，請聯繫系統管理員';
}

/**
 * 處理 API 錯誤並顯示 Toast
 * 
 * @param error - 錯誤對象
 * @param fallbackMessage - 備用錯誤訊息
 */
export function handleApiError(error: UnknownError, fallbackMessage?: string): void {
  const message = fallbackMessage || parseApiError(error);
  
  toast.error(message);
  
  // 在開發環境下記錄詳細錯誤
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error);
  }
}

/**
 * 創建 API 錯誤對象
 * 
 * @param message - 錯誤訊息
 * @param status - HTTP 狀態碼
 * @param code - 錯誤代碼
 * @param details - 詳細錯誤信息
 * @returns ApiError 對象
 */
export function createApiError(
  message: string,
  status?: number,
  code?: string,
  details?: Record<string, unknown>
): ApiError {
  return {
    message,
    status,
    code,
    details,
  };
}

/**
 * 重試邏輯
 * 
 * @param fn - 要重試的異步函數
 * @param retries - 重試次數
 * @param delay - 重試延遲（毫秒）
 * @returns Promise
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2); // 指數退避
    }
    throw error;
  }
} 