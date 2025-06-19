import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * 用於延遲處理值的變化，常用於搜尋輸入框等場景，
 * 避免在使用者快速輸入時頻繁觸發 API 請求
 * 
 * @param value - 需要 debounce 的值
 * @param delay - 延遲時間（毫秒）
 * @returns 延遲後的值
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
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 在延遲時間後更新 debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 如果 value 或 delay 發生變化，則清除上一個 timeout
    // 這可以防止在延遲時間內 value 改變時，還觸發舊的 debounced value 更新
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
} 