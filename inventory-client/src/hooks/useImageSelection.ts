'use client';

import { useState, useCallback } from 'react';

/**
 * 圖片選擇數據結構
 */
export interface ImageSelectionData {
  file: File | null;
  preview: string | null; // Base64 預覽 URL
  isValid: boolean;
  validationError?: string;
}

/**
 * 圖片文件驗證函數
 * 
 * @param file - 要驗證的圖片文件
 * @returns 驗證結果
 */
const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  if (file.size > maxSize) {
    return { isValid: false, error: '圖片大小不能超過 5MB' };
  }
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '僅支援 JPEG、PNG、WebP 格式' };
  }
  
  return { isValid: true };
};

/**
 * 提取圖片元數據
 * 
 * @param file - 圖片文件
 * @returns 圖片元數據
 */
const extractImageMetadata = (file: File) => {
  return new Promise<{
    originalSize: number;
    dimensions: { width: number; height: number };
    format: string;
  }>((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        originalSize: file.size,
        dimensions: { width: img.width, height: img.height },
        format: file.type,
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

/**
 * 圖片選擇 Hook
 * 
 * 專門用於本地圖片選擇和預覽，不包含上傳邏輯。
 * 遵循「本地暫存，鏈式提交」的原子化創建流程理念。
 * 
 * 功能特色：
 * - 本地圖片選擇和預覽
 * - 圖片格式和大小驗證
 * - 自動生成預覽 URL
 * - 記憶體管理（自動清理 blob URL）
 * - 圖片元數據提取
 * 
 * @returns 圖片選擇相關的狀態和方法
 */
export function useImageSelection() {
  const [imageData, setImageData] = useState<ImageSelectionData>({
    file: null,
    preview: null,
    isValid: true,
  });

  /**
   * 選擇圖片
   * 
   * @param file - 選中的圖片文件
   */
  const selectImage = useCallback(async (file: File) => {
    // 驗證圖片
    const validation = validateImageFile(file);
    
    if (validation.isValid) {
      // 清理舊的預覽 URL
      if (imageData.preview) {
        URL.revokeObjectURL(imageData.preview);
      }
      
      // 創建新的預覽 URL
      const previewUrl = URL.createObjectURL(file);
      
      setImageData({
        file,
        preview: previewUrl,
        isValid: true,
      });
    } else {
      // 驗證失敗，清理狀態
      if (imageData.preview) {
        URL.revokeObjectURL(imageData.preview);
      }
      
      setImageData({
        file: null,
        preview: null,
        isValid: false,
        validationError: validation.error,
      });
    }
  }, [imageData.preview]);

  /**
   * 清除圖片選擇
   */
  const clearImage = useCallback(() => {
    // 清理預覽 URL
    if (imageData.preview) {
      URL.revokeObjectURL(imageData.preview);
    }
    
    setImageData({
      file: null,
      preview: null,
      isValid: true,
    });
  }, [imageData.preview]);

  /**
   * 獲取圖片元數據
   * 
   * @returns 圖片元數據（如果有選中的圖片）
   */
  const getImageMetadata = useCallback(async () => {
    if (!imageData.file) return null;
    
    try {
      return await extractImageMetadata(imageData.file);
    } catch (error) {
      console.error('獲取圖片元數據失敗:', error);
      return null;
    }
  }, [imageData.file]);

  return {
    imageData,
    selectImage,
    clearImage,
    getImageMetadata,
  };
} 