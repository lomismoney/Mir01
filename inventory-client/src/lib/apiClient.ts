import createClient from "openapi-fetch";
import type { paths } from "@/types/api";
import { getToken } from "./tokenManager";

/**
 * API 客戶端設定
 * 使用 openapi-fetch 建立具有類型安全的 API 客戶端
 * 自動對應後端的 OpenAPI 規範
 * 
 * 功能特色：
 * 1. 類型安全的 API 呼叫
 * 2. 自動注入 Bearer Token
 * 3. 統一的請求攔截處理
 * 4. 與後端 API 規範同步
 * 5. 環境變數配置支援
 */
const apiClient = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
});

/**
 * 使用中間件為所有請求自動添加 Bearer Token
 * 
 * 這是 openapi-fetch 推薦的方式來處理認證 Token
 * 會在每次請求時動態獲取最新的 Token
 */
apiClient.use({
    onRequest({ request }) {
        const token = getToken();
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
        return request;
    },
});

export default apiClient; 