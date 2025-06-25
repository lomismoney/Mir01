'use client'

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import Link from "next/link"

/**
 * 網站頭部組件（Auth.js 版本）
 * 提供側邊欄觸發器、頁面標題、用戶資訊和操作按鈕
 * 使用 Auth.js useSession Hook 獲取用戶狀態
 */
export function SiteHeader() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  
  // 從 Auth.js session 中提取用戶資訊和狀態
  const user = session?.user
  const isLoading = status === 'loading'
  
  // 路徑到標題的映射表
  const routeTitles: Record<string, string> = {
    '/dashboard': '儀表板',
    '/products': '商品列表',
    '/products/new': '新增商品',
    '/categories': '分類管理',
    '/attributes': '規格管理',
    '/inventory': '庫存管理',
    '/inventory/management': '庫存清單',
    '/inventory/transfers': '庫存轉移',
    '/inventory/history': '變動歷史',
    '/inventory/incoming': '進貨管理',
    '/orders': '訂單管理',
    '/orders/new': '新增訂單',
    '/customers': '客戶管理',
    '/purchases': '進貨單管理',
    '/stores': '分店管理',
    '/users': '用戶管理',
    '/api-test': 'API 測試',
  }
  
  // 父選單映射表（根據側邊欄選單結構）
  const parentMenuMap: Record<string, { label: string }> = {
    '/products': { label: '商品管理' },
    '/categories': { label: '商品管理' },
    '/attributes': { label: '商品管理' },
    '/inventory/management': { label: '庫存管理' },
    '/inventory/transfers': { label: '庫存管理' },
    '/inventory/history': { label: '庫存管理' },
    '/inventory/incoming': { label: '庫存管理' },
  }
  
  // 根據當前路徑生成麵包屑項目
  const getBreadcrumbItems = () => {
    const items: Array<{
      href: string
      label: string
      isLast?: boolean
      isClickable?: boolean
    }> = []
    
    // 如果在首頁，只顯示儀表板
    if (pathname === '/dashboard' || pathname === '/') {
      items.push({
        href: '/dashboard',
        label: '儀表板',
        isLast: true
      })
      return items
    }
    
    // 檢查是否有父選單
    const parentMenu = parentMenuMap[pathname]
    if (parentMenu) {
      // 有父選單的情況，顯示：父選單 > 當前頁面
      items.push({
        href: '#',
        label: parentMenu.label,
        isClickable: false
      })
      items.push({
        href: pathname,
        label: routeTitles[pathname] || '',
        isLast: true
      })
      return items
    }
    
    // 處理其他路徑層級（沒有父選單的頁面）
    const pathSegments = pathname.split('/').filter(Boolean)
    let currentPath = ''
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      let title = routeTitles[currentPath]
      
      // 處理動態路由 (如 /products/123/edit)
      if (!title) {
        // 檢查是否為數字ID
        if (/^\d+$/.test(segment)) {
          // 根據父路徑確定標題
          const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/'))
          if (parentPath === '/products') {
            title = '商品詳情'
            // 動態路由也需要檢查是否有父選單
            const parent = parentMenuMap[parentPath]
            if (parent && items.length === 0) {
              items.push({
                href: '#',
                label: parent.label,
                isClickable: false
              })
              items.push({
                href: parentPath,
                label: routeTitles[parentPath] || ''
              })
            }
          } else if (parentPath === '/orders') {
            title = '訂單詳情'
          } else if (parentPath === '/customers') {
            title = '客戶詳情'
          } else if (parentPath === '/purchases') {
            title = '進貨單詳情'
          }
        } else if (segment === 'edit') {
          title = '編輯'
        }
      }
      
      // 只添加有標題的路徑
      if (title) {
        // 如果還沒有項目且當前路徑有父選單，先加入父選單
        if (items.length === 0) {
          const parent = parentMenuMap[currentPath]
          if (parent) {
            items.push({
              href: '#',
              label: parent.label,
              isClickable: false
            })
          }
        }
        
        items.push({
          href: currentPath,
          label: title,
          isLast: index === pathSegments.length - 1
        })
      }
    })
    
    return items
  }
  
  const breadcrumbItems = getBreadcrumbItems()
  
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbItems.map((item, index) => {
              const isLastItem = item.isLast
              return (
                <React.Fragment key={item.href + index}>
                  <BreadcrumbItem>
                    {isLastItem ? (
                      <BreadcrumbPage>{item.label}</BreadcrumbPage>
                    ) : item.isClickable === false ? (
                      <span className="font-normal text-muted-foreground">{item.label}</span>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={item.href}>{item.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          {/* 用戶資訊區域 */}
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:inline">
                {user.name || '未知用戶'}
              </span>
            </div>
          ) : null}
          
          <Separator orientation="vertical" className="h-4" />
          
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="/help"
              className="dark:text-foreground"
            >
              幫助
            </a>
          </Button>
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="/settings"
              className="dark:text-foreground"
            >
              設定
            </a>
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
