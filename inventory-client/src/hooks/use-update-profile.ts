import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { paths } from "@/types/api";

type UpdateProfileRequest = paths["/api/user/profile"]["put"]["requestBody"]["content"]["application/json"];
type UpdateProfileResponse = paths["/api/user/profile"]["put"]["responses"]["200"]["content"]["application/json"];

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UpdateProfileResponse, Error, UpdateProfileRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.PUT("/api/user/profile", {
        body: data,
      });

      if (response.error) {
        throw new Error(response.error.message || "更新個人資料失敗");
      }

      if (!response.data) {
        throw new Error("更新個人資料失敗");
      }

      return response.data;
    },
    onSuccess: () => {
      // 使相關查詢失效
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
  });
}