import 'next-auth';
import { DefaultSession } from 'next-auth';

/**
 * Next-Auth 類型擴展 - 密鑰統一作戰版本
 * 
 * 透過模組擴展 (Module Augmentation) 技術
 * 為 Auth.js 添加自訂欄位的類型定義
 * 
 * 核心架構改進：
 * 1. 統一認證憑證為 session.accessToken
 * 2. 消除多重權威來源的混亂
 * 3. 確保類型安全的 API 認證機制
 * 
 * 擴展內容：
 * 1. User 物件 - 認證回呼中的用戶資料
 * 2. Session 物件 - 客戶端可存取的 session 資料（含統一的 accessToken）
 * 3. JWT 物件 - JWT token 中的自訂欄位
 */

declare module 'next-auth' {
  /**
   * 擴展 User 物件
   * 使其包含我們在 authorize 回呼中回傳的自訂欄位
   */
  interface User {
    role?: string;
    roleDisplay?: string;
    isAdmin?: boolean;
    username?: string;
    apiToken?: string;
  }

  /**
   * 擴展 Session 物件 - 密鑰統一核心
   * 
   * 關鍵改進：添加 accessToken 作為統一的 API 認證憑證
   * 消除了多重認證來源的架構混亂
   */
  interface Session {
    /** 統一的 API 認證憑證 - 唯一權威來源 */
    accessToken?: string;
    user: {
      role?: string;
      roleDisplay?: string;
      isAdmin?: boolean;
      username?: string;
      /** @deprecated 使用 session.accessToken 替代 */
      apiToken?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * 擴展 JWT 介面
   * 使其包含我們的自訂欄位和統一的 accessToken
   */
  interface JWT {
    /** 統一的 API 認證憑證 */
    accessToken?: string;
    /** 用戶 ID */
    userId?: string;
    role?: string;
    roleDisplay?: string;
    isAdmin?: boolean;
    username?: string;
  }
} 