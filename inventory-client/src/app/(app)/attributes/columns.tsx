"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Tags } from "lucide-react";
import { Attribute } from "@/types/attribute";

/**
 * 規格管理表格欄位定義
 *
 * @description
 * 定義規格管理表格的所有欄位結構，採用現代化 TanStack Table 架構：
 * - 複選框欄位（用於批量操作）
 * - 規格名稱（主要識別資訊）
 * - 規格值數量（顯示該規格下有多少個值）
 * - 創建時間（格式化顯示）
 * - 操作欄位（編輯、刪除）
 *
 * 使用 TanStack Table 的 ColumnDef 類型，確保類型安全
 * 使用統一的 Attribute 類型，支援完整的規格管理功能
 */

/**
 * 安全的日期格式化函數
 *
 * @description
 * 格式化創建時間顯示
 *
 * @param dateString - 日期字串
 * @returns 格式化的日期字串
 */
const formatDate = (dateString?: string) => {
  if (!dateString) {
    return (
      <span className="text-muted-foreground" data-oid="1q7s2xt">
        N/A
      </span>
    );
  }

  try {
    return new Date(dateString).toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    return (
      <span className="text-muted-foreground" data-oid="4c2isgm">
        無效日期
      </span>
    );
  }
};

/**
 * 規格值數量格式化函數
 *
 * @description
 * 計算並格式化規格值數量顯示
 *
 * @param values - 規格值陣列
 * @returns 格式化的數量顯示
 */
const formatValueCount = (values?: Attribute["values"]) => {
  const count = values?.length || 0;

  if (count === 0) {
    return (
      <Badge
        variant="secondary"
        className="text-muted-foreground"
        data-oid="v7zew:7"
      >
        無值
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-medium" data-oid="l0m:.20">
      <Tags className="h-3 w-3 mr-1" data-oid="t.pzzbl" />
      {count} 個值
    </Badge>
  );
};

// 使用統一的權威 Attribute 類型
export const columns: ColumnDef<Attribute>[] = [
  // 複選框欄位（批量操作）
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="選擇全部"
        className="translate-y-[2px]"
        data-oid="yzd8gzs"
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="選擇此行"
        className="translate-y-[2px]"
        data-oid="e9xn:6q"
      />
    ),

    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // 規格名稱欄位
  {
    accessorKey: "name",
    header: "規格名稱",
    cell: ({ row }) => {
      const name = row.original.name;
      return (
        <div className="font-medium" data-oid="y2liap9">
          {name || (
            <span className="text-muted-foreground" data-oid="6_l-l-n">
              未命名規格
            </span>
          )}
        </div>
      );
    },
  },

  // 規格值數量欄位
  {
    id: "value_count",
    header: "規格值數量",
    cell: ({ row }) => {
      const values = row.original.values;
      return (
        <div className="text-center" data-oid="ni87jy.">
          {formatValueCount(values)}
        </div>
      );
    },
    enableSorting: false,
  },

  // 創建時間欄位
  {
    accessorKey: "created_at",
    header: "創建時間",
    cell: ({ row }) => {
      const createdAt = row.original.created_at;
      return (
        <div className="text-sm" data-oid="81t1cjt">
          {formatDate(createdAt)}
        </div>
      );
    },
  },

  // 操作欄位
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const attribute = row.original;

      const handleEdit = () => {
        // 觸發自定義事件，讓父元件處理編輯邏輯
        window.dispatchEvent(
          new CustomEvent("editAttribute", {
            detail: attribute,
          }),
        );
      };

      const handleDelete = () => {
        // 觸發自定義事件，讓父元件處理刪除邏輯
        window.dispatchEvent(
          new CustomEvent("deleteAttribute", {
            detail: attribute,
          }),
        );
      };

      const handleManageValues = () => {
        // 觸發自定義事件，讓父元件處理管理規格值邏輯
        window.dispatchEvent(
          new CustomEvent("manageAttributeValues", {
            detail: attribute,
          }),
        );
      };

      return (
        <DropdownMenu data-oid="-1d6._6">
          <DropdownMenuTrigger asChild data-oid="0yh4dsc">
            <Button variant="ghost" className="h-8 w-8 p-0" data-oid="p.zq8zi">
              <span className="sr-only" data-oid="rnu6_b2">
                開啟選單
              </span>
              <MoreHorizontal className="h-4 w-4" data-oid="e60sys6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="300abi2">
            <DropdownMenuItem onClick={handleEdit} data-oid="l7:6tw9">
              <Edit className="mr-2 h-4 w-4" data-oid="dm59yck" />
              編輯規格
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleManageValues} data-oid="2q6-sf-">
              <Tags className="mr-2 h-4 w-4" data-oid="wpcj7hv" />
              管理規格值
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive focus:text-destructive"
              data-oid="iyohr84"
            >
              <Trash2 className="mr-2 h-4 w-4" data-oid="5fi3009" />
              刪除規格
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];
