import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ProductClientComponent } from '@/components/products/ProductClientComponent';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

/**
 * 商品管理頁面（伺服器端認證版本）
 * 
 * 安全特性：
 * - 伺服器端身份驗證，未認證用戶無法取得頁面內容
 * - 使用 Next.js redirect() 進行伺服器端重定向
 * - 完全杜絕「偷看」問題，提供企業級安全性
 * 
 * 效能優化：
 * - 父層保持為伺服器元件，可快速渲染和緩存
 * - 動態內容包裹在 Suspense 中，實現串流渲染
 * - 提供良好的載入體驗和 SEO 優化
 */
export default async function ProductsPage() {
  // 在伺服器端直接進行身份驗證
  const session = await auth(); 
  if (!session?.user) {
    // 如果未登入，直接在伺服器端重定向，不會向瀏覽器發送任何頁面內容
    redirect('/login');
  }

  // 只有已登入用戶才會執行到這裡
  return (
    <div className="p-4 md:p-8">
      {/* 頁面標題區 - 伺服器端立即渲染 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">商品管理</h1>
          <p className="text-muted-foreground">
            管理您的商品庫存、定價和分類
          </p>
        </div>
        
        {/* 新增商品按鈕 - 靜態內容，可立即顯示 */}
        <Link href="/products/new">
          <Button size="lg">
            <PlusCircle className="h-4 w-4 mr-2" />
            新增商品
          </Button>
        </Link>
      </div>
      
      {/* 動態內容區 - 使用 Suspense 包裹客戶端元件 */}
      <Suspense fallback={<DataTableSkeleton />}>
        <ProductClientComponent user={session.user} />
      </Suspense>
    </div>
  );
} 