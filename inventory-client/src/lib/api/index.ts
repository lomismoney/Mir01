import { safeApiClient } from "@/lib/apiClient";

/**
 * 提供統一的 API 客戶端 Hook
 * 返回配置好認證的 API 客戶端實例
 */
export function useApiClient() {
  return safeApiClient;
}

// 導出其他相關的 API 工具
export { apiClient, safeApiClient } from "@/lib/apiClient";