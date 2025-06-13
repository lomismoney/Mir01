import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * 資料表格骨架屏元件
 * 
 * 用於在 Suspense fallback 中顯示表格載入狀態
 * 模擬真實表格的結構和間距
 */
export function DataTableSkeleton() {
  return (
    <div className="w-full space-y-4">
      {/* 表格工具列骨架 */}
      <div className="flex items-center justify-between py-4">
        {/* 左側搜尋框骨架 */}
        <div className="relative max-w-sm">
          <Skeleton className="h-10 w-80" />
        </div>
        
        {/* 右側按鈕群組骨架 */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* 表格卡片骨架 */}
      <Card>
        <CardHeader className="pb-3">
          {/* 表格標題列骨架 */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-4 w-4" /> {/* 選擇框 */}
            <Skeleton className="h-4 w-32" /> {/* 欄位標題 1 */}
            <Skeleton className="h-4 w-24" /> {/* 欄位標題 2 */}
            <Skeleton className="h-4 w-20" /> {/* 欄位標題 3 */}
            <Skeleton className="h-4 w-28" /> {/* 欄位標題 4 */}
            <Skeleton className="h-4 w-16" /> {/* 操作欄 */}
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {/* 表格資料列骨架 - 模擬 8 行資料 */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="flex items-center space-x-4 py-3 border-b last:border-b-0">
              <Skeleton className="h-4 w-4" /> {/* 選擇框 */}
              <Skeleton className="h-4 w-32" /> {/* 資料欄位 1 */}
              <Skeleton className="h-4 w-24" /> {/* 資料欄位 2 */}
              <Skeleton className="h-4 w-20" /> {/* 資料欄位 3 */}
              <Skeleton className="h-4 w-28" /> {/* 資料欄位 4 */}
              <div className="flex items-center space-x-1">
                <Skeleton className="h-8 w-8" /> {/* 操作按鈕 1 */}
                <Skeleton className="h-8 w-8" /> {/* 操作按鈕 2 */}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 分頁控制列骨架 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" /> {/* 資料統計文字 */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" /> {/* 上一頁按鈕 */}
          <Skeleton className="h-9 w-8" />  {/* 頁碼 1 */}
          <Skeleton className="h-9 w-8" />  {/* 頁碼 2 */}
          <Skeleton className="h-9 w-8" />  {/* 頁碼 3 */}
          <Skeleton className="h-9 w-20" /> {/* 下一頁按鈕 */}
        </div>
      </div>
    </div>
  );
}

/**
 * 簡化版骨架屏 - 用於較小的資料表格
 */
export function CompactDataTableSkeleton() {
  return (
    <div className="w-full space-y-3">
      {/* 工具列 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-60" />
        <Skeleton className="h-9 w-24" />
      </div>

      {/* 表格內容 */}
      <Card>
        <CardContent className="p-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
} 