"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  ChevronRight,
  MoreHorizontal,
  Edit,
  Trash2,
  Plus,
  Folder,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { CategoryNode } from "@/hooks";

// 定義分類操作介面
export interface CategoryActions {
  onAddSubCategory?: (parentId: number) => void;
  onEdit?: (category: CategoryNode) => void;
  onDelete?: (category: CategoryNode) => void;
}

/**
 * 建立分類表格欄位定義
 * 支援樹狀結構展開功能
 */
export const createCategoryColumns = (
  actions: CategoryActions = {},
): ColumnDef<CategoryNode>[] => {
  const columns: ColumnDef<CategoryNode>[] = [
    {
      accessorKey: "name",
      header: "分類名稱",
      cell: ({ row }) => {
        const canExpand = row.getCanExpand();
        const toggleExpanded = row.getToggleExpandedHandler();

        return (
          <div
            style={{ paddingLeft: `${row.depth * 2}rem` }} // 🎯 根據層級深度，動態計算縮排
            className={`flex items-center gap-2 ${canExpand ? "cursor-pointer" : ""}`}
            onClick={canExpand ? toggleExpanded : undefined} // 整個區域都可以點擊展開
          >
            {/* 展開/收合按鈕或等寬空白 */}
            {canExpand ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation(); // 防止觸發兩次
                  toggleExpanded();
                }}
                className="h-6 w-6"
              >
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${row.getIsExpanded() ? "rotate-90" : ""}`} // 🎯 展開時旋轉圖標
                />
              </Button>
            ) : (
              // 沒有子分類時，添加等寬的空白區域
              <div className="h-6 w-6" />
            )}

            {/* 資料夾圖標 */}
            {row.getIsExpanded() ? (
              <FolderOpen
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
              />
            ) : (
              <Folder
                className="h-4 w-4 text-muted-foreground flex-shrink-0"
              />
            )}

            {/* 分類名稱 */}
            <span className="font-medium">
              {row.original.name}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "描述",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.description || "暫無描述"}
        </span>
      ),
    },
    {
      id: "statistics",
      header: "統計",
      cell: ({ row }) => {
        const hasChildren =
          row.original.children && row.original.children.length > 0;
        const childCount = row.original.children?.length || 0;

        return (
          <div className="flex items-center gap-2">
            {hasChildren && (
              <Badge variant="outline">
                {childCount} 個子分類
              </Badge>
            )}
            <Badge variant="outline">
              {row.original.total_products_count || 0} 個商品
            </Badge>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const category = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.onAddSubCategory && (
                <>
                  <DropdownMenuItem
                    onClick={() => actions.onAddSubCategory?.(category.id)}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    新增子分類
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {actions.onEdit && (
                <DropdownMenuItem
                  onClick={() => actions.onEdit?.(category)}
                >
                  <Edit className="mr-2 h-3.5 w-3.5" />
                  編輯分類
                </DropdownMenuItem>
              )}

              {actions.onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => actions.onDelete?.(category)}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  刪除分類
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

  return columns;
};
