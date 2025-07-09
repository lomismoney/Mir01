import { auth } from '../auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 安全的 Host 驗證函數
 * 
 * 檢查請求的 host 是否為可信任的域名
 */
function isValidHost(host: string): boolean {
  // 🔧 增強的本地開發環境檢測
  const isLocalDevelopment = 
    process.env.NODE_ENV === 'development' ||           // 明確設定為開發環境
    host.includes('localhost') ||                        // localhost 域名
    host.includes('127.0.0.1') ||                       // 本地 IP
    host.startsWith('localhost:') ||                     // 帶端口的 localhost
    host.startsWith('127.0.0.1:') ||                    // 帶端口的本地 IP
    /^localhost:\d+$/.test(host) ||                      // localhost:端口格式
    /^127\.0\.0\.1:\d+$/.test(host);                     // IP:端口格式

  // 如果是本地開發環境，直接允許
  if (isLocalDevelopment) {
    return true;
  }

  // 生產環境的驗證邏輯
  // 從 NEXTAUTH_URL 取得允許的域名
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) {
    try {
      const allowedHost = new URL(nextAuthUrl).hostname;
      if (host === allowedHost) {
        return true;
      }
    } catch (error) {
      console.warn('無法解析 NEXTAUTH_URL:', nextAuthUrl);
    }
  }

  // 允許的自訂域名
  const allowedCustomDomains = [
    'internal.lomis.com.tw',
    'api.lomis.com.tw',
  ];

  if (allowedCustomDomains.includes(host)) {
    return true;
  }

  // Google Cloud Run 域名模式匹配
  const cloudRunPatterns = [
    /^inventory-client-[a-z0-9]+-[a-z0-9-]+\.a\.run\.app$/,  // 標準 Cloud Run URL
    /^inventory-client--[a-z0-9-]+\.a\.run\.app$/,           // 內部路由 URL
    /^.*\.run\.app$/,                                        // 通用 Cloud Run 域名
  ];

  const isValidCloudRunHost = cloudRunPatterns.some(pattern => pattern.test(host));
  
  // 記錄允許的 Cloud Run hosts（用於監控）
  if (isValidCloudRunHost) {
    console.log(`✅ 允許 Cloud Run host: ${host}`);
  }

  return isValidCloudRunHost;
}

/**
 * 簡化中間件（專注於 Host 驗證和 HTTPS 重定向）
 * 
 * 🔐 身份驗證邏輯完全交由 Auth.js 的 authorized 回調處理
 * 
 * 職責分離：
 * 1. Host 安全驗證 - 確保請求來自可信任的域名
 * 2. HTTPS 重定向 - 處理 Cloudflare 代理的 HTTP/HTTPS 問題  
 * 3. 🔥 身份驗證邏輯 → 由 auth.ts 中的 authorized 回調完全處理
 * 
 * 優勢：
 * - 避免重複的身份驗證邏輯
 * - 確保邏輯一致性和可維護性
 * - 讓 Auth.js 完全控制身份驗證流程
 */
export default auth((req) => {
  const host = req.headers.get('host') || '';
  const forwardedProto = req.headers.get('x-forwarded-proto');
  
  console.log(`🔍 中介軟體 Host 檢查: ${host}, 協議: ${forwardedProto || 'unknown'}`);
  
  // 第一層：Host 安全驗證
  if (!isValidHost(host)) {
    console.warn(`🚫 拒絕不信任的 host: ${host}`);
    console.warn(`   環境: NODE_ENV=${process.env.NODE_ENV}`);
    console.warn(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL}`);
    return new NextResponse('Forbidden: Invalid host', { status: 403 });
  }

  // 第二層：🔧 處理 Cloudflare 的 HTTP/HTTPS 問題
  if (forwardedProto === 'http' && process.env.NODE_ENV === 'production') {
    // 在生產環境中，如果請求是 HTTP，重定向到 HTTPS
    const httpsUrl = new URL(req.url);
    httpsUrl.protocol = 'https:';
    console.log(`🔒 HTTP 重定向到 HTTPS: ${httpsUrl.toString()}`);
    return NextResponse.redirect(httpsUrl);
  }

  // 第三層：🔐 身份驗證由 Auth.js 的 authorized 回調處理
  // 這裡不需要額外的身份驗證邏輯，完全交由 auth.ts 處理
  console.log(`✅ Host 驗證通過，身份驗證交由 Auth.js 處理`);
  
  // 如果到達這裡，表示 host 有效，繼續執行 Auth.js 的身份驗證邏輯
  return NextResponse.next();
})

export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，除了：
     * - api/auth (NextAuth.js 路由)
     * - _next/static (靜態檔案)
     * - _next/image (圖片優化)
     * - favicon.ico (網站圖示)
     * - 其他靜態資源
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*|sitemap\\.xml|robots\\.txt).*)',
  ],
} 