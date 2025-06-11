'use client'

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * 網站頭部組件
 * 提供側邊欄觸發器、頁面標題、用戶資訊和操作按鈕
 * 支援動態用戶資料和載入狀態
 */
export function SiteHeader() {
  const { user, isLoading } = useAuth()
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">庫存管理系統</h1>
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
