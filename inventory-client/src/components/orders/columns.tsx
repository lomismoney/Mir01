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
import { useDeleteOrder } from "@/hooks/queries/useEntityQueries";

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
        data-oid="dtoft90"
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="mx-auto block"
        data-oid="_2_w_d."
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
        <div className="flex items-center gap-2" data-oid="vx3ki2n">
          <button
            onClick={() => onPreview(order.id)}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
            data-oid="b1yasza"
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
                    data-oid="backorder-badge"
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
          
          {/* 🎯 如果訂單包含訂製商品，顯示標籤 */}
          {order.has_custom_items && (
            <Badge variant="secondary" className="text-xs" data-oid="qfgr0ki">
              含訂製品
            </Badge>
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
          data-oid="j-3iaoj"
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
          data-oid="79txkxp"
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
      <div className="text-center" data-oid="_k7mj.p">
        訂單總額
      </div>
    ),

    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("grand_total"));
      const formatted = new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
        minimumFractionDigits: 0,
      }).format(amount);
              return (
          <div className="text-center">
            <span
              className="font-medium tabular-nums text-sm"
              data-oid="weqxenh"
            >
              {formatted}
            </span>
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
          <Badge variant={variant} className="text-xs" data-oid="asnc4c9">
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
          <Badge variant={variant} className="text-xs" data-oid="lo24k4c">
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
      <div className="text-right" data-oid="s-wb7qj">
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
        <div className="flex justify-end" data-oid="nppn:fh">
          <DropdownMenu data-oid="sy5q_4b">
            <DropdownMenuTrigger asChild data-oid="r-id9zg">
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                data-oid="hz3jisl"
              >
                <span className="sr-only" data-oid="7uc2pk:">
                  Open menu
                </span>
                <MoreHorizontal className="h-4 w-4" data-oid="yjrr0xu" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" data-oid="4bydpf_">
              <DropdownMenuLabel data-oid="b63_.zi">操作</DropdownMenuLabel>

              {/* --- 檢視分組 --- */}
              <DropdownMenuGroup data-oid="5cgyicm">
                <DropdownMenuItem
                  onSelect={() => onPreview(order.id)}
                  data-oid="xu6jjxj"
                >
                  <Eye className="mr-2 h-4 w-4" data-oid="mu2dma8" />
                  <span data-oid="t34jupw">快速預覽</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild data-oid="_btjumm">
                  <Link href={`/orders/${order.id}`} data-oid="b06_25e">
                    <FileText className="mr-2 h-4 w-4" data-oid="7hw7z_q" />
                    <span data-oid="gwjjl6z">查看完整詳情</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator data-oid="_.rszkt" />

              {/* --- 核心流程分組 --- */}
              <DropdownMenuGroup data-oid="n_0tipg">
                <DropdownMenuItem
                  onSelect={() =>
                    onRecordPayment(order as unknown as ProcessedOrder)
                  }
                  disabled={order.payment_status === "paid"}
                  data-oid="ncarrq9"
                >
                  <DollarSign className="mr-2 h-4 w-4" data-oid="o9:yaq5" />
                  <span data-oid="eshz.zi">記錄收款</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onShip(order.id)}
                  disabled={
                    order.payment_status !== "paid" ||
                    order.shipping_status !== "pending"
                  }
                  data-oid="_y3gvqh"
                >
                  <Truck className="mr-2 h-4 w-4" data-oid="rvrcmts" />
                  <span data-oid="5lf1shj">執行出貨</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator data-oid=":p1krvg" />

              {/* --- 逆向流程分組 --- */}
              <DropdownMenuGroup data-oid="5puqtc5">
                <DropdownMenuItem
                  onSelect={() => onRefund(order as unknown as ProcessedOrder)}
                  disabled={
                    order.payment_status !== "paid" &&
                    order.payment_status !== "partial"
                  }
                  data-oid="xvbf0.7"
                >
                  <Undo2
                    className="mr-2 h-4 w-4 text-destructive"
                    data-oid="4.au5bd"
                  />

                  <span className="text-destructive" data-oid="iaqbdwe">
                    處理退款
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => onCancel(order as unknown as ProcessedOrder)}
                  disabled={!canCancel}
                  data-oid="e9zrz8-"
                >
                  <Ban
                    className="mr-2 h-4 w-4 text-destructive"
                    data-oid="fnf0:xm"
                  />

                  <span className="text-destructive" data-oid="i6elikl">
                    取消訂單
                  </span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator data-oid="_wno6sq" />

              {/* --- 編輯與刪除分組 --- */}
              <DropdownMenuGroup data-oid="lf3z-7_">
                <DropdownMenuItem asChild data-oid="kj-wnef">
                  <Link href={`/orders/${order.id}/edit`} data-oid="28ihkuv">
                    <Pencil className="mr-2 h-4 w-4" data-oid="r9ik56z" />
                    <span data-oid="wiib862">編輯</span>
                  </Link>
                </DropdownMenuItem>
                <AlertDialog data-oid="hk99khr">
                  <AlertDialogTrigger asChild data-oid="fj212jr">
                    <DropdownMenuItem
                      className="text-destructive"
                      onSelect={(e) => e.preventDefault()} // 防止 DropdownMenu 立即關閉
                      data-oid="dp8m7.g"
                    >
                      <Trash2 className="mr-2 h-4 w-4" data-oid="r844g07" />
                      <span data-oid="04stqyu">刪除</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent data-oid="otto0ze">
                    <AlertDialogHeader data-oid="a:8cpau">
                      <AlertDialogTitle data-oid=":-.pn3e">
                        確定要刪除此訂單嗎？
                      </AlertDialogTitle>
                      <AlertDialogDescription data-oid="wcqouma">
                        此操作無法撤銷。這將永久刪除訂單「{order.order_number}
                        」。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter data-oid="j6r_5h0">
                      <AlertDialogCancel data-oid="k6bef1t">
                        取消
                      </AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => deleteOrder(order.id)}
                        disabled={isPending}
                        data-oid="8vlg8y6"
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
