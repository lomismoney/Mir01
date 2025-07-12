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
  Calendar,
  Clock,
  User,
  Settings,
  Crown,
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { formatDate } from "@/lib/dateHelpers";

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
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
 * 建立用戶表格欄位定義（美化版）
 *
 * 根據 shadcn/ui Data Table 最佳實踐設計的欄位配置，
 * 包含完整的用戶資訊展示和操作功能，具有現代化的視覺設計
 *
 * 視覺改進：
 * 1. 更美觀的頭像設計 - 漸變背景和更好的字體
 * 2. 增強的用戶資訊顯示 - 姓名和用戶名的層次結構
 * 3. 精美的角色徽章 - 不同角色的專屬顏色和圖標
 * 4. 優化的分店顯示 - 更清晰的分店列表
 * 5. 改善的時間格式 - 更友好的時間顯示
 * 6. 現代化的操作按鈕 - 更好的視覺反饋
 *
 * 欄位說明：
 * 1. 頭像 - 顯示用戶姓名首字母的漸變頭像
 * 2. 用戶資訊 - 姓名和用戶名的層次結構顯示
 * 3. 角色 - 帶圖示的精美角色徽章
 * 4. 分店 - 清晰的分店列表顯示
 * 5. 建立時間 - 格式化的建立日期
 * 6. 更新時間 - 格式化的更新日期
 * 7. 操作 - 現代化的操作下拉選單
 *
 * @param actions - 操作處理器
 * @returns 欄位定義陣列
 */
