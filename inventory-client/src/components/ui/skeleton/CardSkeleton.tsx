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

interface CardSkeletonProps {
  count?: number;
  columns?: number;
  showImage?: boolean;
  showActions?: boolean;
  className?: string;
  variant?: "default" | "compact" | "stats" | "product";
}

/**
 * 統一的卡片骨架屏組件
 * 用於所有卡片類型的載入狀態顯示
 */
export function CardSkeleton({
  count = 6,
  columns = 3,
  showImage = false,
  showActions = true,
  className,
  variant = "default",
}: CardSkeletonProps) {
  const renderCard = (index: number) => {
    switch (variant) {
      case "stats":
        return (
          <Card key={index} className="@container/card">
            <CardHeader className="space-y-1">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </CardHeader>
          </Card>
        );

      case "product":
        return (
          <Card key={index} className="overflow-hidden">
            {showImage && (
              <div className="aspect-square relative">
                <Skeleton className="absolute inset-0" />
              </div>
            )}
            <CardHeader className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
              {showActions && (
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                </div>
              )}
            </CardContent>
          </Card>
        );

      case "compact":
        return (
          <Card key={index} className="p-4">
            <div className="flex items-center gap-4">
              {showImage && <Skeleton className="h-12 w-12 rounded-lg" />}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              {showActions && <Skeleton className="h-8 w-16" />}
            </div>
          </Card>
        );

      default:
        return (
          <Card key={index}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            {showActions && (
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </CardContent>
            )}
          </Card>
        );
    }
  };

  return (
    <div
      className={cn(
        "grid gap-4",
        columns === 1 && "grid-cols-1",
        columns === 2 && "grid-cols-1 md:grid-cols-2",
        columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
        className
      )}
    >
      {Array.from({ length: count }).map((_, index) => renderCard(index))}
    </div>
  );
}

/**
 * 統計卡片骨架屏
 */
export function StatsCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="@container/card">
          <CardHeader className="space-y-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-16" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

/**
 * 詳情卡片骨架屏
 */
export function DetailCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 基本信息區塊 */}
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
            </div>
          ))}
        </div>

        {/* 分隔線 */}
        <Skeleton className="h-px w-full" />

        {/* 詳細信息區塊 */}
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}