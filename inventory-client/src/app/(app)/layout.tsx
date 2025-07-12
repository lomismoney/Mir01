"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense, memo, useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useRouteIconPreloader } from "@/hooks/useRouteIconPreloader";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 高性能應用布局（身份驗證安全版本）
 *
 * 🚀 核心性能優化（六階段完整實現）：
 * 1. React.memo 包裹 - 阻止父組件重渲染導致的連鎖反應
 * 2. Suspense 邊界 - 優化子組件載入體驗，實現真正的懶加載
 * 3. 固定樣式變數 - 避免動態計算CSS自定義屬性
 * 4. 主內容區域優化 - 獨立滾動容器，避免整頁重繪
 * 5. 組件分離策略 - 側邊欄、標題、內容各自獨立優化
 * 6. 性能監控整合 - 實時監控和優化建議系統
 * 7. 🔐 身份驗證保護 - 防止未登入用戶觸發客戶端錯誤 (NEW)
 *
 * 🎯 專為解決「全系統性能瓶頸」問題設計：
 * - 消除不必要的組件重渲染
 * - 預加載關鍵路由組件
 * - 智能 Suspense 回退，提供即時視覺反饋
 * - 內存級別的佈局緩存
 * - 中間件層面的認證優化
 * - 實時性能監控和問題診斷
 * - 🔐 客戶端身份驗證防護 - 雙重保險機制
 *
 * 安全特性：
 * - Auth.js 中間件 + 客戶端雙重認證保護
 * - 優雅的載入和錯誤狀態處理
 * - 防止未登入用戶觸發 useSession 相關錯誤
 * - 錯誤邊界準備（透過 Suspense）
 *
 * @param children - 要在佈局中顯示的主要內容
 */
const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // 🎨 圖標預加載系統 - 根據路由自動預加載相關圖標
  useRouteIconPreloader();

  // 🔐 客戶端身份驗證保護 - 防止未登入用戶觸發錯誤
  useEffect(() => {
    if (status === "unauthenticated") {
      // 如果用戶未登入，立即重定向到登入頁
      // 這是中介軟體的備援保護機制
      router.replace("/login");
    }
  }, [status, router]);

  // 🔐 載入狀態：顯示載入畫面，避免閃爍
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            正在驗證身份
          </h3>
          <p className="text-sm text-muted-foreground">
            請稍候，正在確認您的登入狀態...
          </p>
        </div>
      </div>
    );
  }

  // 🔐 未登入狀態：顯示簡單載入畫面（同時進行重定向）
  if (status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <LoadingSpinner size="lg" />
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            正在導向登入頁面
          </h3>
          <p className="text-sm text-muted-foreground">
            請稍候，正在為您跳轉至登入頁面...
          </p>
        </div>
      </div>
    );
  }

  // 🔐 已登入且有 session：正常渲染應用佈局
  if (status === "authenticated" && session) {
    return (
      <SidebarProvider
        style={
          {
            // 🎯 性能優化：使用固定值避免動態計算
            "--sidebar-width": "18rem", // 288px = 18rem，避免 calc() 動態計算
            "--header-height": "3rem", // 48px = 3rem，固定標題高度
          } as React.CSSProperties
        }
       
      >
        {/* 🔧 側邊欄組件 - 獨立緩存和優化 */}
        <AppSidebar variant="inset" />

        <SidebarInset>
          {/* 🔧 標題組件 - 輕量級，最小重渲染 */}
          <SiteHeader />

          {/* 🚀 主內容區域 - 核心性能優化區域 */}
          <main
            className="flex-1 overflow-auto p-6 bg-background"
           
          >
            <div className="container mx-auto max-w-7xl">
              {/* 🎯 Suspense 邊界 - 路由性能革命的核心 */}
              <Suspense
                fallback={
                  <div
                    className="flex flex-col items-center justify-center h-64 space-y-4"
                   
                  >
                    <LoadingSpinner size="lg" />
                    <div className="text-center space-y-2">
                      <h3
                        className="text-lg font-semibold text-foreground"
                       
                      >
                        載入頁面中
                      </h3>
                      <p
                        className="text-sm text-muted-foreground"
                       
                      >
                        正在為您準備最新內容...
                      </p>
                    </div>
                  </div>
                }
               
              >
                {/* 🔥 子頁面內容 - 在 Suspense 保護下懶加載 */}
                {children}
              </Suspense>
            </div>
          </main>
        </SidebarInset>

        {/* 🚀 性能監控儀表板 - 實時監控系統性能 */}
        <PerformanceMonitor />
      </SidebarProvider>
    );
  }

  // 🔐 其他未預期狀態：顯示錯誤狀態
  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-destructive">
          身份驗證異常
        </h3>
        <p className="text-sm text-muted-foreground">
          請重新整理頁面或聯絡系統管理員
        </p>
      </div>
    </div>
  );
});

// 🎯 為 React DevTools 提供清晰的組件名稱
AppLayout.displayName = "AppLayout";

export default AppLayout;
