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

interface FormSkeletonProps {
  fields?: number;
  sections?: number;
  showHeader?: boolean;
  showActions?: boolean;
  className?: string;
  variant?: "default" | "wizard" | "inline" | "modal";
}

/**
 * 統一的表單骨架屏組件
 * 用於所有表單類型的載入狀態顯示
 */
export function FormSkeleton({
  fields = 5,
  sections = 1,
  showHeader = true,
  showActions = true,
  className,
  variant = "default",
}: FormSkeletonProps) {
  const renderFormField = (index: number) => (
    <div key={index} className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full" />
    </div>
  );

  const renderSection = (sectionIndex: number) => (
    <div key={sectionIndex} className="space-y-6">
      {sectionIndex > 0 && <Skeleton className="h-px w-full" />}
      {sections > 1 && (
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        {Array.from({ length: fields }).map((_, index) => renderFormField(index))}
      </div>
    </div>
  );

  switch (variant) {
    case "wizard":
      return (
        <div className={cn("flex gap-8", className)}>
          {/* 側邊欄 */}
          <div className="w-64 space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent className="space-y-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* 主內容區 */}
          <div className="flex-1 space-y-6">
            {showHeader && (
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
            )}
            <Card>
              <CardContent className="pt-6 space-y-6">
                {Array.from({ length: sections }).map((_, index) => renderSection(index))}
              </CardContent>
            </Card>
            {showActions && (
              <div className="flex justify-between">
                <Skeleton className="h-10 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case "modal":
      return (
        <div className={cn("space-y-6", className)}>
          {showHeader && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          )}
          <div className="space-y-4">
            {Array.from({ length: fields }).map((_, index) => renderFormField(index))}
          </div>
          {showActions && (
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-24" />
            </div>
          )}
        </div>
      );

    case "inline":
      return (
        <div className={cn("flex items-end gap-4", className)}>
          {Array.from({ length: fields }).map((_, index) => (
            <div key={index} className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          {showActions && <Skeleton className="h-10 w-24" />}
        </div>
      );

    default:
      return (
        <div className={cn("space-y-6", className)}>
          {showHeader && (
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          )}
          <Card>
            <CardContent className="pt-6 space-y-6">
              {Array.from({ length: sections }).map((_, index) => renderSection(index))}
            </CardContent>
          </Card>
          {showActions && (
            <div className="flex justify-end gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-32" />
            </div>
          )}
        </div>
      );
  }
}

/**
 * 搜尋表單骨架屏
 */
export function SearchFormSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 flex-1 max-w-md" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-24" />
      <Skeleton className="h-10 w-10" />
    </div>
  );
}

/**
 * 篩選表單骨架屏
 */
export function FilterFormSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </CardContent>
    </Card>
  );
}