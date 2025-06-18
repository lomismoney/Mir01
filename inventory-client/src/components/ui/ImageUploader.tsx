'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Upload, 
  ImageIcon, 
  X, 
  Loader2, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * 圖片 URL 結構類型
 * 與後端 API 契約保持一致
 */
interface ImageUrls {
  original?: string;
  thumb?: string;
  medium?: string;
  large?: string;
}

/**
 * ImageUploader 組件 Props
 */
interface ImageUploaderProps {
  /** 當前圖片 URL（編輯模式時顯示） */
  currentImageUrl?: string | null;
  
  /** 上傳函數 - 處理實際的 API 上傳邏輯 */
  onUpload: (file: File) => Promise<void>;
  
  /** 上傳成功回調 - 傳出新的圖片 URLs */
  onUploadSuccess?: (imageUrls: ImageUrls) => void;
  
  /** 是否禁用組件 */
  disabled?: boolean;
  
  /** 自定義類名 */
  className?: string;
  
  /** 標籤文字 */
  label?: string;
  
  /** 輔助說明文字 */
  helperText?: string;
}

/**
 * 圖片上傳組件
 * 
 * 功能特色：
 * - 支援拖拽上傳和點擊上傳
 * - 本地圖片預覽
 * - 上傳進度和狀態管理
 * - 文件格式和大小驗證
 * - 優雅的錯誤處理
 * - 響應式設計
 * - 完整的鍵盤導航支援
 */
export function ImageUploader({
  currentImageUrl,
  onUpload,
  onUploadSuccess,
  disabled = false,
  className,
  label = '商品圖片',
  helperText = '支援 JPEG、PNG、GIF、WebP 格式，最大 10MB'
}: ImageUploaderProps) {
  // 狀態管理
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  /**
   * 清理預覽 URL 以避免記憶體洩漏
   */
  const cleanupPreviewUrl = useCallback(() => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);
  
  /**
   * 文件格式和大小驗證
   */
  const validateFile = (file: File): string | null => {
    // 檢查文件類型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return '不支援的文件格式。請選擇 JPEG、PNG、GIF 或 WebP 格式的圖片。';
    }
    
    // 檢查文件大小（10MB）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return '文件太大。圖片大小不能超過 10MB。';
    }
    
    return null;
  };
  
  /**
   * 處理文件選擇
   */
  const handleFileSelect = useCallback((file: File) => {
    // 驗證文件
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      toast.error(validationError);
      return;
    }
    
    // 清理之前的預覽
    cleanupPreviewUrl();
    
    // 設置新文件和預覽
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
  }, [cleanupPreviewUrl]);
  
  /**
   * 處理文件輸入變更
   */
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };
  
  /**
   * 處理拖拽事件
   */
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };
  
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };
  
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
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
   * 處理圖片上傳
   */
  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      await onUpload(selectedFile);
      
      // 上傳成功
      toast.success('圖片上傳成功！正在處理中...');
      
      // 如果有成功回調，調用它（注意：實際的 image_urls 需要在父組件中處理）
      if (onUploadSuccess) {
        // 這裡只是示例，實際的 imageUrls 應該從 API 響應中獲取
        onUploadSuccess({
          original: previewUrl || undefined,
          thumb: previewUrl || undefined,
          medium: previewUrl || undefined,
          large: previewUrl || undefined,
        });
      }
      
    } catch (error: any) {
      const errorMessage = error?.message || '圖片上傳失敗，請重試。';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };
  
  /**
   * 清除選擇的文件
   */
  const handleClearFile = () => {
    cleanupPreviewUrl();
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    
    // 重置文件輸入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 組件卸載時清理預覽 URL
  React.useEffect(() => {
    return () => {
      cleanupPreviewUrl();
    };
  }, [cleanupPreviewUrl]);
  
  // 確定要顯示的圖片 URL（優先順序：預覽 > 當前圖片）
  const displayImageUrl = previewUrl || currentImageUrl;
  
  return (
    <div className={cn('space-y-3', className)}>
      {/* 標籤 */}
      {label && (
        <Label className="text-sm font-medium">
          {label}
        </Label>
      )}
      
      {/* 主要上傳區域 */}
      <Card className={cn(
        'transition-colors duration-200',
        isDragOver && !disabled && 'border-primary bg-primary/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}>
        <CardContent className="p-6">
          {/* 圖片顯示區域 */}
          {displayImageUrl && (
            <div className="mb-4 relative">
              <div className="relative aspect-video w-full max-w-md mx-auto rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={displayImageUrl}
                  alt="商品圖片預覽"
                  className="w-full h-full object-contain"
                  onError={() => {
                    // 圖片載入失敗時的處理
                    if (previewUrl) {
                      handleClearFile();
                    }
                  }}
                />
                
                {/* 移除按鈕 */}
                {selectedFile && !disabled && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={handleClearFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          )}
          
          {/* 拖拽上傳區域 */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200',
              isDragOver && !disabled && 'border-primary bg-primary/5',
              disabled ? 'border-gray-200 cursor-not-allowed' : 'border-gray-300 cursor-pointer hover:border-gray-400',
              !displayImageUrl && 'min-h-[200px] flex items-center justify-center'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClickUpload}
            role="button"
            tabIndex={disabled ? -1 : 0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClickUpload();
              }
            }}
          >
            <div className="space-y-4">
              {/* 圖標和主要文字 */}
              <div className="flex flex-col items-center space-y-2">
                {isUploading ? (
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                ) : (
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                    {displayImageUrl ? (
                      <CheckCircle className="h-6 w-6 text-primary" />
                    ) : (
                      <Upload className="h-6 w-6 text-primary" />
                    )}
                  </div>
                )}
                
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {isUploading ? '上傳中...' : 
                     displayImageUrl ? '點擊更換圖片' : '點擊上傳圖片'}
                  </p>
                  <p className="text-sm text-gray-500">
                    或拖拽圖片文件到此區域
                  </p>
                </div>
              </div>
              
              {/* 輔助文字 */}
              {helperText && (
                <p className="text-xs text-gray-400">
                  {helperText}
                </p>
              )}
            </div>
          </div>
          
          {/* 隱藏的文件輸入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          {/* 上傳按鈕 */}
          {selectedFile && !disabled && (
            <div className="mt-4 flex justify-center">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="min-w-[120px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    上傳中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    確認上傳
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* 錯誤提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
} 