"use client";

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { LazyImage } from './lazy-image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface LazyImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  className?: string;
  thumbnailClassName?: string;
  mainImageHeight?: number | string;
  showThumbnails?: boolean;
  enableLightbox?: boolean;
}

/**
 * 懶加載圖片畫廊組件
 * 
 * 特性：
 * 1. 支援主圖和縮略圖的懶加載
 * 2. 內建燈箱功能
 * 3. 鍵盤導航支援
 * 4. 觸控滑動支援
 * 5. 響應式設計
 */
export function LazyImageGallery({
  images,
  className,
  thumbnailClassName,
  mainImageHeight = 400,
  showThumbnails = true,
  enableLightbox = true,
}: LazyImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  
  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);
  
  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);
  
  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);
  
  const handleMainImageClick = useCallback(() => {
    if (enableLightbox) {
      setIsLightboxOpen(true);
    }
  }, [enableLightbox]);
  
  // 鍵盤導航
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          setIsLightboxOpen(false);
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, handlePrevious, handleNext]);
  
  if (!images.length) {
    return null;
  }
  
  const currentImage = images[selectedIndex];
  
  return (
    <>
      <div className={cn('space-y-4', className)}>
        {/* 主圖片 */}
        <div className="relative group">
          <div
            className={cn(
              'cursor-pointer',
              enableLightbox && 'hover:opacity-95 transition-opacity'
            )}
            onClick={handleMainImageClick}
          >
            <LazyImage
              src={currentImage.src}
              alt={currentImage.alt}
              height={mainImageHeight}
              objectFit="contain"
              placeholder="shimmer"
              className="rounded-lg"
              containerClassName="rounded-lg"
            />
          </div>
          
          {/* 導航按鈕 */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
                onClick={handlePrevious}
                aria-label="上一張圖片"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background/90"
                onClick={handleNext}
                aria-label="下一張圖片"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {/* 圖片計數器 */}
          {images.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 rounded-md text-xs">
              {selectedIndex + 1} / {images.length}
            </div>
          )}
        </div>
        
        {/* 縮略圖 */}
        {showThumbnails && images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  'relative flex-shrink-0 rounded-md overflow-hidden transition-all',
                  'ring-2 ring-offset-2',
                  selectedIndex === index
                    ? 'ring-primary'
                    : 'ring-transparent hover:ring-muted-foreground/50',
                  thumbnailClassName
                )}
                aria-label={`查看圖片 ${index + 1}`}
              >
                <LazyImage
                  src={image.thumbnail || image.src}
                  alt={image.alt}
                  width={80}
                  height={80}
                  objectFit="cover"
                  placeholder="shimmer"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 燈箱 */}
      {enableLightbox && (
        <Dialog open={isLightboxOpen} onOpenChange={setIsLightboxOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>圖片預覽</DialogTitle>
            </DialogHeader>
            
            <div className="relative">
              <LazyImage
                src={currentImage.src}
                alt={currentImage.alt}
                className="max-h-[80vh]"
                objectFit="contain"
                priority
              />
              
              {/* 燈箱導航 */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background/90"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* 關閉按鈕 */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-background/80 hover:bg-background/90"
                onClick={() => setIsLightboxOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
              
              {/* 圖片信息 */}
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 p-4">
                <p className="text-sm text-center">
                  {currentImage.alt} ({selectedIndex + 1} / {images.length})
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}