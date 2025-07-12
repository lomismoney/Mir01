import React from 'react';
import { Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { LoadingState } from '@/hooks/useLoadingState';

/**
 * 載入狀態指示器組件
 */
interface LoadingIndicatorProps {
  state: LoadingState;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  customMessages?: Partial<Record<LoadingState, string>>;
  className?: string;
}

export function LoadingIndicator({
  state,
  size = 'md',
  showText = true,
  customMessages,
  className,
}: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const defaultMessages = {
    idle: '就緒',
    loading: '載入中...',
    success: '完成',
    error: '錯誤',
  };

  const message = customMessages?.[state] || defaultMessages[state];

  const renderIcon = () => {
    const iconClass = cn(sizeClasses[size]);
    
    switch (state) {
      case 'loading':
        return <Loader2 className={cn(iconClass, 'animate-spin text-blue-500')} />;
      case 'success':
        return <CheckCircle className={cn(iconClass, 'text-green-500')} />;
      case 'error':
        return <XCircle className={cn(iconClass, 'text-red-500')} />;
      case 'idle':
      default:
        return null;
    }
  };

  if (state === 'idle' && !showText) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {renderIcon()}
      {showText && (
        <span className={cn(textSizeClasses[size], {
          'text-blue-600': state === 'loading',
          'text-green-600': state === 'success',
          'text-red-600': state === 'error',
          'text-gray-500': state === 'idle',
        })}>
          {message}
        </span>
      )}
    </div>
  );
}

/**
 * 載入按鈕組件
 */
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  state: LoadingState;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loadingText?: string;
  successText?: string;
  errorText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  state,
  variant = 'default',
  size = 'default',
  loadingText = '處理中...',
  successText,
  errorText,
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  const isDisabled = disabled || state === 'loading';

  const getButtonText = () => {
    switch (state) {
      case 'loading':
        return loadingText;
      case 'success':
        return successText || children;
      case 'error':
        return errorText || children;
      default:
        return children;
    }
  };

  const getButtonVariant = () => {
    if (state === 'error' && variant === 'default') {
      return 'destructive';
    }
    return variant;
  };

  return (
    <Button
      variant={getButtonVariant()}
      size={size}
      disabled={isDisabled}
      className={cn(className)}
      {...props}
    >
      {state === 'loading' && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {state === 'success' && successText && (
        <CheckCircle className="mr-2 h-4 w-4" />
      )}
      {state === 'error' && errorText && (
        <XCircle className="mr-2 h-4 w-4" />
      )}
      {getButtonText()}
    </Button>
  );
}

/**
 * 重試按鈕組件
 */
interface RetryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onRetry: () => void;
  state: LoadingState;
  retryText?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function RetryButton({
  onRetry,
  state,
  retryText = '重試',
  size = 'sm',
  className,
  ...props
}: RetryButtonProps) {
  if (state !== 'error') {
    return null;
  }

  return (
    <Button
      variant="outline"
      size={size}
      onClick={onRetry}
      className={cn('gap-1', className)}
      {...props}
    >
      <RefreshCw className="h-3 w-3" />
      {retryText}
    </Button>
  );
}

/**
 * 載入覆蓋層組件
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  backdrop?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = '載入中...',
  backdrop = true,
  className,
  children,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={cn('relative', className)}>
      {children}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center',
          backdrop && 'bg-white/80 backdrop-blur-sm'
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
          <p className="text-sm text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 內容載入骨架組件
 */
interface ContentSkeletonProps {
  type?: 'list' | 'card' | 'table' | 'form';
  rows?: number;
  className?: string;
}

export function ContentSkeleton({
  type = 'list',
  rows = 5,
  className,
}: ContentSkeletonProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'list':
        return (
          <div className="space-y-3">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'card':
        return (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="rounded-lg border p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            ))}
          </div>
        );

      case 'table':
        return (
          <div className="rounded-md border">
            <div className="border-b p-4">
              <div className="flex space-x-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
            </div>
            <div className="divide-y">
              {Array.from({ length: rows }, (_, i) => (
                <div key={i} className="p-4">
                  <div className="flex space-x-4">
                    {Array.from({ length: 4 }, (_, j) => (
                      <Skeleton key={j} className="h-4 w-20" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-16" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return <div className={cn(className)}>{renderSkeleton()}</div>;
}

/**
 * 空狀態組件
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-gray-500 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/**
 * 錯誤狀態組件
 */
interface ErrorStateProps {
  title?: string;
  description?: string;
  error?: Error | string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = '載入失敗',
  description = '無法載入內容，請稍後再試',
  error,
  onRetry,
  className,
}: ErrorStateProps) {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <XCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-2">{description}</p>
      {errorMessage && (
        <p className="text-xs text-gray-400 mb-4 font-mono bg-gray-50 p-2 rounded">
          {errorMessage}
        </p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="gap-1">
          <RefreshCw className="h-4 w-4" />
          重新載入
        </Button>
      )}
    </div>
  );
}