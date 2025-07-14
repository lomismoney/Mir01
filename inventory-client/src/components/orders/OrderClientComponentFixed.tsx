"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  useOrders,
  useCancelOrder,
  useDeleteOrder,
  useBatchDeleteOrders,
  useBatchUpdateStatus,
  useVirtualizedTable,
} from "@/hooks";
import { useOrderModalManager, ORDER_MODAL_TYPES } from "@/hooks/useModalManager";
import { useApiErrorHandler } from "@/hooks/useErrorHandler";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Input } from "@/components/ui/input";
import { AdaptiveTable } from "@/components/ui/AdaptiveTable";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createColumns } from "./columns";
import { ProcessedOrder } from "@/types/api-helpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import {
  SortingState,
  PaginationState,
  type RowSelectionState,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEmptyState } from "@/hooks/use-empty-state";
import { EmptyTable, EmptySearch, EmptyError } from "@/components/ui/empty-state";
import { OrderPreviewModal } from "@/components/orders/OrderPreviewModal";
import { ShipmentFormModal } from "@/components/orders/ShipmentFormModal";
import RecordPaymentModal from "@/components/orders/RecordPaymentModal";
import RefundModal from "@/components/orders/RefundModal";

export function OrderClientComponentFixed() {
  // 分頁狀態管理
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, // 從 0 開始
    pageSize: 15,
  });

  // 行選擇狀態管理
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // 篩選狀態管理
  const [filters, setFilters] = useState({
    search: "",
    shipping_status: "",
    payment_status: "",
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  // Modal 管理器
  const modalManager = useOrderModalManager();
  const { handleError, handleSuccess } = useApiErrorHandler();
  
  // 取消訂單相關狀態
  const [cancelReason, setCancelReason] = useState<string>("");
  const cancelOrderMutation = useCancelOrder();
  
  // 刪除訂單相關狀態
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const deleteOrderMutation = useDeleteOrder();

  // 批量刪除狀態管理
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false);
  const batchDeleteMutation = useBatchDeleteOrders();

  // 批量更新狀態管理
  const [batchUpdateConfig, setBatchUpdateConfig] = useState<{
    status_type: "payment_status" | "shipping_status";
    status_value: string;
  } | null>(null);
  const batchUpdateMutation = useBatchUpdateStatus();

  // 分頁聯動到 useOrders Hook
  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      shipping_status: filters.shipping_status || undefined,
      payment_status: filters.payment_status || undefined,
      page: pagination.pageIndex + 1, // API 從 1 開始
      per_page: pagination.pageSize,
    }),
    [
      debouncedSearch,
      filters.shipping_status,
      filters.payment_status,
      pagination.pageIndex,
      pagination.pageSize,
    ],
  );

  // 使用真實的數據獲取 Hook
  const { data: response, isLoading, isError, error } = useOrders(queryFilters);

  // 表格狀態管理
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // 🎯 正確解析響應數據
  const pageData = response?.data || [];
  const meta = response?.meta;

  // 使用空狀態配置
  const { config: emptyConfig, handleAction } = useEmptyState('orders');

  // 搜尋建議
  const suggestions = [
    '訂單編號',
    '客戶名稱',
    '商品名稱',
    'SKU'
  ];

  // 建立確認取消的處理函式
  const handleConfirmCancel = () => {
    const cancellingOrder = modalManager.currentData;
    if (!cancellingOrder) return;
    
    cancelOrderMutation.mutate(
      { orderId: cancellingOrder.id, reason: cancelReason },
      {
        onSuccess: () => {
          modalManager.handleSuccess();
          setCancelReason("");
          handleSuccess('訂單已取消');
        },
        onError: (error) => handleError(error),
      },
    );
  };

  // 建立批量刪除確認處理函式
  const handleConfirmBatchDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedOrderIds = selectedRows.map((row: any) => row.original.id);

    if (selectedOrderIds.length === 0) {
      handleError(new Error("沒有選擇任何訂單"));
      return;
    }

    batchDeleteMutation.mutate(
      { ids: selectedOrderIds },
      {
        onSuccess: () => {
          setIsBatchDeleteConfirmOpen(false);
          table.resetRowSelection();
        },
      },
    );
  };

  // 建立批量更新狀態確認處理函式
  const handleConfirmBatchAction = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedOrderIds = selectedRows.map((row: any) => row.original.id);

    if (selectedOrderIds.length === 0) {
      handleError(new Error("沒有選擇任何訂單"));
      return;
    }

    if (batchUpdateConfig) {
      batchUpdateMutation.mutate(
        {
          ids: selectedOrderIds,
          status_type: batchUpdateConfig.status_type,
          status_value: batchUpdateConfig.status_value,
        },
        {
          onSuccess: () => {
            setBatchUpdateConfig(null);
            table.resetRowSelection();
          },
        },
      );
    }
  };

  // 創建包含預覽、出貨、收款、退款和取消回調的 columns
  const columns = useMemo(
    () =>
      createColumns({
        onPreview: (orderId: number) => modalManager.openModal(ORDER_MODAL_TYPES.PREVIEW, orderId),
        onShip: (orderId: number) => modalManager.openModal(ORDER_MODAL_TYPES.SHIPMENT, orderId),
        onRecordPayment: (order: ProcessedOrder) => modalManager.openModal(ORDER_MODAL_TYPES.PAYMENT, order),
        onRefund: (order: ProcessedOrder) => modalManager.openModal(ORDER_MODAL_TYPES.REFUND, order),
        onCancel: (order: ProcessedOrder) => modalManager.openModal(ORDER_MODAL_TYPES.CANCEL, order),
        onDelete: (id: number) => {
          setDeleteOrderId(id);
          setIsDeleteConfirmOpen(true);
        },
      }),
    [modalManager],
  );

  // 使用虛擬化表格 Hook
  const virtualizedTableResult = useVirtualizedTable({
    data: pageData,
    columns,
    enableVirtualization: pageData.length > 20,
    rowHeight: 70,

    enableRowSelection: true,
    manualPagination: true,
    pageCount: meta?.last_page ?? -1,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,

    state: {
      sorting,
      pagination,
      rowSelection,
    },
  });

  // 從虛擬化配置中獲取 table 實例
  const { table } = virtualizedTableResult;

  const router = useRouter();

  if (isLoading) {
    return <DataTableSkeleton columns={8} />;
  }

  if (isError) {
    return (
      <div className="rounded-lg border bg-card shadow-sm p-6">
        <EmptyError
          title="載入訂單資料失敗"
          description="無法載入訂單列表，請稍後再試"
          onRetry={() => window.location.reload()}
          showDetails={true}
          error={error}
        />
      </div>
    );
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
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            className="max-w-sm"
          />

          <Select
            value={filters.shipping_status || "all"}
            onValueChange={(value) => {
              const newValue = value === "all" ? "" : value;
              setFilters((prev) => ({ ...prev, shipping_status: newValue }));
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
              const newValue = value === "all" ? "" : value;
              setFilters((prev) => ({ ...prev, payment_status: newValue }));
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
        <Button asChild>
          <Link href="/orders/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            新增訂單
          </Link>
        </Button>
      </div>

      {/* 批量操作欄 */}
      <div className="flex items-center justify-between">
        <div className="flex-1 text-sm text-muted-foreground">
          已選擇 {table.getFilteredSelectedRowModel().rows.length} 筆 / 總計{" "}
          {meta?.total ?? 0} 筆
        </div>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBatchDeleteConfirmOpen(true)}
              disabled={table.getFilteredSelectedRowModel().rows.length === 0}
            >
              批量刪除
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    table.getFilteredSelectedRowModel().rows.length === 0
                  }
                >
                  批量更新狀態
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>標記付款狀態為</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() =>
                    setBatchUpdateConfig({
                      status_type: "payment_status",
                      status_value: "paid",
                    })
                  }
                >
                  已付款
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    setBatchUpdateConfig({
                      status_type: "payment_status",
                      status_value: "pending",
                    })
                  }
                >
                  待付款
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>標記貨物狀態為</DropdownMenuLabel>
                <DropdownMenuItem
                  onSelect={() =>
                    setBatchUpdateConfig({
                      status_type: "shipping_status",
                      status_value: "shipped",
                    })
                  }
                >
                  已出貨
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    setBatchUpdateConfig({
                      status_type: "shipping_status",
                      status_value: "delivered",
                    })
                  }
                >
                  已送達
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* 使用 AdaptiveTable 組件 */}
      <AdaptiveTable
        table={table}
        className="rounded-lg border bg-card shadow-sm"
        virtualizationOptions={{
          containerHeight: virtualizedTableResult.virtualizationConfig.containerHeight,
          estimateSize: virtualizedTableResult.virtualizationConfig.estimateSize,
          overscan: virtualizedTableResult.virtualizationConfig.overscan,
        }}
        showVirtualizationToggle={true}
        dataType="訂單"
        emptyState={
          filters.search ? (
            <EmptySearch
              searchTerm={filters.search}
              onClearSearch={() => setFilters(prev => ({ ...prev, search: '' }))}
              suggestions={suggestions}
            />
          ) : (
            <EmptyTable
              title={emptyConfig.title}
              description={emptyConfig.description}
              actionLabel={emptyConfig.actionLabel}
              onAction={handleAction}
            />
          )
        }
      />

      {/* 分頁控制器 */}
      <DataTablePagination
        table={table}
        totalCount={meta?.total}
      />

      {/* 訂單預覽模態 */}
      <OrderPreviewModal
        orderId={modalManager.currentData}
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.PREVIEW)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            modalManager.closeModal();
          }
        }}
        onEdit={(order) => {
          router.push(`/orders/${order.id}/edit`);
          modalManager.closeModal();
        }}
        onPrint={(order) => {
          handleSuccess("列印功能開發中");
        }}
        onCancel={(order) => {
          modalManager.openModal(ORDER_MODAL_TYPES.CANCEL, order);
        }}
        onShipOrder={(order) => {
          modalManager.openModal(ORDER_MODAL_TYPES.SHIPMENT, order.id);
        }}
        onRecordPayment={(order) => {
          modalManager.openModal(ORDER_MODAL_TYPES.PAYMENT, order);
        }}
        onRefund={(order) => {
          modalManager.openModal(ORDER_MODAL_TYPES.REFUND, order);
        }}
      />

      {/* 出貨表單模態 */}
      <ShipmentFormModal
        orderId={modalManager.currentData}
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.SHIPMENT)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            modalManager.closeModal();
          }
        }}
      />

      {/* 部分收款模態 */}
      <RecordPaymentModal
        order={modalManager.currentData}
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.PAYMENT)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            modalManager.closeModal();
          }
        }}
      />

      {/* 退款模態 */}
      <RefundModal
        order={modalManager.currentData}
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.REFUND)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            modalManager.closeModal();
          }
        }}
      />

      {/* 取消訂單確認對話框 */}
      <AlertDialog
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.CANCEL)}
        onOpenChange={(isOpen) => !isOpen && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消訂單？</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要取消訂單{" "}
              <strong>{modalManager.currentData?.order_number}</strong>{" "}
              嗎？此操作不可撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="cancel-reason" className="text-sm font-medium">
              取消原因 (可選)
            </label>
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
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? "處理中..." : "確認取消"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 通用批量操作確認對話框 */}
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
              onClick={
                isBatchDeleteConfirmOpen
                  ? handleConfirmBatchDelete
                  : handleConfirmBatchAction
              }
              disabled={
                batchDeleteMutation.isPending || batchUpdateMutation.isPending
              }
              className={
                isBatchDeleteConfirmOpen
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
            >
              {batchDeleteMutation.isPending || batchUpdateMutation.isPending
                ? "處理中..."
                : "確認執行"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除單一訂單確認對話框 */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此訂單嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法撤銷。這將永久刪除選中的訂單。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOrderId(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteOrderId) {
                  deleteOrderMutation.mutate(deleteOrderId, {
                    onSuccess: () => {
                      handleSuccess('訂單已刪除');
                      setIsDeleteConfirmOpen(false);
                      setDeleteOrderId(null);
                    },
                    onError: handleError,
                  });
                }
              }}
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}