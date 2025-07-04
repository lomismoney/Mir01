/**
 * 用戶分店關聯管理相關的 React Query Hooks
 * 
 * 提供用戶分店關聯的查詢和操作功能
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/apiClient';
import { handleApiError } from '@/lib/errorHandler';

/**
 * 獲取用戶關聯的分店列表
 * @param userId 用戶ID
 */
export function useUserStores(userId: number) {
  return useQuery({
    queryKey: ['userStores', userId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/users/{user_id}/stores' as any, {
        params: { path: { user_id: userId } },
      });
      if (error) {
        handleApiError(error);
        throw new Error('取得用戶門市失敗');
      }
      return data;
    },
    // 數據精煉廠 - 處理分店數據的解包和轉換
    select: (response: any) => {
      // 處理可能的巢狀數據結構
      const data = response?.data || response || [];
      return { data: Array.isArray(data) ? data : [] };
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,  // 5 分鐘內保持新鮮
  });
}

/**
 * 分配分店給用戶
 */
export function useAssignUserStores() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, storeIds }: { userId: number; storeIds: number[] }) => {
      const { data, error } = await apiClient.POST('/api/users/{user_id}/stores' as any, {
        params: { path: { user_id: userId } },
        body: { store_ids: storeIds },
      });
      if (error) {
        handleApiError(error);
        throw new Error('分配門市失敗');
      }
      return data;
    },
    onSuccess: (_, variables) => {
      // 無效化相關快取
      queryClient.invalidateQueries({ queryKey: ['userStores', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      
      // 成功通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.success('門市分配成功！');
      }
    },
    onError: (error) => {
      // 錯誤通知
      if (typeof window !== 'undefined') {
        const { toast } = require('sonner');
        toast.error('門市分配失敗', {
          description: error.message || '請檢查輸入資料並重試。'
        });
      }
    },
  });
} 