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
      <SidebarMenu data-oid="rgoy_sd">
        <SidebarMenuItem data-oid="xrsbyr0">
          <SidebarMenuButton
            size="lg"
            disabled
            suppressHydrationWarning
            data-oid="o926pgg"
          >
            <Skeleton className="h-8 w-8 rounded-lg" data-oid="d8t:23q" />
            <div
              className="grid flex-1 text-left text-sm leading-tight"
              data-oid=".nd435q"
            >
              <Skeleton className="h-4 w-20 mb-1" data-oid="ai0uisk" />
              <Skeleton className="h-3 w-24" data-oid="kxu4yiv" />
            </div>
            <Skeleton className="ml-auto h-4 w-4" data-oid="wn3rqch" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  // 如果沒有用戶資料，顯示預設狀態
  if (!user) {
    return (
      <SidebarMenu data-oid="i3asr4e">
        <SidebarMenuItem data-oid="cc3bej:">
          <SidebarMenuButton
            size="lg"
            disabled
            suppressHydrationWarning
            data-oid="t0e:d5-"
          >
            <Avatar className="h-8 w-8 rounded-lg grayscale" data-oid="1e30eei">
              <AvatarFallback className="rounded-lg" data-oid="w.s3vij">
                ?
              </AvatarFallback>
            </Avatar>
            <div
              className="grid flex-1 text-left text-sm leading-tight"
              data-oid="2:4h1j_"
            >
              <span
                className="truncate font-medium text-muted-foreground"
                data-oid="dc4xd9x"
              >
                未登入
              </span>
              <span
                className="text-muted-foreground truncate text-xs"
                data-oid="c08p-57"
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
    <SidebarMenu data-oid=":3ux:6o">
      <SidebarMenuItem data-oid="urea7v1">
        <DropdownMenu data-oid="p.2.ir3">
          <DropdownMenuTrigger asChild data-oid="tw68d19">
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              suppressHydrationWarning
              data-oid="mk1b_r1"
            >
              <Avatar
                className="h-8 w-8 rounded-lg grayscale"
                data-oid="8iuvgnp"
              >
                <AvatarFallback className="rounded-lg" data-oid="no5-g2d">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className="grid flex-1 text-left text-sm leading-tight"
                data-oid="imx7bi1"
              >
                <span className="truncate font-medium" data-oid="cysknfu">
                  {user?.name || "未知用戶"}
                </span>
                <span
                  className="text-muted-foreground truncate text-xs"
                  data-oid="c4hn69i"
                >
                  {user?.username || "無帳號資訊"}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" data-oid="jz5u_0:" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            // 🎯 只在客戶端 mounted 後使用 isMobile，避免 hydration 錯誤
            side={mounted && isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            suppressHydrationWarning
            data-oid=":yyuq:9"
          >
            <DropdownMenuLabel className="p-0 font-normal" data-oid="bl.3s3w">
              <div
                className="flex items-center gap-2 px-1 py-1.5 text-left text-sm"
                data-oid="awh2xr-"
              >
                <Avatar className="h-8 w-8 rounded-lg" data-oid="yhl-00p">
                  <AvatarFallback className="rounded-lg" data-oid="n6::m3c">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div
                  className="grid flex-1 text-left text-sm leading-tight"
                  data-oid="x.b6om_"
                >
                  <span className="truncate font-medium" data-oid="v:3w.9j">
                    {user?.name || "未知用戶"}
                  </span>
                  <span
                    className="text-muted-foreground truncate text-xs"
                    data-oid="4wumyan"
                  >
                    {user?.username || "無帳號資訊"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator data-oid="d2gdx0x" />
            <DropdownMenuGroup data-oid="8wmbqif">
              <DropdownMenuItem data-oid="m:xv3z.">
                <IconUserCircle data-oid="67or-ek" />
                個人資料
              </DropdownMenuItem>
              <DropdownMenuItem data-oid="_h6x8a.">
                <IconCreditCard data-oid="o5kq04." />
                帳戶設定
              </DropdownMenuItem>
              <DropdownMenuItem data-oid="8ioqrm:">
                <IconNotification data-oid="kygm5g8" />
                通知設定
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator data-oid="oyjeopz" />
            <DropdownMenuItem onClick={handleLogout} data-oid="ir9:wor">
              <IconLogout data-oid="8yh0:gg" />
              登出
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
