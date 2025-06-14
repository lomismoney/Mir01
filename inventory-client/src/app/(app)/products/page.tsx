import { Suspense } from 'react';
import Link from 'next/link';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ProductClientComponent } from '@/components/products/ProductClientComponent';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

/**
 * 商品管理頁面（Auth.js 中間件保護版本）
 * 
 * 安全特性：
 * - 由 Auth.js 中間件統一保護，無需頁面級認證檢查
 * - 在 Edge Runtime 中執行認證，效能更佳
 * - 自動重導向機制，用戶體驗更流暢
 * 
 * 效能優化：
 * - 移除伺服器端認證檢查，減少頁面載入時間
 * - 動態內容包裹在 Suspense 中，實現串流渲染
 * - 提供良好的載入體驗和 SEO 優化
 */
export default function ProductsPage() {
  // Auth.js 中間件已確保只有已登入用戶才能到達此頁面
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
        <ProductClientComponent />
      </Suspense>
    </div>
  );
} 