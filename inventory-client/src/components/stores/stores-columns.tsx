"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Store as StoreIcon,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
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

// Store 類型定義
type Store = {
  id: number;
  name: string;
  address: string | null;
  phone?: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  inventory_count?: number;
  users_count?: number;
};

// 定義分店操作介面
export interface StoreActions {
  onEdit?: (store: Store) => void;
  onDelete?: (store: Store) => void;
}

/**
 * 建立分店表格欄位定義
 *
 * 根據 shadcn/ui Data Table 最佳實踐設計的欄位配置，
 * 包含完整的分店資訊展示和操作功能
 *
 * 欄位說明：
 * 1. 名稱 - 可排序的分店名稱
 * 2. 地址 - 分店地址
 * 3. 建立時間 - 格式化的建立日期
 * 4. 更新時間 - 格式化的更新日期
 * 5. 操作 - 下拉選單包含編輯、刪除
 *
 * @param actions - 操作處理器
 * @param showActions - 是否顯示操作欄位（根據權限控制）
 * @returns 欄位定義陣列
 */
export const createStoresColumns = (
  actions: StoreActions = {},
  showActions: boolean = true,
): ColumnDef<Store>[] => {
  const columns: ColumnDef<Store>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        const sortDirection = column.getIsSorted();
        
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10">
              <StoreIcon className="h-3 w-3 text-primary" />
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors"
            >
              分店名稱
              <div className="ml-2 flex items-center">
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                ) : sortDirection === "desc" ? (
                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                )}
              </div>
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const storeName = row.getValue("name") as string;
        const storeInitial = storeName ? storeName.charAt(0) : "?";
        const store = row.original;
        
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {storeInitial}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium text-foreground">{storeName || "未知分店"}</span>
              <span className="text-xs text-muted-foreground">ID: #{store.id}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: () => (
        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
            <MapPin className="h-3 w-3 text-muted-foreground" />
          </div>
          <span className="font-semibold text-foreground">分店地址</span>
        </div>
      ),
      cell: ({ row }) => {
        const address = row.getValue("address") as string | null;
        return (
          <div className="max-w-[300px] space-y-1">
            {address ? (
              <>
                <div className="text-sm text-foreground truncate">{address}</div>
                <div className="flex items-center space-x-1">
                  <div className="h-2 w-2 rounded-full bg-success"></div>
                  <span className="text-xs text-muted-foreground">已設定地址</span>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 rounded-full bg-muted"></div>
                <span className="text-sm text-muted-foreground">未設定地址</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        const sortDirection = column.getIsSorted();
        
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
              <Calendar className="h-3 w-3 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors"
            >
              建立時間
              <div className="ml-2 flex items-center">
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                ) : sortDirection === "desc" ? (
                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                )}
              </div>
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const dateString = row.getValue("created_at") as string;
        if (!dateString)
          return (
            <div className="text-muted-foreground text-left">
              -
            </div>
          );

        try {
          const date = new Date(dateString);
          const formattedDate = format(date, "yyyy-MM-dd", { locale: zhTW });
          const timeAgo = format(date, "MM月dd日", { locale: zhTW });
          
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium">{formattedDate}</div>
              <div className="text-xs text-muted-foreground">{timeAgo}</div>
            </div>
          );
        } catch {
          return (
            <div className="text-muted-foreground text-left">
              格式錯誤
            </div>
          );
        }
      },
    },
    {
      accessorKey: "updated_at",
      header: ({ column }) => {
        const sortDirection = column.getIsSorted();
        
        return (
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted">
              <Clock className="h-3 w-3 text-muted-foreground" />
            </div>
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-semibold text-foreground hover:text-primary transition-colors"
            >
              更新時間
              <div className="ml-2 flex items-center">
                {sortDirection === "asc" ? (
                  <ArrowUp className="h-3.5 w-3.5 text-primary" />
                ) : sortDirection === "desc" ? (
                  <ArrowDown className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground opacity-50" />
                )}
              </div>
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const dateString = row.getValue("updated_at") as string;
        if (!dateString)
          return (
            <div className="text-muted-foreground text-left">
              -
            </div>
          );

        try {
          const date = new Date(dateString);
          const now = new Date();
          const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
          
          let timeDisplay = "";
          if (diffInDays === 0) {
            timeDisplay = "今天";
          } else if (diffInDays === 1) {
            timeDisplay = "昨天";
          } else if (diffInDays < 7) {
            timeDisplay = `${diffInDays}天前`;
          } else {
            timeDisplay = format(date, "MM月dd日", { locale: zhTW });
          }
          
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium">{format(date, "yyyy-MM-dd", { locale: zhTW })}</div>
              <div className="text-xs text-muted-foreground">{timeDisplay}</div>
            </div>
          );
        } catch {
          return (
            <div className="text-muted-foreground text-left">
              格式錯誤
            </div>
          );
        }
      },
    },
  ];

  // 只有在需要顯示操作欄位時才添加
  if (showActions) {
    columns.push({
      id: "actions",
      header: () => (
        <div className="flex items-center justify-center">
          <span className="font-semibold text-foreground">操作</span>
        </div>
      ),
      cell: ({ row }) => {
        const store = row.original;

        return (
          <div className="text-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-muted"
                 
                >
                  <span className="sr-only">
                    開啟選單
                  </span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>操作</DropdownMenuLabel>
                <DropdownMenuSeparator />

                {actions.onEdit && (
                  <DropdownMenuItem
                    onClick={() => actions.onEdit?.(store)}
                    className="cursor-pointer"
                   
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    編輯分店
                  </DropdownMenuItem>
                )}

                {actions.onDelete && (
                  <DropdownMenuItem
                    onClick={() => actions.onDelete?.(store)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                   
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    刪除分店
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    });
  }

  return columns;
};
