import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/errorHandler";
import { Store } from "./useStores";

/**
 * 用戶分店關聯請求主體類型定義
 */
type UserStoreAssignBody = {
  store_ids: string[];
};

/**
 * 獲取用戶分店的 Hook
 * @param userId - 用戶 ID
 */
export function useUserStores(userId: number) {
  return useQuery({
    queryKey: ['users', userId, 'stores'],
    queryFn: async () => {
      const { data, error } = await (apiClient as any).GET(`/api/users/${userId}/stores`);

      if (error) {
        // 處理錯誤但不拋出，而是返回空數組作為預設值
        handleApiError(error);
        return { data: [] };
      }

      // 如果 data 有 data 屬性，返回它；否則返回整個 data 對象
      return { data: data?.data || data || [] };
    },
    enabled: !!userId,
  });
}

/**
 * 分配分店給用戶的 Hook
 */
export function useAssignUserStores() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, storeIds }: { userId: number; storeIds: number[] }) => {
      // 確保所有 ID 都轉為字符串，符合後端期望的格式
      const stringStoreIds = storeIds.map(id => String(id));
      
      const { data, error } = await (apiClient as any).POST(`/api/users/${userId}/stores`, {
        body: { store_ids: stringStoreIds }
      });

      if (error) {
        // 處理錯誤並拋出帶有訊息的錯誤
        const errorMessage = handleApiError(error);
        throw new Error(errorMessage);
      }

      return data;
    },
    onSuccess: (_, variables) => {
      // 成功分配後，更新相關查詢緩存
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId, 'stores'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error) => {
      console.error('Failed to assign stores:', error);
      // 錯誤已經在 mutationFn 中使用 handleApiError 處理
    }
  });
} 