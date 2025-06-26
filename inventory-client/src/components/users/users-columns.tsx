"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  Shield,
  Eye,
  Trash2,
  Edit,
  Store,
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// 使用統一的類型定義，確保與 API 契約同步
import { UserItem, StoreItem } from "@/types/api-helpers";

// 定義用戶操作介面
export interface UserActions {
  onView?: (user: UserItem) => void;
  onEdit?: (user: UserItem) => void;
  onDelete?: (user: UserItem) => void;
  onManageStores?: (user: UserItem) => void;
}

/**
 * 建立用戶表格欄位定義
 *
 * 根據 shadcn/ui Data Table 最佳實踐設計的欄位配置，
 * 包含完整的用戶資訊展示和操作功能
 *
 * 欄位說明：
 * 1. 頭像 - 顯示用戶姓名首字母
 * 2. 姓名 - 可排序的用戶姓名
 * 3. 帳號 - 用戶登入帳號
 * 4. 角色 - 帶圖示的角色徽章
 * 5. 建立時間 - 格式化的建立日期
 * 6. 更新時間 - 格式化的更新日期
 * 7. 操作 - 下拉選單包含查看、編輯、分配分店、刪除（僅管理員可見）
 *
 * @param actions - 操作處理器
 * @returns 欄位定義陣列
 */
export const createUsersColumns = (
  actions: UserActions = {},
): ColumnDef<UserItem>[] => [
  {
    id: "avatar",
    header: "",
    cell: ({ row }) => {
      const user = row.original;
      const name = user.name || "未知用戶";
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <Avatar className="h-8 w-8" data-oid="dpbf62m">
          <AvatarFallback className="text-xs font-medium" data-oid="yo.gm.n">
            {initials}
          </AvatarFallback>
        </Avatar>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          data-oid="2v:mqjp"
        >
          姓名
          <ArrowUpDown className="ml-2 h-4 w-4" data-oid="vp_4jjg" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="font-medium" data-oid="gsc6vjd">
          {row.getValue("name") || "未知用戶"}
        </div>
      );
    },
  },
  {
    accessorKey: "username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          data-oid="ac-vj_3"
        >
          用戶名
          <ArrowUpDown className="ml-2 h-4 w-4" data-oid="klo1btg" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return (
        <div className="font-mono text-sm" data-oid="y7o0gx6">
          {row.getValue("username") || "未知用戶名"}
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "角色",
    cell: ({ row }) => {
      const user = row.original;
      const role = user.role || "viewer";

      // 角色映射表
      const roleConfig = {
        admin: {
          label: "管理員",
          variant: "default" as const,
          icon: <Shield className="h-3 w-3" data-oid="5khxvst" />,
        },
        staff: {
          label: "員工",
          variant: "destructive" as const,
          icon: <Eye className="h-3 w-3" data-oid="38s_zih" />,
        },
        viewer: {
          label: "檢視者",
          variant: "secondary" as const,
          icon: <Eye className="h-3 w-3" data-oid="01q1759" />,
        },
      };

      const config =
        roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;

      return (
        <Badge
          variant={config.variant}
          className="flex w-fit items-center gap-1"
          data-oid="yne1fmq"
        >
          {config.icon}
          {config.label}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "stores",
    header: "所屬分店",
    cell: ({ row }) => {
      const user = row.original;
      const stores = user.stores || [];
      return (
        <div className="flex flex-wrap gap-1" data-oid="j9583cl">
          {stores.map((store: StoreItem) => (
            <Badge
              key={store.id}
              variant="outline"
              className="text-xs"
              data-oid="_aojafr"
            >
              <Store className="mr-1 h-3 w-3" data-oid="5uw:hbt" />
              {store.name}
            </Badge>
          ))}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          data-oid="toiw7or"
        >
          建立時間
          <ArrowUpDown className="ml-2 h-4 w-4" data-oid="flv_.f1" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateString = row.getValue("created_at") as string;
      if (!dateString)
        return (
          <div className="text-muted-foreground" data-oid="4aaxbvj">
            -
          </div>
        );

      try {
        return (
          <div className="text-sm" data-oid="ac75wm3">
            {format(new Date(dateString), "yyyy-MM-dd HH:mm", { locale: zhTW })}
          </div>
        );
      } catch {
        return (
          <div className="text-muted-foreground" data-oid="rx597ap">
            格式錯誤
          </div>
        );
      }
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
          data-oid="rybp73u"
        >
          更新時間
          <ArrowUpDown className="ml-2 h-4 w-4" data-oid="nd87ofy" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateString = row.getValue("updated_at") as string;
      if (!dateString)
        return (
          <div className="text-muted-foreground" data-oid="903x9pk">
            -
          </div>
        );

      try {
        return (
          <div className="text-sm" data-oid="coyy6ke">
            {format(new Date(dateString), "yyyy-MM-dd HH:mm", { locale: zhTW })}
          </div>
        );
      } catch {
        return (
          <div className="text-muted-foreground" data-oid="67vyxqp">
            格式錯誤
          </div>
        );
      }
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu data-oid="x88kx.v">
          <DropdownMenuTrigger asChild data-oid="gpr6ds-">
            <Button variant="ghost" className="h-8 w-8 p-0" data-oid="j8g3xvf">
              <span className="sr-only" data-oid="lw4f3q4">
                開啟選單
              </span>
              <MoreHorizontal className="h-4 w-4" data-oid="ms91kh0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="2223j9v">
            <DropdownMenuLabel data-oid="t.uwnou">操作</DropdownMenuLabel>
            <DropdownMenuSeparator data-oid="7umw:8." />

            {actions.onView && (
              <DropdownMenuItem
                onClick={() => actions.onView?.(user)}
                className="cursor-pointer"
                data-oid="1izj5rj"
              >
                <Eye className="mr-2 h-4 w-4" data-oid="5.gg.d0" />
                查看詳情
              </DropdownMenuItem>
            )}

            {actions.onEdit && (
              <DropdownMenuItem
                onClick={() => actions.onEdit?.(user)}
                className="cursor-pointer"
                data-oid="y04ivty"
              >
                <Edit className="mr-2 h-4 w-4" data-oid="6dy1mpz" />
                編輯用戶
              </DropdownMenuItem>
            )}

            {actions.onManageStores && (
              <DropdownMenuItem
                onClick={() => actions.onManageStores?.(user)}
                className="cursor-pointer"
                data-oid="nf3rolu"
              >
                <Store className="mr-2 h-4 w-4" data-oid="ec481pe" />
                分配分店
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator data-oid="vyt_bxc" />

            {actions.onDelete && (
              <DropdownMenuItem
                onClick={() => actions.onDelete?.(user)}
                className="cursor-pointer text-destructive focus:text-destructive"
                data-oid=".ebj9j1"
              >
                <Trash2 className="mr-2 h-4 w-4" data-oid=".bfbgnp" />
                刪除用戶
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
