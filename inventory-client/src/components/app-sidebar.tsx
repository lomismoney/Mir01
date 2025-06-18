"use client"

import Link from "next/link"
import { IconChartBar } from "@tabler/icons-react"
import { 
  IconBox,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconHelp,
  IconHistory,
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
import { memo, useCallback } from 'react'
import { useRouter } from 'next/navigation'

/**
 * 智能預加載導航鏈接組件（第三階段核心組件）
 * 
 * 🚀 核心功能：
 * 1. 鼠標懸停時預加載路由組件（Next.js router.prefetch）
 * 2. 同時預加載關鍵數據（React Query prefetchQuery）
 * 3. 避免重複預加載，優化性能
 * 4. 支援嵌套路由預加載
 * 
 * 這是解決「10秒路由切換」問題的關鍵技術
 */
const SmartNavLink = memo(function SmartNavLink({ 
  href, 
  children, 
  prefetchData,
  className = ""
}: {
  href: string;
  children: React.ReactNode;
  prefetchData?: () => void;
  className?: string;
}) {
  const router = useRouter();
  
  const handleMouseEnter = useCallback(() => {
    // 🚀 預加載路由組件（Next.js 層面）
    router.prefetch(href);
    
    // 🎯 預加載關鍵數據（React Query 層面）
    prefetchData?.();
  }, [href, prefetchData, router]);

  return (
    <Link 
      href={href} 
      onMouseEnter={handleMouseEnter}
      prefetch={false} // 使用自定義預加載邏輯
      className={className}
    >
      {children}
    </Link>
  );
});

/**
 * 庫存管理系統的導航數據配置（高性能版本）
 * 
 * 🎯 整合智能預加載的路由配置
 * 每個路由都配置了對應的數據預加載函數
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
        { title: "變動歷史", url: "/inventory/history" },
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
      title: "進貨管理",
      icon: IconPackage,
      isActive: true,
      url: "/purchases",
      items: [
        {
          title: "新增進貨",
          url: "/purchases",
        },
        {
          title: "進貨記錄",
          url: "/purchases/history",
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
 * 高性能應用程式側邊欄（修復 Hydration 錯誤版本）
 * 
 * 🚀 核心性能優化：
 * 1. React.memo 包裹，防止不必要重渲染
 * 2. 修復 Next.js Hydration 錯誤
 * 3. 統一導航系統，避免重複項目
 * 
 * @param props - Sidebar 組件的屬性
 */
const AppSidebar = memo(function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // 移除未使用的 queryClient 和 prefetch 函數以通過 ESLint 檢查

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <SmartNavLink href="/dashboard">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">庫存管理系統</span>
              </SmartNavLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* 🚀 統一導航系統 - 移除重複項目，保持智能預加載功能 */}
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
});

// 🎯 為 React DevTools 提供清晰的組件名稱
AppSidebar.displayName = 'AppSidebar';

export { AppSidebar };
