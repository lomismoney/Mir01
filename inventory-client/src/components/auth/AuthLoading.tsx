import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * 身份驗證載入元件
 * 
 * 功能描述：
 * - 在使用者身份驗證過程中顯示全頁載入畫面
 * - 使用 Loader2 圖示提供視覺回饋
 * - 採用全螢幕居中佈局設計
 * - 與應用程式主題色彩保持一致
 * 
 * 使用場景：
 * - 使用者登入驗證期間
 * - Token 驗證過程中
 * - 身份狀態檢查時
 * - 頁面重新載入時的認證確認
 * 
 * @returns JSX.Element 身份驗證載入畫面
 */
export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
} 