'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link'; // <-- 新增導入
import { Button } from '@/components/ui/button'; // <-- 新增導入
import { PlusCircle } from 'lucide-react'; // <-- 新增導入
import { useOrders } from '@/hooks/queries/useEntityQueries';
import { OrderPreviewModal } from '@/components/orders/OrderPreviewModal';
import { useDebounce } from '@/hooks/use-debounce';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createColumns } from './columns';
import { Order } from '@/types/api-helpers';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrderClientComponent() {
  // 篩選狀態管理
  const [filters, setFilters] = useState({
    search: '',
    shipping_status: '',
    payment_status: '',
  });
  const debouncedSearch = useDebounce(filters.search, 500); // 500ms 防抖

  // 🎯 訂單預覽狀態管理
  const [previewingOrderId, setPreviewingOrderId] = useState<number | null>(null);

  // 使用 useMemo 來避免在每次渲染時都重新創建查詢對象
  const queryFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    shipping_status: filters.shipping_status || undefined,
    payment_status: filters.payment_status || undefined,
  }), [debouncedSearch, filters.shipping_status, filters.payment_status]);

  // 使用真實的數據獲取 Hook
  const { data: response, isLoading, isError, error } = useOrders(queryFilters);
  
  // 表格狀態管理
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // 從響應中解析數據
  const pageData = ((response as any)?.data || []) as Order[];
  const meta = (response as any)?.meta;

  // 🎯 創建包含預覽回調的 columns
  const columns = useMemo(() => createColumns({ onPreview: setPreviewingOrderId }), []);

  // 配置表格
  const table = useReactTable({
    data: pageData,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  if (isLoading) {
    // 預計會有 8 列，顯示 10 行骨架屏
    return <DataTableSkeleton columns={8} />;
  }

  if (isError) {
    return <div className="text-red-500">無法加載訂單資料: {error?.message}</div>;
  }

  return (
    <div className="space-y-4">
      {/* 篩選與操作按鈕區域 */}
      <div className="flex items-center justify-between py-4">
        {/* 左側的篩選/搜尋區域 */}
        <div className="flex items-center gap-2">
          <Input
            placeholder="搜尋訂單號、客戶名稱..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="max-w-sm"
          />
          <Select
            value={filters.shipping_status || "all"}
            onValueChange={(value) => {
              // 如果選擇的是 "all"，則設為空字符串來清除篩選
              const newValue = value === "all" ? "" : value;
              setFilters(prev => ({ ...prev, shipping_status: newValue }));
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="貨物狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="pending">待處理</SelectItem>
              <SelectItem value="processing">處理中</SelectItem>
              <SelectItem value="shipped">已出貨</SelectItem>
              <SelectItem value="delivered">已完成</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.payment_status || "all"}
            onValueChange={(value) => {
              // 如果選擇的是 "all"，則設為空字符串來清除篩選
              const newValue = value === "all" ? "" : value;
              setFilters(prev => ({ ...prev, payment_status: newValue }));
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="付款狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              <SelectItem value="pending">待付款</SelectItem>
              <SelectItem value="partial">部分付款</SelectItem>
              <SelectItem value="paid">已付款</SelectItem>
              <SelectItem value="refunded">已退款</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 右側的操作按鈕區域 */}
        <Link href="/orders/new" passHref>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            新增訂單
          </Button>
        </Link>
      </div>
      
      {/* 表格容器 */}
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
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  暫無訂單資料
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 分頁邏輯將在後續實現 */}

      {/* 🎯 訂單預覽模態 */}
      <OrderPreviewModal
        orderId={previewingOrderId}
        open={!!previewingOrderId} // 當 ID 存在時，open 為 true
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPreviewingOrderId(null); // 當面板關閉時，重置 ID
          }
        }}
      />
    </div>
  );
} 