export const createUsersColumns = (
  actions: UserActions = {},
): ColumnDef<UserItem>[] => [
  {
    id: "user_info",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          <User className="mr-2 h-4 w-4" />
          用戶資訊
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      const name = user.name || "未知用戶";
      const username = user.username || "未知用戶名";
      const email = user.email || "";
      
      // 生成頭像首字母
      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback 
              className="bg-black text-white font-semibold text-sm"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="font-medium text-foreground">
              {name}
            </div>
            <div className="text-sm text-muted-foreground font-mono">
              @{username}
            </div>
            {email && (
              <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                {email}
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const nameA = rowA.original.name || "";
      const nameB = rowB.original.name || "";
      return nameA.localeCompare(nameB);
    },
  },
  {
    accessorKey: "roles",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          <Shield className="mr-2 h-4 w-4" />
          角色權限
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      const roles = (user as any).roles || [];

      // 角色映射表（使用 shadcn/UI 官方配色）
      const roleConfig = {
        admin: {
          label: "管理員",
          variant: "default" as const,
          icon: <Crown className="h-3 w-3" />,
        },
        staff: {
          label: "員工",
          variant: "secondary" as const,
          icon: <Store className="h-3 w-3" />,
        },
        viewer: {
          label: "檢視者",
          variant: "outline" as const,
          icon: <Eye className="h-3 w-3" />,
        },
        installer: {
          label: "安裝師傅",
          variant: "secondary" as const,
          icon: <Settings className="h-3 w-3" />,
        },
      };

      return (
        <div className="flex flex-wrap gap-1">
          {roles.map((role: string) => {
            const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.viewer;
            return (
              <Tooltip key={role}>
                <TooltipTrigger>
                  <Badge
                    variant={config.variant}
                    className="flex w-fit items-center gap-1 text-xs font-medium"
                  >
                    {config.icon}
                    {config.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{config.label}權限</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {roles.length === 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              無角色
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      const roles = row.getValue(id) as string[];
      return value.some((v: string) => roles.includes(v));
    },
  },
  {
    id: "stores",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          <Store className="mr-2 h-4 w-4" />
          所屬分店
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      const stores = user.stores || [];
      
      if (stores.length === 0) {
        return (
          <div className="text-sm text-muted-foreground ml-2">
            未分配分店
          </div>
        );
      }

      return (
        <div className="flex flex-wrap gap-1">
          {stores.slice(0, 2).map((store: StoreItem) => (
            <Badge
              key={store.id}
              variant="outline"
              className="text-xs bg-accent/50 text-accent-foreground border-accent"
            >
              <Store className="mr-1 h-3 w-3" />
              {store.name}
            </Badge>
          ))}
          {stores.length > 2 && (
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="text-xs">
                  +{stores.length - 2}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  {stores.slice(2).map((store: StoreItem) => (
                    <div key={store.id} className="text-sm">
                      {store.name}
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          )}
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
        >
          <Calendar className="mr-2 h-4 w-4" />
          建立時間
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateString = row.getValue("created_at") as string;
      if (!dateString) {
        return (
          <div className="text-sm text-muted-foreground">
            -
          </div>
        );
      }

      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      let timeAgo = "";
      let variant: "default" | "secondary" | "outline" = "outline";
      
      if (diffDays === 0) {
        timeAgo = "今天";
        variant = "default";
      } else if (diffDays === 1) {
        timeAgo = "昨天";
        variant = "secondary";
      } else if (diffDays < 7) {
        timeAgo = `${diffDays} 天前`;
        variant = "outline";
      } else if (diffDays < 30) {
        timeAgo = `${Math.floor(diffDays / 7)} 週前`;
        variant = "outline";
      } else {
        timeAgo = `${Math.floor(diffDays / 30)} 個月前`;
        variant = "outline";
      }

      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={variant} className="text-xs flex-shrink-0">
                <Calendar className="mr-1 h-3 w-3" />
                {timeAgo}
              </Badge>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {format(date, "yyyy/MM/dd")}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formatDate.fullDateTime(dateString, "格式錯誤")}</p>
          </TooltipContent>
        </Tooltip>
      );
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
        >
          <Clock className="mr-2 h-4 w-4" />
          更新時間
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const dateString = row.getValue("updated_at") as string;
      if (!dateString) {
        return (
          <div className="text-sm text-muted-foreground">
            -
          </div>
        );
      }

      const date = new Date(dateString);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      
      let timeAgo = "";
      let variant: "default" | "secondary" | "outline" = "outline";
      
      if (diffDays === 0) {
        timeAgo = "今天";
        variant = "secondary";
      } else if (diffDays === 1) {
        timeAgo = "昨天";
        variant = "outline";
      } else if (diffDays < 7) {
        timeAgo = `${diffDays} 天前`;
        variant = "outline";
      } else if (diffDays < 30) {
        timeAgo = `${Math.floor(diffDays / 7)} 週前`;
        variant = "outline";
      } else {
        timeAgo = `${Math.floor(diffDays / 30)} 個月前`;
        variant = "outline";
      }

      return (
        <Tooltip>
          <TooltipTrigger>
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant={variant} className="text-xs flex-shrink-0">
                <Clock className="mr-1 h-3 w-3" />
                {timeAgo}
              </Badge>
              <div className="text-xs text-muted-foreground font-mono truncate">
                {format(date, "yyyy/MM/dd")}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{formatDate.fullDateTime(dateString, "格式錯誤")}</p>
          </TooltipContent>
        </Tooltip>
      );
    },
  },
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-8 w-8 p-0 hover:bg-accent"
            >
              <span className="sr-only">開啟選單</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="font-medium">
              用戶操作
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {actions.onView && (
              <DropdownMenuItem
                onClick={() => actions.onView?.(user)}
                className="cursor-pointer"
              >
                <Eye className="mr-2 h-4 w-4" />
                查看詳情
              </DropdownMenuItem>
            )}

            {actions.onEdit && (
              <DropdownMenuItem
                onClick={() => actions.onEdit?.(user)}
                className="cursor-pointer"
              >
                <Edit className="mr-2 h-4 w-4" />
                編輯用戶
              </DropdownMenuItem>
            )}

            {actions.onManageStores && (
              <DropdownMenuItem
                onClick={() => actions.onManageStores?.(user)}
                className="cursor-pointer"
              >
                <Store className="mr-2 h-4 w-4" />
                分配分店
              </DropdownMenuItem>
            )}

            {actions.onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => actions.onDelete?.(user)}
                  className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  刪除用戶
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
