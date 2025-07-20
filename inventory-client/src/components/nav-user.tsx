"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  MoreVertical,
  LogOut,
  Bell,
  UserCircle,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession, signOut } from "next-auth/react";
import { clearTokenCache } from "@/lib/apiClient";

/**
 * 用戶導覽元件（Auth.js + 高性能緩存整合版本）
 *
 * 功能特色：
 * - 顯示當前登入用戶的資訊和選單選項
 * - 使用 Auth.js useSession Hook 獲取用戶狀態
 * - 整合智能 token 緩存管理，登出時自動清理
 * - 確保系統性能優化的完整性
 * - 修復 Next.js Hydration 錯誤
 */
export function NavUser() {
  const { isMobile } = useSidebar();
  const { data: session, status } = useSession();

  // 🚀 修復 Hydration 錯誤：延遲獲取狀態
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 從 Auth.js session 中提取用戶資訊和狀態
  const user = session?.user;
  const isLoading = status === "loading";

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
    clearTokenCache();

    // 🚪 執行 Auth.js 登出流程
    signOut({ callbackUrl: "/login" });
  };

  // 🎯 在客戶端 hydration 完成前，顯示骨架屏避免不一致
  if (!mounted || isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            disabled
            suppressHydrationWarning
           
          >
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div
              className="grid flex-1 text-left text-sm leading-tight"
             
            >
              <Skeleton className="h-4 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="ml-auto h-4 w-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // 如果沒有用戶資料，顯示預設狀態
  if (!user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            disabled
            suppressHydrationWarning
           
          >
            <Avatar className="h-8 w-8 rounded-lg grayscale">
              <AvatarFallback className="rounded-lg">
                ?
              </AvatarFallback>
            </Avatar>
            <div
              className="grid flex-1 text-left text-sm leading-tight"
             
            >
              <span
                className="truncate font-medium text-muted-foreground"
               
              >
                未登入
              </span>
              <span
                className="text-muted-foreground truncate text-xs"
               
              >
                請先登入
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              suppressHydrationWarning
             
            >
              <Avatar
                className="h-8 w-8 rounded-lg grayscale"
               
              >
                <AvatarFallback className="rounded-lg">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className="grid flex-1 text-left text-sm leading-tight"
               
              >
                <span className="truncate font-medium">
                  {user?.name || "未知用戶"}
                </span>
                <span
                  className="text-muted-foreground truncate text-xs"
                 
                >
                  {user?.username || "無帳號資訊"}
                </span>
              </div>
              <MoreVertical className="ml-auto h-4 w-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            // 🎯 只在客戶端 mounted 後使用 isMobile，避免 hydration 錯誤
            side={mounted && isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            suppressHydrationWarning
           
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div
                className="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
               
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="grid flex-1 text-left text-sm leading-tight"
                 
                >
                  <span className="truncate font-medium">
                    {user?.name || "未知用戶"}
                  </span>
                  <span
                    className="text-muted-foreground truncate text-xs"
                   
                  >
                    {user?.username || "無帳號資訊"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className="flex items-center gap-2" asChild>
                <Link href="/profile">
                  <UserCircle className="h-4 w-4" />
                  <span>個人資料</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>帳戶設定</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span>通知設定</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              <span>登出</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
