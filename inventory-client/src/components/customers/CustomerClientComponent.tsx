"use client";

import React, { useState } from "react";
import {
  useCustomers,
  useCreateCustomer,
} from "@/hooks/queries/useEntityQueries";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Customer } from "@/types/api-helpers";
import { columns } from "./columns";
import { CustomerForm } from "./CustomerForm";

export function CustomerClientComponent() {
  // 【升級】搜尋功能實現
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 【新增】模態框狀態管理
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  // API 查詢 Hook - 現在支援搜尋參數
  const {
    data: customerResponse,
    isLoading,
    isError,
    error,
  } = useCustomers({
    search: debouncedSearchQuery || undefined, // 僅在有值時傳遞
  });

  // 【新增】創建客戶的 Mutation Hook
  const { mutate: createCustomer, isPending: isCreating } = useCreateCustomer();

  // 狀態管理 Hooks
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  // 🎯 純淨消費：直接從 Hook 返回的物件中解構出 data 和 meta
  const customers = customerResponse?.data ?? [];
  const pageMeta = customerResponse?.meta;

  // 【新增】表單提交處理邏輯
  const handleCreateSubmit = (values: any) => {
    createCustomer(values, {
      onSuccess: () => {
        setCreateModalOpen(false); // 成功後關閉彈窗
      },
    });
  };

  // 配置表格（每次渲染都配置，確保 Hooks 順序一致）
  const table = useReactTable({
    data: customers,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  });

  // 【修復】現在才進行條件性渲染，所有 Hooks 都已調用完畢
  if (isLoading) {
    // 顯示骨架屏，提升加載體驗。6 列包含：名稱、電話、行業、付款、時間、操作
    return (
      <DataTableSkeleton
        columns={6}
        rows={5}
        showHeader={false}
        data-oid="q1cih:k"
      />
    );
  }

  if (isError) {
    return (
      <div className="text-red-500" data-oid="krj1zia">
        無法加載客戶資料: {error?.message || "未知錯誤"}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-oid="dfmx2hw">
      {/* 【升級】工具列 - 搜尋與操作按鈕 */}
      <div className="flex items-center justify-between" data-oid="yyerznt">
        <Input
          placeholder="搜尋客戶名稱、電話或統編..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
          data-oid="fptju4r"
        />

        {/* 【新增】新增客戶按鈕與對話框 */}
        <Dialog
          open={isCreateModalOpen}
          onOpenChange={setCreateModalOpen}
          data-oid="cfplh_s"
        >
          <DialogTrigger asChild data-oid=".ai_p__">
            <Button data-oid="6exc4rg">新增客戶</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]" data-oid="jjjzpp9">
            <DialogHeader data-oid="a2t_a61">
              <DialogTitle data-oid="nxg63:a">新增客戶</DialogTitle>
            </DialogHeader>
            <CustomerForm
              isSubmitting={isCreating}
              onSubmit={handleCreateSubmit}
              data-oid=":93cfk2"
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* 表格容器 */}
      <div className="rounded-md border" data-oid="ncku7l0">
        <Table data-oid="db:8idg">
          <TableHeader data-oid="fpapqj5">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b hover:bg-transparent"
                data-oid="62npwkv"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                      data-oid="wj.coop"
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
          <TableBody data-oid="6jywpyl">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  data-oid="nd84i3m"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} data-oid="foizz6:">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow data-oid="vq8bfs6">
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                  data-oid="q7t853m"
                >
                  暫無客戶資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁邏輯將在後續與 meta 對象連接 */}
    </div>
  );
}
