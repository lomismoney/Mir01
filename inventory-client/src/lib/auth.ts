import { cookies } from 'next/headers';
import { cache } from 'react';
import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

/**
 * 認證用戶資料類型（從 API 響應中提取）
 */
export interface AuthUser {
  id: number;
  name: string;
  username: string;
  role: 'admin' | 'viewer';
  role_display: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * 認證 Session 類型
 */
export interface AuthSession {
  user: AuthUser;
  token: string;
}

/**
 * Token 鍵值常數
 */
const TOKEN_KEY = 'authToken';

/**
 * 建立伺服器端專用的 API 客戶端
 * 
 * 與客戶端 apiClient 不同，這個版本：
 * 1. 不會自動注入 Token（需要手動傳遞）
 * 2. 專為伺服器端環境設計
 * 3. 支援動態 Token 設定
 */
function createServerApiClient(token?: string) {
  const client = createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
  });

  // 如果提供了 Token，則設定 Authorization header
  if (token) {
    client.use({
      onRequest({ request }) {
        request.headers.set("Authorization", `Bearer ${token}`);
        return request;
      },
    });
  }

  return client;
}

/**
 * 從伺服器端 Cookie 獲取認證 Token
 * 
 * @returns Token 字串或 null
 * 
 * 功能說明：
 * - 使用 Next.js cookies() API 存取 HTTP Cookie
 * - 支援伺服器端渲染環境
 * - 安全地讀取認證 Token
 */
async function getServerToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get(TOKEN_KEY);
    return tokenCookie?.value || null;
  } catch (error) {
    console.warn('讀取 Cookie 時發生錯誤:', error);
    return null;
  }
}

/**
 * 驗證 Token 並獲取用戶資訊（非快取版本）
 * 
 * @param token - 認證 Token
 * @returns 用戶資訊或 null
 * 
 * 功能說明：
 * - 使用類型安全的 apiClient 呼叫後端 /api/user 端點
 * - 獲取當前用戶的詳細資訊
 * - 處理 Token 無效或過期的情況
 * - 完全類型安全，無需手動類型斷言
 */
async function validateTokenWithApi(token: string): Promise<AuthUser | null> {
  try {
    // 建立帶有 Token 的伺服器端 API 客戶端
    const serverApiClient = createServerApiClient(token);
    
    // 使用類型安全的 API 呼叫
    const { data, error } = await serverApiClient.GET("/api/user");

    if (error) {
      console.warn('API 認證失敗:', error);
      return null;
    }

    // 檢查回應格式並回傳用戶資料
    if (data && data.data && typeof data.data === 'object') {
      return data.data as AuthUser;
    }
    
    console.warn('API 回應格式不正確:', data);
    return null;
    
  } catch (error) {
    console.error('Token 驗證時發生錯誤:', error);
    return null;
  }
}

/**
 * 快取版本的用戶驗證函式
 * 
 * 使用 React cache() 來確保在同一個請求週期內
 * 相同的 Token 只會被驗證一次，提升效能
 */
const getCachedUser = cache(async (token: string): Promise<AuthUser | null> => {
  return validateTokenWithApi(token);
});

/**
 * 主要的伺服器端認證檢查函式
 * 
 * @returns Promise<AuthSession | null>
 * 
 * 功能說明：
 * 1. 從 Cookie 獲取認證 Token
 * 2. 呼叫後端 API 驗證 Token 並獲取用戶資訊
 * 3. 回傳完整的認證 Session 或 null
 * 
 * 使用範例：
 * ```tsx
 * export default async function ProtectedPage() {
 *   const session = await auth();
 *   if (!session?.user) {
 *     redirect('/login');
 *   }
 *   
 *   return <div>歡迎，{session.user.name}！</div>;
 * }
 * ```
 * 
 * 安全特性：
 * - 伺服器端執行，避免 Token 暴露給客戶端
 * - 每次請求都會驗證 Token 的有效性
 * - 支援 Token 過期和無效的自動處理
 * - 使用 cache() 最佳化同一請求週期內的重複驗證
 */
export async function auth(): Promise<AuthSession | null> {
  // 1. 獲取 Token
  const token = await getServerToken();
  if (!token) {
    return null;
  }

  // 2. 驗證 Token 並獲取用戶資訊
  const user = await getCachedUser(token);
  if (!user) {
    return null;
  }

  // 3. 回傳完整的 Session
  return {
    user,
    token
  };
}

/**
 * 檢查當前用戶是否為管理員
 * 
 * @returns Promise<boolean>
 * 
 * 便利函式，用於需要管理員權限的頁面
 */
export async function isAdmin(): Promise<boolean> {
  const session = await auth();
  return session?.user?.is_admin === true;
}

/**
 * 獲取當前用戶（不包含 Token）
 * 
 * @returns Promise<AuthUser | null>
 * 
 * 便利函式，當只需要用戶資訊時使用
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  return session?.user || null;
} 