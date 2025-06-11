import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * 將快速變化的值進行防抖處理，在指定的延遲時間後才更新輸出值
 * 常用於搜尋輸入框，避免每次輸入都觸發 API 請求
 * 
 * @param value - 需要防抖的值
 * @param delay - 防抖延遲時間（毫秒）
 * @returns 防抖後的值
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearchQuery = useDebounce(searchQuery, 500);
 * 
 * // 只有當用戶停止輸入 500ms 後，debouncedSearchQuery 才會更新
 * useEffect(() => {
 *   if (debouncedSearchQuery) {
 *     // 執行搜尋 API 請求
 *     searchProducts(debouncedSearchQuery);
 *   }
 * }, [debouncedSearchQuery]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  // 儲存防抖後的值
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 設定定時器，在 delay 時間後更新防抖值
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 清理函數：在 value 或 delay 變化時清除舊的定時器
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]); // 依賴於 value 和 delay

  return debouncedValue;
} 