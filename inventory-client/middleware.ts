import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 中間件配置
 * 
 * 處理路由重定向和認證檢查
 * 提供基本的路由保護機制
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 公開路由列表（不需要認證）
  const publicRoutes = ['/login']
  
  // 檢查是否為公開路由
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  // 如果訪問根路徑，重定向到 dashboard
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // 對於受保護的路由，檢查是否有 token
  // 注意：這是基本檢查，真正的認證驗證在客戶端進行
  if (!isPublicRoute && pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('authToken')?.value || 
                  request.headers.get('authorization')
    
    // 如果沒有 token 且不是登入頁面，重定向到登入頁
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
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