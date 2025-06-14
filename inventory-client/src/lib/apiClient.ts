import createClient from "openapi-fetch";
import type { paths } from "@/types/api";
import { getSession } from "next-auth/react";

/**
 * API 客戶端設定（NextAuth.js 整合版）
 * 使用 openapi-fetch 建立具有類型安全的 API 客戶端
 * 自動對應後端的 OpenAPI 規範，並整合 NextAuth session
 * 
 * 功能特色：
 * 1. 類型安全的 API 呼叫
 * 2. 自動從 NextAuth session 注入 Bearer Token
 * 3. 統一的請求攔截處理
 * 4. 與後端 API 規範同步
 * 5. 環境變數配置支援
 * 6. 非同步 token 獲取機制
 */
const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost",
});

/**
 * 使用攔截器 (interceptor)，在每個請求發送前動態注入 Token
 * 
 * 重要改進：
 * - 使用 NextAuth 的 getSession() 替代舊的 tokenManager
 * - 支援非同步 token 獲取
 * - 確保與 Auth.js 認證流程完全同步
 * - 自動處理 session 過期和更新
 */
apiClient.use({
    async onRequest({ request }) {
        // 從 NextAuth 的 session 中非同步獲取 token
        const session = await getSession();
        const token = session?.user?.apiToken;

        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
    // 確保必要的標頭存在
    request.headers.set("Accept", "application/json");

    return request;
  },
});

export { apiClient }; 