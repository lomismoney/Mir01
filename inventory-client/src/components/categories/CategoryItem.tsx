"use client";

import { useState } from "react";
import { ChevronRight, MoreHorizontal, Edit, Trash, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CategoryTree } from "./CategoryTree";
import { Category } from "@/types/category";

/**
 * CategoryItem 元件屬性介面
 *
 * @param category - 當前分類資料
 * @param allCategories - 所有分類的分組資料（按 parent_id 分組）
 * @param onEdit - 編輯分類的回調函數
 * @param onDelete - 刪除分類的回調函數
 * @param onAddSubCategory - 新增子分類的回調函數
 */
interface CategoryItemProps {
  category: Category;
  allCategories: Record<string, Category[]>;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onAddSubCategory?: (parentId: number) => void;
}

/**
 * 單一分類項目元件（遞迴核心）
 *
 * 這是分類樹狀結構的核心遞迴元件，負責：
 * 1. 顯示單個分類的基本資訊
 * 2. 提供展開/收合功能控制子分類顯示
 * 3. 遞迴調用 CategoryTree 來顯示子分類
 * 4. 提供完整的操作選單（編輯、刪除、新增子分類）
 *
 * 功能特色：
 * - 智能展開控制（無子分類時禁用展開按鈕）
 * - 平滑的動畫效果（箭頭旋轉）
 * - 滑鼠懸停效果增強用戶體驗
 * - 完整的 CRUD 操作選單
 * - 遞迴傳遞事件處理函數
 *
 * @param category - 要顯示的分類資料
 * @param allCategories - 完整分類分組資料，用於查找子分類
 * @param onEdit - 編輯分類的事件處理函數
 * @param onDelete - 刪除分類的事件處理函數
 * @param onAddSubCategory - 新增子分類的事件處理函數
 * @returns 渲染的分類項目及其子樹
 */
export function CategoryItem({
  category,
  allCategories,
  onEdit,
  onDelete,
  onAddSubCategory,
}: CategoryItemProps) {
  // 控制當前分類是否展開顯示子分類
  const [isExpanded, setIsExpanded] = useState(false);

  // 從分組資料中獲取當前分類的子分類
  // 使用 category.id 作為 key 查找對應的子分類陣列
  const children = allCategories[category.id.toString()] || [];

  return (
    <div className="my-1" data-oid="q359zik">
      {/* 分類項目主要內容區 */}
      <div
        className="flex items-center p-2 rounded-md hover:bg-muted group"
        data-oid="tkvpp_p"
      >
        {/* 展開/收合按鈕 */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={children.length === 0}
          className="mr-2 h-6 w-6 p-0"
          data-oid="dp7xzlz"
        >
          <ChevronRight
            className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-90" : ""} ${children.length === 0 ? "opacity-0" : ""}`}
            data-oid="3m62z_d"
          />
        </Button>

        {/* 分類名稱顯示區 */}
        <span className="flex-1 font-medium" data-oid="p7orw93">
          {category.name}
        </span>

        {/* 分類描述 */}
        {category.description && (
          <span
            className="text-xs text-muted-foreground mr-2 max-w-40 truncate"
            data-oid="z6dt_fz"
          >
            {category.description}
          </span>
        )}

        {/* 子分類計數器 */}
        {children.length > 0 && (
          <span
            className="text-xs text-muted-foreground mr-2 bg-muted rounded-full px-2 py-0.5"
            data-oid=".f96.3:"
          >
            {children.length}
          </span>
        )}

        {/* 操作選單 */}
        <DropdownMenu data-oid="1.vmz04">
          <DropdownMenuTrigger asChild data-oid="me8q-_v">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              data-oid="sjmo-6d"
            >
              <MoreHorizontal className="h-3 w-3" data-oid="zmibe0l" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="0:dtyae">
            {onAddSubCategory && (
              <>
                <DropdownMenuItem
                  onClick={() => onAddSubCategory(category.id)}
                  data-oid="x154-fq"
                >
                  <Plus className="mr-2 h-4 w-4" data-oid="3ky6so1" />
                  新增子分類
                </DropdownMenuItem>
                <DropdownMenuSeparator data-oid="4sqyfd." />
              </>
            )}
            {onEdit && (
              <DropdownMenuItem
                onClick={() => onEdit(category)}
                data-oid="tt.j.7w"
              >
                <Edit className="mr-2 h-4 w-4" data-oid="gzw3me0" />
                編輯分類
              </DropdownMenuItem>
            )}
            {onDelete && (
              <DropdownMenuItem
                onClick={() => onDelete(category)}
                className="text-destructive focus:text-destructive"
                data-oid="vu72p_0"
              >
                <Trash className="mr-2 h-4 w-4" data-oid="9mrbkqs" />
                刪除分類
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* 子分類遞迴展示區 */}
      {isExpanded && children.length > 0 && (
        <CategoryTree
          categories={children}
          allCategories={allCategories}
          onEdit={onEdit}
          onDelete={onDelete}
          onAddSubCategory={onAddSubCategory}
          data-oid="kdpqkvu"
        />
      )}
    </div>
  );
}
