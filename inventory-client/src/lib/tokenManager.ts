const TOKEN_KEY = 'authToken';

/**
 * Token 管理器
 * 
 * 提供安全的 API Token 儲存、獲取和移除功能
 * 支援 Next.js 伺服器端渲染 (SSR) 環境
 * 
 * 功能特色：
 * 1. SSR 相容性檢查
 * 2. 統一的 Token 鍵值管理
 * 3. 類型安全的操作介面
 * 4. 錯誤預防機制
 */

/**
 * 從 localStorage 儲存 API Token
 * 
 * @param token - 要儲存的 API Token
 * 
 * 安全特性：
 * - 檢查瀏覽器環境可用性
 * - 防止 SSR 環境錯誤
 */
export const saveToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

/**
 * 從 localStorage 獲取 API Token
 * 
 * @returns API Token 字串或 null（如果不存在）
 * 
 * 使用情境：
 * - 頁面初始化時檢查登入狀態
 * - API 請求前獲取認證 Token
 * - 自動登入功能
 */
export const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

/**
 * 從 localStorage 移除 API Token
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
    localStorage.removeItem(TOKEN_KEY);
  }
}; 