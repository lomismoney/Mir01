"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  IconCirclePlusFilled,
  IconMail,
  IconChevronDown,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/**
 * 導航連結類型定義
 */
export type NavLink = {
  title: string;
  url?: string; // 父選單沒有連結
  icon: React.ElementType;
  children?: {
    title: string;
    url: string;
  }[];
};

export function NavMain({ items }: { items: NavLink[] }) {
  const pathname = usePathname();

  // 🚀 修復 Hydration 錯誤：使用 useEffect 來管理客戶端狀態
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  // 🔧 只在客戶端設置默認展開項目，避免 SSR/客戶端不一致
  useEffect(() => {
    setMounted(true);
    setOpenItems([]); // 所有選項預設為閉合狀態
  }, []);

  const toggleItem = (title: string) => {
    setOpenItems((prev) =>
      prev.includes(title)
        ? prev.filter((item) => item !== title)
        : [...prev, title],
    );
  };

  // 🎯 在客戶端 hydration 完成前，渲染一個簡化版本
  if (!mounted) {
    return (
      <SidebarGroup>
        <SidebarGroupContent className="flex flex-col gap-2">
          <SidebarMenu>
            <SidebarMenuItem
              className="flex items-center gap-2"
             
            >
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
               
              >
                <IconCirclePlusFilled />
                <span>Quick Create</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
               
              >
                <IconMail />
                <span className="sr-only">
                  Inbox
                </span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.children ? (
                  // 🔧 SSR 階段：簡化渲染，避免狀態依賴
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground"
                   
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground"
                   
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </div>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem
            className="flex items-center gap-2"
           
          >
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
             
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
             
            >
              <IconMail />
              <span className="sr-only">
                Inbox
              </span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) =>
            item.children ? (
              // ✅ 如果有子選單，渲染修正後的 Collapsible 元件
              <SidebarMenuItem key={item.title}>
                <Collapsible
                  open={openItems.includes(item.title)}
                  onOpenChange={() => toggleItem(item.title)}
                 
                >
                  <CollapsibleTrigger
                    // 將樣式直接應用在觸發器上，而不是內部的 span
                    className={cn(
                      "flex items-center justify-between w-full rounded-lg text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground",
                    )}
                   
                  >
                    {/* 將 padding 等樣式統一放在這裡 */}
                    <div
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                     
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </div>
                    <IconChevronDown
                      className={`h-4 w-4 mr-3 shrink-0 transition-transform duration-200 ${openItems.includes(item.title) ? "rotate-180" : ""}`}
                     
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.url}
                        prefetch={true}
                        // 🎯 使用 suppressHydrationWarning 來處理路徑相關的 hydration 差異
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground",
                          {
                            "text-sidebar-accent-foreground bg-sidebar-accent":
                              pathname === child.url,
                          },
                        )}
                        suppressHydrationWarning
                       
                      >
                        {child.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : (
              // 普通連結項保持統一樣式
              <SidebarMenuItem key={item.title}>
                <Link
                  href={item.url!}
                  prefetch={true}
                  // 🎯 使用 suppressHydrationWarning 來處理路徑相關的 hydration 差異
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground",
                    {
                      "text-sidebar-accent-foreground bg-sidebar-accent":
                        pathname === item.url,
                    },
                  )}
                  suppressHydrationWarning
                 
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </SidebarMenuItem>
            ),
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
