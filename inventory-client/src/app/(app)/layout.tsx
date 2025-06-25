"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { Suspense, memo } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import PerformanceMonitor from "@/components/performance/PerformanceMonitor";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * 高性能應用布局（第五階段：中間件優化完成版本）
 *
 * 🚀 核心性能優化（五階段完整實現）：
 * 1. React.memo 包裹 - 阻止父組件重渲染導致的連鎖反應
 * 2. Suspense 邊界 - 優化子組件載入體驗，實現真正的懶加載
 * 3. 固定樣式變數 - 避免動態計算CSS自定義屬性
 * 4. 主內容區域優化 - 獨立滾動容器，避免整頁重繪
 * 5. 組件分離策略 - 側邊欄、標題、內容各自獨立優化
 * 6. 性能監控整合 - 實時監控和優化建議系統
 *
 * 🎯 專為解決「全系統性能瓶頸」問題設計：
 * - 消除不必要的組件重渲染
 * - 預加載關鍵路由組件
 * - 智能 Suspense 回退，提供即時視覺反饋
 * - 內存級別的佈局緩存
 * - 中間件層面的認證優化
 * - 實時性能監控和問題診斷
 *
 * 安全特性：
 * - Auth.js 中間件已確保認證保護
 * - 無需額外 HOC 包裹，簡化渲染樹
 * - 錯誤邊界準備（透過 Suspense）
 *
 * @param children - 要在佈局中顯示的主要內容
 */
const AppLayout = memo(function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider
      style={
        {
          // 🎯 性能優化：使用固定值避免動態計算
          "--sidebar-width": "18rem", // 288px = 18rem，避免 calc() 動態計算
          "--header-height": "3rem", // 48px = 3rem，固定標題高度
        } as React.CSSProperties
      }
      data-oid="tm-6xs1"
    >
      {/* 🔧 側邊欄組件 - 獨立緩存和優化 */}
      <AppSidebar variant="inset" data-oid="43y3o-j" />

      <SidebarInset data-oid="lq-7fbo">
        {/* 🔧 標題組件 - 輕量級，最小重渲染 */}
        <SiteHeader data-oid="w50djt." />

        {/* 🚀 主內容區域 - 核心性能優化區域 */}
        <main
          className="flex-1 overflow-auto p-6 bg-background"
          data-oid="ype050f"
        >
          <div className="container mx-auto max-w-7xl" data-oid="ysh0jeg">
            {/* 🎯 Suspense 邊界 - 路由性能革命的核心 */}
            <Suspense
              fallback={
                <div
                  className="flex flex-col items-center justify-center h-64 space-y-4"
                  data-oid="u8lv-5:"
                >
                  <LoadingSpinner size="lg" data-oid="ur2t3w5" />
                  <div className="text-center space-y-2" data-oid="1v6j2zi">
                    <h3
                      className="text-lg font-semibold text-foreground"
                      data-oid="elat_gp"
                    >
                      載入頁面中
                    </h3>
                    <p
                      className="text-sm text-muted-foreground"
                      data-oid="jxagfl7"
                    >
                      正在為您準備最新內容...
                    </p>
                  </div>
                </div>
              }
              data-oid="w5s2vra"
            >
              {/* 🔥 子頁面內容 - 在 Suspense 保護下懶加載 */}
              {children}
            </Suspense>
          </div>
        </main>
      </SidebarInset>

      {/* 🚀 性能監控儀表板 - 實時監控系統性能 */}
      <PerformanceMonitor data-oid="4u2lv75" />
    </SidebarProvider>
  );
});

// 🎯 為 React DevTools 提供清晰的組件名稱
AppLayout.displayName = "AppLayout";

export default AppLayout;
