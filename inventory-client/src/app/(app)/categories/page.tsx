import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { CategoriesClientPage } from '@/components/categories/CategoriesClientPage';

/**
 * 分類管理頁面（伺服器端認證版本）
 * 
 * 安全特性：
 * - 伺服器端身份驗證，未認證用戶無法取得頁面內容
 * - 使用 Next.js redirect() 進行伺服器端重定向
 * - 完全杜絕「偷看」問題，提供企業級安全性
 * 
 * 功能概述：
 * - 管理商品分類的樹狀結構
 * - 支援新增、編輯、刪除分類
 * - 支援父子分類關係管理
 * - 提供專業的表格化管理介面
 */
export default async function CategoriesPage() {
  // 在伺服器端直接進行身份驗證
  const session = await auth(); 
  if (!session?.user) {
    // 如果未登入，直接在伺服器端重定向
    redirect('/login');
  }

  // 只有已登入用戶才會執行到這裡
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <CategoriesClientPage />
    </Suspense>
  );
} 