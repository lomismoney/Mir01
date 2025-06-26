"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react";

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
  items: { name: string; url: string; icon: Icon }[];
}) {
  const { isMobile } = useSidebar();

  // 🚀 修復 Hydration 錯誤：延遲獲取 mobile 狀態
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarGroup
      className="group-data-[collapsible=icon]:hidden"
      data-oid="tz6:1v3"
    >
      <SidebarGroupLabel data-oid="lhx-1yg">Documents</SidebarGroupLabel>
      <SidebarMenu data-oid="ca8ltvr">
        {items.map((item) => (
          <SidebarMenuItem key={item.name} data-oid="ly:3tlr">
            <SidebarMenuButton asChild data-oid="yl:f9-c">
              <Link href={item.url} prefetch={true} data-oid="l-_qqcv">
                <item.icon data-oid="o0j-9l." />
                <span data-oid="b_syfr5">{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu data-oid="goxti9q">
              <DropdownMenuTrigger asChild data-oid="tt8uc:-">
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                  data-oid="exb06d:"
                >
                  <IconDots data-oid="v7qxi2e" />
                  <span className="sr-only" data-oid="w-dh646">
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
                data-oid="i9rqqiy"
              >
                <DropdownMenuItem data-oid="ea4frca">
                  <IconFolder data-oid="z9oc1nn" />
                  <span data-oid="b590qi_">Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem data-oid="xwp8--n">
                  <IconShare3 data-oid="kfn4cq4" />
                  <span data-oid="5rb-tty">Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator data-oid="dy5yhlt" />
                <DropdownMenuItem variant="destructive" data-oid="rdogr71">
                  <IconTrash data-oid="7ommoqj" />
                  <span data-oid="aqiigya">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem data-oid=":pjm.tc">
          <SidebarMenuButton
            className="text-sidebar-foreground/70"
            data-oid="1jc:fcq"
          >
            <IconDots
              className="text-sidebar-foreground/70"
              data-oid="nx_lpr0"
            />

            <span data-oid="8t0-m:w">More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
