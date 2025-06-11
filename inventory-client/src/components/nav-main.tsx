"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { IconCirclePlusFilled, IconMail, IconChevronDown } from "@tabler/icons-react"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

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

export function NavMain({
  items,
}: {
  items: NavLink[]
}) {
  const pathname = usePathname();
  // 為可折疊項管理開啟狀態 - 預設展開商品管理
  const [openItems, setOpenItems] = useState<string[]>(['商品管理']);

  const toggleItem = (title: string) => {
    setOpenItems(prev => 
      prev.includes(title) ? prev.filter(item => item !== title) : [...prev, title]
    );
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
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
              <span className="sr-only">Inbox</span>
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
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2">
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </div>
                    <IconChevronDown className={`h-4 w-4 mr-3 shrink-0 transition-transform duration-200 ${openItems.includes(item.title) ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-1">
                    {item.children.map((child) => (
                      <Link
                        key={child.title}
                        href={child.url}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground",
                          { "text-sidebar-accent-foreground bg-sidebar-accent": pathname === child.url }
                        )}
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
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground",
                    { "text-sidebar-accent-foreground bg-sidebar-accent": pathname === item.url }
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.title}
                </Link>
              </SidebarMenuItem>
            )
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
