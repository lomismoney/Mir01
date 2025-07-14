import { useEffect, useState } from "react";

/**
 * 媒體查詢 Hook
 * 用於響應式設計，檢測當前設備是否匹配指定的媒體查詢
 * 
 * @param query - CSS 媒體查詢字符串
 * @returns 是否匹配媒體查詢
 * 
 * @example
 * const isMobile = useMediaQuery("(max-width: 640px)");
 * const isTablet = useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
 * const isDesktop = useMediaQuery("(min-width: 1025px)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // 創建媒體查詢對象
    const media = window.matchMedia(query);
    
    // 設置初始值
    setMatches(media.matches);

    // 定義事件處理函數
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // 添加事件監聽器
    // 使用 addEventListener 以支持所有瀏覽器
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // 向後兼容舊版瀏覽器
      media.addListener(listener);
    }

    // 清理函數
    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        // 向後兼容舊版瀏覽器
        media.removeListener(listener);
      }
    };
  }, [query]);

  return matches;
}

/**
 * 預定義的媒體查詢 Hooks
 */
export function useIsMobile() {
  return useMediaQuery("(max-width: 640px)");
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 641px) and (max-width: 1024px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1025px)");
}