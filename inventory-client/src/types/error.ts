/**
 * API 錯誤相關類型定義
 * 用於替代原本使用 any 的錯誤處理
 */

// Laravel 驗證錯誤格式
export interface LaravelValidationError {
  message: string;
  errors: Record<string, string[]>;
}

// Laravel 一般錯誤格式
export interface LaravelGeneralError {
  message: string;
  status?: number;
  code?: string;
}

// API 錯誤聯合類型
export type ApiError = LaravelValidationError | LaravelGeneralError | Error;

// 錯誤處理工具函數
export function isLaravelValidationError(error: unknown): error is LaravelValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'errors' in error &&
    typeof (error as { errors: unknown }).errors === 'object'
  );
}

export function isLaravelGeneralError(error: unknown): error is LaravelGeneralError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  );
}

export function parseApiErrorMessage(error: unknown): string {
  if (isLaravelValidationError(error)) {
    // Laravel 驗證錯誤格式：{ errors: { field: [messages] } }
    const validationErrors = Object.values(error.errors)
      .flat()
      .join('\n');
    return validationErrors || error.message || '驗證錯誤';
  }
  
  if (isLaravelGeneralError(error)) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return '未知錯誤';
}
