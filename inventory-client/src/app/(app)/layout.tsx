"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense, memo } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRouteIconPreloader } from "@/hooks/useRouteIconPreloader";
import { BreadcrumbProvider } from "@/components/breadcrumb-context";
import { useEffect } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 應用主佈局（簡化版）
 * 
 * 採用更簡單的認證策略：
 * 1. 依賴 Auth.js middleware 的保護
 * 2. 這裡只做最基本的 session 檢查
 * 3. 避免複雜的狀態判斷導致黑屏
 */
const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  const { status } = useSession();
  const router = useRouter();
  
  // 圖標預加載
  useRouteIconPreloader();

  // 簡單的認證檢查：如果明確未登入，重定向到登入頁
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // 如果還在載入 session，顯示載入畫面
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            正在載入應用程式
          </h3>
          <p className="text-sm text-muted-foreground">
            請稍候...
          </p>
        </div>
      </div>
    );
  }

  // 預設情況下，顯示應用佈局
  // 相信 Auth.js middleware 已經做好保護
  return (
    <BreadcrumbProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "18rem",
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <main className="flex-1 overflow-auto p-6 bg-background">
            <div className="container mx-auto max-w-7xl">
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                    <LoadingSpinner size="lg" />
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        載入頁面中
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        正在為您準備最新內容...
                      </p>
                    </div>
                  </div>
                }
              >
                {children}
              </Suspense>
            </div>
          </main>
        </SidebarInset>
        <PerformanceMonitor />
      </SidebarProvider>
    </BreadcrumbProvider>
  );
});

AppLayout.displayName = "AppLayout";

export default AppLayout;