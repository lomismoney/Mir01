import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import type { paths } from "@/types/api";

type ChangePasswordRequest = paths["/api/user/change-password"]["post"]["requestBody"]["content"]["application/json"];
type ChangePasswordResponse = paths["/api/user/change-password"]["post"]["responses"]["200"]["content"]["application/json"];

export function useChangePassword() {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordRequest>({
    mutationFn: async (data) => {
      const response = await apiClient.POST("/api/user/change-password", {
        body: data,
      });

      if (!response.data) {
        // 處理驗證錯誤
        if (response.error && "errors" in response.error) {
          const errors = response.error.errors as Record<string, string[]>;
          if (errors.current_password) {
            throw new Error(errors.current_password[0]);
          }
          throw new Error(response.error.message || "密碼變更失敗");
        }
        throw new Error("密碼變更失敗");
      }

      return response.data;
    },
  });
}