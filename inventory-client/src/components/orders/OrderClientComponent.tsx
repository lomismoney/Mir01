'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link'; // <-- 新增導入
import { Button } from '@/components/ui/button'; // <-- 新增導入
import { PlusCircle } from 'lucide-react'; // <-- 新增導入
import { useOrders, useCancelOrder } from '@/hooks/queries/useEntityQueries'; // 🎯 新增 useCancelOrder
import { OrderPreviewModal } from '@/components/orders/OrderPreviewModal';
import { ShipmentFormModal } from '@/components/orders/ShipmentFormModal';
import RecordPaymentModal from '@/components/orders/RecordPaymentModal';
import RefundModal from '@/components/orders/RefundModal'; // 🎯 新增 RefundModal
import { useDebounce } from '@/hooks/use-debounce';
import { DataTableSkeleton } from '@/components/ui/data-table-skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createColumns } from './columns';
import { Order, ProcessedOrder } from '@/types/api-helpers';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
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
  
  // 🎯 出貨Modal狀態管理
  const [shippingOrderId, setShippingOrderId] = useState<number | null>(null);
  
  // 🎯 部分收款Modal狀態管理
  const [payingOrder, setPayingOrder] = useState<ProcessedOrder | null>(null);
  
  // 🎯 退款Modal狀態管理
  const [refundingOrder, setRefundingOrder] = useState<ProcessedOrder | null>(null);
  
  // 🎯 新增：取消訂單狀態管理
  const [cancellingOrder, setCancellingOrder] = useState<ProcessedOrder | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');
  const cancelOrderMutation = useCancelOrder();

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
  
  // 🎯 建立確認取消的處理函式
  const handleConfirmCancel = () => {
    if (!cancellingOrder) return;
    cancelOrderMutation.mutate(
      { orderId: cancellingOrder.id, reason: cancelReason },
      {
        onSuccess: () => {
          setCancellingOrder(null); // 成功後關閉對話框
          setCancelReason(''); // 清空原因
        },
      }
    );
  };

  // 🎯 創建包含預覽、出貨、收款、退款和取消回調的 columns
  const columns = useMemo(() => createColumns({ 
    onPreview: setPreviewingOrderId,
    onShip: setShippingOrderId,
    onRecordPayment: setPayingOrder,
    onRefund: setRefundingOrder, // 🎯 新增
    onCancel: setCancellingOrder, // 🎯 新增
    onDelete: (id: number) => {
      // 目前使用 deleteOrder hook 在 columns 內部處理
      // 未來可以在這裡添加確認對話框或其他邏輯
    }
  }), []);

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
        onShip={setShippingOrderId}
        onRecordPayment={setPayingOrder}
        onRefund={setRefundingOrder} // 🎯 新增
      />
      
      {/* 🎯 出貨表單模態 */}
      <ShipmentFormModal
        orderId={shippingOrderId!}
        open={!!shippingOrderId}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setShippingOrderId(null);
          }
        }}
      />
      
      {/* 🎯 部分收款模態 */}
      <RecordPaymentModal
        order={payingOrder}
        open={!!payingOrder}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setPayingOrder(null);
          }
        }}
      />
      
      {/* 🎯 退款模態 */}
      <RefundModal
        order={refundingOrder}
        open={!!refundingOrder}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setRefundingOrder(null);
          }
        }}
      />
      
      {/* 🎯 取消訂單確認對話框 */}
      <AlertDialog
        open={!!cancellingOrder}
        onOpenChange={(isOpen) => !isOpen && setCancellingOrder(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消訂單？</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要取消訂單 <strong>{cancellingOrder?.order_number}</strong> 嗎？此操作不可撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="cancel-reason" className="text-sm font-medium">取消原因 (可選)</label>
            <Textarea
              id="cancel-reason"
              placeholder="例如：客戶要求取消..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel} disabled={cancelOrderMutation.isPending}>
              {cancelOrderMutation.isPending ? '處理中...' : '確認取消'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 