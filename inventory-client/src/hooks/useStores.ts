/**
 * @deprecated 此文件已廢棄，請使用 @/hooks/queries/useEntityQueries 中的標準化 hooks
 * 
 * 遷移指南：
 * 1. 將 import { useStores } from "@/hooks/useStores" 
 *    改為 import { useStores } from "@/hooks/queries/useEntityQueries"
 * 
 * 2. 新版 useStores 返回標準化的 { data, meta } 結構，而非 { data: [] }
 * 
 * 3. Store 類型定義請直接在使用處定義，或創建共用的類型文件
 * 
 * 此文件將在後續版本中移除
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";
import { handleApiError } from "@/lib/errorHandler";

/**
 * 分店類型定義
 */
export type Store = {
  id: number;
  name: string;
  address: string | null;
  created_at: string;
  updated_at: string;
};

/**
 * 分店創建請求主體類型定義
 */
type CreateStoreBody = {
  name: string;
  address?: string | null;
};

/**
 * 分店更新請求主體類型定義
 */
type UpdateStoreBody = {
  name: string;
  address?: string | null;
};

/**
 * 獲取所有分店的 Hook
 */
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      // 使用正確的 API 類型
      const { data, error } = await apiClient.GET("/api/stores");

      if (error) {
        throw handleApiError(error);
      }

      // 如果 data 有 data 屬性，返回它；否則返回整個 data 對象
      return { data: data?.data || data || [] };
    },
  });
}

/**
 * 獲取單個分店的 Hook
 * @param id - 分店 ID
 */
export function useStore(id: number) {
  return useQuery({
    queryKey: ["stores", id],
    queryFn: async () => {
      // 使用正確的 API 類型
      const { data, error } = await apiClient.GET(`/api/stores/{id}` as any, {
        params: { path: { id } }
      } as any);

      if (error) {
        throw new Error("取得門市詳情失敗");
      }

      return { data: (data as any)?.data || data };
    },
    enabled: !!id,
  });
}

/**
 * 創建分店的 Hook
 */
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { data: responseData, error } = await apiClient.POST("/api/stores" as any, {
        body: data,
      } as any);

      if (error) {
        throw new Error("新增門市失敗");
      }

      return responseData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
    },
  });
}

/**
 * 更新分店的 Hook
 */
export function useUpdateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const { data: responseData, error } = await apiClient.PUT(`/api/stores/{id}` as any, {
        params: { path: { id } },
        body: data,
      } as any);

      if (error) {
        throw new Error("更新門市失敗");
      }

      return responseData;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["stores"] });
      queryClient.invalidateQueries({ queryKey: ["stores", variables.id] });
    },
  });
}

/**
 * 刪除分店的 Hook
 */
export function useDeleteStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      // 使用正確的 API 類型
      const { error } = await apiClient.DELETE(`/api/stores/{id}`, {
        params: { path: { id } }
      });

      if (error) {
        throw handleApiError(error);
      }

      return { success: true };
    },
    onSuccess: () => {
      // 成功刪除後，更新分店列表的查詢緩存
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
} 