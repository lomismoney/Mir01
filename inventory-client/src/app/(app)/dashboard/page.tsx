'use client';

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import withAuth from '@/components/auth/withAuth';

/**
 * 儀表板頁面組件
 * 提供庫存管理系統的主要儀表板內容
 * 佈局結構由 (app)/layout.tsx 提供
 */
function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <SectionCards />
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
          {/* 未來功能：可根據需要添加從 API 獲取的資料表格 */}
        </div>
      </div>
    </div>
  )
}

// 使用 withAuth HOC 進行權限保護，確保只有已登入用戶可以存取
export default withAuth(DashboardPage);
