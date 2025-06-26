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
import { ChevronDown, Plus, Search } from "lucide-react";
import debounce from "lodash.debounce";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * 用戶資料表格組件的屬性介面
 *
 * @template TData - 表格資料的類型
 * @template TValue - 表格值的類型
 */
interface UsersDataTableProps<TData, TValue> {
  /** 表格欄位定義 */
  columns: ColumnDef<TData, TValue>[];
  /** 表格資料 */
  data: TData[];
  /** 是否顯示新增用戶按鈕 */
  showAddButton?: boolean;
  /** 新增用戶按鈕點擊處理器 */
  onAddUser?: () => void;
  /** 是否正在載入資料 */
  isLoading?: boolean;
  /** 搜索值 */
  searchValue?: string;
  /** 搜索值變更處理器 */
  onSearchChange?: (value: string) => void;
}

/**
 * 用戶管理專用的資料表格組件（後端搜索版本）
 *
 * 基於 shadcn/ui 和 TanStack React Table 構建的專業資料表格，
 * 專門為用戶管理功能設計，支援後端搜索功能。
 *
 * 功能特色：
 * 1. 響應式設計 - 適應不同螢幕尺寸
 * 2. 後端搜尋過濾 - 支援按姓名和帳號搜尋（使用 UserSearchFilter）
 * 3. 欄位排序 - 點擊表頭進行排序
 * 4. 欄位顯示控制 - 動態顯示/隱藏欄位
 * 5. 分頁功能 - 大量資料的分頁顯示
 * 6. 載入狀態 - 優雅的載入動畫
 * 7. 空狀態處理 - 無資料時的友善提示
 * 8. 操作按鈕 - 整合新增用戶功能
 * 9. 防抖搜索 - 避免過度請求後端 API
 *
 * @param props - 組件屬性
 * @returns 用戶資料表格組件
 */
export function UsersDataTable<TData, TValue>({
  columns,
  data,
  showAddButton = true,
  onAddUser,
  isLoading = false,
  searchValue = "",
  onSearchChange,
}: UsersDataTableProps<TData, TValue>) {
  // 表格狀態管理（移除前端過濾相關狀態）
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [inputValue, setInputValue] = React.useState(searchValue);

  // 防抖搜索處理 - 避免每次輸入都觸發 API 請求
  const debouncedSearch = React.useMemo(() => {
    if (!onSearchChange) return undefined;

    return debounce((value: string) => {
      onSearchChange(value);
    }, 500); // 500ms 延遲
  }, [onSearchChange]);

  // 處理搜索輸入變更
  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = event.target.value;
    setInputValue(value);

    if (debouncedSearch) {
      debouncedSearch(value);
    }
  };

  // 同步外部搜索值變更
  React.useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  // 初始化表格實例（移除前端過濾功能，因為使用後端搜索）
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
    <div className="w-full space-y-4">
      {/* 工具列 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {/* 後端搜尋輸入框 */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

            <Input
              placeholder="搜尋用戶姓名或帳號..."
              value={inputValue}
              onChange={handleSearchInputChange}
              className="pl-8"
              disabled={isLoading}
            />
          </div>
          {isLoading && (
            <div className="flex items-center text-sm text-muted-foreground">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent mr-2"></div>
              搜尋中...
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 欄位顯示控制 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                欄位 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
                    >
                      {column.id === "name" && "姓名"}
                      {column.id === "username" && "帳號"}
                      {column.id === "role" && "角色"}
                      {column.id === "created_at" && "建立時間"}
                      {column.id === "updated_at" && "更新時間"}
                      {column.id === "actions" && "操作"}
                      {![
                        "name",
                        "username",
                        "role",
                        "created_at",
                        "updated_at",
                        "actions",
                      ].includes(column.id) && column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 新增用戶按鈕 */}
          {showAddButton && onAddUser && (
            <Button onClick={onAddUser} className="ml-2">
              <Plus className="mr-2 h-4 w-4" />
              新增用戶
            </Button>
          )}
        </div>
      </div>

      {/* 資料表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
          <TableBody>
            {isLoading ? (
              // 載入狀態
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <span>載入中...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              // 有資料時顯示表格行
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="text-muted-foreground">
                      {searchValue
                        ? `沒有找到符合 "${searchValue}" 的用戶`
                        : "沒有找到用戶資料"}
                    </div>
                    {showAddButton && onAddUser && !searchValue && (
                      <Button
                        variant="outline"
                        onClick={onAddUser}
                        className="mt-2"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        建立第一個用戶
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
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {data.length} 個用戶
          {searchValue && ` (搜尋: "${searchValue}")`}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage() || isLoading}
          >
            上一頁
          </Button>
          <div className="flex items-center space-x-1">
            <span className="text-sm text-muted-foreground">
              第 {table.getState().pagination.pageIndex + 1} 頁， 共{" "}
              {table.getPageCount()} 頁
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage() || isLoading}
          >
            下一頁
          </Button>
        </div>
      </div>
    </div>
  );
}
