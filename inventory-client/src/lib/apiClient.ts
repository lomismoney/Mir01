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
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost",
});

/**
 * 檢查響應是否為 HTML 格式
 */
function isHtmlResponse(responseText: string): boolean {
  return !!responseText && 
    (responseText.trim().startsWith('<!DOCTYPE html>') || 
     responseText.trim().startsWith('<html'));
}

/**
 * 使用中間件為所有請求自動添加 Bearer Token
 * 並處理非 JSON 響應的情況
 */
apiClient.use({
    onRequest({ request }) {
        const token = getToken();
        if (token) {
            request.headers.set("Authorization", `Bearer ${token}`);
        }
        // 確保我們期望接收 JSON 響應
        request.headers.set("Accept", "application/json");
        return request;
    },
    onResponse({ response }) {
        // 檢查回應格式是否為 HTML 而非預期的 JSON
        if (response.headers.get('content-type')?.includes('text/html')) {
            const error = new Error('伺服器返回了 HTML 而非預期的 JSON 回應，請檢查 API 設定或伺服器狀態');
            (error as any).status = response.status;
            (error as any).statusText = response.statusText;
            throw error;
        }
        return response;
    }
});

export default apiClient; 