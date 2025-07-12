"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Eye,
  FileText,
  DollarSign,
  Truck,
  Undo2,
  Ban,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Order, ProcessedOrder } from "@/types/api-helpers";
import { useDeleteOrder } from "@/hooks";
import { formatPrice } from "@/lib/utils";

// 創建 columns 函數，接受預覽、出貨、收款、退款、取消和刪除回調
export const createColumns = ({
  onPreview,
  onShip,
  onRecordPayment,
  onRefund,
  onCancel,
  onDelete, // 🎯 新增刪除回調
}: {
  onPreview: (id: number) => void;
  onShip: (id: number) => void;
  onRecordPayment: (order: ProcessedOrder) => void;
  onRefund: (order: ProcessedOrder) => void;
  onCancel: (order: ProcessedOrder) => void;
  onDelete: (id: number) => void; // 🎯 新增刪除回調類型
}): ColumnDef<Order>[] => [
  // --- 🎯 新增的選擇欄 ---
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="mx-auto block"
       
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="mx-auto block"
       
      />
    ),

    enableSorting: false,
    enableHiding: false,
    size: 40,
    maxSize: 40,
  },
  // --- 選擇欄結束 ---

  {
    accessorKey: "order_number",
    header: "訂單編號",
    cell: ({ row }) => {
      const order = row.original;
      
      // 🎯 檢查是否為預訂訂單（根據備註中的預訂模式標記）
      const isBackorder = order.notes?.includes('【智能預訂】') || false;
      
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPreview(order.id)}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
           
          >
            {order.order_number}
          </button>
          
          {/* 🎯 預訂訂單徽章 - 使用 shadcn/ui 官方警告色系統 */}
          {isBackorder && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge 
                    variant="warning" 
                    className="text-xs cursor-help"
                   
                  >
                    預訂
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>此訂單包含庫存不足的商品，將於補貨後出貨</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          {/* 🎯 顯示訂單包含的商品類型標籤 */}
          {order.items && order.items.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {(() => {
                const hasStock = order.items.some((item: any) => 
                  item.item_type === 'stock' || item.is_stocked_sale
                );
                const hasBackorder = order.items.some((item: any) => 
                  item.item_type === 'backorder' || item.is_backorder
                );
                const hasCustom = order.items.some((item: any) => 
                  item.item_type === 'custom' || (!item.product_variant_id && !item.is_stocked_sale && !item.is_backorder)
                );

                return (
                  <>
                    {hasStock && (
                      <Badge variant="default" className="text-xs">現貨</Badge>
                    )}
                    {hasBackorder && (
                      <Badge variant="secondary" className="text-xs">預訂</Badge>
                    )}
                    {hasCustom && (
                      <Badge variant="outline" className="text-xs">訂製</Badge>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "formatted_created_date", // 🎯 直接訪問格式化好的欄位
    header: () => <div className="text-center">日期</div>,
    size: 100,
    cell: ({ row }) => (
      <div className="text-center">
        <span
          className="whitespace-nowrap text-muted-foreground text-sm"
         
        >
          {row.original.formatted_created_date}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "customer.name", // 嵌套數據訪問
    header: "客戶姓名",
    cell: ({ row }) => {
      const customerName = row.original.customer?.name || "-";
      return (
        <div
          className="max-w-[150px] truncate text-sm"
          title={customerName}
         
        >
          {customerName}
        </div>
      );
    },
  },
  {
    accessorKey: "grand_total",
    size: 120,
    header: () => (
      <div className="text-center">
        訂單總額
      </div>
    ),

    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("grand_total"));
      return (
        <div className="text-center">
          <span
            className="font-medium tabular-nums text-sm"
           
          >
            {formatPrice(amount)}
          </span>
        </div>
      );
    },
    },

  {
    accessorKey: "fulfillment_priority",
    header: () => <div className="text-center">優先級</div>,
    size: 90,
    cell: ({ row }) => {
      const priority = row.getValue("fulfillment_priority") as string || "normal";
      const variant: "default" | "secondary" | "destructive" | "outline" =
        priority === "urgent"
          ? "destructive"
          : priority === "high"
            ? "default"
            : priority === "low"
              ? "outline"
              : "secondary";

      const priorityText = {
        urgent: "緊急",
        high: "高",
        normal: "一般",
        low: "低",
      }[priority] || priority;

      return (
        <div className="text-center">
          <Badge variant={variant} className="text-xs">
            {priorityText}
          </Badge>
        </div>
      );
    },
  },

  {
    accessorKey: "payment_status",
    header: () => <div className="text-center">付款狀態</div>,
    size: 100,
    cell: ({ row }) => {
      const status = row.getValue("payment_status") as string;
      const variant: "default" | "secondary" | "destructive" | "outline" =
        status === "paid"
          ? "default"
          : status === "partial"
            ? "secondary"
            : status === "pending"
              ? "outline"
              : "destructive";

      const statusText =
        {
          pending: "待付款",
          partial: "部分付款",
          paid: "已付款",
          refunded: "已退款",
        }[status] || status;

      return (
        <div className="text-center">
          <Badge variant={variant} className="text-xs">
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "shipping_status",
    header: () => <div className="text-center">出貨狀態</div>, // 🎯 改名為出貨狀態
    size: 100,
    cell: ({ row }) => {
      const status = row.getValue("shipping_status") as string;
      const variant: "default" | "secondary" | "destructive" | "outline" =
        status === "delivered"
          ? "default"
          : status === "shipped"
            ? "secondary"
            : status === "processing"
              ? "outline"
              : status === "pending"
                ? "outline"
                : "destructive";

      const statusText =
        {
          pending: "待處理",
          processing: "處理中",
          shipped: "已出貨",
          delivered: "已完成",
          cancelled: "已取消",
        }[status] || status;

      return (
        <div className="text-center">
          <Badge variant={variant} className="text-xs">
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  {
    id: "fulfillment_status",
    header: () => <div className="text-center">履行狀態</div>,
    size: 120,
    cell: ({ row }) => {
      const order = row.original;
      
      // 計算履行狀態（基於訂單項目的履行狀況）
      if (!order.items || order.items.length === 0) {
        return (
          <div className="text-center">
            <Badge variant="outline" className="text-xs">無項目</Badge>
          </div>
        );
      }

      const totalItems = order.items.length;
      const fulfilledItems = order.items.filter((item: any) => item.is_fulfilled).length;
      const partiallyFulfilledItems = order.items.filter(
        (item: any) => !item.is_fulfilled && (item.fulfilled_quantity || 0) > 0
      ).length;

      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      let statusText = "未履行";

      if (fulfilledItems === totalItems) {
        variant = "default";
        statusText = "已履行";
      } else if (fulfilledItems > 0 || partiallyFulfilledItems > 0) {
        variant = "secondary";
        statusText = `部分履行 (${fulfilledItems + partiallyFulfilledItems}/${totalItems})`;
      }

      return (
        <div className="text-center">
          <Badge variant={variant} className="text-xs">
            {statusText}
          </Badge>
        </div>
      );
    },
  },
  // 操作列
  {
    id: "actions",
    size: 80,
    header: () => (
      <div className="text-right">
        操作
      </div>
    ),

    cell: ({ row }) => {
      const order = row.original;
      const { mutate: deleteOrder, isPending } = useDeleteOrder();

      // 🎯 權限判斷邏輯
      const canCancel = !["shipped", "delivered", "cancelled"].includes(
        order.shipping_status,
      );

      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
               
              >
                <span className="sr-only">
                  Open menu
                </span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>

              {/* --- 檢視分組 --- */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => onPreview(order.id)}
                 
                >
                  <Eye className="mr-2 h-4 w-4" />
                  <span>快速預覽</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/orders/${order.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    <span>查看完整詳情</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* --- 核心流程分組 --- */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() =>
                    onRecordPayment(order as unknown as ProcessedOrder)
                  }
                  disabled={order.payment_status === "paid"}
                 
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  <span>記錄收款</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onShip(order.id)}
                  disabled={
                    order.payment_status !== "paid" ||
                    order.shipping_status !== "pending"
                  }
                 
                >
                  <Truck className="mr-2 h-4 w-4" />
                  <span>執行出貨</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* --- 逆向流程分組 --- */}
              <DropdownMenuGroup>
                <DropdownMenuItem
                  onSelect={() => onRefund(order as unknown as ProcessedOrder)}
                  disabled={
                    order.payment_status !== "paid" &&
                    order.payment_status !== "partial"
                  }
                 
                >
                  <Undo2
                    className="mr-2 h-4 w-4 text-destructive"
                   
                  />

                  <span className="text-destructive">
                    處理退款
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onCancel(order as unknown as ProcessedOrder)}
                  disabled={!canCancel}
                 
                >
                  <Ban
                    className="mr-2 h-4 w-4 text-destructive"
                   
                  />

                  <span className="text-destructive">
                    取消訂單
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              {/* --- 編輯與刪除分組 --- */}
              <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                  <Link href={`/orders/${order.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    <span>編輯</span>
                  </Link>
                </DropdownMenuItem>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()} // 防止 DropdownMenu 立即關閉
                     
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>刪除</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        確定要刪除此訂單嗎？
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        此操作無法撤銷。這將永久刪除訂單「{order.order_number}
                        」。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        取消
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteOrder(order.id)}
                        disabled={isPending}
                       
                      >
                        {isPending ? "刪除中..." : "確定刪除"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
