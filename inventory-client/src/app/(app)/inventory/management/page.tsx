'use client';

import { InventoryManagement } from '@/components/inventory/InventoryManagement';

/**
 * 庫存管理頁面（Auth.js 中間件保護版本）
 * 
 * 安全特性：
 * - 由 Auth.js 中間件統一保護，無需 HOC 包裹
 * - 在 Edge Runtime 中執行認證，效能更佳
 * - 自動重導向機制，用戶體驗更流暢
 * 
 * 功能概述：
 * - 管理商品庫存數量
 * - 監控庫存水位和預警
 * - 處理庫存調整和盤點
 */
export default function InventoryManagementPage() {
  // Auth.js 中間件已確保只有已登入用戶才能到達此頁面
  return (
    <div className="container mx-auto p-4 md:p-8">
      <InventoryManagement />
    </div>
  );
} 