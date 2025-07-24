/**
 * 距離格式化工具函數
 * 
 * 提供距離資訊的格式化功能，用於庫存調貨建議中顯示門市距離。
 * 
 * 功能特性：
 * - 距離小於 1 公里顯示為公尺（如：「500 公尺」）
 * - 距離大於等於 1 公里顯示為公里（如：「2.3 公里」）
 * - 支援 null/undefined 處理
 * - 提供一致的格式化輸出
 */

/**
 * 格式化距離為人類可讀的字串
 * 
 * @param distance 距離（公里），可為 null 或 undefined
 * @returns 格式化後的距離字串，如 "500 公尺" 或 "2.3 公里"
 */
export function formatDistance(distance?: number | null): string {
  // 處理無效值
  if (distance === null || distance === undefined || isNaN(distance)) {
    return '距離未知';
  }

  // 處理負值
  if (distance < 0) {
    return '距離未知';
  }

  // 小於 1 公里時，轉換為公尺顯示
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters} 公尺`;
  }

  // 大於等於 1 公里時，顯示公里（保留一位小數）
  return `${distance.toFixed(1)} 公里`;
}

/**
 * 格式化距離為簡短版本（用於表格或狹小空間）
 * 
 * @param distance 距離（公里），可為 null 或 undefined
 * @returns 簡短的距離字串，如 "500m" 或 "2.3km"
 */
export function formatDistanceShort(distance?: number | null): string {
  // 處理無效值
  if (distance === null || distance === undefined || isNaN(distance)) {
    return '-';
  }

  // 處理負值
  if (distance < 0) {
    return '-';
  }

  // 小於 1 公里時，轉換為公尺顯示
  if (distance < 1) {
    const meters = Math.round(distance * 1000);
    return `${meters}m`;
  }

  // 大於等於 1 公里時，顯示公里（保留一位小數）
  return `${distance.toFixed(1)}km`;
}

/**
 * 檢查距離是否有效
 * 
 * @param distance 距離值
 * @returns 是否為有效的距離值
 */
export function isValidDistance(distance?: number | null): boolean {
  return distance !== null && distance !== undefined && !isNaN(distance) && distance >= 0;
}

/**
 * 比較兩個距離值（用於排序）
 * 
 * @param a 距離 A
 * @param b 距離 B
 * @returns 排序比較結果（-1, 0, 1）
 */
export function compareDistance(a?: number | null, b?: number | null): number {
  // 處理無效值，無效值排在最後
  const aValid = isValidDistance(a);
  const bValid = isValidDistance(b);
  
  if (!aValid && !bValid) return 0;
  if (!aValid) return 1;
  if (!bValid) return -1;
  
  // 都有效時，按距離升序排列
  return (a as number) - (b as number);
}