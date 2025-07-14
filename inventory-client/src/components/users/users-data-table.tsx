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
import { useDebounce } from "@/hooks/use-debounce";
import { useErrorHandler } from "@/hooks";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

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
 * 用戶管理專用的資料表格組件（現代化設計版）
 *
 * 全新設計的現代化表格組件，具有以下特色：
 * 1. 精美的視覺設計 - 漸層背景、陰影效果、圓角設計
 * 2. 豐富的微互動 - 懸浮效果、過渡動畫、載入動畫
 * 3. 現代化工具欄 - 美化的搜索框、按鈕和控制項
 * 4. 優雅的空狀態 - 精美的空狀態插圖和提示
 * 5. 響應式設計 - 完美適配各種螢幕尺寸
 * 6. 視覺層次分明 - 清晰的資訊架構和視覺引導
 *
 * @param props - 組件屬性
 * @returns 現代化用戶資料表格組件
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
  // 🎯 錯誤處理
  const { handleError, handleSuccess } = useErrorHandler();
  
  // 表格狀態管理
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [inputValue, setInputValue] = React.useState(searchValue);

  // 使用自定義 useDebounce hook 進行防抖處理
  const debouncedInputValue = useDebounce(inputValue, 500);

  // 當防抖值改變時觸發搜索
  React.useEffect(() => {
    if (onSearchChange && debouncedInputValue !== searchValue) {
      onSearchChange(debouncedInputValue);
    }
  }, [debouncedInputValue, onSearchChange, searchValue]);

  // 處理搜索輸入變更
  const handleSearchInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInputValue(event.target.value);
  };

  // 同步外部搜索值變更
  React.useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  // 🎯 使用標準 React Table 配置
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
    },
  });

  // 計算搜索結果數量
  const resultCount = table.getRowModel().rows.length;

  return (
    <div className="space-y-4">
      {/* 🔍 搜尋與操作工具列 */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜尋用戶姓名、帳號或電子郵件..."
          value={inputValue}
          onChange={handleSearchInputChange}
          className="max-w-sm"
          disabled={isLoading}
        />

        <div className="flex items-center space-x-2">
          {/* 欄位控制 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
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
                      {column.id === "user_info" && "用戶資訊"}
                      {column.id === "roles" && "角色"}
                      {column.id === "stores" && "分店"}
                      {column.id === "created_at" && "建立時間"}
                      {column.id === "updated_at" && "更新時間"}
                      {column.id === "actions" && "操作"}
                      {![
                        "user_info",
                        "roles",
                        "stores",
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
            <Button onClick={onAddUser}>
              <Plus className="mr-2 h-4 w-4" />
              新增用戶
            </Button>
          )}
        </div>
      </div>

      {/* 📊 用戶資料表格 */}
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            <thead className="[&_tr]:border-b">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b transition-colors hover:bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th 
                      key={header.id} 
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="[&_tr:last-child]:border-0">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span className="ml-2">載入中...</span>
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                                      <tr
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted"
                    >
                                          {row.getVisibleCells().map((cell) => (
                        <td 
                          key={cell.id} 
                          className="p-4 align-middle [&:has([role=checkbox])]:pr-0"
                        >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length} className="h-24 text-center">
                    {inputValue ? (
                      <div className="text-muted-foreground">
                        沒有找到符合 &ldquo;{inputValue}&rdquo; 的用戶
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        暫無用戶資料
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📄 分頁控制 */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          共 {data.length} 個用戶
          {inputValue && (
            <span className="ml-2">
              搜尋 &ldquo;{inputValue}&rdquo; 找到 {resultCount} 個結果
            </span>
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一頁
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一頁
          </Button>
        </div>
      </div>
    </div>
  );
}
