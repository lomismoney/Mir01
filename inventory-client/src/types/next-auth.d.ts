import 'next-auth';
import { DefaultSession } from 'next-auth';

/**
 * Next-Auth 類型擴展
 * 
 * 透過模組擴展 (Module Augmentation) 技術
 * 為 Auth.js 添加自訂欄位的類型定義
 * 
 * 擴展內容：
 * 1. User 物件 - 認證回呼中的用戶資料
 * 2. Session 物件 - 客戶端可存取的 session 資料
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
   * 擴展 Session 物件
   * 使其 user 屬性包含我們的自訂欄位
   */
  interface Session {
    user: {
      role?: string;
      roleDisplay?: string;
      isAdmin?: boolean;
      username?: string;
      apiToken?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  /**
   * 擴展 JWT 介面
   * 使其包含我們的自訂欄位
   */
  interface JWT {
    role?: string;
    roleDisplay?: string;
    isAdmin?: boolean;
    username?: string;
    apiToken?: string;
  }
} 