import { clsx, type ClassValue } from "clsx"
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
