"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { SmartPreloadLink } from "@/lib/apiPreloader";
import { cn } from "@/lib/utils";

export interface NavLink {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: {
    title: string;
    url: string;
  }[];
}

interface NavMainEnhancedProps {
  items: NavLink[];
  label?: string;
}

/**
 * 增強版導航主組件
 * 
 * 集成了智能預加載功能的導航組件
 */
export function NavMainEnhanced({ items, label }: NavMainEnhancedProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => (
          <NavItem key={item.title} item={item} pathname={pathname} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/**
 * 導航項目組件
 */
function NavItem({ item, pathname }: { item: NavLink; pathname: string }) {
  const isActive = item.isActive || pathname === item.url;
  const hasSubItems = item.items && item.items.length > 0;
  const [isOpen, setIsOpen] = React.useState(
    hasSubItems && item.items!.some(subItem => pathname === subItem.url)
  );

  if (!hasSubItems) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <SmartPreloadLink
            href={item.url}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
              isActive && "bg-muted text-primary"
            )}
            preloadDelay={150} // 更短的延遲以提升響應速度
          >
            {item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.title}</span>
          </SmartPreloadLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }

  return (
    <Collapsible
      key={item.title}
      asChild
      defaultOpen={isActive}
      open={isOpen}
      onOpenChange={setIsOpen}
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton tooltip={item.title}>
            {item.icon && <item.icon />}
            <span>{item.title}</span>
            <ChevronRight
              className={cn(
                "ml-auto h-4 w-4 transition-transform duration-200",
                isOpen && "rotate-90"
              )}
            />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items?.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild>
                  <SmartPreloadLink
                    href={subItem.url}
                    className={cn(
                      pathname === subItem.url && "text-primary"
                    )}
                    preloadDelay={150}
                  >
                    <span>{subItem.title}</span>
                  </SmartPreloadLink>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

// 導出一個向後兼容的版本
export { NavMainEnhanced as NavMain };