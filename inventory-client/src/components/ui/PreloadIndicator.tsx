import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PreloadIndicatorProps {
  isPreloading: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

/**
 * 預加載指示器組件
 * 
 * 顯示預加載狀態的視覺反饋
 */
export function PreloadIndicator({
  isPreloading,
  className,
  size = 'sm',
  label = '預加載中',
}: PreloadIndicatorProps) {
  if (!isPreloading) return null;

  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className={cn('animate-spin', sizeClasses[size])} />
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

/**
 * 全局預加載提示
 * 
 * 在頁面角落顯示預加載狀態
 */
export function GlobalPreloadIndicator({ isActive }: { isActive: boolean }) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-background/80 backdrop-blur-sm border rounded-lg px-3 py-2 shadow-lg">
        <PreloadIndicator isPreloading={true} size="sm" label="正在預加載資源..." />
      </div>
    </div>
  );
}