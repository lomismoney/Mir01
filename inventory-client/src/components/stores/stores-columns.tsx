"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  ArrowUpDown,
  Store as StoreIcon,
  Edit,
  Trash2,
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
 * 1. ID - 分店編號
 * 2. 名稱 - 可排序的分店名稱
 * 3. 地址 - 分店地址
 * 4. 建立時間 - 格式化的建立日期
 * 5. 更新時間 - 格式化的更新日期
 * 6. 操作 - 下拉選單包含編輯、刪除
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
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <div className="text-center" data-oid="3dd96ri">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="mwfovwb"
            >
              ID
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="onn79_n" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="font-mono text-sm text-center" data-oid="lx46d:x">
            #{row.getValue("id")}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div className="text-center" data-oid="dkc1bk6">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="jf1t0ao"
            >
              <StoreIcon className="mr-2 h-4 w-4" data-oid="aw:qo6d" />
              名稱
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="x804fz5" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center" data-oid="rgcx:8e">
            <Badge
              variant="secondary"
              className="font-medium"
              data-oid="c7.6jks"
            >
              {row.getValue("name") || "未知分店"}
            </Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "address",
      header: () => (
        <div className="text-center" data-oid="_y-x4ha">
          地址
        </div>
      ),

      cell: ({ row }) => {
        const address = row.getValue("address") as string | null;
        return (
          <div
            className="max-w-[300px] truncate text-center"
            data-oid="v6vuqr4"
          >
            {address || (
              <span className="text-muted-foreground" data-oid="3d80xkq">
                未設定地址
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => {
        return (
          <div className="text-center" data-oid="s1e2xtq">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="3n32a2r"
            >
              建立時間
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="4ztrd0." />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const dateString = row.getValue("created_at") as string;
        if (!dateString)
          return (
            <div
              className="text-muted-foreground text-center"
              data-oid="lz84d9f"
            >
              -
            </div>
          );

        try {
          return (
            <div className="text-sm text-center" data-oid="zgg:_74">
              {format(new Date(dateString), "yyyy-MM-dd", { locale: zhTW })}
            </div>
          );
        } catch {
          return (
            <div
              className="text-muted-foreground text-center"
              data-oid="_3bnk3_"
            >
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
          <div className="text-center" data-oid="canv13i">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="omlmbns"
            >
              更新時間
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="bv3et_4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        const dateString = row.getValue("updated_at") as string;
        if (!dateString)
          return (
            <div
              className="text-muted-foreground text-center"
              data-oid="0w4_hja"
            >
              -
            </div>
          );

        try {
          return (
            <div className="text-sm text-center" data-oid="i4axwa8">
              {format(new Date(dateString), "yyyy-MM-dd", { locale: zhTW })}
            </div>
          );
        } catch {
          return (
            <div
              className="text-muted-foreground text-center"
              data-oid="570hq_3"
            >
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
        <div className="text-center" data-oid="v976.4_">
          操作
        </div>
      ),

      cell: ({ row }) => {
        const store = row.original;

        return (
          <div className="text-center" data-oid="x0wtevi">
            <DropdownMenu data-oid="b.lvou:">
              <DropdownMenuTrigger asChild data-oid="xb:xtfg">
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  data-oid="f9dzoi9"
                >
                  <span className="sr-only" data-oid="z7ybdz3">
                    開啟選單
                  </span>
                  <MoreHorizontal className="h-4 w-4" data-oid="uzv6x5c" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-oid="sjtk._f">
                <DropdownMenuLabel data-oid="2itmlkk">操作</DropdownMenuLabel>
                <DropdownMenuSeparator data-oid="0.kvo3v" />

                {actions.onEdit && (
                  <DropdownMenuItem
                    onClick={() => actions.onEdit?.(store)}
                    className="cursor-pointer"
                    data-oid="zbb6ahr"
                  >
                    <Edit className="mr-2 h-4 w-4" data-oid="_cs-5a7" />
                    編輯分店
                  </DropdownMenuItem>
                )}

                {actions.onDelete && (
                  <DropdownMenuItem
                    onClick={() => actions.onDelete?.(store)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    data-oid="f3jho7f"
                  >
                    <Trash2 className="mr-2 h-4 w-4" data-oid="cdapaux" />
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
