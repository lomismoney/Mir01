import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';
import { parseApiError } from '@/lib/errorHandler';
import { toast } from 'sonner';
import type { paths } from '@/types/api';

// API類型定義
type UpdateProfileRequest = paths["/api/user/profile"]["put"]["requestBody"]["content"]["application/json"];

/**
 * 獲取當前用戶個人資料的Hook
 * 
 * 功能特性：
 * 1. 類型安全的API調用
 * 2. 自動緩存管理
 * 3. 錯誤處理
 * 4. 載入狀態管理
 * 
 * @returns 當前用戶個人資料查詢結果
 */
export function useProfile() {
  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/user/profile');
      
      if (error) {
        const errorMessage = parseApiError(error) || '獲取個人資料失敗';
        throw new Error(errorMessage);
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5分鐘內不重新獲取
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/**
 * 更新個人資料的Mutation Hook
 * 
 * 功能特性：
 * 1. 類型安全的API調用
 * 2. 樂觀更新支援
 * 3. 成功/錯誤通知
 * 4. 自動緩存失效和重新獲取
 * 
 * @returns 更新個人資料的mutation結果
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestData: UpdateProfileRequest) => {
      const { data, error } = await apiClient.PUT('/api/user/profile', {
        body: requestData,
      });
      
      if (error) {
        const errorMessage = parseApiError(error) || '更新個人資料失敗';
        throw new Error(errorMessage);
      }
      
      return data;
    },
    onSuccess: async (data) => {
      // 更新個人資料緩存
      queryClient.setQueryData(['user', 'profile'], data);
      
      // 同時失效用戶相關的查詢，確保所有地方的用戶資料都是最新的
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['user'],
          exact: false,
        }),
        // 如果有session管理相關的查詢，也需要失效
        queryClient.invalidateQueries({
          queryKey: ['session'],
          exact: false,
        }),
      ]);
      
      // 成功通知
      toast.success('個人資料已更新', {
        description: '您的個人資料已成功更新',
      });
    },
    onError: (error) => {
      // 錯誤通知
      const errorMessage = parseApiError(error);
      toast.error('更新失敗', {
        description: errorMessage,
      });
    },
  });
} 