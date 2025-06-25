"use client";

import { useState, useEffect } from "react";
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react";

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
      <SidebarMenu data-oid="oy:dg9v">
        <SidebarMenuItem data-oid=":iry-je">
          <SidebarMenuButton
            size="lg"
            disabled
            suppressHydrationWarning
            data-oid="ylyw8t7"
          >
            <Skeleton className="h-8 w-8 rounded-lg" data-oid="y_p6ca3" />
            <div
              className="grid flex-1 text-left text-sm leading-tight"
              data-oid="7s9ioep"
            >
              <Skeleton className="h-4 w-20 mb-1" data-oid="p:8hti7" />
              <Skeleton className="h-3 w-24" data-oid="mwtmbsy" />
            </div>
            <Skeleton className="ml-auto h-4 w-4" data-oid="fh7c0y-" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // 如果沒有用戶資料，顯示預設狀態
  if (!user) {
    return (
      <SidebarMenu data-oid="hwr7-fb">
        <SidebarMenuItem data-oid="t2_i72c">
          <SidebarMenuButton
            size="lg"
            disabled
            suppressHydrationWarning
            data-oid="veimk6r"
          >
            <Avatar className="h-8 w-8 rounded-lg grayscale" data-oid="q4bnuc4">
              <AvatarFallback className="rounded-lg" data-oid="52ze9oo">
                ?
              </AvatarFallback>
            </Avatar>
            <div
              className="grid flex-1 text-left text-sm leading-tight"
              data-oid="tsr92o5"
            >
              <span
                className="truncate font-medium text-muted-foreground"
                data-oid="url1k7c"
              >
                未登入
              </span>
              <span
                className="text-muted-foreground truncate text-xs"
                data-oid="noa85:y"
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
    <SidebarMenu data-oid="htwm7b_">
      <SidebarMenuItem data-oid="g2thcrm">
        <DropdownMenu data-oid="lw9jj9m">
          <DropdownMenuTrigger asChild data-oid="1zz0ws_">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              suppressHydrationWarning
              data-oid="zj3vs9k"
            >
              <Avatar
                className="h-8 w-8 rounded-lg grayscale"
                data-oid="vzt06i2"
              >
                <AvatarFallback className="rounded-lg" data-oid="5ktd7zt">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className="grid flex-1 text-left text-sm leading-tight"
                data-oid="ufh7jre"
              >
                <span className="truncate font-medium" data-oid="sr.-i4n">
                  {user?.name || "未知用戶"}
                </span>
                <span
                  className="text-muted-foreground truncate text-xs"
                  data-oid="d4n2ojk"
                >
                  {user?.username || "無帳號資訊"}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" data-oid="n137xqx" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            // 🎯 只在客戶端 mounted 後使用 isMobile，避免 hydration 錯誤
            side={mounted && isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            suppressHydrationWarning
            data-oid="2f7suul"
          >
            <DropdownMenuLabel className="p-0 font-normal" data-oid="8s7dc6g">
              <div
                className="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                data-oid="hlxqvgn"
              >
                <Avatar className="h-8 w-8 rounded-lg" data-oid="w5jm3kh">
                  <AvatarFallback className="rounded-lg" data-oid="lsx5idz">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="grid flex-1 text-left text-sm leading-tight"
                  data-oid="5rpvmme"
                >
                  <span className="truncate font-medium" data-oid="nis8ly_">
                    {user?.name || "未知用戶"}
                  </span>
                  <span
                    className="text-muted-foreground truncate text-xs"
                    data-oid="8nrfnis"
                  >
                    {user?.username || "無帳號資訊"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator data-oid="aey0-si" />
            <DropdownMenuGroup data-oid="kmf7lc-">
              <DropdownMenuItem data-oid="ll40bsv">
                <IconUserCircle data-oid="q:3sui:" />
                個人資料
              </DropdownMenuItem>
              <DropdownMenuItem data-oid="yrh8xy3">
                <IconCreditCard data-oid="3ms9l90" />
                帳戶設定
              </DropdownMenuItem>
              <DropdownMenuItem data-oid="zo9vq-n">
                <IconNotification data-oid="4aulz84" />
                通知設定
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator data-oid="u9w-r6o" />
            <DropdownMenuItem onClick={handleLogout} data-oid="hai4ta6">
              <IconLogout data-oid="vh:0gx_" />
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
