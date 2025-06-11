"use client"

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Plus, Edit, Trash2, ChevronRight, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Category } from "@/types/category"
import { cn } from "@/lib/utils"

/**
 * 分類操作處理器介面
 * 
 * 定義分類表格中各種操作的回調函數
 * 遵循統一的操作介面設計模式
 */
export interface CategoryActions {
  /** 編輯分類 */
  onEdit: (category: Category) => void
  /** 刪除分類 */
  onDelete: (category: Category) => void
  /** 新增子分類 */
  onAddSubCategory: (parentId: number) => void
}

/**
 * 建立分類表格欄位定義
 * 
 * 根據 shadcn/ui Data Table 最佳實踐設計的欄位配置，
 * 專為分類層級結構和管理功能優化
 * 
 * 欄位說明：
 * 1. 分類名稱 - 支援層級縮排顯示，包含展開/收合圖示
 * 2. 描述 - 分類說明文字，空值顯示占位符
 * 3. 操作 - 下拉選單包含新增子分類、編輯、刪除功能
 * 
 * 設計特色：
 * - 支援樹狀結構視覺展示
 * - 完整的 CRUD 操作支援
 * - 遵循無障礙設計原則
 * - 統一的視覺風格與交互模式
 * 
 * @param actions - 操作處理器（包含編輯、刪除、新增子分類功能）
 * @returns 欄位定義陣列
 */
export const getCategoryColumns = (actions: CategoryActions): ColumnDef<Category>[] => [
  {
    accessorKey: "name",
    header: "分類名稱",
    cell: ({ row }) => {
      // const category = row.original
      const canExpand = row.getCanExpand()
      const isExpanded = row.getIsExpanded()
      
      return (
        <div 
          className={cn(
            "flex items-center",
            canExpand && "cursor-pointer"
          )}
          style={{ paddingLeft: `${row.depth * 1.5}rem` }}
          onClick={canExpand ? row.getToggleExpandedHandler() : undefined}
        >
          {/* 展開/收合按鈕 */}
          {canExpand ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 mr-2"
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡到外層 div
                row.getToggleExpandedHandler()();
              }}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          ) : (
            <div className="mr-8" /> // 保持對齊，留出展開按鈕的空間
          )}
          
          <div className="font-medium">
            {row.getValue("name") || "未命名分類"}
          </div>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "description",
    header: "商品數量",
    cell: ({ row }) => {
      const description = row.getValue("description") as string
      
      return (
        <div className="text-sm text-muted-foreground">
          {description || "-"}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    id: "actions",
    header: () => (
      <div className="text-right">操作</div>
    ),
    cell: ({ row }) => {
      const category = row.original

      return (
        <div className="flex items-center justify-end gap-2">
          {/* 新增子分類按鈕 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => actions.onAddSubCategory(category.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
          
          {/* 編輯按鈕 */}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => actions.onEdit(category)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {/* 更多操作下拉選單 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>分類操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => actions.onDelete(category)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
  },
] 