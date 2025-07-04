/**
 * 門市管理相關的 React Query Hooks
 * 
 * 提供完整的門市 CRUD 操作功能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { QUERY_KEYS } from '../shared/queryKeys';
import { CreateStoreRequest, UpdateStoreRequest } from '@/types/api-helpers';

/**
 * 獲取門市列表
 */
export function useStores(params: {
  name?: string;
  status?: string;
  page?: number;
  per_page?: number;
} = {}) {
  return useQuery({
    queryKey: ['stores', params],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/stores');
      if (error) {
        throw new Error('獲取門市列表失敗');
      }
      return data;
    },
    
    // 🎯 標準化數據精煉廠 - 處理門市數據的解包和轉換
    select: (response: any) => {
      // 處理可能的巢狀或分頁數據結構
      const data = response?.data?.data || response?.data || response || [];
      const meta = response?.data?.meta || {
        total: Array.isArray(data) ? data.length : 0,
        per_page: params.per_page || 100,
        current_page: params.page || 1,
        last_page: 1
      };
      
      // 確保數據的類型安全和結構一致性
      const stores = Array.isArray(data) ? data.map((store: any) => ({
        id: store.id || 0,
        name: store.name || '未命名門市',
        address: store.address || null,
        phone: store.phone || null,
        status: store.status || 'active',
        created_at: store.created_at || '',
        updated_at: store.updated_at || '',
        // 如果有庫存統計數據，也進行處理
        inventory_count: store.inventory_count || 0,
        // 如果有用戶關聯數據，也進行處理
        users_count: store.users_count || 0
      })) : [];
      
      // 返回標準的分頁結構
      return { data: stores, meta };
    },
    
    staleTime: 10 * 60 * 1000,  // 10 分鐘內保持新鮮（門市資訊變化較少）
  });
}

/**
 * 獲取單個門市詳情
 */
export function useStore(id: number) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/stores/{id}' as any, {
        params: { path: { id } },
      } as any);
      if (error) {
        throw new Error('獲取門市詳情失敗');
      }
      return data;
    },
    // 🎯 新增的數據精煉廠，負責解包
    select: (response: any) => response?.data,
    enabled: !!id,
  });
}

/**
 * 🎯 創建門市請求的具名類型定義
 * 
 * 此類型反映前端表單的數據結構，確保類型安全並提供
 * 完善的開發體驗（IDE 自動補全、類型檢查等）
 */
type CreateStorePayload = {
  name: string;           // 門市名稱（必填）
  address?: string;       // 門市地址
  phone?: string;         // 聯絡電話
  status?: 'active' | 'inactive';  // 門市狀態
  description?: string;   // 門市描述
  // 可根據實際業務需求擴展其他欄位
};

/**
 * 創建門市
 * 
 * 功能說明：
 * 1. 接收門市創建資料（名稱為必填，其他為選填）
 * 2. 發送 POST 請求到 /api/stores 端點
 * 3. 成功後自動無效化門市列表快取
 * 4. 顯示成功或錯誤通知
 */
export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateStoreRequest) => {
      const { data, error } = await apiClient.POST('/api/stores', {
        body,
      });
      if (error) {
        throw new Error('創建門市失敗');
      }
      return data;
    },
    onSuccess: (newStore) => {
      // 無效化門市列表快取，觸發重新獲取最新的門市列表
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success(`門市「${newStore?.data?.name}」創建成功！`);
      }
    },
    onError: (error) => {
      // 🔔 錯誤通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('門市創建失敗', {
          description: error.message || '請檢查輸入資料並重試。'
        });
      }
    },
  });
}

/**
 * 更新門市
 * 
 * 功能說明：
 * 1. 接收門市更新資料（路徑參數和請求體）
 * 2. 發送 PUT 請求到 /api/stores/{id} 端點
 * 3. 成功後自動無效化相關快取
 * 4. 提供成功或錯誤反饋
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: number; body: UpdateStoreRequest }) => {
      const { data, error } = await apiClient.PUT('/api/stores/{id}' as any, {
        params: { path: { id } },
        body,
      } as any);
      if (error) {
        throw new Error('更新門市失敗');
      }
      return data;
    },
    onSuccess: (updatedStore, variables) => {
      // 無效化相關快取
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.invalidateQueries({ queryKey: ['stores', variables.id] });
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success(`門市資料更新成功！`);
      }
    },
    onError: (error) => {
      // 🔔 錯誤通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('門市更新失敗', {
          description: error.message || '請檢查輸入資料並重試。'
        });
      }
    },
  });
}

/**
 * 刪除門市
 * 
 * 功能說明：
 * 1. 接收要刪除的門市 ID 路徑參數
 * 2. 發送 DELETE 請求到 /api/stores/{id} 端點
 * 3. 成功後自動無效化門市列表快取
 * 4. 提供成功或錯誤反饋
 * 
 * 注意：刪除門市可能會影響相關的庫存和用戶資料，請謹慎操作
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await apiClient.DELETE('/api/stores/{id}', {
        params: { path: { id } },
      });
      if (error) {
        throw new Error('刪除門市失敗');
      }
    },
    onSuccess: (_, id) => {
      // 無效化門市列表快取
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      queryClient.removeQueries({ queryKey: ['stores', id] });
      
      // 🔔 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('門市已成功刪除');
      }
    },
    onError: (error) => {
      // 🔔 錯誤通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('門市刪除失敗', {
          description: error.message || '此門市可能有關聯資料，無法刪除。'
        });
      }
    },
  });
} 