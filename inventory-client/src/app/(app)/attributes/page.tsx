import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { AttributesClientPage } from '@/components/attributes/AttributesClientPage';

/**
 * 屬性管理頁面（伺服器端認證版本）
 * 
 * 安全特性：
 * - 伺服器端身份驗證，未認證用戶無法取得頁面內容
 * - 使用 Next.js redirect() 進行伺服器端重定向
 * - 完全杜絕「偷看」問題，提供企業級安全性
 * 
 * 功能概述：
 * - 管理商品的規格屬性（如顏色、尺寸等）
 * - 支援新增、編輯、刪除屬性
 * - 管理屬性值（如紅色、XL 等）
 * - 提供專業的表格化管理介面
 */
export default async function AttributesPage() {
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
          屬性管理
        </h1>
        <p className="text-gray-600 mt-2">
          設定商品的規格屬性和變體
        </p>
      </div>

      {/* 屬性管理功能區域 */}
      <AttributesClientPage />
    </div>
  );
} 