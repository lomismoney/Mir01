import { format as dateFormat } from "date-fns";
import { zhTW } from "date-fns/locale";

/**
 * 安全的日期格式化函數
 * 處理 null、undefined 或無效日期值
 * 
 * @param date - 要格式化的日期字符串、Date對象或null/undefined
 * @param formatString - 日期格式字符串
 * @param options - 格式化選項
 * @param fallback - 當日期無效時的備用文字
 * @returns 格式化後的日期字符串或備用文字
 */
export function safeFormatDate(
  date: string | Date | null | undefined,
  formatString: string,
  options: { locale?: any } = { locale: zhTW },
  fallback: string = "未設定"
): string {
  if (!date) {
    return fallback;
  }

  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // 檢查日期是否有效
    if (isNaN(dateObj.getTime())) {
      return fallback;
    }

    return dateFormat(dateObj, formatString, options);
  } catch (error) {
    console.warn("日期格式化失敗:", error, "原始值:", date);
    return fallback;
  }
}

/**
 * 常用的日期格式化預設
 */
export const DateFormats = {
  /** 完整日期時間：2023/12/01 14:30 */
  FULL_DATETIME: "yyyy/MM/dd HH:mm",
  
  /** 簡短日期時間：12/01 14:30 */
  SHORT_DATETIME: "MM/dd HH:mm",
  
  /** 年月日：2023/12/01 */
  DATE_ONLY: "yyyy/MM/dd",
  
  /** 月日：12/01 */
  MONTH_DAY: "MM/dd",
  
  /** 中文完整日期：2023 年 12 月 01 日 */
  CHINESE_DATE: "yyyy 年 MM 月 dd 日",
  
  /** 星期：星期五 */
  WEEKDAY: "EEEE",
  
  /** 中文日期 + 星期：2023 年 12 月 01 日 (星期五) */
  CHINESE_DATE_WITH_WEEKDAY: "yyyy 年 MM 月 dd 日 (EEEE)",
  
  /** 時間：14:30 */
  TIME_ONLY: "HH:mm",
} as const;

/**
 * 快捷格式化函數
 */
export const formatDate = {
  /** 格式化為完整日期時間 */
  fullDateTime: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.FULL_DATETIME, { locale: zhTW }, fallback),
  
  /** 格式化為簡短日期時間 */
  shortDateTime: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.SHORT_DATETIME, { locale: zhTW }, fallback),
  
  /** 格式化為年月日 */
  dateOnly: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.DATE_ONLY, { locale: zhTW }, fallback),
  
  /** 格式化為月日 */
  monthDay: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.MONTH_DAY, { locale: zhTW }, fallback),
  
  /** 格式化為中文日期 */
  chineseDate: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.CHINESE_DATE, { locale: zhTW }, fallback),
  
  /** 格式化為星期 */
  weekday: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.WEEKDAY, { locale: zhTW }, fallback),
  
  /** 格式化為中文日期 + 星期 */
  chineseDateWithWeekday: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.CHINESE_DATE_WITH_WEEKDAY, { locale: zhTW }, fallback),
  
  /** 格式化為時間 */
  timeOnly: (date: string | Date | null | undefined, fallback?: string) =>
    safeFormatDate(date, DateFormats.TIME_ONLY, { locale: zhTW }, fallback),
};

/**
 * 檢查日期是否有效
 */
export function isValidDate(date: string | Date | null | undefined): boolean {
  if (!date) return false;
  
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return !isNaN(dateObj.getTime());
  } catch {
    return false;
  }
}

/**
 * 計算兩個日期之間的差異（天數）
 */
export function daysBetween(
  date1: string | Date | null | undefined,
  date2: string | Date | null | undefined
): number | null {
  if (!isValidDate(date1) || !isValidDate(date2)) {
    return null;
  }
  
  try {
    const d1 = date1 instanceof Date ? date1 : new Date(date1!);
    const d2 = date2 instanceof Date ? date2 : new Date(date2!);
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch {
    return null;
  }
} 