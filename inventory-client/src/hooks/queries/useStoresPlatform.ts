import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api-platform';
import { toast } from 'sonner';
import { getSession } from 'next-auth/react';

// 創建 API Platform 客戶端（集成認證邏輯）
const apiPlatformClient = createClient<paths>({
  baseUrl: 'http://localhost:8000',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * 統一認證攔截器 - 與 apiClient.ts 保持一致
 * 
 * 核心功能：
 * 1. 從 next-auth Session 中獲取 accessToken
 * 2. 將 accessToken 注入到每個 API 請求的 Authorization header
 * 3. 設定必要的 HTTP headers
 * 4. 提供詳細的開發環境日誌
 */
apiPlatformClient.use({
  /**
   * 請求攔截器 - 統一認證注入點
   */
  async onRequest({ request }) {
    try {
      // 🎯 唯一權威：從 next-auth Session 獲取 accessToken
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
      // 認證攔截器錯誤
      console.error('API Platform 認證攔截器錯誤:', error);
      
      // 即使認證失敗，也要設定基本 headers 並繼續請求
      request.headers.set('Accept', 'application/json');
      request.headers.set('Content-Type', 'application/json');
      
      return request;
    }
  },

  /**
   * 響應攔截器 - 錯誤監控與日誌
   */
  async onResponse({ response }) {
    if (process.env.NODE_ENV === 'development') {
      if (!response.ok) {
        console.error('API Platform 請求失敗:', {
          url: response.url,
          status: response.status,
          statusText: response.statusText
        });
      }
    }
    return response;
  },
});

// 從生成的類型中提取請求體類型
type CreateStoreBody = paths['/api/stores']['post']['requestBody']['content']['application/json'];
type UpdateStoreBody = paths['/api/stores/{id}']['put']['requestBody']['content']['application/json'];

/**
 * 使用 API Platform 獲取分店列表的測試 Hook
 */
export function useStoresPlatform(filters?: {
  page?: number;
  per_page?: number;
  search?: string;
}) {
  return useQuery({
    queryKey: ['stores-platform', filters],
    queryFn: async () => {
      const response = await apiPlatformClient.GET('/api/stores', {
        params: {
          query: {
            page: filters?.page,
            per_page: filters?.per_page,
            search: filters?.search,
          }
        }
      });

      if (!response.data) {
        throw new Error('Failed to fetch stores');
      }

      // API Platform 返回 JSON-LD 格式，需要處理
      const data = response.data;
      
      // 檢查是否為 JSON-LD 格式（包含 hydra:member）
      if ('member' in data && Array.isArray(data.member)) {
        return {
          stores: data.member,
          meta: {
            total: data.totalItems || 0,
            page: filters?.page || 1,
            perPage: filters?.per_page || 15
          }
        };
      }

      // 普通 JSON 格式
      return {
        stores: Array.isArray(data) ? data : [],
        meta: {
          total: Array.isArray(data) ? data.length : 0,
          page: filters?.page || 1,
          perPage: filters?.per_page || 15
        }
      };
    },
    // 啟用開發模式的詳細錯誤訊息
    throwOnError: false,
  });
}

/**
 * 創建分店的 Mutation Hook (API Platform)
 * 
 * 功能特性：
 * 1. 契約優先 - 使用 openapi-typescript 生成的類型
 * 2. 數據精煉廠 - 在 mutationFn 中處理所有 API 交互
 * 3. 快取同步 - 成功後自動失效相關查詢
 * 4. 用戶反饋 - 成功/失敗時顯示 toast 通知
 */
export function useCreateStorePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStoreBody) => {
      // 🔒 雙重保險：手動獲取認證 token
      const session = await getSession();
      const accessToken = session?.accessToken;

      console.log('🔍 創建分店請求詳情:', {
        hasToken: !!accessToken,
        tokenPrefix: accessToken?.substring(0, 20),
        requestData: data
      });

      const response = await apiPlatformClient.POST('/api/stores', {
        body: data,
        // 🛡️ 雙重保險：直接在請求中添加認證 header
        ...(accessToken && {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          }
        })
      });

      console.log('📡 創建分店響應:', {
        success: !!response.data,
        error: response.error,
        status: (response as any).response?.status
      });

      if (!response.data) {
        const errorMessage = (response.error as any)?.message || '創建分店失敗';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: async () => {
      // 🚀 失效分店列表快取，確保新數據立即顯示
      await Promise.all([
        queryClient.invalidateQueries({ 
          queryKey: ['stores-platform'],
          exact: false,
          refetchType: 'all'
        }),
        // 同時失效舊 API 的快取（過渡期雙重保險）
        queryClient.invalidateQueries({ 
          queryKey: ['stores'],
          exact: false,
          refetchType: 'all'
        })
      ]);
      
      // 🔔 成功通知
      toast.success('分店創建成功');
    },
    onError: (error: Error) => {
      // 🔴 錯誤處理
      console.error('🔥 創建分店失敗:', error);
      toast.error('創建分店失敗', {
        description: error.message || '請檢查輸入資料並重試'
      });
    }
  });
}

