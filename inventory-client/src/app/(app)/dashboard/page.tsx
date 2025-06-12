'use client';

import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import withAuth from '@/components/auth/withAuth';

/**
 * Renders the main dashboard page for the inventory management system.
 *
 * Displays dashboard summary cards and an interactive chart area within a structured layout.
 *
 * @remark This component is intended to be used within the layout provided by `(app)/layout.tsx` and is protected by authentication via a higher-order component.
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
