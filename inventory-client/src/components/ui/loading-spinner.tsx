import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

/**
 * 統一的載入動畫組件（高性能版本）
 *
 * 功能特色：
 * 1. 輕量級設計，最小化重渲染成本
 * 2. 支援多種尺寸配置
 * 3. 可選的載入文字顯示
 * 4. 與 shadcn/ui 風格完全一致
 * 5. 支援自定義樣式覆蓋
 *
 * 使用場景：
 * - API 請求載入狀態
 * - 頁面切換過渡
 * - 組件懶加載回退
 * - 權限驗證等待
 */
export function LoadingSpinner({
  className,
  size = "md",
  text,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center gap-2" data-oid="r46cg:f">
      <Loader2
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size],
          className,
        )}
        data-oid="9no1v82"
      />

      {text && (
        <span
          className="text-sm text-muted-foreground animate-pulse"
          data-oid="66v7-ux"
        >
          {text}
        </span>
      )}
    </div>
  );
}
