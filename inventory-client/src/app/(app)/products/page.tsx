import { Suspense } from 'react';
import Link from 'next/link';
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ProductClientComponent } from '@/components/products/ProductClientComponent';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

/**
 * 商品管理頁面
 * 
 * 使用 Next.js App Router 的最佳實踐：
 * - 父層保持為伺服器元件，可快速渲染和緩存
 * - 動態內容包裹在 Suspense 中，實現串流渲染
 * - 提供良好的載入體驗和 SEO 優化
 */
function ProductsPage() {
  return (
    <AuthWrapper fallback={<DataTableSkeleton />}>
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
          <ProductClientComponent />
        </Suspense>
      </div>
    </AuthWrapper>
  );
}

export default ProductsPage; 