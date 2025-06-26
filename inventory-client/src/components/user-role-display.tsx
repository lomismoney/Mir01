"use client";

import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { Shield, Eye } from "lucide-react";

/**
 * 用戶角色顯示組件（Auth.js 版本）
 *
 * 展示如何使用 Auth.js session 中的用戶角色屬性：
 * - user.role (角色代碼)
 * - user.roleDisplay (角色顯示名稱)
 * - user.isAdmin (管理員標識)
 */
export function UserRoleDisplay() {
  const { data: session, status } = useSession();

  // 從 Auth.js session 中提取用戶資訊和狀態
  const user = session?.user;
  const isAuthenticated = status === "authenticated";

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2" data-oid="deb1g1z">
      {/* 角色徽章 */}
      <Badge
        variant={user.isAdmin ? "default" : "secondary"}
        className="flex items-center space-x-1"
        data-oid="aazq1pd"
      >
        {user.isAdmin ? (
          <Shield className="h-3 w-3" data-oid="e2tn2a3" />
        ) : (
          <Eye className="h-3 w-3" data-oid="04zzo2b" />
        )}
        <span data-oid="rs7-lhg">{user.roleDisplay || user.role}</span>
      </Badge>

      {/* 用戶名稱 */}
      <span className="text-sm text-muted-foreground" data-oid="_fk5tnw">
        {user.name}
      </span>

      {/* 管理員專用標識 */}
      {user.isAdmin && (
        <Badge variant="outline" className="text-xs" data-oid="61i5ea1">
          管理員
        </Badge>
      )}
    </div>
  );
}

/**
 * 條件渲染示例：根據角色顯示不同內容（Auth.js 版本）
 */
export function RoleBasedContent() {
  const { data: session } = useSession();
  const user = session?.user;

  // 管理員內容
  if (user?.isAdmin) {
    return (
      <div className="p-4 border rounded-lg bg-blue-50" data-oid="mltm5ma">
        <h3 className="font-semibold text-blue-900" data-oid="bjbd2gg">
          管理員面板
        </h3>
        <p className="text-blue-700" data-oid="rqje17z">
          您具有完整的系統管理權限。
        </p>
        <ul className="mt-2 text-sm text-blue-600" data-oid="f:-l7j3">
          <li data-oid="wbknu-d">• 可以管理所有商品</li>
          <li data-oid="nwbasnw">• 可以查看所有用戶</li>
          <li data-oid="l3mm6bv">• 可以修改系統設定</li>
        </ul>
      </div>
    );
  }

  // 檢視者內容
  if (user?.role === "viewer") {
    return (
      <div className="p-4 border rounded-lg bg-gray-50" data-oid="3fo6tqp">
        <h3 className="font-semibold text-gray-900" data-oid="06yuvda">
          檢視者面板
        </h3>
        <p className="text-gray-700" data-oid="jd:7fz4">
          您具有唯讀權限。
        </p>
        <ul className="mt-2 text-sm text-gray-600" data-oid="7llx0-q">
          <li data-oid="wl4wkn.">• 可以查看商品列表</li>
          <li data-oid="gldcfht">• 可以查看商品詳細資訊</li>
          <li data-oid="47yp9t-">• 無法修改任何資料</li>
        </ul>
      </div>
    );
  }

  // 未知角色或未登入
  return (
    <div className="p-4 border rounded-lg bg-yellow-50" data-oid="p6dcd3l">
      <h3 className="font-semibold text-yellow-900" data-oid="7u462ps">
        訪客
      </h3>
      <p className="text-yellow-700" data-oid="jo--iyz">
        請登入以查看更多內容。
      </p>
    </div>
  );
}
