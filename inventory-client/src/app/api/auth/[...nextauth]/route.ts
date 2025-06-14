import { handlers } from "../../../../../auth";

/**
 * Auth.js API 路由處理器
 * 
 * 此檔案為 Next.js App Router 的動態路由處理器
 * 負責處理所有 Auth.js 相關的 API 請求
 * 
 * 路由模式：/api/auth/[...nextauth]
 * 處理的端點包括：
 * - GET  /api/auth/signin     - 顯示登入頁面
 * - POST /api/auth/signin     - 處理登入請求
 * - POST /api/auth/signout    - 處理登出請求
 * - GET  /api/auth/session    - 獲取當前 session
 * - GET  /api/auth/csrf       - 獲取 CSRF token
 * - GET  /api/auth/providers  - 獲取可用的認證提供者
 * 
 * 所有請求都會被 Auth.js 核心處理器自動路由到對應的處理函式
 */

export const { GET, POST } = handlers; 