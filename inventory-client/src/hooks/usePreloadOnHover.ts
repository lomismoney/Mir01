import React, { useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPreloader } from '@/lib/apiPreloader';

interface PreloadOptions {
  delay?: number; // 延遲預加載（毫秒）
  force?: boolean; // 強制預加載
  onPreloadStart?: () => void;
  onPreloadEnd?: () => void;
}

/**
 * 鼠標懸停預加載 Hook
 * 
 * 為任何元素提供懸停預加載功能
 */
export function usePreloadOnHover(
  route: string,
  options: PreloadOptions = {}
) {
  const { delay = 200, force = false, onPreloadStart, onPreloadEnd } = options;
  const queryClient = useQueryClient();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPreloadingRef = useRef(false);

  const handleMouseEnter = useCallback(() => {
    // 避免重複預加載
    if (isPreloadingRef.current) return;

    timeoutRef.current = setTimeout(async () => {
      isPreloadingRef.current = true;
      onPreloadStart?.();
      
      try {
        await apiPreloader.preloadRoute(route, queryClient, { force });
      } finally {
        isPreloadingRef.current = false;
        onPreloadEnd?.();
      }
    }, delay);
  }, [route, queryClient, delay, force, onPreloadStart, onPreloadEnd]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // 清理函數
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isPreloadingRef.current = false;
  }, []);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    cleanup,
  };
}

// PreloadButton 組件已移動到 components/ui/preload-button.tsx