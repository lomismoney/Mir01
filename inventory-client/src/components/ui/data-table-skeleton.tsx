import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * 資料表骨架屏元件
 * 
 * 功能特色：
 * 1. 語義化的載入狀態展示
 * 2. 符合實際資料表結構的骨架布局
 * 3. 響應式設計，適應不同螢幕尺寸
 * 4. 高度可定制的骨架行數和欄位
 * 5. 整合 shadcn/ui 的設計系統
 * 
 * 用途：
 * - Suspense fallback
 * - 資料載入中的占位符
 * - 提升用戶體驗的載入動畫
 */
interface DataTableSkeletonProps {
  /** 骨架表格的行數 */
  rows?: number;
  /** 骨架表格的欄數 */
  columns?: number;
  /** 是否顯示標題區域 */
  showHeader?: boolean;
  /** 是否顯示操作按鈕區域 */
  showActions?: boolean;
  /** 自訂類別名稱 */
  className?: string;
}

/**
 * 資料表骨架屏元件
 * 模擬真實資料表的結構和載入狀態
 */
export function DataTableSkeleton({
  rows = 10,
  columns = 6,
  showHeader = true,
  showActions = true,
  className = ''
}: DataTableSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 頁面標題骨架 */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          {showActions && (
            <Skeleton className="h-10 w-24" />
          )}
        </div>
      )}

      {/* 搜尋和篩選區骨架 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-80" />
            <div className="flex space-x-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 資料表主體骨架 */}
      <Card>
        <CardContent className="p-0">
          {/* 表格標題行 */}
          <div className="border-b">
            <div className="grid grid-cols-6 gap-4 p-4">
              {Array.from({ length: columns }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full" />
              ))}
            </div>
          </div>

          {/* 表格資料行 */}
          <div className="divide-y">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="grid grid-cols-6 gap-4 p-4">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className="flex items-center">
                    {/* 第一欄通常是選擇框 */}
                    {colIndex === 0 ? (
                      <Skeleton className="h-4 w-4 rounded" />
                    ) : colIndex === 1 ? (
                      /* 第二欄通常是主要內容，稍微寬一些 */
                      <Skeleton className="h-4 w-full" />
                    ) : colIndex === columns - 1 ? (
                      /* 最後一欄通常是操作按鈕 */
                      <div className="flex space-x-1">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    ) : (
                      /* 其他欄位 */
                      <Skeleton className="h-4 w-3/4" />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 分頁骨架 */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-40" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

/**
 * 簡化版骨架屏，用於較小的區域
 */
export function CompactDataTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-3 border rounded-lg">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
} 