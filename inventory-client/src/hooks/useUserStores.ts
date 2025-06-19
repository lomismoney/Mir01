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
    queryKey: ["user-stores", userId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET(`/api/users/{user_id}/stores` as any, {
        params: { path: { user_id: userId } },
      } as any);

      if (error) {
        handleApiError(error);
        throw new Error("取得用戶門市失敗");
      }

      // 如果 data 有 data 屬性，返回它；否則返回空陣列
      return { data: (data as any)?.data || data || [] };
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
      const { data, error } = await apiClient.POST(`/api/users/{user_id}/stores` as any, {
        params: { path: { user_id: userId } },
        body: { store_ids: storeIds },
      } as any);

      if (error) {
        handleApiError(error);
        throw new Error("分配門市失敗");
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["user-stores", variables.userId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
} 