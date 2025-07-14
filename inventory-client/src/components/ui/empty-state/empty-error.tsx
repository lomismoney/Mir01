"use client";

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { EmptyState } from './empty-state';
import { cn } from '@/lib/utils';

interface EmptyErrorProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  error?: Error | unknown;
  className?: string;
}

/**
 * 錯誤狀態空組件
 * 用於顯示載入錯誤或操作失敗的狀態
 */
export const EmptyError: React.FC<EmptyErrorProps> = ({
  title = '載入失敗',
  description = '發生錯誤，請稍後再試',
  onRetry,
  showDetails = false,
  error,
  className,
}) => {
  return (
    <div className={cn("py-12", className)}>
      <EmptyState
        icon={AlertCircle}
        title={title}
        description={description}
        action={
          onRetry
            ? {
                label: '重試',
                onClick: onRetry,
                variant: 'default',
              }
            : undefined
        }
      >
        {showDetails && error && (
          <details className="mt-4 text-left max-w-md">
            <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
              查看錯誤詳情
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
              {error instanceof Error ? error.message : JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </EmptyState>
    </div>
  );
};