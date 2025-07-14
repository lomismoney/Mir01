import { useEffect, useRef, useState } from 'react';
import type { IntersectionObserverOptions } from './types';

/**
 * 使用 Intersection Observer API 的自定義 Hook
 * 用於檢測元素是否進入視窗
 */
export function useIntersectionObserver(
  options: IntersectionObserverOptions = {}
) {
  const {
    threshold = 0,
    rootMargin = '50px',
    root = null,
  } = options;
  
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const target = targetRef.current;
    
    if (!target) return;
    
    // 如果不支援 Intersection Observer，立即載入
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      setHasIntersected(true);
      return;
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const intersecting = entry.isIntersecting;
          setIsIntersecting(intersecting);
          
          // 一旦元素進入視窗，記錄已經相交過
          if (intersecting) {
            setHasIntersected(true);
          }
        });
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );
    
    observer.observe(target);
    
    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, root]);
  
  return {
    targetRef,
    isIntersecting,
    hasIntersected,
  };
}