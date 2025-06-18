'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImageIcon, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ImageSelectionData } from '@/hooks/useImageSelection';

/**
 * ImageSelector 組件 Props
 */
interface ImageSelectorProps {
  /** 圖片選擇數據 */
  imageData: ImageSelectionData;
  
  /** 選擇圖片回調 */
  onSelectImage: (file: File) => void;
  
  /** 清除圖片回調 */
  onClearImage: () => void;
  
  /** 最大文件大小（字節） */
  maxFileSize?: number;
  
  /** 支援的文件格式 */
  acceptedFormats?: string[];
  
  /** 是否禁用 */
  disabled?: boolean;
  
  /** 自定義類名 */
  className?: string;
}

/**
 * 圖片選擇器組件
 * 
 * 專門用於本地圖片選擇和預覽，遵循「本地暫存，鏈式提交」的原子化創建流程理念。
 * 
 * 功能特色：
 * - 支援拖拽上傳和點擊上傳
 * - 本地圖片預覽
 * - 文件格式和大小驗證提示
 * - 優雅的錯誤處理
 * - 響應式設計
 * - 完整的鍵盤導航支援
 * - 無上傳邏輯，純本地操作
 * 
 * @param props - 組件屬性
 */
export function ImageSelector({
  imageData,
  onSelectImage,
  onClearImage,
  maxFileSize = 5 * 1024 * 1024, // 5MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  disabled = false,
  className,
}: ImageSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /**
   * 處理文件輸入變更
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelectImage(file);
    }
    // 清空 input 值，允許重複選擇同一文件
    event.target.value = '';
  };
  
  /**
   * 處理拖拽事件
   */
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      onSelectImage(files[0]);
    }
  };
  
  /**
   * 觸發文件選擇對話框
   */
  const handleClickUpload = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  /**
   * 格式化文件大小顯示
   */
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {!imageData.file ? (
        // 圖片選擇區域
        <div
          className={cn(
            'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center transition-colors cursor-pointer',
            'hover:border-gray-400 hover:bg-gray-50',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            disabled && 'opacity-50 cursor-not-allowed hover:border-gray-300 hover:bg-transparent'
          )}
          onClick={handleClickUpload}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          tabIndex={disabled ? -1 : 0}
          role="button"
          aria-label="選擇圖片"
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              handleClickUpload();
            }
          }}
        >
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            點擊選擇圖片或拖拽圖片到此處
          </p>
          <p className="text-xs text-gray-500 mt-1">
            支援 {acceptedFormats.map(format => format.split('/')[1].toUpperCase()).join('、')} 格式，
            最大 {formatFileSize(maxFileSize)}
          </p>
        </div>
      ) : (
        // 圖片預覽區域
        <div className="relative">
          <div className="relative overflow-hidden rounded-lg border border-gray-200">
            <img
              src={imageData.preview!}
              alt="商品圖片預覽"
              className="w-full h-48 object-cover"
            />
            {/* 清除按鈕 */}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={onClearImage}
              disabled={disabled}
              aria-label="清除圖片"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 圖片信息 */}
          <div className="mt-2 text-xs text-gray-500 space-y-1">
            <p>檔案名稱：{imageData.file.name}</p>
            <p>檔案大小：{formatFileSize(imageData.file.size)}</p>
            <p>檔案格式：{imageData.file.type}</p>
          </div>
        </div>
      )}
      
      {/* 錯誤提示 */}
      {!imageData.isValid && imageData.validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {imageData.validationError}
          </AlertDescription>
        </Alert>
      )}
      
      {/* 隱藏的檔案輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
} 