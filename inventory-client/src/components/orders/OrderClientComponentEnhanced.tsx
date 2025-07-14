"use client";

import React, { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlusCircle, Zap, TrendingUp, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useOrders,
  useCancelOrder,
  useBatchDeleteOrders,
  useBatchUpdateStatus,
} from "@/hooks";
import { useOrderModalManager, ORDER_MODAL_TYPES } from "@/hooks/useModalManager";
import { useApiErrorHandler } from "@/hooks/useErrorHandler";
import { useOptimisticListOperations } from "@/hooks/useOptimisticUpdate";
import { extractResponseData, extractPaginationMeta } from "@/types/api-responses";
import type { OrdersResponse } from "@/types/api-responses";
import { OrderPreviewModal } from "@/components/orders/OrderPreviewModal";
import { ShipmentFormModal } from "@/components/orders/ShipmentFormModal";
import RecordPaymentModal from "@/components/orders/RecordPaymentModal";
import RefundModal from "@/components/orders/RefundModal";
import { useDebounce } from "@/hooks/use-debounce";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Input } from "@/components/ui/input";
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
import {
  SortingState,
  RowSelectionState,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import { useRouter } from "next/navigation";
import { useEmptyState } from "@/hooks/use-empty-state";
import { EmptyTable, EmptySearch, EmptyError } from "@/components/ui/empty-state";

// 導入虛擬化組件
import { VirtualTable, useVirtualizedTablePerformance, createVirtualizationConfig } from "@/components/ui/virtual-table";
import { getVirtualScrollConfig, performanceMonitor } from "@/lib/performance-config";

/**
 * 增強版訂單管理組件
 * 
 * 新增特性：
 * 1. 虛擬滾動 - 支援大量訂單數據的高性能渲染
 * 2. 性能監控 - 實時顯示虛擬化性能指標
 * 3. 自適應配置 - 根據數據量自動調整虛擬化參數
 */
export function OrderClientComponentEnhanced() {
  // 行選擇狀態管理
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  
  // 篩選狀態管理
  const [filters, setFilters] = useState({
    search: "",
    shipping_status: "all",
    payment_status: "all",
  });
  const debouncedSearch = useDebounce(filters.search, 500);

  // 性能監控狀態
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);

  // Modal 管理器
  const modalManager = useOrderModalManager();
  const { handleError, handleSuccess } = useApiErrorHandler();
  
  // 取消訂單相關狀態
  const [cancelReason, setCancelReason] = useState<string>("");
  const cancelOrderMutation = useCancelOrder();

  // 批量操作狀態
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false);
  const batchDeleteMutation = useBatchDeleteOrders();
  const [batchUpdateConfig, setBatchUpdateConfig] = useState<{
    status_type: "payment_status" | "shipping_status";
    status_value: string;
  } | null>(null);
  const batchUpdateMutation = useBatchUpdateStatus();
  const router = useRouter();

  // 獲取所有訂單數據（不分頁）
  const queryParams = useMemo(() => ({
    page: 1,
    per_page: 10000, // 獲取所有訂單以支援虛擬滾動
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(filters.shipping_status && filters.shipping_status !== "all" && {
      shipping_status: filters.shipping_status,
    }),
    ...(filters.payment_status && filters.payment_status !== "all" && {
      payment_status: filters.payment_status,
    }),
  }), [debouncedSearch, filters.shipping_status, filters.payment_status]);

  const { data, isLoading, error, refetch } = useOrders(queryParams);
  
  // 處理數據
  const rawOrders = useMemo(() => {
    const extractedData = extractResponseData(data as OrdersResponse);
    return extractedData || [];
  }, [data]);

  // 使用虛擬化性能優化
  const { data: optimizedData, performanceMetrics } = useVirtualizedTablePerformance(
    rawOrders,
    {
      enableMetrics: true,
      onMetricsUpdate: (metrics) => {
        if (metrics.renderTime && metrics.renderTime > 100) {
          console.warn(`訂單表格渲染時間過長: ${metrics.renderTime}ms`);
        }
      },
    }
  );

  // 獲取虛擬化配置
  const virtualizationConfig = getVirtualScrollConfig(
    optimizedData.length,
    'orders'
  );

  // 使用空狀態配置
  const { config: emptyConfig, handleAction } = useEmptyState('orders');

  // 創建列定義
  const columns = useMemo(
    () =>
      createColumns({
        handlePreview: (order: ProcessedOrder) => {
          modalManager.openModal(ORDER_MODAL_TYPES.ORDER_PREVIEW, order);
        },
        handleUpdateShipping: (order: ProcessedOrder) => {
          modalManager.openModal(ORDER_MODAL_TYPES.SHIPMENT_FORM, order);
        },
        handleRecordPayment: (order: ProcessedOrder) => {
          modalManager.openModal(ORDER_MODAL_TYPES.RECORD_PAYMENT, order);
        },
        handleRefund: (order: ProcessedOrder) => {
          modalManager.openModal(ORDER_MODAL_TYPES.REFUND, order);
        },
        handleCancelOrder: (order: ProcessedOrder) => {
          modalManager.openModal(ORDER_MODAL_TYPES.CANCEL_ORDER, order);
        },
      }),
    [modalManager]
  );

  // 創建表格實例
  const table = useReactTable({
    data: optimizedData as ProcessedOrder[],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      rowSelection,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    // 虛擬滾動模式下不使用分頁
    manualPagination: true,
    pageCount: 1,
  });

  // 批量刪除處理
  const handleBatchDelete = useCallback(() => {
    const selectedRows = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => optimizedData[parseInt(key)] as ProcessedOrder)
      .filter(Boolean);

    if (selectedRows.length === 0) {
      handleError(new Error("請選擇要刪除的訂單"));
      return;
    }

    setIsBatchDeleteConfirmOpen(true);
  }, [rowSelection, optimizedData, handleError]);

  const confirmBatchDelete = useCallback(() => {
    const selectedIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => optimizedData[parseInt(key)]?.id)
      .filter(Boolean);

    batchDeleteMutation.mutate(
      { order_ids: selectedIds },
      {
        onSuccess: () => {
          handleSuccess(`成功刪除 ${selectedIds.length} 個訂單`);
          setRowSelection({});
          setIsBatchDeleteConfirmOpen(false);
          refetch();
        },
        onError: (error) => {
          handleError(error);
          setIsBatchDeleteConfirmOpen(false);
        },
      }
    );
  }, [rowSelection, optimizedData, batchDeleteMutation, handleSuccess, handleError, refetch]);

  // 批量更新狀態處理
  const handleBatchUpdateStatus = useCallback((
    status_type: "payment_status" | "shipping_status",
    status_value: string
  ) => {
    const selectedRows = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => optimizedData[parseInt(key)] as ProcessedOrder)
      .filter(Boolean);

    if (selectedRows.length === 0) {
      handleError(new Error("請選擇要更新的訂單"));
      return;
    }

    setBatchUpdateConfig({ status_type, status_value });
  }, [rowSelection, optimizedData, handleError]);

  const confirmBatchUpdateStatus = useCallback(() => {
    if (!batchUpdateConfig) return;

    const selectedIds = Object.keys(rowSelection)
      .filter((key) => rowSelection[key])
      .map((key) => optimizedData[parseInt(key)]?.id)
      .filter(Boolean);

    batchUpdateMutation.mutate(
      {
        order_ids: selectedIds,
        status_type: batchUpdateConfig.status_type,
        status_value: batchUpdateConfig.status_value,
      },
      {
        onSuccess: () => {
          handleSuccess(
            `成功更新 ${selectedIds.length} 個訂單的${
              batchUpdateConfig.status_type === "payment_status"
                ? "付款"
                : "運送"
            }狀態`
          );
          setRowSelection({});
          setBatchUpdateConfig(null);
          refetch();
        },
        onError: (error) => {
          handleError(error);
          setBatchUpdateConfig(null);
        },
      }
    );
  }, [batchUpdateConfig, rowSelection, optimizedData, batchUpdateMutation, handleSuccess, handleError, refetch]);

  // 取消訂單處理
  const handleConfirmCancel = useCallback(() => {
    const orderToCancel = modalManager.currentData as ProcessedOrder | null;
    if (!orderToCancel) return;

    cancelOrderMutation.mutate(
      {
        orderId: orderToCancel.id,
        reason: cancelReason,
      },
      {
        onSuccess: () => {
          handleSuccess("訂單已成功取消");
          modalManager.closeModal();
          setCancelReason("");
          refetch();
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  }, [modalManager, cancelReason, cancelOrderMutation, handleSuccess, handleError, refetch]);

  // 性能監控
  React.useEffect(() => {
    performanceMonitor.startMeasure('order-table-render');
    return () => {
      performanceMonitor.endMeasure('order-table-render');
    };
  }, [optimizedData]);

  const shouldUseVirtualization = virtualizationConfig !== null;

  return (
    <div className="space-y-6">
      {/* 性能指標儀表板 */}
      {showPerformanceMetrics && shouldUseVirtualization && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
              <Zap className="h-5 w-5" />
              虛擬化性能監控
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {performanceMetrics.totalItems.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">總訂單數</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {performanceMetrics.estimatedMemorySaving}
                </div>
                <div className="text-xs text-muted-foreground">記憶體節省</div>
              </div>
              
              <div className="text-center">
                <Badge 
                  variant={performanceMetrics.isLargeDataset ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {performanceMetrics.isLargeDataset ? '大數據集' : '標準數據集'}
                </Badge>
              </div>
              
              <div className="text-center">
                <Badge 
                  variant={performanceMetrics.recommendVirtualization ? 'default' : 'outline'}
                  className="text-xs"
                >
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {performanceMetrics.recommendVirtualization ? '已優化' : '無需優化'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 主要內容卡片 */}
      <div className="rounded-lg border bg-card shadow-sm">
        {/* 頭部工具欄 */}
        <div className="border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-lg">
              <Input
                placeholder="搜索訂單編號、客戶名稱..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="h-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {/* 性能監控開關 */}
              {shouldUseVirtualization && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  性能監控
                </Button>
              )}

              {/* 篩選選項 */}
              <Select
                value={filters.shipping_status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, shipping_status: value }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="運送狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending">待處理</SelectItem>
                  <SelectItem value="processing">處理中</SelectItem>
                  <SelectItem value="shipped">已出貨</SelectItem>
                  <SelectItem value="delivered">已送達</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.payment_status}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, payment_status: value }))
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="付款狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="pending">待付款</SelectItem>
                  <SelectItem value="paid">已付款</SelectItem>
                  <SelectItem value="partial">部分付款</SelectItem>
                  <SelectItem value="refunded">已退款</SelectItem>
                  <SelectItem value="failed">付款失敗</SelectItem>
                </SelectContent>
              </Select>

              <Link href="/orders/create">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  新增訂單
                </Button>
              </Link>
            </div>
          </div>

          {/* 批量操作工具欄 */}
          {Object.keys(rowSelection).length > 0 && (
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBatchDelete}
              >
                批量刪除 ({Object.keys(rowSelection).length})
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    批量更新狀態
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>更新付款狀態</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleBatchUpdateStatus("payment_status", "paid")}
                  >
                    已付款
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBatchUpdateStatus("payment_status", "pending")}
                  >
                    待付款
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>更新運送狀態</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => handleBatchUpdateStatus("shipping_status", "processing")}
                  >
                    處理中
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBatchUpdateStatus("shipping_status", "shipped")}
                  >
                    已出貨
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleBatchUpdateStatus("shipping_status", "delivered")}
                  >
                    已送達
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* 表格內容 */}
        {isLoading ? (
          <div className="p-6">
            <DataTableSkeleton columnCount={8} rowCount={10} />
          </div>
        ) : error ? (
          <div className="p-6">
            <EmptyError
              title="載入訂單資料失敗"
              description="無法載入訂單列表，請稍後再試"
              onRetry={() => refetch()}
              showDetails={true}
              error={error}
            />
          </div>
        ) : shouldUseVirtualization ? (
          // 使用虛擬化表格
          <div className="p-6">
            <VirtualTable
              table={table}
              containerHeight={virtualizationConfig.containerHeight}
              estimateSize={virtualizationConfig.estimateSize}
              overscan={virtualizationConfig.overscan}
              className="w-full"
              enableStickyHeader={true}
              emptyMessage={filters.search ? "找不到符合的訂單" : "暫無訂單數據"}
              isLoading={isLoading}
            />
            
            {/* 虛擬化模式信息 */}
            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
              <div>
                虛擬化模式已啟用 - 僅渲染可見行以提升性能
              </div>
              <div>
                共 {table.getFilteredRowModel().rows.length} 個訂單
              </div>
            </div>
          </div>
        ) : (
          // 標準表格模式（數據量小時）
          <div className="p-6">
            <div className="rounded-md border">
              <div className="p-4 text-center text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>目前訂單數量較少（{optimizedData.length} 個）</p>
                <p className="text-sm">當訂單數量超過 100 個時將自動啟用虛擬滾動</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal 組件 */}
      <OrderPreviewModal
        order={modalManager.currentData as ProcessedOrder | null}
        isOpen={modalManager.isModalOpen(ORDER_MODAL_TYPES.ORDER_PREVIEW)}
        onClose={() => modalManager.closeModal()}
      />

      <ShipmentFormModal
        order={modalManager.currentData as ProcessedOrder | null}
        isOpen={modalManager.isModalOpen(ORDER_MODAL_TYPES.SHIPMENT_FORM)}
        onClose={() => modalManager.closeModal()}
        onSuccess={() => {
          refetch();
          modalManager.closeModal();
        }}
      />

      <RecordPaymentModal
        order={modalManager.currentData as ProcessedOrder | null}
        isOpen={modalManager.isModalOpen(ORDER_MODAL_TYPES.RECORD_PAYMENT)}
        onClose={() => modalManager.closeModal()}
        onSuccess={() => {
          refetch();
          modalManager.closeModal();
        }}
      />

      <RefundModal
        order={modalManager.currentData as ProcessedOrder | null}
        isOpen={modalManager.isModalOpen(ORDER_MODAL_TYPES.REFUND)}
        onClose={() => modalManager.closeModal()}
        onSuccess={() => {
          refetch();
          modalManager.closeModal();
        }}
      />

      {/* 取消訂單對話框 */}
      <AlertDialog
        open={modalManager.isModalOpen(ORDER_MODAL_TYPES.CANCEL_ORDER)}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消訂單</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要取消訂單 #
              {(modalManager.currentData as ProcessedOrder)?.order_number} 嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="my-4">
            <label className="text-sm font-medium">取消原因</label>
            <Textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="請輸入取消原因..."
              className="mt-2"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason("")}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              disabled={!cancelReason.trim() || cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? "處理中..." : "確認取消"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量刪除確認對話框 */}
      <AlertDialog
        open={isBatchDeleteConfirmOpen}
        onOpenChange={setIsBatchDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除選中的 {Object.keys(rowSelection).length} 個訂單嗎？
              此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              disabled={batchDeleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {batchDeleteMutation.isPending ? "刪除中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量更新狀態確認對話框 */}
      <AlertDialog
        open={!!batchUpdateConfig}
        onOpenChange={(open) => !open && setBatchUpdateConfig(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量更新</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要將選中的 {Object.keys(rowSelection).length} 個訂單的
              {batchUpdateConfig?.status_type === "payment_status"
                ? "付款狀態"
                : "運送狀態"}
              更新為
              {batchUpdateConfig?.status_value === "paid"
                ? "已付款"
                : batchUpdateConfig?.status_value === "processing"
                ? "處理中"
                : batchUpdateConfig?.status_value === "shipped"
                ? "已出貨"
                : batchUpdateConfig?.status_value === "delivered"
                ? "已送達"
                : batchUpdateConfig?.status_value}
              嗎？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchUpdateStatus}
              disabled={batchUpdateMutation.isPending}
            >
              {batchUpdateMutation.isPending ? "更新中..." : "確認更新"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}