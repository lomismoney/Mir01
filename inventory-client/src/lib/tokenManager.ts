/**
 * Token Manager - 管理 API 令牌
 * 在客戶端環境中，負責處理令牌的存儲和檢索
 */

// Token 存儲的鍵
const TOKEN_KEY = 'authToken';

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
export function getToken(): string | null {
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
}

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
export function setToken(token: string): void {
  if (typeof window !== 'undefined') {
    // 儲存到 localStorage
    localStorage.setItem(TOKEN_KEY, token);
    
    // 儲存到 cookie (30天過期)
    // 使用 SameSite=Lax 以確保跨頁面導航時的相容性
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=${60*60*24*30}; SameSite=Lax`;
  }
}

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
export function clearToken(): void {
  if (typeof window !== 'undefined') {
    // 從 localStorage 移除
    localStorage.removeItem(TOKEN_KEY);
    
    // 從 cookie 移除 (設置過期時間為過去)
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
}

/**
 * 檢查是否已登錄
 * @returns 如果存在令牌，則返回 true
 */
export function isLoggedIn(): boolean {
  return !!getToken();
}

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
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    // 從 localStorage 移除
    localStorage.removeItem(TOKEN_KEY);
    
    // 從 cookie 移除 (設置過期時間為過去)
    document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
  }
} 