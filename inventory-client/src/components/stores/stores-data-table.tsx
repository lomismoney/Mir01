"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { useVirtualizedTable, useErrorHandler } from "@/hooks";
import { ChevronDown, Plus, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { AdaptiveTable, TablePresets } from "@/components/ui/AdaptiveTable";

/**
 * 分店資料表格組件的屬性介面
 *
 * @template TData - 表格資料的類型
 * @template TValue - 表格值的類型
 */
interface StoresDataTableProps<TData, TValue> {
  /** 表格欄位定義 */
  columns: ColumnDef<TData, TValue>[];
  /** 表格資料 */
  data: TData[];
  /** 是否顯示新增分店按鈕 */
  showAddButton?: boolean;
  /** 新增分店按鈕點擊處理器 */
  onAddStore?: () => void;
  /** 是否正在載入資料 */
  isLoading?: boolean;
  /** 搜尋值 */
  searchValue?: string;
  /** 搜尋變更處理器 */
  onSearchChange?: (value: string) => void;
}

/**
 * 分店管理專用的資料表格組件
 *
 * 基於 shadcn/ui 和 TanStack React Table 構建的專業資料表格，
 * 專門為分店管理功能設計。
 *
 * 功能特色：
 * 1. 響應式設計 - 適應不同螢幕尺寸
 * 2. 欄位排序 - 點擊表頭進行排序
 * 3. 欄位顯示控制 - 動態顯示/隱藏欄位
 * 4. 分頁功能 - 大量資料的分頁顯示
 * 5. 載入狀態 - 優雅的載入動畫
 * 6. 空狀態處理 - 無資料時的友善提示
 * 7. 操作按鈕 - 整合新增分店功能
 *
 * @param props - 組件屬性
 * @returns 分店資料表格組件
 */
export function StoresDataTable<TData, TValue>({
  columns,
  data,
  showAddButton = true,
  onAddStore,
  isLoading = false,
  searchValue = "",
  onSearchChange,
}: StoresDataTableProps<TData, TValue>) {
  // 🎯 增強的錯誤處理
  const { handleError, handleSuccess } = useErrorHandler();
  
  // 表格狀態管理
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // 🎯 使用虛擬化表格 Hook - 分店列表優化
  const virtualizedTableConfig = useVirtualizedTable({
    data,
    columns,
    enableVirtualization: data.length > 50, // 超過50筆分店時啟用虛擬化
    rowHeight: 60, // 分店行高度
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="w-full space-y-4">
      {/* 🔍 搜尋與操作工具列 */}
      <div className="flex items-center justify-between">
        {onSearchChange && (
          <Input
            placeholder="搜尋分店名稱或地址..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="max-w-sm"
            disabled={isLoading}
          />
        )}

        <div className="flex items-center space-x-2">
          {/* 欄位顯示控制 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                欄位 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {virtualizedTableConfig.table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                     
                    >
                      {column.id === "name" && "名稱"}
                      {column.id === "address" && "地址"}
                      {column.id === "created_at" && "建立時間"}
                      {column.id === "updated_at" && "更新時間"}
                      {column.id === "actions" && "操作"}
                      {![
                        "name",
                        "address",
                        "created_at",
                        "updated_at",
                        "actions",
                      ].includes(column.id) && column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 新增分店按鈕 */}
          {showAddButton && onAddStore && (
            <Button onClick={onAddStore}>
              <Plus className="mr-2 h-4 w-4" />
              新增分店
            </Button>
          )}
        </div>
      </div>

      {/* 🎯 使用 AdaptiveTable 組件 - 分店列表虛擬化 */}
      {isLoading ? (
        <div className="rounded-md border">
          <div className="flex items-center justify-center h-32 space-x-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            <span>載入中...</span>
          </div>
        </div>
      ) : (
        <AdaptiveTable
          table={virtualizedTableConfig.table}
          className="rounded-md border"
          virtualizationOptions={{
            containerHeight: virtualizedTableConfig.virtualizationConfig.containerHeight,
            estimateSize: virtualizedTableConfig.virtualizationConfig.estimateSize,
            overscan: virtualizedTableConfig.virtualizationConfig.overscan,
          }}
          showVirtualizationToggle={true}
          dataType="分店"
        />
      )}

      {/* 分頁控制和統計資訊 */}
      <div
        className="flex items-center justify-between space-x-2 py-4"
       
      >
        <div
          className="flex-1 text-sm text-muted-foreground"
         
        >
          {searchValue ? (
            <span>
              找到 {data.length} 個分店
              <span className="text-xs ml-2">
                {data.length === 0 ? "嘗試調整搜尋條件" : ""}
              </span>
            </span>
          ) : (
            `共 ${data.length} 個分店`
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => virtualizedTableConfig.table.previousPage()}
            disabled={!virtualizedTableConfig.table.getCanPreviousPage() || isLoading}
          >
            上一頁
          </Button>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              第 {virtualizedTableConfig.table.getState().pagination.pageIndex + 1} 頁， 共{" "}
              {virtualizedTableConfig.table.getPageCount()} 頁
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => virtualizedTableConfig.table.nextPage()}
            disabled={!virtualizedTableConfig.table.getCanNextPage() || isLoading}
          >
            下一頁
          </Button>
        </div>
      </div>
    </div>
  );
}
