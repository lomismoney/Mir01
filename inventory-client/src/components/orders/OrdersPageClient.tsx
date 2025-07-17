"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlusCircle, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  useOrders,
  useDeleteOrder,
  useBatchDeleteOrders,
  useBatchUpdateStatus,
} from "@/hooks";
import { useApiErrorHandler } from "@/hooks/useErrorHandler";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { OrderPreviewModal } from "@/components/orders/OrderPreviewModal";
import RecordPaymentModal from "@/components/orders/RecordPaymentModal";
import RefundModal from "@/components/orders/RefundModal";
import { ShipmentFormModal } from "@/components/orders/ShipmentFormModal";
import { ProcessedOrder } from "@/types/api-helpers";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import type { PaginationState } from "@tanstack/react-table";

// 定義訂單的類型接口
interface OrderItem {
  id: number;
  order_number: string;
  customer?: {
    name: string;
  };
  grand_total: number;
  payment_status: string;
  shipping_status: string;
  created_at: string;
}

interface OrdersResponse {
  data: OrderItem[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// 狀態文字映射
const paymentStatusText: Record<string, string> = {
  pending: "待付款",
  partial: "部分付款",
  paid: "已付款",
  refunded: "已退款",
};

const shippingStatusText: Record<string, string> = {
  pending: "待處理",
  processing: "處理中",
  shipped: "已出貨",
  delivered: "已送達",
};

export function OrdersPageClient() {
  const router = useRouter();
  const { handleError, handleSuccess } = useApiErrorHandler();
  
  // 分頁狀態
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 15,
  });
  
  // 篩選狀態
  const [filters, setFilters] = useState({
    search: "",
    shipping_status: "",
    payment_status: "",
  });
  const debouncedSearch = useDebounce(filters.search, 500);
  
  // 選擇狀態
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // 刪除確認對話框狀態
  const [deleteOrderId, setDeleteOrderId] = useState<number | null>(null);
  const [isBatchDeleteOpen, setIsBatchDeleteOpen] = useState(false);
  
  // 訂單預覽 Modal 狀態
  const [previewOrderId, setPreviewOrderId] = useState<number | null>(null);
  const [recordPaymentOrderId, setRecordPaymentOrderId] = useState<number | null>(null);
  const [refundOrderId, setRefundOrderId] = useState<number | null>(null);
  const [shipOrderId, setShipOrderId] = useState<number | null>(null);
  
  // Mutations
  const deleteOrderMutation = useDeleteOrder();
  const batchDeleteMutation = useBatchDeleteOrders();
  const batchUpdateMutation = useBatchUpdateStatus();
  
