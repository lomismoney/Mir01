import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

/**
 * Auth.js v5 核心配置 (Edge Runtime 兼容版本)
 * 
 * 整合 Laravel Sanctum 後端認證系統
 * 提供 Credentials Provider 進行用戶名密碼登入
 * 
 * 核心功能：
 * 1. 與 Laravel API 整合的登入驗證
 * 2. Session 和 JWT Token 管理
 * 3. 自訂用戶資料結構
 * 4. API Token 儲存與傳遞
 * 5. 角色權限管理
 * 
 * 注意：使用原生 fetch 以兼容 Edge Runtime
 */

/**
 * 安全的 Host 配置策略
 * 
 * 使用 AUTH_TRUST_HOST 環境變數來控制：
 * - 'auto': 自動從 NEXTAUTH_URL 提取允許的 host (推薦)
 * - 'true': 信任所有 hosts (僅開發環境)
 * - 未設定: 使用預設的嚴格驗證
 * 
 * 生產環境建議設定 AUTH_TRUST_HOST=auto 並確保 NEXTAUTH_URL 正確
 */
const getTrustHostConfig = (): boolean => {
  const authTrustHost = process.env.AUTH_TRUST_HOST;
  
  // 🔧 本地開發環境自動檢測
  // 如果是本地環境（localhost 或開發模式），預設為信任
  const isLocalhost = process.env.NEXTAUTH_URL?.includes('localhost') || 
                     process.env.NEXTAUTH_URL?.includes('127.0.0.1');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (isLocalhost || isDevelopment) {
    return true;
  }
  
  // 如果設定為 'auto'，從 NEXTAUTH_URL 自動決定
  if (authTrustHost === 'auto') {
    return !!process.env.NEXTAUTH_URL;
  }
  
  // 如果明確設定為 'true'
  if (authTrustHost === 'true') {
    // 在生產環境中警告不安全的設定
    if (process.env.NODE_ENV === 'production') {
      console.warn('⚠️  AUTH_TRUST_HOST=true 在生產環境中不安全，建議改用 AUTH_TRUST_HOST=auto');
    }
    return true;
  }
  
  // 預設為 false（最安全）
  return false;
};

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 使用環境變數控制的安全 host 驗證
  trustHost: getTrustHostConfig(),
  // 添加基本 URL 配置以處理 Cloudflare 代理
  basePath: '/api/auth',
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          // 使用原生 fetch 進行 API 調用，兼容 Edge Runtime
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              username: String(credentials.username),
              password: String(credentials.password),
            }),
          });

          if (!response.ok) {
            console.error("登入失敗:", response.status, response.statusText);
            return null;
          }

          const loginData = await response.json();

          if (!loginData.user || !loginData.token) {
            console.error("登入回應格式錯誤:", loginData);
            return null;
          }

          // 登入成功，回傳包含後端 token 和用戶資訊的物件
          // Auth.js 會將此物件加密儲存在 session cookie 中
          return {
            id: String(loginData.user.id),
            name: loginData.user.name,
            username: loginData.user.username,
            role: (loginData.user.roles && loginData.user.roles[0]) || 'user',
            roleDisplay: (loginData.user.roles_display && loginData.user.roles_display[0]) || 'unknown',
            isAdmin: loginData.user.is_admin || false,
            apiToken: loginData.token, // 儲存後端 API Token
          };
        } catch (error) {
          console.error("認證過程發生錯誤:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /**
     * 授權回呼函式 - 中間件核心邏輯（重定向修復版）
     * 
     * 採用「預設保護」策略：除了明確定義的公開路由外，所有路由都需要登入
     * 此策略能確保系統安全性，並根除登入循環問題
     * 
     * 🔧 重定向修復：
     * 1. 讓 Auth.js 完全處理重定向邏輯
     * 2. 已登入用戶訪問登入頁時重定向到儀表板
     * 3. 確保認證流程的完整性
     * 
     * 在 Edge Runtime 中執行，效能極佳
     * 
     * @param auth - 當前用戶的認證狀態
     * @param request - 請求物件，包含 URL 等資訊
     * @returns boolean | Response - true 允許訪問，false 重導向登入頁，Response 自訂重導向
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      // 定義不需要登入即可訪問的公開路由
      const publicRoutes = ['/login'];
      const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route));
      
      // 特殊處理根路徑
      if (nextUrl.pathname === '/') {
        if (isLoggedIn) {
          // 已登入用戶訪問根路徑，重定向到儀表板
          return Response.redirect(new URL('/dashboard', nextUrl.origin));
        } else {
          // 未登入用戶訪問根路徑，重定向到登入頁
          return Response.redirect(new URL('/login', nextUrl.origin));
        }
      }

      // 🔧 關鍵修復：已登入用戶不應該訪問登入頁
      if (isPublicRoute && isLoggedIn) {
        // 已登入用戶訪問登入頁時，重定向到儀表板
        // 使用絕對 URL 避免 Cloudflare 代理問題
        const dashboardUrl = new URL('/dashboard', nextUrl.origin);
        return Response.redirect(dashboardUrl);
      }
      
      // 公開路由且未登入，允許訪問
      if (isPublicRoute) {
        return true;
      }

      // 對於所有其他的非公開路由：
      if (isLoggedIn) {
        // 如果用戶已登入，允許訪問
        return true;
      }
      
      // 如果用戶未登入，則拒絕訪問，Auth.js 會自動將他們重定向到登入頁
      return false; 
    },
    /**
     * JWT 回呼函式 - 密鑰統一作戰核心
     * 
     * 當一個 JWT 被創建或更新時調用
     * 我們在這裡將從 provider 獲取的 accessToken 存入 token 物件
     * 確保 API 認證權限的唯一來源
     */
    async jwt({ token, user, account }) {
      if (account && user) {
        // 統一權力：將後端 API Token 儲存為 accessToken
        token.accessToken = user.apiToken; // 從 authorize 回呼中獲取的 apiToken
        token.userId = user.id;
        token.role = user.role;
        token.roleDisplay = user.roleDisplay;
        token.isAdmin = user.isAdmin;
        token.username = user.username;
      }
      return token;
    },
    /**
     * Session 回呼函式 - 權威憑證分發中心
     * 
     * 當一個 session 被訪問時調用
     * 我們在這裡將儲存在 token 中的 accessToken，暴露給客戶端的 session 物件
     * 這是 API 客戶端獲取認證憑證的唯一權威來源
     */
    async session({ session, token }) {
      if (token && session.user) {
        // 🎯 關鍵：將 accessToken 暴露為 session.accessToken（統一權威）
        session.accessToken = token.accessToken as string;
        
        // 保持用戶資訊的完整性
        session.user.id = token.userId as string;
        session.user.role = token.role as string;
        session.user.roleDisplay = token.roleDisplay as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // 指定自訂登入頁面路徑
  },
  session: {
    strategy: "jwt", // 使用 JWT 策略
  },
}); 