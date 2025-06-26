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
        className="translate-y-[2px]"
        data-oid="rk2688d"
      />
    ),

    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
        data-oid="o_x85_m"
      />
    ),

    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  // --- 選擇欄結束 ---

  {
    accessorKey: "order_number",
    header: "訂單編號",
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div className="flex items-center gap-2" data-oid="_9l2-zc">
          <button
            onClick={() => onPreview(order.id)}
            className="font-medium text-primary underline-offset-4 hover:underline"
            data-oid="liqh2um"
          >
            {order.order_number}
          </button>
          {/* 🎯 如果訂單包含訂製商品，顯示標籤 */}
          {order.has_custom_items && (
            <Badge variant="secondary" className="text-xs" data-oid="9ihp-_h">
              含訂製品
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "customer.name", // 嵌套數據訪問
    header: "客戶名稱",
  },
  {
    accessorKey: "shipping_status",
    header: "貨物狀態",
    cell: ({ row }) => {
      const status = row.getValue("shipping_status") as string;
      // 根據不同狀態給予不同顏色的徽章
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
          cancelled: "已取消", // 🎯 新增已取消狀態
        }[status] || status;

      return (
        <Badge variant={variant} data-oid="ywbwmh6">
          {statusText}
        </Badge>
      );
    },
  },
  {
    accessorKey: "payment_status",
    header: "付款狀態",
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
        <Badge variant={variant} data-oid="umxx0ri">
          {statusText}
        </Badge>
      );
    },
  },
  {
    accessorKey: "grand_total",
    header: "訂單總額",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("grand_total"));
      const formatted = new Intl.NumberFormat("zh-TW", {
        style: "currency",
        currency: "TWD",
        minimumFractionDigits: 0,
      }).format(amount);
      return (
        <div className="text-right font-medium" data-oid="j:jszxp">
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "下單時間",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <span data-oid="pe:d0fx">{date.toLocaleString("zh-TW")}</span>;
    },
  },
  // 操作列
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const order = row.original;
      const { mutate: deleteOrder, isPending } = useDeleteOrder();

      // 🎯 權限判斷邏輯
      const canCancel = !["shipped", "delivered", "cancelled"].includes(
        order.shipping_status,
      );

      return (
        <DropdownMenu data-oid="w_s1csi">
          <DropdownMenuTrigger asChild data-oid=":-exs11">
            <Button variant="ghost" className="h-8 w-8 p-0" data-oid="lg-n73f">
              <span className="sr-only" data-oid="8ok.ue1">
                Open menu
              </span>
              <MoreHorizontal className="h-4 w-4" data-oid="qxtnvxa" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="3oht-jk">
            <DropdownMenuLabel data-oid="ym.sg4l">操作</DropdownMenuLabel>

            {/* --- 檢視分組 --- */}
            <DropdownMenuGroup data-oid="c_nzqx-">
              <DropdownMenuItem
                onSelect={() => onPreview(order.id)}
                data-oid="a6-.:xs"
              >
                <Eye className="mr-2 h-4 w-4" data-oid="0vvtwku" />
                <span data-oid="k-:s2bv">快速預覽</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild data-oid="ni.087l">
                <Link href={`/orders/${order.id}`} data-oid="_xj23ku">
                  <FileText className="mr-2 h-4 w-4" data-oid="ux0es9u" />
                  <span data-oid="qckm:ny">查看完整詳情</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator data-oid="ci3wgun" />

            {/* --- 核心流程分組 --- */}
            <DropdownMenuGroup data-oid="pdx45p6">
              <DropdownMenuItem
                onSelect={() =>
                  onRecordPayment(order as unknown as ProcessedOrder)
                }
                disabled={order.payment_status === "paid"}
                data-oid=".yaw69:"
              >
                <DollarSign className="mr-2 h-4 w-4" data-oid="d72f8n8" />
                <span data-oid="-e-nxcp">記錄收款</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onShip(order.id)}
                disabled={
                  order.payment_status !== "paid" ||
                  order.shipping_status !== "pending"
                }
                data-oid="b2244gb"
              >
                <Truck className="mr-2 h-4 w-4" data-oid="m93rya8" />
                <span data-oid="8w_2kvv">執行出貨</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator data-oid="1faa5by" />

            {/* --- 逆向流程分組 --- */}
            <DropdownMenuGroup data-oid="vplv6f:">
              <DropdownMenuItem
                onSelect={() => onRefund(order as unknown as ProcessedOrder)}
                disabled={
                  order.payment_status !== "paid" &&
                  order.payment_status !== "partial"
                }
                data-oid="gf0umwa"
              >
                <Undo2
                  className="mr-2 h-4 w-4 text-destructive"
                  data-oid="rd3_zqa"
                />

                <span className="text-destructive" data-oid="glpjhwx">
                  處理退款
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onCancel(order as unknown as ProcessedOrder)}
                disabled={!canCancel}
                data-oid="anw:9tk"
              >
                <Ban
                  className="mr-2 h-4 w-4 text-destructive"
                  data-oid="t94kgc7"
                />

                <span className="text-destructive" data-oid="b7zbspg">
                  取消訂單
                </span>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator data-oid="9cd0.27" />

            {/* --- 編輯與刪除分組 --- */}
            <DropdownMenuGroup data-oid="_b-8hkg">
              <DropdownMenuItem asChild data-oid="dsmx3c-">
                <Link href={`/orders/${order.id}/edit`} data-oid="zs6mmoe">
                  <Pencil className="mr-2 h-4 w-4" data-oid="fl7ooke" />
                  <span data-oid="uc1q:h9">編輯</span>
                </Link>
              </DropdownMenuItem>
              <AlertDialog data-oid=".:ag7kr">
                <AlertDialogTrigger asChild data-oid="j0l_svx">
                  <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()} // 防止 DropdownMenu 立即關閉
                    data-oid="k453_c1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" data-oid="7m5jygx" />
                    <span data-oid=":14u__4">刪除</span>
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent data-oid="cef.p_1">
                  <AlertDialogHeader data-oid="3gl6m87">
                    <AlertDialogTitle data-oid="acajy-k">
                      確定要刪除此訂單嗎？
                    </AlertDialogTitle>
                    <AlertDialogDescription data-oid="gi1u_j6">
                      此操作無法撤銷。這將永久刪除訂單「{order.order_number}」。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter data-oid="-sqvgu3">
                    <AlertDialogCancel data-oid="f0l5sjo">
                      取消
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteOrder(order.id)}
                      disabled={isPending}
                      data-oid=":npdqom"
                    >
                      {isPending ? "刪除中..." : "確定刪除"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
