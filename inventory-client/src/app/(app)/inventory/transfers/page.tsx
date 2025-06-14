'use client';

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
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-4">庫存轉移</h1>
      <p className="text-muted-foreground">管理不同倉庫間的庫存轉移作業</p>
      {/* 庫存轉移功能將在此實作 */}
    </div>
  );
} 