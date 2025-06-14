import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import createClient from "openapi-fetch";
import type { paths } from "@/types/api";

/**
 * Auth.js 核心配置
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
 */

// 建立專用於認證的 API 客戶端（無攔截器版本）
const authApiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost",
  credentials: "include",
});

// 為認證客戶端添加基本標頭
authApiClient.use({
  onRequest({ request }) {
    request.headers.set("Accept", "application/json");
    request.headers.set("Content-Type", "application/json");
    return request;
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
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
          // 使用專用的認證 API 客戶端呼叫後端登入 API
          const { data, error } = await authApiClient.POST("/api/login", {
            body: {
              username: String(credentials.username),
              password: String(credentials.password),
            },
          });

          if (error || !data?.user) {
            // 登入失敗，回傳 null
            console.error("登入失敗:", error);
            return null;
          }

          // 登入成功，回傳包含後端 token 和用戶資訊的物件
          // Auth.js 會將此物件加密儲存在 session cookie 中
          return {
            id: String(data.user.id),
            name: data.user.name,
            username: data.user.username,
            role: data.user.role,
            roleDisplay: data.user.role_display,
            isAdmin: data.user.is_admin,
            apiToken: data.token, // 儲存後端 API Token
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
     * 授權回呼函式 - 中間件核心邏輯（修正版）
     * 
     * 採用「預設保護」策略：除了明確定義的公開路由外，所有路由都需要登入
     * 此策略能確保系統安全性，並根除登入循環問題
     * 
     * 在 Edge Runtime 中執行，效能極佳
     * 
     * @param auth - 當前用戶的認證狀態
     * @param request - 請求物件，包含 URL 等資訊
     * @returns boolean | Response - true 允許訪問，false 重導向登入頁，Response 自訂重導向
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      
      // 定義不需要登入即可訪問的公開路由（未來可以擴展，例如加入 /register）
      const publicRoutes = ['/login'];
      const isPublicRoute = publicRoutes.some(route => nextUrl.pathname.startsWith(route));

      if (isPublicRoute) {
        if (isLoggedIn) {
          // 如果用戶已登入，但試圖訪問登入頁等公開路由，
          // 將他們重定向到儀表板，提供更好的使用者體驗。
          return Response.redirect(new URL('/dashboard', nextUrl));
        }
        // 如果用戶未登入，允許他們訪問公開路由。
        return true; 
      }

      // 對於所有其他的非公開路由：
      if (isLoggedIn) {
        // 如果用戶已登入，允許訪問。
        return true;
      }
      
      // 如果用戶未登入，則拒絕訪問，Auth.js 會自動將他們重定向到 `pages.signIn` 中定義的登入頁。
      return false; 
    },
    /**
     * JWT 回呼函式
     * 將自訂欄位加入到 JWT token 中
     */
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.roleDisplay = user.roleDisplay;
        token.isAdmin = user.isAdmin;
        token.username = user.username;
        token.apiToken = user.apiToken;
      }
      return token;
    },
    /**
     * Session 回呼函式
     * 將 JWT token 中的自訂欄位傳遞到 session 中
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.roleDisplay = token.roleDisplay as string;
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.username = token.username as string;
        session.user.apiToken = token.apiToken as string;
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