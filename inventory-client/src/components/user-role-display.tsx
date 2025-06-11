'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Shield, Eye } from 'lucide-react';

/**
 * 用戶角色顯示組件
 * 
 * 展示如何使用新的用戶角色屬性：
 * - user.role (角色代碼)
 * - user.role_display (角色顯示名稱)
 * - user.is_admin (管理員標識)
 */
export function UserRoleDisplay() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* 角色徽章 */}
      <Badge 
        variant={user.is_admin ? "default" : "secondary"}
        className="flex items-center space-x-1"
      >
        {user.is_admin ? (
          <Shield className="h-3 w-3" />
        ) : (
          <Eye className="h-3 w-3" />
        )}
        <span>{user.role_display || user.role}</span>
      </Badge>

      {/* 用戶名稱 */}
      <span className="text-sm text-muted-foreground">
        {user.name}
      </span>

      {/* 管理員專用標識 */}
      {user.is_admin && (
        <Badge variant="outline" className="text-xs">
          管理員
        </Badge>
      )}
    </div>
  );
}

/**
 * 條件渲染示例：根據角色顯示不同內容
 */
export function RoleBasedContent() {
  const { user } = useAuth();

  // 管理員內容
  if (user?.is_admin) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50">
        <h3 className="font-semibold text-blue-900">管理員面板</h3>
        <p className="text-blue-700">您具有完整的系統管理權限。</p>
        <ul className="mt-2 text-sm text-blue-600">
          <li>• 可以管理所有商品</li>
          <li>• 可以查看所有用戶</li>
          <li>• 可以修改系統設定</li>
        </ul>
      </div>
    );
  }

  // 檢視者內容
  if (user?.role === 'viewer') {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <h3 className="font-semibold text-gray-900">檢視者面板</h3>
        <p className="text-gray-700">您具有唯讀權限。</p>
        <ul className="mt-2 text-sm text-gray-600">
          <li>• 可以查看商品列表</li>
          <li>• 可以查看商品詳細資訊</li>
          <li>• 無法修改任何資料</li>
        </ul>
      </div>
    );
  }

  // 未知角色或未登入
  return (
    <div className="p-4 border rounded-lg bg-yellow-50">
      <h3 className="font-semibold text-yellow-900">訪客</h3>
      <p className="text-yellow-700">請登入以查看更多內容。</p>
    </div>
  );
} 