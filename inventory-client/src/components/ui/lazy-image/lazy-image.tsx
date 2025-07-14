"use client";

import React, { useState, useEffect, useCallback, memo, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from './use-intersection-observer';
import type { LazyImageProps } from './types';
import { ImageIcon } from 'lucide-react';

/**
 * 圖片預載入和緩存管理器
 * 提供全局圖片載入狀態管理和緩存
 */
class ImagePreloadManager {
  private static cache = new Map<string, 'loading' | 'loaded' | 'error'>();
  private static preloadQueue = new Set<string>();
  private static loadPromises = new Map<string, Promise<void>>();

  /**
   * 檢查圖片是否已載入
   */
  static isLoaded(src: string): boolean {
    return this.cache.get(src) === 'loaded';
  }

  /**
   * 檢查圖片是否載入失敗
   */
  static isError(src: string): boolean {
    return this.cache.get(src) === 'error';
  }

  /**
   * 檢查圖片是否正在載入
   */
  static isLoading(src: string): boolean {
    return this.cache.get(src) === 'loading';
  }

  /**
   * 預載入圖片
   */
  static async preload(src: string): Promise<void> {
    if (!src || this.cache.has(src)) {
      return this.loadPromises.get(src) || Promise.resolve();
    }

    this.cache.set(src, 'loading');
    
    const promise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.cache.set(src, 'loaded');
        this.preloadQueue.delete(src);
        resolve();
      };
      
      img.onerror = () => {
        this.cache.set(src, 'error');
        this.preloadQueue.delete(src);
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });

    this.loadPromises.set(src, promise);
    return promise;
  }

  /**
   * 批量預載入圖片（限制並發數）
   */
  static async preloadBatch(sources: string[], concurrency = 3): Promise<void> {
    const chunks = [];
    for (let i = 0; i < sources.length; i += concurrency) {
      chunks.push(sources.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.allSettled(chunk.map(src => this.preload(src)));
    }
  }

  /**
   * 清理過期緩存
   */
  static cleanup(): void {
    // 保留最近使用的 100 張圖片的緩存
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      const toDelete = entries.slice(0, entries.length - 100);
      toDelete.forEach(([key]) => {
        this.cache.delete(key);
        this.loadPromises.delete(key);
      });
    }
  }

  /**
   * 獲取緩存統計
   */
  static getStats() {
    const loaded = Array.from(this.cache.values()).filter(status => status === 'loaded').length;
    const loading = Array.from(this.cache.values()).filter(status => status === 'loading').length;
    const errors = Array.from(this.cache.values()).filter(status => status === 'error').length;
    
    return {
      total: this.cache.size,
      loaded,
      loading,
      errors,
      hitRate: this.cache.size > 0 ? (loaded / this.cache.size * 100).toFixed(1) + '%' : '0%'
    };
  }
}

/**
 * 懶加載圖片組件 - 性能優化版
 * 
 * 特性：
 * 1. 使用 Intersection Observer API 實現懶加載
 * 2. 支援漸進式載入效果
 * 3. 內建載入狀態和錯誤處理
 * 4. 支援 WebP 格式回退
 * 5. 可配置的載入閾值和邊距
 * 6. 優雅的佔位符和載入動畫
 * 7. 全局圖片緩存和預載入
 * 8. React.memo 優化避免不必要重渲染
 */
