import createClient from 'openapi-fetch';
import type { paths, components } from '@/types/scramble-api';
import { getSession } from 'next-auth/react';

/**
 * Scramble PRO API 客戶端 - 分類模組專用
 * 
 * 使用 DTO 驅動遷移生成的精確類型定義
 * 享受 100% 類型安全的 API 調用體驗
 * 
 * 🔐 認證機制：與主 API 客戶端保持一致
 * - 使用 next-auth Session 作為唯一認證來源
 * - 自動注入 Bearer Token 到每個請求
 * - 完整的錯誤處理和日誌記錄
 */
export const scrambleApiClient = createClient<paths>({
  baseUrl: (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000') + '/api',
});

/**
 * 統一認證攔截器 - 與主 API 客戶端保持一致
 * 
 * 確保 Scramble PRO API 使用相同的認證邏輯
 * 從 next-auth Session 中獲取 accessToken 並注入到請求中
 */
scrambleApiClient.use({
  /**
   * 請求攔截器 - 自動注入認證信息
   */
  async onRequest({ request }) {
    try {
      // 🎯 統一權威：從 next-auth Session 獲取 accessToken
      const session = await getSession();
      const accessToken = session?.accessToken;

      // 注入認證憑證到 Authorization header
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
      }

      // 設定必要的 HTTP headers
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');

      return request;
    } catch (error) {
      console.error('Scramble API 認證攔截器錯誤:', error);
      
      // 即使認證失敗，也要設定基本 headers 並繼續請求
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');
      
      return request;
    }
  },

  /**
   * 響應攔截器 - 錯誤監控
   */
  async onResponse({ response }) {
    // 記錄認證相關錯誤
    if (response.status === 401) {
      console.warn('Scramble API 認證失敗 (401)，可能需要重新登入');
    }
    
    return response;
  },
});

// 導出類型以供組件使用 - 使用實際 API 響應類型
export type ScramblePaths = paths;
export type CategoryData = components['schemas']['CategoryData'];
export type CategoryResource = components['schemas']['App.Http.Resources.Api.CategoryResource'];
export type ReorderRequest = components['schemas']['ReorderCategoriesRequest']; 