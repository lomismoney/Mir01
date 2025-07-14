import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// 基本的 Skeleton 組件定義（避免循環導入）
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showActions?: boolean;
  showSearch?: boolean;
  showPagination?: boolean;
  className?: string;
  compact?: boolean;
}

/**
 * 統一的表格骨架屏組件
 * 用於所有表格類型的載入狀態顯示
 */
export function TableSkeleton({
  rows = 10,
  columns = 5,
  showHeader = true,
  showActions = true,
  showSearch = true,
  showPagination = true,
  className,
  compact = false,
}: TableSkeletonProps) {
  if (compact) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 p-3 border rounded-lg bg-card"
          >
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 頁面標題骨架 */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-96" />
          </div>
          {showActions && <Skeleton className="h-10 w-32" />}
        </div>
      )}

      {/* 搜尋和篩選區骨架 */}
      {showSearch && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-9 w-80" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* 資料表主體骨架 */}
      <Card>
        <CardContent className="p-0">
          {/* 表格標題行 */}
          <div className="border-b bg-muted/30">
            <div className={cn(
              "grid gap-4 p-4",
              `grid-cols-${columns}`
            )} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
              {Array.from({ length: columns }).map((_, index) => (
                <Skeleton 
                  key={index} 
                  className={cn(
                    "h-4",
                    index === 0 && "w-16",
                    index === columns - 1 && "w-20"
                  )} 
                />
              ))}
            </div>
          </div>

          {/* 表格資料行 */}
          <div className="divide-y">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div 
                key={rowIndex} 
                className={cn(
                  "grid gap-4 p-4 hover:bg-muted/5 transition-colors",
                  `grid-cols-${columns}`
                )}
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <div key={colIndex} className="flex items-center">
                    {/* 第一欄通常是選擇框 */}
                    {colIndex === 0 ? (
                      <Skeleton className="h-4 w-4 rounded" />
                    ) : colIndex === 1 ? (
                      /* 第二欄通常是主要內容 */
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-full max-w-[200px]" />
                        <Skeleton className="h-3 w-2/3 max-w-[150px]" />
                      </div>
                    ) : colIndex === columns - 1 ? (
                      /* 最後一欄通常是操作按鈕 */
                      <div className="flex gap-1 justify-end w-full">
                        <Skeleton className="h-8 w-8 rounded" />
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
      {showPagination && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      )}
    </div>
  );
}