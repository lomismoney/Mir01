import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 受保護應用區域的佈局組件
 * 
 * 提供完整的儀表板介面，包含：
 * 1. 側邊欄導覽 (AppSidebar)
 * 2. 頂部標題列 (SiteHeader)
 * 3. 主要內容區域
 * 
 * 此佈局僅應用於需要認證的應用功能頁面
 * 
 * @param children - 子頁面內容
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