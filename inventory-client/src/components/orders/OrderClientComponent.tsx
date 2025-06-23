'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link'; // <-- 新增導入
import { Button } from '@/components/ui/button'; // <-- 新增導入
import { PlusCircle } from 'lucide-react'; // <-- 新增導入
import { useOrders, useCancelOrder, useBatchDeleteOrders, useBatchUpdateStatus } from '@/hooks/queries/useEntityQueries'; // 🎯 新增 useCancelOrder & useBatchDeleteOrders & useBatchUpdateStatus
import { toast } from 'sonner'; // 🎯 新增 toast 導入
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from '@/components/ui/textarea';
import { DataTablePagination } from '@/components/ui/data-table-pagination'; // 🎯 新增分頁組件導入
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  PaginationState, // 🎯 新增分頁狀態類型
  type RowSelectionState, // 🎯 新增
  getFilteredRowModel, // 🎯 新增 (用於獲取已選項目)
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
  // 🎯 分頁狀態管理 - 分段進軍終章
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 從 0 開始
    pageSize: 15,
  });

  // 🎯 行選擇狀態管理 - 軍團作戰
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

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

  // 🎯 新增：批量刪除狀態管理 - 裁決行動
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false);
  const batchDeleteMutation = useBatchDeleteOrders();

  // 🎯 新增：批量更新狀態管理 - 授旗儀式
  const [batchUpdateConfig, setBatchUpdateConfig] = useState<{ status_type: 'payment_status' | 'shipping_status'; status_value: string; } | null>(null);
  const batchUpdateMutation = useBatchUpdateStatus();

  // 🎯 分頁聯動到 useOrders Hook - 將分頁狀態納入查詢參數
  const queryFilters = useMemo(() => ({
    search: debouncedSearch || undefined,
    shipping_status: filters.shipping_status || undefined,
    payment_status: filters.payment_status || undefined,
    page: pagination.pageIndex + 1, // API 從 1 開始
    per_page: pagination.pageSize,
  }), [debouncedSearch, filters.shipping_status, filters.payment_status, pagination.pageIndex, pagination.pageSize]);

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

  // 🎯 建立批量刪除確認處理函式 - 裁決核心
  const handleConfirmBatchDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedOrderIds = selectedRows.map(row => row.original.id);

    if (selectedOrderIds.length === 0) {
      toast.warning("沒有選擇任何訂單");
      return;
    }

    batchDeleteMutation.mutate(
      { ids: selectedOrderIds },
      {
        onSuccess: () => {
          setIsBatchDeleteConfirmOpen(false); // 成功後關閉對話框
          table.resetRowSelection(); // 清空選擇
        },
      }
    );
  };

  // 🎯 建立批量更新狀態確認處理函式 - 授旗儀式核心
  const handleConfirmBatchAction = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedOrderIds = selectedRows.map(row => row.original.id);

    if (selectedOrderIds.length === 0) {
      toast.warning("沒有選擇任何訂單");
      return;
    }

    // 根據 batchUpdateConfig 執行批量更新
    if (batchUpdateConfig) {
      batchUpdateMutation.mutate(
        { 
          ids: selectedOrderIds,
          status_type: batchUpdateConfig.status_type,
          status_value: batchUpdateConfig.status_value,
        },
        {
          onSuccess: () => {
            setBatchUpdateConfig(null); // 成功後關閉對話框
            table.resetRowSelection(); // 清空選擇
          },
        }
      );
    }
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

  // 🎯 配置表格以啟用手動分頁和行選擇 - 軍團作戰升級
  const table = useReactTable({
    data: pageData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // 🎯 新增
    
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection, // 🎯 新增
    
    manualPagination: true, // 🎯 啟用手動分頁（後端分頁）
    enableRowSelection: true, // 🎯 新增
    pageCount: meta?.last_page ?? -1, // 🎯 從後端獲取總頁數
    
    state: {
      sorting,
      pagination, // 🎯 納入分頁狀態
      rowSelection, // 🎯 新增
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
      
      {/* --- 🎯 新增的批量操作欄 --- */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          已選擇 {table.getFilteredSelectedRowModel().rows.length} 筆 / 總計 {meta?.total ?? 0} 筆
        </div>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setIsBatchDeleteConfirmOpen(true)} // 🎯 解開主炮保險
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            >
              批量刪除
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={table.getFilteredSelectedRowModel().rows.length === 0}>
                  批量更新狀態
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>標記付款狀態為</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setBatchUpdateConfig({ status_type: 'payment_status', status_value: 'paid' })}>
                  已付款
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setBatchUpdateConfig({ status_type: 'payment_status', status_value: 'pending' })}>
                  待付款
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>標記貨物狀態為</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => setBatchUpdateConfig({ status_type: 'shipping_status', status_value: 'shipped' })}>
                  已出貨
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setBatchUpdateConfig({ status_type: 'shipping_status', status_value: 'delivered' })}>
                  已送達
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
      {/* --- 批量操作欄結束 --- */}
      
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
      
      {/* 🎯 分頁控制器 - 分段進軍終章完成 */}
      <DataTablePagination 
        table={table} 
        totalCount={meta?.total} // 傳入後端返回的總數據量
      />

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

      {/* 🎯 通用批量操作確認對話框 - 裁決行動與授旗儀式最後防線 */}
      <AlertDialog
        open={isBatchDeleteConfirmOpen || !!batchUpdateConfig}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setIsBatchDeleteConfirmOpen(false);
            setBatchUpdateConfig(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量操作？</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要對所選的 
              <strong>{table.getFilteredSelectedRowModel().rows.length}</strong> 
              筆訂單執行此操作嗎？
              {isBatchDeleteConfirmOpen && " 此操作不可撤銷。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={isBatchDeleteConfirmOpen ? handleConfirmBatchDelete : handleConfirmBatchAction}
              disabled={batchDeleteMutation.isPending || batchUpdateMutation.isPending}
              className={isBatchDeleteConfirmOpen ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              { (batchDeleteMutation.isPending || batchUpdateMutation.isPending) ? '處理中...' : '確認執行' }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 