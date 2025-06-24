import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { CategoriesClientPage } from '@/components/categories/CategoriesClientPage';

/**
 * 分類管理頁面（Auth.js 中間件保護版本）
 * 
 * 安全特性：
 * - 由 Auth.js 中間件統一保護，無需頁面級認證檢查
 * - 在 Edge Runtime 中執行認證，效能更佳
 * - 自動重導向機制，用戶體驗更流暢
 * 
 * 功能概述：
 * - 管理商品分類的樹狀結構
 * - 支援新增、編輯、刪除分類
 * - 支援父子分類關係管理
 * - 提供專業的表格化管理介面
 */
export default function CategoriesPage() {
  // Auth.js 中間件已確保只有已登入用戶才能到達此頁面
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <CategoriesClientPage />
    </Suspense>
  );
} 