"use client";

import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageIcon, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ImageSelectionData } from "@/hooks/useImageSelection";

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
  acceptedFormats = ["image/jpeg", "image/png", "image/webp"],
  disabled = false,
  className,
}: ImageSelectorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * 處理文件輸入變更
   */
  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      onSelectImage(file);
    }
    // 清空 input 值，允許重複選擇同一文件
    event.target.value = "";
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
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("space-y-4", className)} data-oid="zyx6jqh">
      {!imageData.file && !imageData.preview ? (
        // 圖片選擇區域
        <div
          className="flex items-center justify-center w-full"
          data-oid="4ahgb-i"
        >
          <label
            htmlFor="dropzone-file"
            className={cn(
              "flex flex-col items-center justify-center w-full h-64 border-2 border-border/60 border-dashed rounded-lg cursor-pointer",
              "bg-muted/40 hover:bg-muted/80 dark:hover:bg-muted/30 transition-colors",
              "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
              disabled && "opacity-50 cursor-not-allowed hover:bg-muted/40",
            )}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            data-oid="5q2uf:."
          >
            <div
              className="flex flex-col items-center justify-center pt-5 pb-6"
              data-oid="gk-mjbe"
            >
              <svg
                className="w-8 h-8 mb-4 text-muted-foreground"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
                data-oid="5hzdgu0"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  data-oid="41opuav"
                />
              </svg>
              <p
                className="mb-2 text-sm text-muted-foreground"
                data-oid="nnayvyu"
              >
                <span className="font-semibold" data-oid="fdzxb.l">
                  點擊上傳
                </span>{" "}
                或拖曳檔案至此
              </p>
              <p className="text-xs text-muted-foreground" data-oid="q4wr:7-">
                {acceptedFormats
                  .map((format) => format.split("/")[1].toUpperCase())
                  .join("、")}
                (最大 {formatFileSize(maxFileSize)})
              </p>
            </div>
            <input
              id="dropzone-file"
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={acceptedFormats.join(",")}
              onChange={handleFileInputChange}
              disabled={disabled}
              data-oid="uxhzag0"
            />
          </label>
        </div>
      ) : (
        // 圖片預覽區域
        <div className="relative" data-oid="qpmwf4u">
          <div
            className="relative w-full max-w-sm h-48 mx-auto overflow-hidden rounded-lg border border-border bg-muted/30"
            data-oid="4_hoey1"
          >
            <img
              src={imageData.preview!}
              alt="商品圖片預覽"
              className="w-full h-full object-contain p-2"
              data-oid="n.ktdeo"
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
              data-oid="nsp:2t0"
            >
              <X className="h-4 w-4" data-oid="uli_6.j" />
            </Button>
          </div>

          {/* 圖片信息 - 只在有檔案時顯示 */}
          {imageData.file && (
            <div
              className="mt-2 text-xs text-muted-foreground space-y-1"
              data-oid="s5jtnq2"
            >
              <p data-oid=":0-vym-">檔案名稱：{imageData.file.name}</p>
              <p data-oid="8v4xnuy">
                檔案大小：{formatFileSize(imageData.file.size)}
              </p>
              <p data-oid="-xzz0uk">檔案格式：{imageData.file.type}</p>
            </div>
          )}
        </div>
      )}

      {/* 錯誤提示 */}
      {!imageData.isValid && imageData.validationError && (
        <Alert variant="destructive" data-oid="-vh1cz-">
          <AlertCircle className="h-4 w-4" data-oid="pot0ffr" />
          <AlertDescription data-oid="gqr-7kv">
            {imageData.validationError}
          </AlertDescription>
        </Alert>
      )}

      {/* 隱藏的檔案輸入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        data-oid="up0tt6z"
      />
    </div>
  );
}
