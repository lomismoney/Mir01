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
      <SidebarGroup data-oid="anwid89">
        <SidebarGroupContent className="flex flex-col gap-2" data-oid="thtff8m">
          <SidebarMenu data-oid="433x49e">
            <SidebarMenuItem
              className="flex items-center gap-2"
              data-oid="4mg23vs"
            >
              <SidebarMenuButton
                tooltip="Quick Create"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
                data-oid="3byyyw9"
              >
                <IconCirclePlusFilled data-oid="pesddx0" />
                <span data-oid="y_0ad:v">Quick Create</span>
              </SidebarMenuButton>
              <Button
                size="icon"
                className="size-8 group-data-[collapsible=icon]:opacity-0"
                variant="outline"
                data-oid="d.dkv.3"
              >
                <IconMail data-oid="574ld:5" />
                <span className="sr-only" data-oid="vz4e756">
                  Inbox
                </span>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
          <SidebarMenu data-oid="lqa4evo">
            {items.map((item) => (
              <SidebarMenuItem key={item.title} data-oid="dxxcwpa">
                {item.children ? (
                  // 🔧 SSR 階段：簡化渲染，避免狀態依賴
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground"
                    data-oid="hli:bte"
                  >
                    <item.icon className="h-4 w-4" data-oid="k0u2ur." />
                    {item.title}
                  </div>
                ) : (
                  <div
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground"
                    data-oid=":wra3hh"
                  >
                    <item.icon className="h-4 w-4" data-oid="g_920iy" />
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
    <SidebarGroup data-oid="an.35c_">
      <SidebarGroupContent className="flex flex-col gap-2" data-oid="66xyw0.">
        <SidebarMenu data-oid="ekcm8pz">
          <SidebarMenuItem
            className="flex items-center gap-2"
            data-oid="_1_4y4y"
          >
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
              data-oid="jb1:m.i"
            >
              <IconCirclePlusFilled data-oid=":qsxlr1" />
              <span data-oid="hl4lo23">Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
              data-oid="m7j5mmf"
            >
              <IconMail data-oid="dxjdxni" />
              <span className="sr-only" data-oid="bb506t.">
                Inbox
              </span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu data-oid="vl2gmjo">
          {items.map((item) =>
            item.children ? (
              // ✅ 如果有子選單，渲染修正後的 Collapsible 元件
              <SidebarMenuItem key={item.title} data-oid="t9qhstj">
                <Collapsible
                  open={openItems.includes(item.title)}
                  onOpenChange={() => toggleItem(item.title)}
                  data-oid="68i9isz"
                >
                  <CollapsibleTrigger
                    // 將樣式直接應用在觸發器上，而不是內部的 span
                    className={cn(
                      "flex items-center justify-between w-full rounded-lg text-sidebar-foreground transition-all hover:text-sidebar-accent-foreground",
                    )}
                    data-oid="g54cj5u"
                  >
                    {/* 將 padding 等樣式統一放在這裡 */}
                    <div
                      className="flex items-center gap-3 rounded-lg px-3 py-2"
                      data-oid="-ob125q"
                    >
                      <item.icon className="h-4 w-4" data-oid="n:inld5" />
                      {item.title}
                    </div>
                    <IconChevronDown
                      className={`h-4 w-4 mr-3 shrink-0 transition-transform duration-200 ${openItems.includes(item.title) ? "rotate-180" : ""}`}
                      data-oid="losshx."
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pl-8 pt-1" data-oid="ar:r--9">
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
                        data-oid="ukzr3js"
                      >
                        {child.title}
                      </Link>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenuItem>
            ) : (
              // 普通連結項保持統一樣式
              <SidebarMenuItem key={item.title} data-oid="ami2bwc">
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
                  data-oid="ultyna3"
                >
                  <item.icon className="h-4 w-4" data-oid="gr57s0l" />
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
