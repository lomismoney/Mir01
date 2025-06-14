export { auth as middleware } from "../auth";

/**
 * Auth.js 中間件配置
 * 
 * 此中間件在 Next.js Edge Runtime 中執行
 * 為所有路由提供統一的認證檢查機制
 * 
 * 核心功能：
 * 1. 邊緣運算 - 在 CDN 邊緣節點執行，響應速度極快
 * 2. 統一認證 - 所有路由的認證邏輯集中管理
 * 3. 自動重導向 - 未認證用戶自動跳轉登入頁
 * 4. 效能優化 - 避免在每個頁面重複認證檢查
 * 5. 安全防護 - 在請求到達頁面元件前就進行攔截
 */

/**
 * 中間件匹配器配置
 * 
 * 定義哪些路由需要經過中間件處理
 * 使用正則表達式排除不需要認證的資源：
 * 
 * 排除項目：
 * - /api/* - API 路由（有自己的認證機制）
 * - /_next/static/* - Next.js 靜態資源
 * - /_next/image/* - Next.js 圖片優化
 * - /favicon.ico - 網站圖標
 * 
 * 包含項目：
 * - 所有其他路由都會經過認證檢查
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 