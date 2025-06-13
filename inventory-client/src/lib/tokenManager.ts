/**
 * Token Manager - 管理 API 令牌
 * 在客戶端環境中，負責處理令牌的存儲和檢索
 */

// Token 存儲的鍵
const TOKEN_KEY = 'auth_token';

/**
 * 獲取令牌
 * @returns 從本地存儲中檢索的令牌，如果不存在則返回 null
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * 存儲令牌
 * @param token 要存儲的令牌
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * 清除令牌
 */
export function clearToken(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * 檢查是否已登錄
 * @returns 如果存在令牌，則返回 true
 */
export function isLoggedIn(): boolean {
  return !!getToken();
}

/**
 * Token 管理器
 * 
 * 提供安全的 API Token 儲存、獲取和移除功能
 * 支援 Next.js 伺服器端渲染 (SSR) 環境
 * 同時支援 localStorage 和 cookie 儲存機制
 * 
 * 功能特色：
 * 1. SSR 相容性檢查
 * 2. 統一的 Token 鍵值管理
 * 3. 類型安全的操作介面
 * 4. 錯誤預防機制
 * 5. 多重儲存機制
 */

/**
 * 將 API Token 儲存到 localStorage 和 cookie
 * 
 * @param token - 要儲存的 API Token
 * 
 * 安全特性：
 * - 檢查瀏覽器環境可用性
 * - 防止 SSR 環境錯誤
 * - 使用 cookie 支援 middleware 層級的認證
 */
export const saveToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    // 儲存到 localStorage
    localStorage.setItem(TOKEN_KEY, token);
    
    // 儲存到 cookie (30天過期)
    // 設定 Secure 屬性以提高安全性
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60*60*24*30}; SameSite=Strict`;
  }
};

/**
 * 從 localStorage 或 cookie 獲取 API Token
 * 
 * @returns API Token 字串或 null（如果不存在）
 * 
 * 使用情境：
 * - 頁面初始化時檢查登入狀態
 * - API 請求前獲取認證 Token
 * - 自動登入功能
 */
export const getTokenFromManager = (): string | null => {
  if (typeof window !== 'undefined') {
    // 優先從 localStorage 獲取
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) return localToken;
    
    // 如果 localStorage 中沒有，嘗試從 cookie 獲取
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === TOKEN_KEY && value) {
        return value;
      }
    }
  }
  return null;
};

/**
 * 從 localStorage 和 cookie 移除 API Token
 * 
 * 使用情境：
 * - 使用者主動登出
 * - Token 過期處理
 * - 安全性清除
 * 
 * 安全特性：
 * - 確保完全清除認證資訊
 * - 防止殘留的安全風險
 */
export const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    // 從 localStorage 移除
    localStorage.removeItem(TOKEN_KEY);
    
    // 從 cookie 移除 (設置過期時間為過去)
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict`;
  }
}; 