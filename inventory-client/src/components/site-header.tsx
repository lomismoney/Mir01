"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedBreadcrumb } from "@/components/enhanced-breadcrumb";
import { Search } from "lucide-react";
import { GlobalSearchDialog } from "@/components/global-search/GlobalSearchDialog";

/**
 * 網站頭部組件（Auth.js 版本）
 * 提供側邊欄觸發器、頁面標題、用戶資訊和操作按鈕
 * 使用 Auth.js useSession Hook 獲取用戶狀態
 */
export function SiteHeader() {
  const { data: session, status } = useSession();
  const [searchOpen, setSearchOpen] = React.useState(false);

  // 從 Auth.js session 中提取用戶資訊和狀態
  const user = session?.user;
  const isLoading = status === "loading";

  // 註冊全局鍵盤快捷鍵
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header
      className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)"
     
    >
      <div
        className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6"
       
      >
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
         
        />

        <EnhancedBreadcrumb 
          showHomeIcon={true}
          showIcons={true}
          maxItemsMobile={2}
          maxItemsDesktop={4}
        />
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
                  {user.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span
                className="text-sm font-medium hidden md:inline"
               
              >
                {user.name || "未知用戶"}
              </span>
            </div>
          ) : null}

          <Separator
            orientation="vertical"
            className="h-4"
           
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchOpen(true)}
            className="relative px-3 sm:w-auto sm:pr-12"
          >
            <Search className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">搜索</span>
            <kbd className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          <Button
            variant="ghost"
            asChild
            size="sm"
            className="hidden sm:flex"
           
          >
            <a href="/help" className="dark:text-foreground">
              幫助
            </a>
          </Button>
          <Button
            variant="ghost"
            asChild
            size="sm"
            className="hidden sm:flex"
           
          >
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
      
      <GlobalSearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
      />
    </header>
  );
}
