import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Handles authentication and route protection for incoming requests.
 *
 * Redirects users based on authentication status: unauthenticated users are sent to the login page, authenticated users are redirected away from the login page and root path to the dashboard, and all other requests proceed as normal.
 *
 * @param request - The incoming Next.js request object.
 * @returns A {@link NextResponse} that either redirects the user or allows the request to continue.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 公開路由列表（不需要認證）
  const publicRoutes = ['/login']
  
  // 檢查是否為公開路由
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // 獲取認證 token
  const token = request.cookies.get('authToken')?.value || 
                request.headers.get('authorization')
  
  // 如果訪問根路徑，根據是否有 token 決定重定向目標
  if (pathname === '/') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }
  
  // 對於非公開路由，檢查是否有 token
  if (!isPublicRoute) {
    // 如果沒有 token，重定向到登入頁
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      // 保存原始請求路徑作為重定向參數，方便登入後跳轉回來
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  } else if (pathname.startsWith('/login') && token) {
    // 如果已登入但嘗試訪問登入頁，重定向到儀表板
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // 允許其他請求繼續
  return NextResponse.next()
}

/**
 * 配置哪些路徑需要經過中間件處理
 */
export const config = {
  matcher: [
    /*
     * 匹配所有請求路徑，除了：
     * - api (API 路由)
     * - _next/static (靜態文件)
     * - _next/image (圖片優化)
     * - favicon.ico (圖標)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 