  // 查詢參數
  const queryFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      shipping_status: filters.shipping_status || undefined,
      payment_status: filters.payment_status || undefined,
      page: pagination.pageIndex + 1,
      per_page: pagination.pageSize,
    }),
    [debouncedSearch, filters.shipping_status, filters.payment_status, pagination]
  );
  
  // 獲取數據
  const { data: response, isLoading, isError, error } = useOrders(queryFilters);
  const orders = (response?.data || []) as OrderItem[];
  const meta = response?.meta;
  
  // 處理全選
  const handleSelectAll = () => {
    if (selectedRows.size === orders.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(orders.map((order: OrderItem) => order.id)));
    }
  };
  
  // 處理單選
  const handleSelectRow = (orderId: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedRows(newSelected);
  };
  
  // 處理刪除
  const handleDelete = (orderId: number) => {
    deleteOrderMutation.mutate(orderId, {
      onSuccess: () => {
        handleSuccess('訂單已刪除');
        setDeleteOrderId(null);
      },
      onError: (error) => {
        handleError(error);
      },
    });
  };
  
  // 處理批量刪除
  const handleBatchDelete = () => {
    const orderIds = Array.from(selectedRows);
    batchDeleteMutation.mutate(
      { ids: orderIds },
      {
        onSuccess: () => {
          handleSuccess('已刪除選中的訂單');
          setSelectedRows(new Set());
          setIsBatchDeleteOpen(false);
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  };
  
  // 處理批量更新狀態
  const handleBatchUpdateStatus = (statusType: string, statusValue: string) => {
    const orderIds = Array.from(selectedRows);
    batchUpdateMutation.mutate(
      {
        ids: orderIds,
        status_type: statusType as "payment_status" | "shipping_status",
        status_value: statusValue,
      },
      {
        onSuccess: () => {
          handleSuccess('已更新訂單狀態');
          setSelectedRows(new Set());
        },
        onError: (error) => {
          handleError(error);
        },
      }
    );
  };
  
  // 預覽 Modal 的操作回調函數
  const handleEdit = (order: ProcessedOrder) => {
    router.push(`/orders/${order.id}/edit`);
    setPreviewOrderId(null);
  };

  const handlePrint = (order: ProcessedOrder) => {
    // 暫時使用 toast 提示，之後可以實作真正的列印功能
    toast.info("列印功能開發中...");
  };

  const handleCancel = (order: ProcessedOrder) => {
    // 暫時使用 toast 提示，之後可以實作取消訂單功能
    toast.info("取消訂單功能開發中...");
  };

  const handleShipOrder = (order: ProcessedOrder) => {
    setShipOrderId(order.id);
    setPreviewOrderId(null);
  };

  const handleRecordPayment = (order: ProcessedOrder) => {
    setRecordPaymentOrderId(order.id);
    setPreviewOrderId(null);
  };

  const handleRefund = (order: ProcessedOrder) => {
    setRefundOrderId(order.id);
    setPreviewOrderId(null);
  };

  // 獲取單個訂單資料（用於 Modal）
  const previewOrder = orders.find(order => order.id === previewOrderId);
  const paymentOrder = orders.find(order => order.id === recordPaymentOrderId);
  const refundOrder = orders.find(order => order.id === refundOrderId);
  const shipOrder = orders.find(order => order.id === shipOrderId);

  // 狀態顏色
  const getPaymentStatusVariant = (status: string) => {
    switch (status) {
      case "paid": return "success";
      case "partial": return "warning";
      case "pending": return "secondary";
      case "refunded": return "destructive";
      default: return "default";
    }
  };
  
  const getShippingStatusVariant = (status: string) => {
    switch (status) {
      case "delivered": return "success";
      case "shipped": return "default";
      case "processing": return "warning";
      case "pending": return "secondary";
      default: return "default";
    }
  };
  
  if (isLoading) {
    return <DataTableSkeleton columns={8} />;
  }
  
  if (isError) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">無法加載訂單資料</p>
        <p className="text-sm text-muted-foreground mt-2">{error?.message}</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="mt-4"
        >
          重試
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* 篩選欄 */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="搜尋訂單..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            className="max-w-sm"
          />
          <Select
            value={filters.shipping_status || "all"}
            onValueChange={(value) => setFilters(prev => ({ ...prev, shipping_status: value === "all" ? "" : value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="出貨狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待處理</SelectItem>
              <SelectItem value="processing">處理中</SelectItem>
              <SelectItem value="shipped">已出貨</SelectItem>
              <SelectItem value="delivered">已送達</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filters.payment_status || "all"}
            onValueChange={(value) => setFilters(prev => ({ ...prev, payment_status: value === "all" ? "" : value }))}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="付款狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="pending">待付款</SelectItem>
              <SelectItem value="partial">部分付款</SelectItem>
              <SelectItem value="paid">已付款</SelectItem>
              <SelectItem value="refunded">已退款</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Link href="/orders/new" className={buttonVariants()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增訂單
        </Link>
      </div>
      
      {/* 批量操作欄 */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
          <span className="text-sm text-muted-foreground">
            已選擇 {selectedRows.size} 筆訂單
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setIsBatchDeleteOpen(true)}
          >
            批量刪除
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                批量更新狀態
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleBatchUpdateStatus("payment_status", "paid")}>
                標記為已付款
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchUpdateStatus("payment_status", "pending")}>
                標記為待付款
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleBatchUpdateStatus("shipping_status", "shipped")}>
                標記為已出貨
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleBatchUpdateStatus("shipping_status", "delivered")}>
                標記為已送達
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {/* 訂單表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedRows.size === orders.length && orders.length > 0}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>訂單編號</TableHead>
              <TableHead>客戶</TableHead>
              <TableHead>金額</TableHead>
              <TableHead>付款狀態</TableHead>
              <TableHead>出貨狀態</TableHead>
              <TableHead>日期</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10">
                  暫無訂單資料
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order: OrderItem) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(order.id)}
                      onCheckedChange={() => handleSelectRow(order.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-medium text-primary hover:underline"
                      onClick={() => {
                        router.push(`/orders/${order.id}`);
                      }}
                    >
                      {order.order_number}
                    </Button>
                  </TableCell>
                  <TableCell>{order.customer?.name || "未知客戶"}</TableCell>
                  <TableCell>{formatPrice(order.grand_total)}</TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusVariant(order.payment_status)}>
                      {paymentStatusText[order.payment_status] || order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getShippingStatusVariant(order.shipping_status)}>
                      {shippingStatusText[order.shipping_status] || order.shipping_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.created_at 
                      ? new Date(order.created_at).toLocaleDateString()
                      : '未知日期'
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/orders/${order.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          查看詳情
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/orders/${order.id}/edit`)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          編輯
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteOrderId(order.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          刪除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* 分頁 */}
      {meta && (
        <DataTablePagination
          table={{
            getState: () => ({ pagination }),
            setPageIndex: (updater: number | ((old: number) => number)) => {
              const newIndex = typeof updater === 'function' 
                ? updater(pagination.pageIndex) 
                : updater;
              setPagination(prev => ({ ...prev, pageIndex: newIndex }));
            },
            setPageSize: (size: number) => {
              setPagination(prev => ({ ...prev, pageSize: size, pageIndex: 0 }));
            },
            getCanPreviousPage: () => pagination.pageIndex > 0,
            getCanNextPage: () => pagination.pageIndex < (meta.last_page - 1),
            previousPage: () => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex - 1 })),
            nextPage: () => setPagination(prev => ({ ...prev, pageIndex: prev.pageIndex + 1 })),
            getPageCount: () => meta.last_page,
            // 添加缺失的方法以修復 getFilteredRowModel 錯誤
            getFilteredRowModel: () => ({
              rows: Array.from({ length: meta.total }, (_, i) => ({ id: i }))
            }),
          } as any}
          totalCount={meta.total}
        />
      )}
      
      {/* 刪除確認對話框 */}
      <AlertDialog
        open={deleteOrderId !== null}
        onOpenChange={(open) => !open && setDeleteOrderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除此訂單嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              此操作無法撤銷。這將永久刪除選中的訂單。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteOrderId && handleDelete(deleteOrderId)}
              disabled={deleteOrderMutation.isPending}
            >
              {deleteOrderMutation.isPending ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 批量刪除確認對話框 */}
      <AlertDialog open={isBatchDeleteOpen} onOpenChange={setIsBatchDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除選中的訂單嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您即將刪除 {selectedRows.size} 筆訂單。此操作無法撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBatchDelete}
              disabled={batchDeleteMutation.isPending}
            >
              {batchDeleteMutation.isPending ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* 訂單預覽 Modal */}
      <OrderPreviewModal
        open={previewOrderId !== null}
        onOpenChange={(open) => !open && setPreviewOrderId(null)}
        orderId={previewOrderId}
        onEdit={handleEdit}
        onPrint={handlePrint}
        onCancel={handleCancel}
        onShipOrder={handleShipOrder}
        onRecordPayment={handleRecordPayment}
        onRefund={handleRefund}
      />
      
      {/* 記錄付款 Modal */}
      <RecordPaymentModal
        order={paymentOrder as any || null}
        open={recordPaymentOrderId !== null}
        onOpenChange={(open) => !open && setRecordPaymentOrderId(null)}
      />
      
      {/* 退款 Modal */}
      <RefundModal
        order={refundOrder as any || null}
        open={refundOrderId !== null}
        onOpenChange={(open) => !open && setRefundOrderId(null)}
      />
      
      {/* 出貨 Modal */}
      <ShipmentFormModal
        order={shipOrder as any || null}
        open={shipOrderId !== null}
        onOpenChange={(open) => !open && setShipOrderId(null)}
      />
    </div>
  );
}