import { useState, useEffect } from 'react';

/**
 * useDebounce Hook - 防抖處理鉤子
 * 
 * @description
 * 用於延遲處理快速變化的值，常用於搜尋輸入框的優化。
 * 避免用戶在快速輸入時對後端 API 造成過度請求。
 * 
 * @template T - 值的類型
 * @param value - 需要防抖處理的值
 * @param delay - 延遲時間（毫秒）
 * @returns 防抖處理後的值
 * 
 * @example
 * ```tsx
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedSearchQuery = useDebounce(searchQuery, 500);
 * 
 * // 只有當用戶停止輸入 500ms 後，debouncedSearchQuery 才會更新
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
} 