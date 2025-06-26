"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
}: StoresDataTableProps<TData, TValue>) {
  // 表格狀態管理
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // 初始化表格實例
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    autoResetPageIndex: false, // 🎯 斬斷循環：禁用分頁自動重設
    state: {
      sorting,
      columnVisibility,
    },
  });

  return (
    <div className="w-full space-y-4" data-oid="zcsmsc3">
      {/* 工具列 */}
      <div className="flex items-center justify-between" data-oid="2ampr58">
        <div className="flex-1" data-oid="ykhs_bk">
          {/* 可以在這裡添加搜尋或其他過濾器 */}
        </div>

        <div className="flex items-center space-x-2" data-oid="tzgji6g">
          {/* 欄位顯示控制 */}
          <DropdownMenu data-oid="xi1561e">
            <DropdownMenuTrigger asChild data-oid="_0pu0.n">
              <Button variant="outline" data-oid="fa.5vpd">
                欄位 <ChevronDown className="ml-2 h-4 w-4" data-oid="3go-kb9" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-oid="akrlz-_">
              {table
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
                      data-oid="rw7b:ef"
                    >
                      {column.id === "id" && "ID"}
                      {column.id === "name" && "名稱"}
                      {column.id === "address" && "地址"}
                      {column.id === "created_at" && "建立時間"}
                      {column.id === "updated_at" && "更新時間"}
                      {column.id === "actions" && "操作"}
                      {![
                        "id",
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
            <Button onClick={onAddStore} data-oid="r4cpopf">
              <Plus className="mr-2 h-4 w-4" data-oid="uecj9:8" />
              新增分店
            </Button>
          )}
        </div>
      </div>

      {/* 資料表格 */}
      <div className="rounded-md border" data-oid="_39ykbo">
        <Table data-oid=".c35nmv">
          <TableHeader data-oid="z-daovy">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b hover:bg-transparent"
                data-oid="iecsy.6"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                      data-oid="b0290mq"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody data-oid="y6x-im_">
            {isLoading ? (
              // 載入狀態
              <TableRow data-oid="heo.f44">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                  data-oid=":gl71z1"
                >
                  <div
                    className="flex items-center justify-center space-x-2"
                    data-oid="vlhums:"
                  >
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
                      data-oid="jh.egqk"
                    ></div>
                    <span data-oid="xhm8t4h">載入中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              // 有資料時顯示表格行
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-oid="unbb9tk"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} data-oid="prfro_s">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              // 無資料狀態
              <TableRow data-oid="2e3l524">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                  data-oid="c01v2fq"
                >
                  <div
                    className="flex flex-col items-center justify-center space-y-2"
                    data-oid="9z5r-f7"
                  >
                    <div className="text-muted-foreground" data-oid="jxiucrf">
                      尚無分店資料
                    </div>
                    {showAddButton && onAddStore && (
                      <Button
                        variant="outline"
                        onClick={onAddStore}
                        className="mt-2"
                        data-oid="7n6pau_"
                      >
                        <Plus className="mr-2 h-4 w-4" data-oid="l56qd60" />
                        建立第一個分店
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁控制和統計資訊 */}
      <div
        className="flex items-center justify-between space-x-2 py-4"
        data-oid="c9jh4xb"
      >
        <div
          className="flex-1 text-sm text-muted-foreground"
          data-oid="cq-g.p5"
        >
          共 {data.length} 個分店
        </div>
        <div className="flex items-center space-x-2" data-oid="ukjlph.">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
            data-oid="9p06u12"
          >
            上一頁
          </Button>
          <div className="flex items-center space-x-1" data-oid="edm68oi">
            <span className="text-sm text-muted-foreground" data-oid="y39x:a_">
              第 {table.getState().pagination.pageIndex + 1} 頁， 共{" "}
              {table.getPageCount()} 頁
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
            data-oid="67m_mg:"
          >
            下一頁
          </Button>
        </div>
      </div>
    </div>
  );
}
