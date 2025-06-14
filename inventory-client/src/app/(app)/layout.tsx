'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 受保護的應用程式佈局（Auth.js 中間件保護版本）
 *
 * 提供包含側邊欄導航、標題列和主要內容區域的儀表板介面
 * 由 Auth.js 中間件統一保護，無需 HOC 包裹
 *
 * 安全特性：
 * - Auth.js 中間件已確保只有已登入用戶才能訪問 (app) 路由群組
 * - 移除 withAuth HOC，簡化元件結構
 * - 提升效能，減少不必要的重新渲染
 *
 * @param children - 要在佈局中顯示的主要內容
 */
export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
} 