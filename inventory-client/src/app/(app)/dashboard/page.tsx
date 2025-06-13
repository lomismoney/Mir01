import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

/**
 * 儀表板頁面（伺服器端認證版本）
 * 
 * 安全特性：
 * - 伺服器端身份驗證，未認證用戶無法取得頁面內容
 * - 使用 Next.js redirect() 進行伺服器端重定向
 * - 完全杜絕「偷看」問題，提供企業級安全性
 * 
 * 功能概述：
 * - 顯示系統總覽和重要統計資訊
 * - 提供快速導航到各功能模組
 * - 根據用戶角色顯示不同的內容
 */
export default async function DashboardPage() {
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
      {/* 歡迎區域 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          歡迎回來，{user.name}！
        </h1>
        <p className="text-gray-600 mt-2">
          今天是個處理庫存管理的好日子
        </p>
      </div>

      {/* 快速統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">總商品數</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">--</p>
          <p className="text-sm text-gray-600 mt-1">開發中</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">商品分類</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">--</p>
          <p className="text-sm text-gray-600 mt-1">開發中</p>
        </div>
        
        {user.is_admin && (
          <div className="bg-white p-6 rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-500">系統用戶</h3>
            <p className="text-2xl font-semibold text-gray-900 mt-2">--</p>
            <p className="text-sm text-gray-600 mt-1">僅管理員可見</p>
          </div>
        )}
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500">您的角色</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{user.role_display}</p>
          <p className="text-sm text-gray-600 mt-1">當前權限等級</p>
        </div>
      </div>

      {/* 快速導航 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">商品管理</h3>
          <p className="text-gray-600 mb-4">管理您的商品庫存、定價和分類</p>
          <a 
            href="/products" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            前往管理 →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">分類管理</h3>
          <p className="text-gray-600 mb-4">組織和管理商品分類結構</p>
          <a 
            href="/categories" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            前往管理 →
          </a>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">屬性管理</h3>
          <p className="text-gray-600 mb-4">設定商品的規格屬性和變體</p>
          <a 
            href="/attributes" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            前往管理 →
          </a>
        </div>

        {user.is_admin && (
          <div className="bg-white p-6 rounded-lg shadow border hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">用戶管理</h3>
            <p className="text-gray-600 mb-4">管理系統用戶和權限設定</p>
            <a 
              href="/users" 
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              前往管理 →
            </a>
          </div>
        )}
      </div>

      {/* 系統資訊 */}
      <div className="mt-12 bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">系統資訊</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">用戶帳號：</span>
            <span className="text-gray-900 font-medium">{user.username}</span>
          </div>
          <div>
            <span className="text-gray-500">帳號建立：</span>
            <span className="text-gray-900 font-medium">
              {new Date(user.created_at).toLocaleDateString('zh-TW')}
            </span>
          </div>
          <div>
            <span className="text-gray-500">最後更新：</span>
            <span className="text-gray-900 font-medium">
              {new Date(user.updated_at).toLocaleDateString('zh-TW')}
            </span>
          </div>
          <div>
            <span className="text-gray-500">用戶 ID：</span>
            <span className="text-gray-900 font-medium">{user.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
