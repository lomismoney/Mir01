import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { ProductForm } from '@/components/products/ProductForm';

/**
 * 新增商品頁面（伺服器端認證版本）
 * 
 * 安全特性：
 * - 伺服器端身份驗證，未認證用戶無法取得頁面內容
 * - 使用 Next.js redirect() 進行伺服器端重定向
 * - 完全杜絕「偷看」問題，提供企業級安全性
 * 
 * 功能概述：
 * - 提供完整的商品建立表單
 * - 支援基本商品資訊輸入
 * - 支援多規格商品變體管理
 * - 整合分類和屬性選擇
 */
export default async function NewProductPage() {
  // 在伺服器端直接進行身份驗證
  const session = await auth(); 
  if (!session?.user) {
    // 如果未登入，直接在伺服器端重定向
    redirect('/login');
  }

  const { user } = session;

  // 只有已登入用戶才會執行到這裡
  return (
    <div className="p-4 md:p-8">
      {/* 頁面標題 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          新增商品
        </h1>
        <p className="text-gray-600 mt-2">
          建立新的商品項目，設定基本資訊和規格變體
        </p>
      </div>

      {/* 商品表單 */}
      <Suspense fallback={<DataTableSkeleton />}>
        <ProductForm
          title="建立新商品"
          description="填寫商品的基本資訊，您可以稍後新增更多詳細設定"
        />
      </Suspense>

      {/* 頁面資訊 */}
      <div className="mt-12 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">操作說明</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">基本資訊</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• 商品名稱為必填欄位</li>
              <li>• 建議填寫詳細的商品描述</li>
              <li>• 選擇適當的商品分類</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">多規格設定</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• 選擇商品需要的屬性（如顏色、尺寸）</li>
              <li>• 系統會自動生成所有可能的變體組合</li>
              <li>• 為每個變體設定 SKU、價格和庫存</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">操作者：</span>{user.name} ({user.username})
            <span className="ml-4 font-medium">權限：</span>{user.role_display}
          </div>
        </div>
      </div>
    </div>
  );
} 