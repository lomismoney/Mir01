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

/**
 * 🎯 訂單狀態中文翻譯函數
 * 提供統一的狀態翻譯，確保整個系統的一致性
 */
export function getOrderStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    // 付款狀態
    'pending': '待付款',
    'paid': '已付款',
    'partial': '部分付款',
    'refunded': '已退款',
    // 出貨狀態
    'processing': '處理中',
    'shipped': '已出貨',
    'delivered': '已送達',
    'cancelled': '已取消',
    'completed': '已完成',
    // 項目狀態（用於訂單品項）
    '待處理': '待處理',
    '已叫貨': '已叫貨',
    '已出貨': '已出貨',
    '完成': '完成'
  };
  
  return statusMap[status] || status;
}

/**
 * 🎯 訂單狀態樣式函數
 * 根據狀態返回對應的 Badge variant
 */
export function getOrderStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'completed':
    case 'paid':
    case 'shipped':
    case 'delivered':
      return 'default';
    case 'cancelled':
    case 'refunded':
      return 'destructive';
    case 'processing':
    case 'partial':
      return 'secondary';
    case 'pending':
    default:
      return 'outline';
  }
}

/**
 * 格式化價格顯示
 * 
 * @param price - 價格金額（元為單位）
 * @returns 格式化的價格字串
 * 
 * @example
 * formatPrice(1000) // "NT$1,000"
 * formatPrice(null) // "N/A"
 */
export function formatPrice(price?: number | null): string {
  if (price === undefined || price === null) {
    return 'N/A';
  }

  const formatter = new Intl.NumberFormat('zh-TW', { 
    style: 'currency', 
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return formatter.format(price);
}

/**
 * 格式化貨幣顯示（別名）
 * 
 * @param amount - 金額數值
 * @returns 格式化的貨幣字串
 */
export const formatCurrency = formatPrice;

