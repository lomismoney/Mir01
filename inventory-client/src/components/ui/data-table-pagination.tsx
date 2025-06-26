import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";
import { Table } from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * DataTable 分頁組件 - 分段進軍終章版本
 *
 * 功能特性：
 * 1. 與 TanStack Table 完全集成
 * 2. 支援手動分頁模式（後端分頁）
 * 3. 頁面大小調整功能
 * 4. 完整的分頁導航控制
 * 5. 響應式設計，適配各種螢幕尺寸
 * 6. 無障礙性支援（ARIA 標籤）
 *
 * @param table - TanStack Table 實例
 */
interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  /** 可選的總數據量顯示 */
  totalCount?: number;
  /** 可選的頁面大小選項 */
  pageSizeOptions?: number[];
}

export function DataTablePagination<TData>({
  table,
  totalCount,
  pageSizeOptions = [10, 15, 20, 30, 50, 100],
}: DataTablePaginationProps<TData>) {
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageSize = table.getState().pagination.pageSize;
  const totalPages = table.getPageCount();

  // 計算顯示的數據範圍
  const startRow = table.getState().pagination.pageIndex * pageSize + 1;
  const endRow = Math.min(
    startRow + pageSize - 1,
    totalCount || table.getFilteredRowModel().rows.length,
  );
  const totalRows = totalCount || table.getFilteredRowModel().rows.length;

  return (
    <div
      className="flex items-center justify-between px-2 py-4"
      data-oid="oiut59c"
    >
      {/* 左側：頁面大小選擇器 */}
      <div className="flex items-center space-x-2" data-oid="nq.qtfq">
        <p className="text-sm font-medium" data-oid="28ex0g0">
          每頁顯示
        </p>
        <Select
          value={`${pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
          data-oid="aykvlh0"
        >
          <SelectTrigger className="h-8 w-[70px]" data-oid="1omtmkk">
            <SelectValue placeholder={pageSize} data-oid="_i:3se6" />
          </SelectTrigger>
          <SelectContent side="top" data-oid="1ntttce">
            {pageSizeOptions.map((pageSize) => (
              <SelectItem
                key={pageSize}
                value={`${pageSize}`}
                data-oid="0o._0.c"
              >
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm font-medium" data-oid="dn4jkvj">
          筆
        </p>
      </div>

      {/* 中間：數據範圍顯示 */}
      <div
        className="flex items-center justify-center text-sm font-medium"
        data-oid="-80-ve6"
      >
        顯示第 {startRow} - {endRow} 筆，共 {totalRows} 筆
      </div>

      {/* 右側：分頁導航 */}
      <div className="flex items-center space-x-2" data-oid="79e5:ui">
        {/* 頁面信息 */}
        <div className="flex items-center space-x-2" data-oid="bl3wt_o">
          <p className="text-sm font-medium" data-oid=":dnv9v_">
            第 {currentPage} 頁，共 {totalPages} 頁
          </p>
        </div>

        {/* 分頁按鈕 */}
        <div className="flex items-center space-x-1" data-oid="giy7_xm">
          {/* 第一頁 */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="跳到第一頁"
            data-oid="-lrdwe5"
          >
            <ChevronsLeftIcon className="h-4 w-4" data-oid="wgwy9ig" />
          </Button>

          {/* 上一頁 */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="上一頁"
            data-oid="5l.0z3o"
          >
            <ChevronLeftIcon className="h-4 w-4" data-oid="y3n-t5l" />
          </Button>

          {/* 下一頁 */}
          <Button
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="下一頁"
            data-oid="6_e:hh0"
          >
            <ChevronRightIcon className="h-4 w-4" data-oid="lb.d-5o" />
          </Button>

          {/* 最後一頁 */}
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="跳到最後一頁"
            data-oid="78xt4dq"
          >
            <ChevronsRightIcon className="h-4 w-4" data-oid="fe.rj2." />
          </Button>
        </div>
      </div>
    </div>
  );
}