const LazyImageComponent = ({
  src,
  alt,
  fallbackSrc = '/images/placeholder.png',
  className,
  containerClassName,
  width,
  height,
  sizes,
  priority = false,
  onLoad,
  onError,
  placeholder = 'shimmer',
  blurDataURL,
  objectFit = 'cover',
  threshold = 0,
  rootMargin = '50px',
}: LazyImageProps) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>(() => {
    // 初始化狀態時檢查緩存
    if (src) {
      if (ImagePreloadManager.isLoaded(src)) return 'loaded';
      if (ImagePreloadManager.isError(src)) return 'error';
      if (ImagePreloadManager.isLoading(src)) return 'loading';
    }
    return 'loading';
  });
  
  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    // 如果圖片已載入，直接設置 src
    return src && ImagePreloadManager.isLoaded(src) ? src : '';
  });
  
  const [isWebPSupported, setIsWebPSupported] = useState<boolean | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { targetRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
  });
  
  // 檢測 WebP 支援
  useEffect(() => {
    const checkWebPSupport = async () => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        setIsWebPSupported(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    };
    
    checkWebPSupport();
  }, []);
  
  // 根據尺寸選擇合適的圖片 - 記憶化以避免重複計算
  const getImageSrc = useMemo(() => {
    if (!src) return fallbackSrc;
    
    // 如果提供了不同尺寸的圖片
    if (sizes) {
      // 根據容器寬度選擇合適的圖片
      if (width && typeof width === 'number') {
        if (width <= 150 && sizes.thumbnail) return sizes.thumbnail;
        if (width <= 300 && sizes.small) return sizes.small;
        if (width <= 600 && sizes.medium) return sizes.medium;
        if (width <= 1200 && sizes.large) return sizes.large;
      }
      return sizes.original || src;
    }
    
    // 如果支援 WebP 且原圖不是 WebP，嘗試使用 WebP 版本
    if (isWebPSupported && !src.endsWith('.webp')) {
      const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      return webpSrc;
    }
    
    return src;
  }, [src, fallbackSrc, sizes, width, isWebPSupported]);

  // 預載入鄰近圖片
  const preloadNearbyImages = useCallback(async () => {
    if (!sizes) return;
    
    const imagesToPreload = [
      sizes.thumbnail,
      sizes.small,
      sizes.medium
    ].filter(Boolean);
    
    if (imagesToPreload.length > 0) {
      ImagePreloadManager.preloadBatch(imagesToPreload, 2);
    }
  }, [sizes]);
  
  // 載入圖片 - 使用新的緩存管理器
  useEffect(() => {
    if (!hasIntersected && !priority) return;
    
    const imageSrc = getImageSrc;
    if (!imageSrc || imageSrc === currentSrc) return;

    // 檢查緩存狀態
    if (ImagePreloadManager.isLoaded(imageSrc)) {
      setCurrentSrc(imageSrc);
      setImageState('loaded');
      onLoad?.();
      return;
    }

    if (ImagePreloadManager.isError(imageSrc)) {
      setImageState('error');
      onError?.();
      return;
    }

    // 設置載入超時
    loadingTimeoutRef.current = setTimeout(() => {
      setImageState('error');
      onError?.();
    }, 10000); // 10秒超時

    let isMounted = true;
    
    // 使用緩存管理器載入圖片
    ImagePreloadManager.preload(imageSrc)
      .then(() => {
        if (isMounted) {
          setCurrentSrc(imageSrc);
          setImageState('loaded');
          onLoad?.();
          preloadNearbyImages(); // 載入成功後預載入相關圖片
        }
      })
      .catch(() => {
        if (isMounted) {
          // 如果主圖片載入失敗，嘗試載入備用圖片
          if (imageSrc !== fallbackSrc) {
            ImagePreloadManager.preload(fallbackSrc)
              .then(() => {
                if (isMounted) {
                  setCurrentSrc(fallbackSrc);
                  setImageState('loaded');
                }
              })
              .catch(() => {
                if (isMounted) {
                  setImageState('error');
                  onError?.();
                }
              });
          } else {
            setImageState('error');
            onError?.();
          }
        }
      })
      .finally(() => {
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
      });
    
    return () => {
      isMounted = false;
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, [hasIntersected, priority, getImageSrc, currentSrc, fallbackSrc, onLoad, onError, preloadNearbyImages]);
  
  // 記憶化佔位符渲染
  const renderPlaceholder = useMemo(() => {
    if (placeholder === 'blur' && blurDataURL) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blurDataURL}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full',
            objectFit === 'contain' && 'object-contain',
            objectFit === 'cover' && 'object-cover',
            objectFit === 'fill' && 'object-fill',
            objectFit === 'none' && 'object-none',
            objectFit === 'scale-down' && 'object-scale-down'
          )}
          aria-hidden="true"
        />
      );
    }
    
    if (placeholder === 'shimmer') {
      return (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-muted/50 via-muted to-muted/50 bg-[length:200%_100%] bg-[position:-100%_0]" />
      );
    }
    
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-muted">
        <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
      </div>
    );
  }, [placeholder, blurDataURL, objectFit]);

  // 記憶化樣式計算
  const containerStyle = useMemo(() => ({
    width: width || '100%',
    height: height || 'auto',
    aspectRatio: width && height ? `${width} / ${height}` : undefined,
  }), [width, height]);

  const imageClassName = useMemo(() => cn(
    'transition-opacity duration-300',
    imageState === 'loaded' ? 'opacity-100' : 'opacity-0',
    objectFit === 'contain' && 'object-contain',
    objectFit === 'cover' && 'object-cover',
    objectFit === 'fill' && 'object-fill',
    objectFit === 'none' && 'object-none',
    objectFit === 'scale-down' && 'object-scale-down',
    className
  ), [imageState, objectFit, className]);
  
  return (
    <div
      ref={targetRef}
      className={cn(
        'relative overflow-hidden bg-muted',
        containerClassName
      )}
      style={containerStyle}
    >
      {/* 佔位符 */}
      {imageState === 'loading' && renderPlaceholder}
      
      {/* 錯誤狀態 */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
          <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">載入失敗</p>
        </div>
      )}
      
      {/* 實際圖片 */}
      {currentSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentSrc}
          alt={alt}
          className={imageClassName}
          style={{
            width: '100%',
            height: '100%',
          }}
        />
      )}
    </div>
  );
};

// 使用 React.memo 包裝組件，進行淺層比較優化
export const LazyImage = memo(LazyImageComponent);

// 導出管理器供外部使用
export { ImagePreloadManager };

// 定期清理緩存
if (typeof window !== 'undefined') {
  setInterval(() => {
    ImagePreloadManager.cleanup();
  }, 5 * 60 * 1000); // 每5分鐘清理一次
}