/**
 * 更新分店的 Mutation Hook (API Platform)
 * 
 * 功能特性：
 * 1. 類型安全的參數傳遞
 * 2. 自動處理 ID 參數
 * 3. 快取同步包含列表和詳情頁
 * 4. 友善的錯誤處理
 */
export function useUpdateStorePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateStoreBody }) => {
      const response = await apiPlatformClient.PUT('/api/stores/{id}', {
        params: { path: { id: id.toString() } },
        body: data
      });

      if (!response.data) {
        const errorMessage = (response.error as any)?.message || '更新分店失敗';
        throw new Error(errorMessage);
      }

      return response.data;
    },
    onSuccess: async (_, variables) => {
      // 🚀 失效相關快取
      await Promise.all([
        // 失效列表快取
        queryClient.invalidateQueries({ 
          queryKey: ['stores-platform'],
          exact: false,
          refetchType: 'all'
        }),
        // 失效特定分店的詳情快取
        queryClient.invalidateQueries({ 
          queryKey: ['stores-platform', variables.id],
          refetchType: 'all'
        }),
        // 同時失效舊 API 的快取（過渡期雙重保險）
        queryClient.invalidateQueries({ 
          queryKey: ['stores'],
          exact: false,
          refetchType: 'all'
        })
      ]);
      
      // 🔔 成功通知
      toast.success('分店更新成功');
    },
    onError: (error: Error) => {
      // 🔴 錯誤處理
      toast.error('更新分店失敗', {
        description: error.message || '請檢查輸入資料並重試'
      });
    }
  });
}

/**
 * 刪除分店的 Mutation Hook (API Platform)
 * 
 * 功能特性：
 * 1. 簡單的 ID 參數接口
 * 2. 成功後移除相關快取
 * 3. 防止意外刪除的二次確認（在組件層實現）
 * 4. 清晰的成功/失敗反饋
 */
export function useDeleteStorePlatform() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiPlatformClient.DELETE('/api/stores/{id}', {
        params: { path: { id: id.toString() } }
      });

      // DELETE 操作通常返回 204 No Content
      if (response.error) {
        const errorMessage = (response.error as any)?.message || '刪除分店失敗';
        throw new Error(errorMessage);
      }

      return { success: true };
    },
    onSuccess: async (_, id) => {
      // 🚀 失效相關快取並移除已刪除項目的快取
      await Promise.all([
        // 失效列表快取
        queryClient.invalidateQueries({ 
          queryKey: ['stores-platform'],
          exact: false,
          refetchType: 'all'
        }),
        // 移除已刪除分店的詳情快取
        queryClient.removeQueries({ 
          queryKey: ['stores-platform', id]
        }),
        // 同時失效舊 API 的快取（過渡期雙重保險）
        queryClient.invalidateQueries({ 
          queryKey: ['stores'],
          exact: false,
          refetchType: 'all'
        })
      ]);
      
      // 🔔 成功通知
      toast.success('分店刪除成功');
    },
    onError: (error: Error) => {
      // 🔴 錯誤處理
      toast.error('刪除分店失敗', {
        description: error.message || '請稍後再試'
      });
    }
  });
} 