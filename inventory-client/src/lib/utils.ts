import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化日期為本地字串
 * @param date 日期字串或日期物件
 * @param options 格式化選項
 * @returns 格式化後的日期字串
 */
export function formatDate(
  date?: string | Date | null,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }
): string {
  if (!date) return "N/A";
  
  const d = typeof date === "string" ? new Date(date) : date;
  
  return d instanceof Date && !isNaN(d.getTime())
    ? new Intl.DateTimeFormat("zh-TW", options).format(d)
    : "N/A";
}

/**
 * 為圖片 URL 添加緩存破壞參數
 * 
 * 用於解決瀏覽器圖片緩存問題，確保新上傳或更新的圖片能立即顯示
 * 
 * @param imageUrl - 原始圖片 URL
 * @param timestamp - 時間戳（可選），如果不提供則使用當前時間
 * @returns 帶有緩存破壞參數的圖片 URL
 * 
 * @example
 * ```tsx
 * const imageUrl = "https://example.com/image.jpg";
 * const cacheBustingUrl = addImageCacheBuster(imageUrl, product.updated_at);
 * // 結果: "https://example.com/image.jpg?t=1640995200000"
 * ```
 */
export function addImageCacheBuster(
  imageUrl: string | null | undefined,
  timestamp?: string | number | Date
): string | null {
  if (!imageUrl) {
    return null;
  }

  // 處理時間戳
  let timestampValue: number;
  if (timestamp) {
    if (typeof timestamp === 'string') {
      timestampValue = new Date(timestamp).getTime();
    } else if (timestamp instanceof Date) {
      timestampValue = timestamp.getTime();
    } else {
      timestampValue = timestamp;
    }
  } else {
    timestampValue = Date.now();
  }

  // 檢查 URL 是否已經有查詢參數
  const separator = imageUrl.includes('?') ? '&' : '?';
  
  return `${imageUrl}${separator}t=${timestampValue}`;
}
