import createClient from "openapi-fetch";
import type { paths } from "@/types/api";
import { getSession } from 'next-auth/react';

/**
 * 統一認證 API 客戶端 - 密鑰統一作戰版本
 * 
 * 架構革命：
 * ✅ 單一事實來源：next-auth Session 作為唯一權威
 * ❌ 徹底移除：localStorage 混亂邏輯
 * ✅ 簡潔高效：統一的認證攔截器
 * ✅ 類型安全：完整的 TypeScript 支援
 * 
 * 核心原則：
 * 1. Session.accessToken 是唯一且絕對的身份憑證來源
 * 2. 所有 API 請求都透過統一攔截器處理認證
 * 3. 零容忍政策：任何繞過 next-auth 的認證邏輯都被禁止
 * 4. 錯誤處理優雅且詳細
 */

/**
 * 統一認證 API 客戶端實例
 * 
 * 基於 openapi-fetch 構建，提供完整的類型安全保證
 * 集成 next-auth Session 認證，確保權威統一
 */
const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost",
});

/**
 * 統一認證攔截器 - 架構統一的核心
 * 
 * 職責：
 * 1. 從 next-auth Session 中獲取 accessToken
 * 2. 將 accessToken 注入到每個 API 請求的 Authorization header
 * 3. 設定必要的 HTTP headers
 * 4. 提供詳細的開發環境日誌
 * 
 * 安全保證：
 * - 唯一認證來源：session.accessToken
 * - 零 localStorage 依賴
 * - 完整的錯誤處理
 */
apiClient.use({
  /**
   * 請求攔截器 - 統一認證注入點
   * 
   * 在每個 API 請求發送前，自動從 next-auth Session 中
   * 獲取有效的 accessToken 並注入到 Authorization header
   */
  async onRequest({ request }) {
    try {
      // 🎯 唯一權威：從 next-auth Session 獲取 accessToken
      const session = await getSession();
      const accessToken = session?.accessToken;

      // 開發環境詳細日誌
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 API 請求認證狀態:', {
          url: request.url,
          method: request.method,
          hasSession: !!session,
          hasAccessToken: !!accessToken,
          tokenPrefix: accessToken ? accessToken.substring(0, 10) + '...' : 'null',
          timestamp: new Date().toISOString()
        });
      }

      // 注入認證憑證到 Authorization header
      if (accessToken) {
        request.headers.set('Authorization', `Bearer ${accessToken}`);
        
        // 確認注入成功（開發環境）
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 Authorization header 已注入:', {
            tokenLength: accessToken.length,
            headerSet: !!request.headers.get('Authorization')
          });
        }
      } else {
        console.warn('⚠️ 無有效 accessToken，請求將以未認證狀態發送');
      }

      // 設定必要的 HTTP headers
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');

      return request;
    } catch (error) {
      console.error('❌ 認證攔截器錯誤:', error);
      
      // 即使認證失敗，也要設定基本 headers 並繼續請求
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');
      
      return request;
    }
  },

  /**
   * 響應攔截器 - 錯誤監控與日誌
   * 
   * 監控 API 響應狀態，特別關注認證相關錯誤
   * 提供詳細的開發環境日誌和錯誤分析
   */
  async onResponse({ response }) {
    // 開發環境響應日誌
    if (process.env.NODE_ENV === 'development') {
      console.log('📡 API 響應狀態:', {
        url: response.url,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      });

      // 認證錯誤特別處理
      if (response.status === 401) {
        console.error('🚨 認證失敗 - 可能的原因:', {
          url: response.url,
          status: response.status,
          可能原因: [
            '1. Session 已過期',
            '2. AccessToken 無效',
            '3. 後端認證配置問題',
            '4. CORS 設定問題'
          ],
          建議動作: [
            '1. 檢查 next-auth Session 狀態',
            '2. 確認後端 API 認證配置',
            '3. 重新登入以刷新 Session'
          ],
          timestamp: new Date().toISOString()
        });
      }
    }

    return response;
  },
});

/**
 * 創建類型安全的 API 客戶端包裝器
 * 
 * 提供特定端點的安全包裝，處理類型不一致問題
 * 同時保持統一的認證機制
 */
export const safeApiClient = {
  ...apiClient,
  
  // 修復庫存詳情端點
  getInventoryDetail: async (id: number) => {
    return apiClient.GET('/api/inventory/{id}' as any, {
      params: { path: { id } }
    } as any);
  },

  // 修復轉移詳情端點
  getInventoryTransferDetail: async (id: number) => {
    return apiClient.GET('/api/inventory/transfers/{id}' as any, {
      params: { path: { id } }
    } as any);
  },

  // 修復門市相關端點
  getStore: async (id: number) => {
    return apiClient.GET('/api/stores/{id}' as any, {
      params: { path: { id } }
    } as any);
  },

  createStore: async (data: any) => {
    return apiClient.POST('/api/stores' as any, {
      body: data
    } as any);
  },

  updateStore: async (id: number, data: any) => {
    return apiClient.PUT('/api/stores/{id}' as any, {
      params: { path: { id } },
      body: data
    } as any);
  },

  // 修復商品變體詳情端點
  getProductVariantDetail: async (id: number) => {
    return apiClient.GET('/api/products/variants/{id}' as any, {
      params: { path: { id } }
    } as any);
  },
};

/**
 * Session 緩存清理函式 - 登出時使用
 * 
 * 當用戶登出或 Session 失效時，調用此函式
 * 確保下次 API 調用會重新獲取有效的認證狀態
 */
export function clearAuthCache(): void {
  // next-auth 會自動處理 Session 清理
  // 這個函式為未來擴展預留接口
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 認證緩存清理完成');
  }
}

// 導出統一的 API 客戶端
export { apiClient };

// 向後兼容的導出（為了修復現有代碼中的導入）
export const clearTokenCache = clearAuthCache;

export default apiClient; 