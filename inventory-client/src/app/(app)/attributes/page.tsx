import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

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

      {/* 開發中提示 */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>功能開發中</strong><br />
              屬性管理功能正在開發中，將會提供以下功能：
            </p>
            <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
              <li>商品屬性管理（如顏色、尺寸、材質等）</li>
              <li>屬性值管理（如紅色、藍色、S、M、L 等）</li>
              <li>SKU 變體組合生成</li>
              <li>屬性與商品的關聯設定</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 用戶資訊（開發時期顯示） */}
      <div className="mt-8 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">當前用戶資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">用戶姓名：</span>
            <span className="text-gray-900 font-medium">{user.name}</span>
          </div>
          <div>
            <span className="text-gray-500">用戶帳號：</span>
            <span className="text-gray-900 font-medium">{user.username}</span>
          </div>
          <div>
            <span className="text-gray-500">用戶角色：</span>
            <span className="text-gray-900 font-medium">{user.role_display}</span>
          </div>
          <div>
            <span className="text-gray-500">用戶 ID：</span>
            <span className="text-gray-900 font-medium">{user.id}</span>
          </div>
        </div>
      </div>

      {/* 預期功能區塊 */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">屬性管理</h3>
          <p className="text-gray-600 mb-4">建立和管理商品的規格屬性</p>
          <div className="text-sm text-gray-500">開發中...</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">屬性值管理</h3>
          <p className="text-gray-600 mb-4">為每個屬性設定可選的值</p>
          <div className="text-sm text-gray-500">開發中...</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">SKU 變體</h3>
          <p className="text-gray-600 mb-4">基於屬性組合生成商品變體</p>
          <div className="text-sm text-gray-500">開發中...</div>
        </div>
      </div>
    </div>
  );
} 