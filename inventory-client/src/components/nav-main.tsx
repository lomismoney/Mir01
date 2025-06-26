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
    setOpenItems(["商品管理"]); // 默認展開商品管理
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
      <SidebarGroup data-oid="gl71bb0">
        <SidebarGroupContent className="flex flex-col gap-2" data-oid="bhe_ypr">
          <SidebarMenu data-oid="1n_lc5t">
            <SidebarMenuItem
              className="flex items-center gap-2"
              data-oid="o51d6q."
            >
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                data-oid="0b3hr-u"
              >
                <IconCirclePlusFilled data-oid="vjajjox" />
                <span data-oid="emg2li1">Quick Create</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                data-oid="phewpor"
              >
                <IconMail data-oid="_vr_f6m" />
                <span className="sr-only" data-oid="r5_.cks">
                  Inbox
                </span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu data-oid="jp7c55s">
            {items.map((item) => (
              <SidebarMenuItem key={item.title} data-oid="vne16t_">
                {item.children ? (
                  // 🔧 SSR 階段：簡化渲染，避免狀態依賴
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground"
                    data-oid="kxyk35s"
                  >
                    <item.icon className="h-4 w-4" data-oid=":rn_.8v" />
                    {item.title}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground"
                    data-oid="6ximu6r"
                  >
                    <item.icon className="h-4 w-4" data-oid="s1iv70m" />
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
    <SidebarGroup data-oid="60.g61t">
      <SidebarGroupContent className="flex flex-col gap-2" data-oid="lte69h8">
        <SidebarMenu data-oid="3rfe18i">
          <SidebarMenuItem
            className="flex items-center gap-2"
            data-oid="w5zf05i"
          >
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              data-oid="-ln5:xw"
            >
              <IconCirclePlusFilled data-oid="g_pbug_" />
              <span data-oid=":6vd8rt">Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
              data-oid="i6h-odp"
            >
              <IconMail data-oid="ftm.s6d" />
              <span className="sr-only" data-oid="74vbta4">
                Inbox
              </span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu data-oid="0_kw35s">
          {items.map((item) =>
            item.children ? (
              // ✅ 如果有子選單，渲染修正後的 Collapsible 元件
              <SidebarMenuItem key={item.title} data-oid="e0oo9p-">
                <Collapsible
                  open={openItems.includes(item.title)}
                  onOpenChange={() => toggleItem(item.title)}
                  data-oid="r5vr4yh"
                >
                  <CollapsibleTrigger
                    // 將樣式直接應用在觸發器上，而不是內部的 span
                    className={cn(
                      "flex items-center justify-between w-full rounded-lg text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground",
                    )}
                    data-oid="47eq:6u"
                  >
                    {/* 將 padding 等樣式統一放在這裡 */}
                    <div
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      data-oid="glmnw9z"
                    >
                      <item.icon className="h-4 w-4" data-oid="cxf_kqs" />
                      {item.title}
                    </div>
                    <IconChevronDown
                      className={`h-4 w-4 mr-3 shrink-0 transition-transform duration-200 ${openItems.includes(item.title) ? "rotate-180" : ""}`}
                      data-oid="9yt83ug"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-1" data-oid="djwpmvf">
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
                        data-oid="i88x_8x"
                      >
                        {child.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : (
              // 普通連結項保持統一樣式
              <SidebarMenuItem key={item.title} data-oid="c1sy8ck">
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
                  data-oid="o-f0qjw"
                >
                  <item.icon className="h-4 w-4" data-oid="_9qt0su" />
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
