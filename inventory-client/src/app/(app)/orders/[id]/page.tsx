"use client"; // 因為使用了 useParams，此頁面需為客戶端組件

import React, { useState, lazy, Suspense, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useDynamicBreadcrumb } from "@/components/breadcrumb-context";
import {
  ArrowLeft,
  CreditCard,
  Truck,
  ChevronLeft,
  DollarSign,
} from "lucide-react";
import { LoadingFallback } from "@/components/ui/skeleton";

// 動態導入訂單詳情組件
const OrderDetailComponent = lazy(() => import("@/components/orders/OrderDetailComponent").then(module => ({ default: module.OrderDetailComponent })));
import Link from "next/link";
import {
  useOrderDetail,
  useConfirmOrderPayment,
  useCreateOrderShipment,
} from "@/hooks";
import { Badge } from "@/components/ui/badge";
import RecordPaymentModal from "@/components/orders/RecordPaymentModal";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = Number(params.id);
  const { setLabel } = useDynamicBreadcrumb();

  // 數據獲取邏輯上移到頁面組件
  const { data: order, isLoading, isError, error } = useOrderDetail(orderId);
  const { mutate: confirmPayment, isPending: isConfirming } =
    useConfirmOrderPayment();
  const { mutate: createShipment, isPending: isShipping } =
    useCreateOrderShipment();

  // 🎯 新增：部分付款 Modal 狀態
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // 動態設置麵包屑標籤
  useEffect(() => {
    if (order?.order_number) {
      setLabel(`訂單 #${order.order_number}`);
    }
  }, [order?.order_number, setLabel]);

  // 🎯 useOrderDetail 的 select 函數已經處理好資料格式，直接使用純淨的訂單物件

  const handleConfirmPayment = () => {
    if (!orderId) return;
    confirmPayment(orderId);
  };

  const handleCreateShipment = () => {
    if (!orderId) return;
    // 實際應用中，這裡會彈出一個表單讓用戶填寫物流單號
    const shipmentData = { tracking_number: "TEMP-TRACKING-12345" };
    createShipment({ orderId, data: shipmentData });
  };

  // 🎯 狀態徽章樣式函數
  const getStatusBadge = (status: string) => {
    // 狀態中文對照表
    const statusMap: Record<string, string> = {
      // 付款狀態
      pending: "待付款",
      paid: "已付款",
      partial: "部分付款",
      refunded: "已退款",
      // 出貨狀態
      processing: "處理中",
      shipped: "已出貨",
      delivered: "已送達",
      cancelled: "已取消",
      completed: "已完成",
    };

    const displayText = statusMap[status] || status;

    switch (status) {
      case "completed":
      case "paid":
      case "shipped":
      case "delivered":
        return (
          <Badge className="bg-green-100 text-green-800">
            {displayText}
          </Badge>
        );

      case "cancelled":
      case "refunded":
        return (
          <Badge variant="destructive">
            {displayText}
          </Badge>
        );

      case "pending":
      case "processing":
      case "partial":
      default:
        return (
          <Badge variant="secondary">
            {displayText}
          </Badge>
        );
    }
  };

  // 🎯 決定付款按鈕的顯示邏輯
  const renderPaymentButton = () => {
    if (!order) return null;

    // 已付清或已退款，不顯示付款按鈕
    if (
      order.payment_status === "paid" ||
      order.payment_status === "refunded"
    ) {
      return null;
    }

    // 待付款狀態
    if (order.payment_status === "pending") {
      // 如果訂單金額等於剩餘未付金額，顯示「確認全額付款」
      const remainingAmount = order.grand_total - order.paid_amount;
      if (remainingAmount === order.grand_total) {
        return (
          <Button
            variant="outline"
            onClick={handleConfirmPayment}
            disabled={isConfirming}
           
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {isConfirming ? "確認中..." : "確認全額付款"}
          </Button>
        );
      }
    }

    // 待付款或部分付款狀態，顯示「記錄付款」
    if (
      order.payment_status === "pending" ||
      order.payment_status === "partial"
    ) {
      return (
        <Button
          variant="outline"
          onClick={() => setIsPaymentModalOpen(true)}
         
        >
          <DollarSign className="h-4 w-4 mr-2" />
          記錄付款
        </Button>
      );
    }

    return null;
  };

  // 載入和錯誤狀態處理
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/orders"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回訂單列表
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              訂單詳情
            </h1>
            <p className="text-muted-foreground">
              載入中...
            </p>
          </div>
        </div>
        <OrderDetailComponent orderId={orderId} />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/orders"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回訂單列表
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              訂單詳情
            </h1>
            <p className="text-red-500">
              載入失敗: {error?.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎯 指揮艦橋頁眉 - 統一的資訊中樞 */}
      <div
        className="flex items-center justify-between gap-2"
       
      >
        <div className="flex items-center gap-4">
          <Link 
            href="/orders"
            className={cn(
              buttonVariants({ variant: "outline", size: "icon" }),
              "h-7 w-7"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">
              返回訂單列表
            </span>
          </Link>
          <h1
            className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0"
           
          >
            訂單編號：{order?.order_number || `#${orderId}`}
          </h1>
          {/* 訂單狀態徽章 */}
          {order && (
            <div
              className="hidden items-center gap-2 md:ml-auto md:flex"
             
            >
              {getStatusBadge(order.shipping_status)}
              {getStatusBadge(order.payment_status)}
            </div>
          )}
        </div>

        {/* 主要操作按鈕 */}
        <div className="flex items-center gap-2">
          {renderPaymentButton()}
          {order?.shipping_status === "pending" && (
            <Button
              onClick={handleCreateShipment}
              disabled={isShipping}
             
            >
              <Truck className="h-4 w-4 mr-2" />
              {isShipping ? "出貨中..." : "執行出貨"}
            </Button>
          )}
        </div>
      </div>

      {/* 訂單詳情組件 - 現在只負責展示 */}
      <Suspense fallback={<LoadingFallback type="page" text="載入訂單詳情..." />}>
        <OrderDetailComponent orderId={orderId} />
      </Suspense>

      {/* 🎯 記錄付款 Modal */}
      <RecordPaymentModal
        order={order || null}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
       
      />
    </div>
  );
}
