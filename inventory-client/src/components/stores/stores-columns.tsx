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
          <div className="text-center" data-oid="qf:-_zf">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="fimz6sv"
            >
              ID
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="_:pn9a4" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="font-mono text-sm text-center" data-oid="mdbrg.9">
            #{row.getValue("id")}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <div className="text-center" data-oid="2xt2j1.">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="4u5anaf"
            >
              <StoreIcon className="mr-2 h-4 w-4" data-oid="jjcps94" />
              名稱
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="js0s.7c" />
            </Button>
          </div>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center" data-oid="4ib:-:7">
            <Badge
              variant="secondary"
              className="font-medium"
              data-oid="0cqm-mm"
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
        <div className="text-center" data-oid="km::4-c">
          地址
        </div>
      ),

      cell: ({ row }) => {
        const address = row.getValue("address") as string | null;
        return (
          <div
            className="max-w-[300px] truncate text-center"
            data-oid=":_dojrc"
          >
            {address || (
              <span className="text-muted-foreground" data-oid="fupioew">
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
          <div className="text-center" data-oid=":vmstxw">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="_s7veh5"
            >
              建立時間
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="--xrfo5" />
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
              data-oid="d9b0z:b"
            >
              -
            </div>
          );

        try {
          return (
            <div className="text-sm text-center" data-oid="men871i">
              {format(new Date(dateString), "yyyy-MM-dd", { locale: zhTW })}
            </div>
          );
        } catch {
          return (
            <div
              className="text-muted-foreground text-center"
              data-oid="g_89hpu"
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
          <div className="text-center" data-oid="b.l.dty">
            <Button
              variant="ghost"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
              className="h-auto p-0 font-medium"
              data-oid="9ckc.6h"
            >
              更新時間
              <ArrowUpDown className="ml-2 h-4 w-4" data-oid="saxpdiq" />
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
              data-oid="lbgl0vz"
            >
              -
            </div>
          );

        try {
          return (
            <div className="text-sm text-center" data-oid="11lczc3">
              {format(new Date(dateString), "yyyy-MM-dd", { locale: zhTW })}
            </div>
          );
        } catch {
          return (
            <div
              className="text-muted-foreground text-center"
              data-oid="vbkae:-"
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
        <div className="text-center" data-oid="7o.-f-e">
          操作
        </div>
      ),

      cell: ({ row }) => {
        const store = row.original;

        return (
          <div className="text-center" data-oid="65::g-4">
            <DropdownMenu data-oid="3cph87w">
              <DropdownMenuTrigger asChild data-oid="t05io9b">
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  data-oid="amapnxg"
                >
                  <span className="sr-only" data-oid="e5oa5ek">
                    開啟選單
                  </span>
                  <MoreHorizontal className="h-4 w-4" data-oid="9m_0nph" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-oid="0ehomqh">
                <DropdownMenuLabel data-oid="qrtm1dm">操作</DropdownMenuLabel>
                <DropdownMenuSeparator data-oid=".:90c7i" />

                {actions.onEdit && (
                  <DropdownMenuItem
                    onClick={() => actions.onEdit?.(store)}
                    className="cursor-pointer"
                    data-oid="o:5d4d9"
                  >
                    <Edit className="mr-2 h-4 w-4" data-oid="prjwp9u" />
                    編輯分店
                  </DropdownMenuItem>
                )}

                {actions.onDelete && (
                  <DropdownMenuItem
                    onClick={() => actions.onDelete?.(store)}
                    className="cursor-pointer text-destructive focus:text-destructive"
                    data-oid="zpz3mw_"
                  >
                    <Trash2 className="mr-2 h-4 w-4" data-oid="gj.201o" />
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
