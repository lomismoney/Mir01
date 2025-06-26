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
      data-oid="w0c9a_g"
    >
      <SidebarGroupLabel data-oid="0r619lr">Documents</SidebarGroupLabel>
      <SidebarMenu data-oid="3co6iqx">
        {items.map((item) => (
          <SidebarMenuItem key={item.name} data-oid="amp32rt">
            <SidebarMenuButton asChild data-oid="j.jker-">
              <Link href={item.url} prefetch={true} data-oid="3f.8va5">
                <item.icon data-oid="g_qcq8t" />
                <span data-oid="m.h3hif">{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu data-oid="7hkbc7g">
              <DropdownMenuTrigger asChild data-oid="unv5p:d">
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                  data-oid="ugd-oaz"
                >
                  <IconDots data-oid="hwtl4-j" />
                  <span className="sr-only" data-oid="swcpu.x">
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
                data-oid="oks4u6a"
              >
                <DropdownMenuItem data-oid="__x08zn">
                  <IconFolder data-oid="xrnxnw_" />
                  <span data-oid="tx_sbiu">Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem data-oid="unvbrxq">
                  <IconShare3 data-oid="43-wzit" />
                  <span data-oid="6x8clbb">Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator data-oid="w79hebs" />
                <DropdownMenuItem variant="destructive" data-oid="1mizh.z">
                  <IconTrash data-oid="16gk845" />
                  <span data-oid="t36cr41">Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem data-oid="7ugqsim">
          <SidebarMenuButton
            className="text-sidebar-foreground/70"
            data-oid="k7-_ql7"
          >
            <IconDots
              className="text-sidebar-foreground/70"
              data-oid="f:k7u01"
            />

            <span data-oid="39lyem0">More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}
