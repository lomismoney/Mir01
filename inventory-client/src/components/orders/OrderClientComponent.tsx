"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  useOrders,
  useCancelOrder,
  useBatchDeleteOrders,
  useBatchUpdateStatus,
  useVirtualizedTable,
} from "@/hooks";
import { useOrderModalManager, ORDER_MODAL_TYPES } from "@/hooks/useModalManager";
import { useApiErrorHandler } from "@/hooks/useErrorHandler";
import { useOptimisticListOperations } from "@/hooks/useOptimisticUpdate";
import { extractResponseData, extractPaginationMeta } from "@/types/api-responses";
import type { OrdersResponse } from "@/types/api-responses";
import { OrderPreviewModal } from "@/components/orders/OrderPreviewModal";
import { ShipmentFormModal } from "@/components/orders/ShipmentFormModal";
import RecordPaymentModal from "@/components/orders/RecordPaymentModal";
import RefundModal from "@/components/orders/RefundModal"; // 🎯 新增 RefundModal
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
import { Order, ProcessedOrder } from "@/types/api-helpers";
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
import { DataTablePagination } from "@/components/ui/data-table-pagination"; // 🎯 新增分頁組件導入
import {
  SortingState,
  PaginationState, // 🎯 新增分頁狀態類型
  type RowSelectionState, // 🎯 新增
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";

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
    search: "",
    shipping_status: "",
    payment_status: "",
  });
  const debouncedSearch = useDebounce(filters.search, 500); // 500ms 防抖

  // 🎯 統一的 Modal 管理器
  const modalManager = useOrderModalManager();
  const { handleError, handleSuccess } = useApiErrorHandler();
  
  // 🎯 取消訂單相關狀態
  const [cancelReason, setCancelReason] = useState<string>("");
  const cancelOrderMutation = useCancelOrder();

  // 🎯 新增：批量刪除狀態管理 - 裁決行動
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] =
    useState(false);
  const batchDeleteMutation = useBatchDeleteOrders();

  // 🎯 新增：批量更新狀態管理 - 授旗儀式
  const [batchUpdateConfig, setBatchUpdateConfig] = useState<{
    status_type: "payment_status" | "shipping_status";
    status_value: string;
  } | null>(null);
  const batchUpdateMutation = useBatchUpdateStatus();

  // 🎯 分頁聯動到 useOrders Hook - 將分頁狀態納入查詢參數
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

  // 🎯 類型安全的響應數據解析
  const pageData = extractResponseData(response || []);
  const meta = extractPaginationMeta(response || []);

  // 🎯 建立確認取消的處理函式
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

  // 🎯 建立批量刪除確認處理函式 - 裁決核心
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
          setIsBatchDeleteConfirmOpen(false); // 成功後關閉對話框
          table.resetRowSelection(); // 清空選擇
        },
      },
    );
  };

  // 🎯 建立批量更新狀態確認處理函式 - 授旗儀式核心
  const handleConfirmBatchAction = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedOrderIds = selectedRows.map((row: any) => row.original.id);

    if (selectedOrderIds.length === 0) {
      handleError(new Error("沒有選擇任何訂單"));
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
        },
      );
    }
  };

  // 🎯 創建包含預覽、出貨、收款、退款和取消回調的 columns
  const columns = useMemo(
    () =>
      createColumns({
        onPreview: (orderId: number) => modalManager.openModal(ORDER_MODAL_TYPES.PREVIEW, orderId),
        onShip: (orderId: number) => modalManager.openModal(ORDER_MODAL_TYPES.SHIPMENT, orderId),
        onRecordPayment: (order: ProcessedOrder) => modalManager.openModal(ORDER_MODAL_TYPES.PAYMENT, order),
        onRefund: (order: ProcessedOrder) => modalManager.openModal(ORDER_MODAL_TYPES.REFUND, order),
        onCancel: (order: ProcessedOrder) => modalManager.openModal(ORDER_MODAL_TYPES.CANCEL, order),
        onDelete: (id: number) => {
          // 目前使用 deleteOrder hook 在 columns 內部處理
          // 未來可以在這裡添加確認對話框或其他邏輯
        },
      }),
    [modalManager],
  );
  // 🎯 配置表格以啟用手動分頁和行選擇 - 軍團作戰升級
  // 🎯 使用虛擬化表格 Hook - 訂單列表優化
  const virtualizedTableResult = useVirtualizedTable({
    data: pageData,
    columns,
    enableVirtualization: pageData.length > 20, // 超過20筆訂單時啟用虛擬化
    rowHeight: 70, // 訂單行較高，包含更多信息

    enableRowSelection: true, // 支持批量操作
    manualPagination: true, // 啟用後端分頁
    pageCount: meta?.last_page ?? -1,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,


    state: {
      sorting,
      pagination, // 🎯 納入分頁狀態
      rowSelection, // �� 新增
    },
  });

  // 從虛擬化配置中獲取 table 實例用於批量操作
  const { table } = virtualizedTableResult;

  const router = useRouter();

  if (isLoading) {
    // 預計會有 8 列，顯示 10 行骨架屏
    return <DataTableSkeleton columns={8} />;
  }

  if (isError) {
    return (
      <div className="text-red-500">
        無法加載訂單資料: {error?.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 篩選與操作按鈕區域 */}
      <div
        className="flex items-center justify-between py-4"
       
      >
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
              // 如果選擇的是 "all"，則設為空字符串來清除篩選
              const newValue = value === "all" ? "" : value;
              setFilters((prev) => ({ ...prev, shipping_status: newValue }));
            }}
           
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="貨物狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                全部狀態
              </SelectItem>
              <SelectItem value="pending">
                待處理
              </SelectItem>
              <SelectItem value="processing">
                處理中
              </SelectItem>
              <SelectItem value="shipped">
                已出貨
              </SelectItem>
              <SelectItem value="delivered">
                已完成
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.payment_status || "all"}
            onValueChange={(value) => {
              // 如果選擇的是 "all"，則設為空字符串來清除篩選
              const newValue = value === "all" ? "" : value;
              setFilters((prev) => ({ ...prev, payment_status: newValue }));
            }}
           
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="付款狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                全部狀態
              </SelectItem>
              <SelectItem value="pending">
                待付款
              </SelectItem>
              <SelectItem value="partial">
                部分付款
              </SelectItem>
              <SelectItem value="paid">
                已付款
              </SelectItem>
              <SelectItem value="refunded">
                已退款
              </SelectItem>
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
        <div
          className="flex-1 text-sm text-muted-foreground"
         
        >
          已選擇 {table.getFilteredSelectedRowModel().rows.length} 筆 / 總計{" "}
          {meta?.total ?? 0} 筆
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
                <DropdownMenuLabel>
                  標記付款狀態為
                </DropdownMenuLabel>
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
                <DropdownMenuLabel>
                  標記貨物狀態為
                </DropdownMenuLabel>
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
      {/* --- 批量操作欄結束 --- */}

      {/* 🎯 使用 AdaptiveTable 組件 - 訂單列表虛擬化 */}
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
      />

      {/* 🎯 分頁控制器 - 分段進軍終章完成 */}
      <DataTablePagination
        table={table}
        totalCount={meta?.total} // 傳入後端返回的總數據量
       
      />

      {/* 🎯 訂單預覽模態 */}
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

      {/* 🎯 出貨表單模態 */}
      <ShipmentFormModal
        orderId={modalManager.currentData}
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.SHIPMENT)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            modalManager.closeModal();
          }
        }}
      />

      {/* 🎯 部分收款模態 */}
      <RecordPaymentModal
        order={modalManager.currentData}
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.PAYMENT)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            modalManager.closeModal();
          }
        }}
      />

      {/* 🎯 退款模態 */}
      <RefundModal
        order={modalManager.currentData}
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.REFUND)}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            modalManager.closeModal();
          }
        }}
      />

      {/* 🎯 取消訂單確認對話框 */}
      <AlertDialog
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.CANCEL)}
        onOpenChange={(isOpen) => !isOpen && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              確認取消訂單？
            </AlertDialogTitle>
            <AlertDialogDescription>
              您確定要取消訂單{" "}
              <strong>
                {modalManager.currentData?.order_number}
              </strong>{" "}
              嗎？此操作不可撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label
              htmlFor="cancel-reason"
              className="text-sm font-medium"
            >
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
            <AlertDialogTitle>
              確認批量操作？
            </AlertDialogTitle>
            <AlertDialogDescription>
              您確定要對所選的
              <strong>
                {table.getFilteredSelectedRowModel().rows.length}
              </strong>
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
    </div>
  );
}
