"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconBox,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconHelp,
  IconInnerShadowTop,
  IconPackage,
  IconReport,
  IconSearch,
  IconSettings,
  IconShoppingCart,
  IconTruck,
  IconUsers,
  IconBuilding,
  IconBuildingStore,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain, type NavLink } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


/**
 * 庫存管理系統的導航數據配置
 */
const data = {
  navMain: [
    {
      title: "儀表板",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "庫存管理",
      icon: IconBuilding,
      children: [
        { title: "庫存清單", url: "/inventory/management" },
        { title: "庫存轉移", url: "/inventory/transfers" },
      ]
    },
    {
      title: "商品管理",
      icon: IconBox,
      children: [
        { title: "商品列表", url: "/products" },
        { title: "分類管理", url: "/categories" },
        { title: "規格管理", url: "/attributes" },
      ]
    },
    {
      title: "訂單管理",
      url: "/orders",
      icon: IconShoppingCart,
    },
    {
      title: "供應商管理",
      url: "/suppliers",
      icon: IconTruck,
    },
    {
      title: "分店管理",
      url: "/stores",
      icon: IconBuildingStore,
    },
    {
      title: "用戶管理",
      url: "/users",
      icon: IconUsers,
    },
  ] as NavLink[],
  navClouds: [
    {
      title: "入庫管理",
      icon: IconPackage,
      isActive: true,
      url: "/inbound",
      items: [
        {
          title: "待入庫",
          url: "/inbound/pending",
        },
        {
          title: "已入庫",
          url: "/inbound/completed",
        },
      ],
    },
    {
      title: "出庫管理",
      icon: IconTruck,
      url: "/outbound",
      items: [
        {
          title: "待出庫",
          url: "/outbound/pending",
        },
        {
          title: "已出庫",
          url: "/outbound/completed",
        },
      ],
    },
    {
      title: "庫存報告",
      icon: IconFileDescription,
      url: "/reports",
      items: [
        {
          title: "庫存統計",
          url: "/reports/inventory",
        },
        {
          title: "進出庫記錄",
          url: "/reports/transactions",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "系統設定",
      url: "/settings",
      icon: IconSettings,
    },
    {
      title: "幫助中心",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "搜尋",
      url: "/search",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "數據中心",
      url: "/data",
      icon: IconDatabase,
    },
    {
      name: "分析報表",
      url: "/analytics",
      icon: IconChartBar,
    },
    {
      name: "系統報告",
      url: "/system-reports",
      icon: IconReport,
    },
  ],
}

/**
 * 應用程式側邊欄組件
 * 提供庫存管理系統的主要導航功能
 * 支援動態用戶資料和載入狀態
 * 
 * @param props - Sidebar 組件的屬性
 */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard" prefetch={true}>
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">庫存管理系統</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
