import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  submessage?: string;
}

/**
 * 載入覆蓋層組件
 * 在執行異步操作時提供視覺反饋
 */
export function LoadingOverlay({ isLoading, message, submessage }: LoadingOverlayProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg shadow-lg text-center max-w-sm">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        {message && (
          <p className="text-lg font-medium mb-2">{message}</p>
        )}
        {submessage && (
          <p className="text-sm text-muted-foreground">{submessage}</p>
        )}
      </div>
    </div>
  );
}