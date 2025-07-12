/**
 * API 響應處理工具函式
 * 
 * 提供統一的 API 響應處理邏輯，消除 as any 類型斷言
 */

import type { 
  ListResponse, 
  PaginatedResponse, 
  PaginationMeta,
  ApiResponse,
  ApiErrorResponse 
} from '@/types/api-responses';

/**
 * 安全的響應數據提取
 * 
 * @param response API 響應
 * @param fallback 當響應為空時的預設值
 * @returns 提取的數據陣列
 */
export function safeExtractData<T>(
  response: any, 
  fallback: T[] = []
): T[] {
  // 處理 null 或 undefined
  if (!response) {
    return fallback;
  }

  // 處理分頁響應 { data: [], meta: {} }
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }

  // 處理直接陣列響應
  if (Array.isArray(response)) {
    return response;
  }

  // 處理包裝響應 { data: [] }
  if (response.data && Array.isArray(response.data)) {
    return response.data;
  }

  return fallback;
}

/**
 * 安全的分頁資訊提取
 * 
 * @param response API 響應
 * @returns 分頁資訊或 undefined
 */
export function safeExtractMeta(response: any): PaginationMeta | undefined {
  if (!response) {
    return undefined;
  }

  // 檢查是否有 meta 屬性
  if (response.meta && typeof response.meta === 'object') {
    return response.meta as PaginationMeta;
  }

  return undefined;
}

/**
 * 安全的單一項目提取
 * 
 * @param response API 響應
 * @returns 提取的項目或 null
 */
export function safeExtractItem<T>(response: any): T | null {
  if (!response) {
    return null;
  }

  // 處理包裝響應 { data: {} }
  if (response.data && typeof response.data === 'object') {
    return response.data as T;
  }

  // 處理直接對象響應
  if (typeof response === 'object' && !Array.isArray(response)) {
    return response as T;
  }

  return null;
}

/**
 * 檢查響應是否為錯誤
 * 
 * @param response API 響應
 * @returns 是否為錯誤響應
 */
export function isErrorResponse(response: any): response is ApiErrorResponse {
  return (
    response &&
    typeof response === 'object' &&
    'message' in response &&
    ('status' in response || 'errors' in response)
  );
}

/**
 * 檢查響應是否為分頁響應
 * 
 * @param response API 響應
 * @returns 是否為分頁響應
 */
export function isPaginatedResponse<T>(
  response: any
): response is PaginatedResponse<T> {
  return (
    response &&
    typeof response === 'object' &&
    'data' in response &&
    'meta' in response &&
    Array.isArray(response.data) &&
    response.meta &&
    typeof response.meta === 'object' &&
    'total' in response.meta
  );
}

/**
 * 統一的響應處理器
 * 
 * 根據響應類型自動選擇合適的處理方式
 */
export class ApiResponseHandler {
  /**
   * 處理列表響應（支援分頁和非分頁）
   */
  static handleListResponse<T>(response: any): {
    data: T[];
    meta?: PaginationMeta;
    isEmpty: boolean;
    total: number;
  } {
    const data = safeExtractData<T>(response);
    const meta = safeExtractMeta(response);
    
    return {
      data,
      meta,
      isEmpty: data.length === 0,
      total: meta?.total ?? data.length,
    };
  }

  /**
   * 處理單一項目響應
   */
  static handleItemResponse<T>(response: any): {
    data: T | null;
    exists: boolean;
  } {
    const data = safeExtractItem<T>(response);
    
    return {
      data,
      exists: data !== null,
    };
  }

  /**
   * 處理創建響應
   */
  static handleCreateResponse<T>(response: any): {
    data: T | null;
    success: boolean;
    message?: string;
  } {
    const data = safeExtractItem<T>(response);
    
    return {
      data,
      success: data !== null,
      message: response?.message,
    };
  }

  /**
   * 處理更新響應
   */
  static handleUpdateResponse<T>(response: any): {
    data: T | null;
    success: boolean;
    message?: string;
  } {
    return this.handleCreateResponse<T>(response);
  }

  /**
   * 處理刪除響應
   */
  static handleDeleteResponse(response: any): {
    success: boolean;
    message?: string;
  } {
    return {
      success: response?.success !== false,
      message: response?.message,
    };
  }
}

/**
 * 類型安全的響應轉換器
 * 
 * 提供更嚴格的類型檢查和轉換
 */
export class TypeSafeResponseTransformer {
  /**
   * 將未知響應轉換為類型安全的列表響應
   */
  static toListResponse<T>(response: unknown): ListResponse<T> {
    if (!response) {
      return [];
    }

    // 檢查是否為分頁響應
    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      'meta' in response
    ) {
      const paginatedResponse = response as any;
      if (Array.isArray(paginatedResponse.data)) {
        return {
          data: paginatedResponse.data as T[],
          meta: paginatedResponse.meta as PaginationMeta,
          links: paginatedResponse.links || {
            first: '',
            last: '',
            prev: null,
            next: null,
          },
        };
      }
    }

    // 檢查是否為直接陣列
    if (Array.isArray(response)) {
      return response as T[];
    }

    // 檢查是否為包裝的陣列響應
    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      Array.isArray((response as any).data)
    ) {
      return (response as any).data as T[];
    }

    return [];
  }

  /**
   * 將未知響應轉換為類型安全的項目響應
   */
  static toItemResponse<T>(response: unknown): T | null {
    if (!response) {
      return null;
    }

    // 檢查是否為包裝的項目響應
    if (
      typeof response === 'object' &&
      response !== null &&
      'data' in response &&
      typeof (response as any).data === 'object'
    ) {
      return (response as any).data as T;
    }

    // 檢查是否為直接項目響應
    if (typeof response === 'object' && response !== null) {
      return response as T;
    }

    return null;
  }
}