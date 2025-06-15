"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession, signOut } from "next-auth/react"
import { clearTokenCache } from "@/lib/apiClient"

/**
 * 用戶導覽元件（Auth.js + 高性能緩存整合版本）
 * 
 * 功能特色：
 * - 顯示當前登入用戶的資訊和選單選項
 * - 使用 Auth.js useSession Hook 獲取用戶狀態
 * - 整合智能 token 緩存管理，登出時自動清理
 * - 確保系統性能優化的完整性
 */
export function NavUser() {
  const { isMobile } = useSidebar()
  const { data: session, status } = useSession()

  // 從 Auth.js session 中提取用戶資訊和狀態
  const user = session?.user
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  /**
   * 處理登出點擊事件（高性能版本）
   * 
   * 優化特性：
   * 1. 清理 API 客戶端的 token 緩存
   * 2. 確保下次登入時重新獲取 token
   * 3. 完整的登出流程整合
   */
  const handleLogout = () => {
    // 🧹 清理 token 緩存，確保安全登出
    clearTokenCache()
    
    // 🚪 執行 Auth.js 登出流程
    signOut({ callbackUrl: '/login' })
  }

  // 載入狀態顯示骨架屏
  if (isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="grid flex-1 text-left text-sm leading-tight">
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // 如果沒有用戶資料，顯示預設狀態
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              <AvatarFallback className="rounded-lg">?</AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium text-muted-foreground">未登入</span>
              <span className="text-muted-foreground truncate text-xs">請先登入</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
                          <Avatar className="h-8 w-8 rounded-lg grayscale">
              <AvatarFallback className="rounded-lg">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{user?.name || '未知用戶'}</span>
              <span className="text-muted-foreground truncate text-xs">
                {user?.username || '無帳號資訊'}
              </span>
            </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user?.name || '未知用戶'}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user?.username || '無帳號資訊'}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                個人資料
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                帳戶設定
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                通知設定
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
