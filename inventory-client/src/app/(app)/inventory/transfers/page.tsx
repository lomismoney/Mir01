'use client';

import InventoryTransfer from '@/components/inventory/InventoryTransfer';

/**
 * 庫存轉移頁面（Auth.js 中間件保護版本）
 * 
 * 安全特性：
 * - 由 Auth.js 中間件統一保護，無需 HOC 包裹
 * - 在 Edge Runtime 中執行認證，效能更佳
 * - 自動重導向機制，用戶體驗更流暢
 * 
 * 功能概述：
 * - 處理不同倉庫間的庫存轉移
 * - 記錄轉移歷史和狀態
 * - 管理轉移申請和審核流程
 */
export default function InventoryTransferPage() {
  // Auth.js 中間件已確保只有已登入用戶才能到達此頁面
  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">庫存轉移</h1>
        <p className="text-muted-foreground">
          管理不同門市間的庫存轉移作業，包括轉移申請、狀態追蹤等功能
        </p>
      </div>
      
      <InventoryTransfer />
    </div>
  );
} 