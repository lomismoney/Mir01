"use client";

import { SmartPreloadLink } from "@/lib/apiPreloader";
import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Folder,
  Share2,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavDocuments({
  items,
}: {
  items: { name: string; url: string; icon: LucideIcon }[];
}) {
  const { isMobile } = useSidebar();
  const pathname = usePathname();

  // 🚀 修復 Hydration 錯誤：延遲獲取 mobile 狀態
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarGroup
      className="group-data-[collapsible=icon]:hidden"
     
    >
      <SidebarGroupLabel>文件中心</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <SmartPreloadLink
                href={item.url}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-primary",
                  pathname === item.url && "bg-accent text-primary font-medium"
                )}
                preloadDelay={150}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </SmartPreloadLink>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                 
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">
                    More
                  </span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                // 🎯 只在客戶端 mounted 後使用 isMobile，避免 hydration 錯誤
                side={mounted && isMobile ? "bottom" : "right"}
                align={mounted && isMobile ? "end" : "start"}
                suppressHydrationWarning
               
              >
                <DropdownMenuItem className="flex items-center gap-2">
                  <Folder className="h-4 w-4" />
                  <span>開啟</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <span>分享</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  <span>刪除</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent hover:text-primary text-muted-foreground"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span>更多</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
