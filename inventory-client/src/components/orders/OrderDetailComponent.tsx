/**
 * 訂單詳情組件
 * 提供完整的訂單詳細資訊和管理功能
 */
"use client";

import React, { useState } from "react";
import {
  useOrderDetail,
  useUpdateOrderItemStatus,
} from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/utils";
import { MoneyHelper } from "@/lib/money-helper";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProductStatusBadge } from "@/components/orders/ProductStatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  Plus,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import RecordPaymentModal from "@/components/orders/RecordPaymentModal";

import { ProcessedOrder } from '@/types/api-helpers';

interface OrderDetailComponentProps {
  orderId: number | null;
  order?: ProcessedOrder | null; // 使用正確的類型
}

export function OrderDetailComponent({ orderId, order: providedOrder }: OrderDetailComponentProps) {
  // 如果已經提供了 order 數據，就不需要再獲取
  const shouldFetch = !providedOrder && orderId !== null;
  const { data: fetchedOrder, isLoading, isError, error } = useOrderDetail(shouldFetch ? orderId : null);
  const order = providedOrder || fetchedOrder;
  const { mutate: updateItemStatus, isPending } = useUpdateOrderItemStatus();

  // 🎯 新增：部分付款 Modal 狀態
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // 🎯 狀態中文對照表
  const getStatusText = (status: string) => {
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
      // 項目狀態
      待處理: "待處理",
      已叫貨: "已叫貨",
      已出貨: "已出貨",
      完成: "完成",
    };
    return statusMap[status] || status;
  };

  // 可用的項目狀態選項
  const statusOptions = [
    { value: "待處理", label: "待處理" },
    { value: "已叫貨", label: "已叫貨" },
    { value: "已出貨", label: "已出貨" },
    { value: "完成", label: "完成" },
  ];

  // 處理狀態更新
  const handleStatusChange = (itemId: number, newStatus: string) => {
    updateItemStatus({
      orderItemId: itemId,
      status: newStatus,
    });
  };

  // 只有在需要獲取數據且正在載入時才顯示載入狀態
  if (shouldFetch && isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // 只有在需要獲取數據且發生錯誤時才顯示錯誤狀態
  if (shouldFetch && isError) {
    return (
                      <div className="text-error">
        無法加載訂單詳情: {error?.message}
      </div>
    );
  }

  if (!order) {
    return <div>找不到訂單資料。</div>;
  }

  // 🎯 計算總計資訊
  const subtotal =
    order.items?.reduce(
      (acc: number, item: any) => acc + (item.price || 0) * (item.quantity || 0),
      0
    ) || 0;

  // 🎯 計算付款進度
  const paymentProgress =
    order.grand_total > 0 ? (order.paid_amount / order.grand_total) * 100 : 0;
  const remainingAmount = order.grand_total - order.paid_amount;

  return (
    <>
      <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:grid-cols-3">
        {/* 左側主欄，佔據 2/3 寬度 */}
        <div className="grid gap-4 lg:col-span-2">
          {/* 訂單項目卡片 - 主要內容 */}
          <Card>
            <CardHeader>
              <CardTitle>訂單品項</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      商品名稱
                    </TableHead>
                    <TableHead>
                      SKU
                    </TableHead>
                    <TableHead className="text-right">
                      單價
                    </TableHead>
                    <TableHead className="text-center">
                      數量
                    </TableHead>
                    <TableHead className="text-right w-[120px]">
                      小計
                    </TableHead>
                    <TableHead>
                      項目狀態
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items?.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{item.product_name}</span>
                            </div>
                          </div>
                        </div>
                        {/* 🎯 優雅地顯示訂製規格 */}
                        {item.custom_specifications && (
                          <div className="mt-2 p-2 bg-muted rounded-md">
                            <div className="text-xs font-medium text-muted-foreground">
                              訂製規格：
                            </div>
                            <div className="text-sm mt-1">
                              {Object.entries(
                                typeof item.custom_specifications === "string"
                                  ? JSON.parse(item.custom_specifications)
                                  : item.custom_specifications
                              ).map(([key, value]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-medium">{key}:</span>
                                  <span>{value as string}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right">
                        {MoneyHelper.format(item.price || 0, '$')}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.quantity || 0}
                      </TableCell>
                      <TableCell className="text-right font-medium w-[120px]">
                        {MoneyHelper.format((item.price || 0) * (item.quantity || 0), '$')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.status_text}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* 🎯 新增：付款歷史卡片 */}
          {order.payment_records && order.payment_records.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  付款記錄
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.payment_records.map((payment: any) => (
                    <div key={payment.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">
                              {MoneyHelper.format(payment.amount || 0, '$')}
                            </span>
                            <Badge variant="outline">
                              {payment.payment_method === "cash"
                                ? "現金"
                                : payment.payment_method === "transfer"
                                ? "銀行轉帳"
                                : payment.payment_method === "credit_card"
                                ? "信用卡"
                                : payment.payment_method}
                            </Badge>
                          </div>
                          {payment.notes && (
                            <p className="text-sm text-muted-foreground">
                              {payment.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {payment.payment_date
                              ? format(
                                  new Date(payment.payment_date),
                                  "yyyy/MM/dd HH:mm"
                                )
                              : "未知日期"
                            }
                          </div>
                          {payment.creator && (
                            <div className="flex items-center gap-1 mt-1">
                              <User className="h-3 w-3" />
                              {payment.creator.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側邊欄，佔據 1/3 寬度 */}
        <div className="grid gap-4">
          {/* 訂單摘要卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>訂單摘要</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">訂單號碼</span>
                <span className="font-medium">{order.order_number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">下單時間</span>
                <span>
                  {order.created_at
                    ? new Date(order.created_at).toLocaleString("zh-TW")
                    : "未知時間"
                  }
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">貨物狀態</span>
                <Badge
                  variant={
                    order.shipping_status === "shipped" ? "default" : "secondary"
                  }
                >
                  {getStatusText(order.shipping_status)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">付款狀態</span>
                <Badge
                  variant={
                    order.payment_status === "paid" ? "default" : "secondary"
                  }
                >
                  {getStatusText(order.payment_status)}
                </Badge>
              </div>

              {/* 金額明細 */}
              <div className="pt-3 mt-3 border-t space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">商品小計</span>
                  <span className="text-right w-[120px]">
                    {MoneyHelper.format(subtotal, '$')}
                  </span>
                </div>
                {(order.shipping_fee ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">運費</span>
                    <span className="text-right w-[120px]">
                      {MoneyHelper.format(order.shipping_fee ?? 0, '$')}
                    </span>
                  </div>
                )}
                {(order.discount_amount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">折扣</span>
                    <span className="text-success text-right w-[120px]">
                      -{MoneyHelper.format(order.discount_amount ?? 0, '$')}
                    </span>
                  </div>
                )}
                {(order.tax ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {order.is_tax_inclusive ? "內含稅金" : "稅金"} ({order.tax_rate || 5}%)
                    </span>
                    <span className="text-right w-[120px]">
                      {MoneyHelper.format(order.tax ?? 0, '$')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between font-medium text-base pt-2 border-t">
                  <span className="text-muted-foreground">
                    訂單總額 ({order.is_tax_inclusive ? "含稅" : "未稅"})
                  </span>
                  <span className="text-right w-[120px]">
                    {formatPrice(order.grand_total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 🎯 新增：付款進度卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  付款進度
                </CardTitle>
                {/* 🎯 新增：在卡片頭部加入記錄付款按鈕 */}
                {order.payment_status !== "paid" &&
                  order.payment_status !== "refunded" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      記錄付款
                    </Button>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 進度條 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">完成度</span>
                  <span className="font-medium">
                    {paymentProgress.toFixed(0)}%
                  </span>
                </div>
                <Progress value={paymentProgress} className="h-2" />
              </div>

              {/* 金額明細 */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">已付金額</span>
                                      <span className="font-medium text-success">
                    {MoneyHelper.format(order.paid_amount || 0, '$')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">未付金額</span>
                                      <span className="font-medium text-error">
                    {MoneyHelper.format(remainingAmount || 0, '$')}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-muted-foreground">
                    訂單總額 ({order.is_tax_inclusive ? "含稅" : "未稅"})
                  </span>
                  <span className="font-medium">
                    {MoneyHelper.format(order.grand_total || 0, '$')}
                  </span>
                </div>
              </div>

              {/* 付款次數統計 */}
              {order.payment_records && order.payment_records.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    已收到 {order.payment_records.length} 筆付款
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 客戶資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle>客戶資訊</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">客戶名稱</span>
                <span className="font-medium">
                  {order.customer?.name || "未提供"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">聯絡電話</span>
                <span>{order.customer?.phone || "未提供"}</span>
              </div>
              {order.shipping_address && (
                <div className="pt-2 mt-2 border-t">
                  <p className="text-muted-foreground mb-1">運送地址</p>
                  <p className="text-sm">{order.shipping_address}</p>
                </div>
              )}
              {order.billing_address && (
                <div className="pt-2 mt-2 border-t">
                  <p className="text-muted-foreground mb-1">帳單地址</p>
                  <p className="text-sm">{order.billing_address}</p>
                </div>
              )}
              {order.notes && (
                <div className="pt-2 mt-2 border-t">
                  <p className="text-muted-foreground mb-1">備註</p>
                  <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 🎯 記錄付款 Modal */}
      <RecordPaymentModal
        order={order || null}
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
      />
    </>
  );
} 