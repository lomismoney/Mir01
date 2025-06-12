'use client';

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import withAuth from '@/components/auth/withAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Provides the protected application layout with sidebar navigation, header, and main content area.
 *
 * Wraps authenticated pages in a dashboard interface, including an inset sidebar, a top header, and a content section.
 *
 * @param children - The main content to display within the layout.
 */
function AppLayout({ children }: AppLayoutProps) {
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

// 使用 withAuth HOC 進行權限保護，確保整個 (app) 路由組都受到保護
export default withAuth(AppLayout); 