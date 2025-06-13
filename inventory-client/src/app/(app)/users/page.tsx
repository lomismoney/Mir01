import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth, isAdmin } from '@/lib/auth';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { UsersClientPage } from '@/components/users/UsersClientPage';

/**
 * 用戶管理頁面（伺服器端認證版本）
 * 
 * 安全特性：
 * - 雙重認證檢查：用戶登入 + 管理員權限
 * - 伺服器端身份驗證，未認證用戶無法取得頁面內容
 * - 使用 Next.js redirect() 進行伺服器端重定向
 * - 完全杜絕「偷看」問題，提供企業級安全性
 * 
 * 架構設計：
 * - 伺服器元件處理認證和權限檢查
 * - 客戶端元件處理複雜的互動邏輯
 * - 保持 SEO 友好的伺服器端渲染
 */
export default async function UsersPage() {
  // 在伺服器端直接進行身份驗證
  const session = await auth(); 
  if (!session?.user) {
    // 如果未登入，直接在伺服器端重定向
    redirect('/login');
  }

  // 檢查管理員權限
  const userIsAdmin = await isAdmin();
  if (!userIsAdmin) {
    // 如果不是管理員，重定向到首頁或無權限頁面
    redirect('/dashboard');
  }

  // 只有已登入且為管理員的用戶才會執行到這裡
  return (
    <Suspense fallback={<DataTableSkeleton />}>
      <UsersClientPage serverUser={session.user} />
    </Suspense>
  );
} 