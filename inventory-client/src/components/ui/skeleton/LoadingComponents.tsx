import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  text?: string;
  variant?: "default" | "primary" | "secondary";
}

/**
 * 統一的載入動畫組件
 */
export function LoadingSpinner({
  className,
  size = "md",
  text,
  variant = "default",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
    xl: "h-12 w-12",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const variantClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    secondary: "text-secondary",
  };

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <Loader2
        className={cn(
          "animate-spin",
          sizeClasses[size],
          variantClasses[variant]
        )}
      />
      {text && (
        <p className={cn(
          "animate-pulse",
          textSizeClasses[size],
          variantClasses[variant]
        )}>
          {text}
        </p>
      )}
    </div>
  );
}

interface PageLoadingProps {
  text?: string;
  className?: string;
}

/**
 * 整頁載入狀態
 */
export function PageLoading({ text = "載入中...", className }: PageLoadingProps) {
  return (
    <div className={cn(
      "flex min-h-[400px] w-full items-center justify-center",
      className
    )}>
      <LoadingSpinner size="lg" text={text} variant="primary" />
    </div>
  );
}

interface SectionLoadingProps {
  text?: string;
  className?: string;
  variant?: "card" | "inline" | "overlay";
  backdrop?: boolean;
}

/**
 * 區塊載入狀態
 */
export function SectionLoading({
  text = "載入中...",
  className,
  variant = "card",
  backdrop = true,
}: SectionLoadingProps) {
  switch (variant) {
    case "overlay":
      return (
        <div className={cn("relative", className)}>
          <div
            className={cn(
              "absolute inset-0 z-10 flex items-center justify-center",
              backdrop && "bg-background/80 backdrop-blur-sm"
            )}
          >
            <LoadingSpinner size="md" text={text} />
          </div>
        </div>
      );

    case "inline":
      return (
        <div className={cn("flex items-center justify-center py-8", className)}>
          <LoadingSpinner size="sm" text={text} />
        </div>
      );

    case "card":
    default:
      return (
        <Card className={cn("flex items-center justify-center p-12", className)}>
          <LoadingSpinner size="md" text={text} />
        </Card>
      );
  }
}

interface LoadingFallbackProps {
  type?: "page" | "section" | "component";
  text?: string;
  className?: string;
}

/**
 * 通用載入回退組件
 * 用於 Suspense fallback
 */
export function LoadingFallback({
  type = "component",
  text,
  className,
}: LoadingFallbackProps) {
  const defaultTexts = {
    page: "載入頁面中...",
    section: "載入內容中...",
    component: "載入組件中...",
  };

  const displayText = text || defaultTexts[type];

  switch (type) {
    case "page":
      return <PageLoading text={displayText} className={className} />;
    case "section":
      return <SectionLoading text={displayText} className={className} />;
    case "component":
    default:
      return (
        <div className={cn("flex items-center justify-center p-4", className)}>
          <LoadingSpinner size="sm" text={displayText} />
        </div>
      );
  }
}

/**
 * 載入邊界組件
 * 提供統一的錯誤處理和載入狀態
 */
interface LoadingBoundaryProps {
  isLoading: boolean;
  error?: Error | null;
  loadingText?: string;
  errorText?: string;
  onRetry?: () => void;
  children: React.ReactNode;
  type?: "page" | "section" | "component";
}

export function LoadingBoundary({
  isLoading,
  error,
  loadingText,
  errorText = "載入失敗",
  onRetry,
  children,
  type = "component",
}: LoadingBoundaryProps) {
  if (isLoading) {
    return <LoadingFallback type={type} text={loadingText} />;
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-destructive mb-4">{errorText}</p>
        {error.message && (
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-primary hover:underline text-sm"
          >
            重試
          </button>
        )}
      </Card>
    );
  }

  return <>{children}</>;
}