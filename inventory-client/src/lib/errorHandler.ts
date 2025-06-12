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
  HTML_RESPONSE: '系統返回了非預期的響應格式，請確認 API 設定是否正確',
} as const;

/**
 * 檢查字符串是否為 HTML
 */
function isHtmlString(text: string): boolean {
  if (!text) return false;
  const trimmedText = text.trim();
  return trimmedText.startsWith('<!DOCTYPE') || 
         trimmedText.startsWith('<html') || 
         (trimmedText.startsWith('<') && trimmedText.includes('</html>'));
}

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

  // 檢查是否為 HTML 響應
  if (typeof errorObj.message === 'string' && isHtmlString(errorObj.message)) {
    return ERROR_MESSAGES.HTML_RESPONSE;
  }
  
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
 * @returns 錯誤訊息字串
 */
export function handleApiError(error: UnknownError, fallbackMessage?: string): string {
  const message = fallbackMessage || parseApiError(error);
  
  toast.error(message);
  
  // 在開發環境下記錄詳細錯誤
  if (process.env.NODE_ENV === 'development') {
    // 記錄錯誤，但避免輸出可能過大的 HTML 內容
    if (error && typeof error === 'object') {
      let errorInfo: Record<string, any> = {};
      
      try {
        const { message, status, code, ...rest } = error as any;
        
        // 不輸出長 HTML 內容
        errorInfo = {
          message: typeof message === 'string' && isHtmlString(message) ? 
            'HTML Response (content omitted)' : message,
          status,
          code
        };
        
        // 添加其他有用但不是 HTML 的信息
        Object.entries(rest).forEach(([key, value]) => {
          // 篩選掉可能的長 HTML 字串
          if (typeof value !== 'string' || !isHtmlString(value)) {
            errorInfo[key] = value;
          }
        });
      } catch {
        errorInfo = { error: 'Error object could not be safely processed' };
      }
      
      console.error('API Error:', errorInfo);
    } else {
      console.error('API Error:', String(error));
    }
  }
  
  return message;
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