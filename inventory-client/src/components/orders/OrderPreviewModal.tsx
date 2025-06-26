"use client";

import { useState } from "react";
import { useOrderDetail } from "@/hooks/queries/useEntityQueries";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCircle, Truck, CreditCard, ShoppingCart } from "lucide-react";
import { ProcessedOrder, ProcessedOrderItem } from "@/types/api-helpers";

/**
 * 定義元件的 Props 介面
 *
 * @param orderId - 要顯示的訂單 ID，可為 null
 * @param open - 控制 Modal 開關狀態
 * @param onOpenChange - 當 Modal 開關狀態改變時的回調函數
 * @param onShip - 執行出貨操作的回調函數
 * @param onRecordPayment - 記錄收款操作的回調函數
 * @param onRefund - 處理退款操作的回調函數
 */
interface OrderPreviewModalProps {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShip: (orderId: number) => void;
  onRecordPayment: (order: ProcessedOrder) => void;
  onRefund: (order: ProcessedOrder) => void; // 🎯 新增
}

/**
 * 訂單預覽模態元件
 *
 * 功能說明：
 * 1. 使用 Dialog 組件提供聚焦的模態預覽體驗
 * 2. 整合 useOrderDetail hook 自動載入訂單資料
 * 3. 完整顯示訂單資訊：基本資訊、客戶資訊、品項列表、總計
 * 4. 智能狀態徽章顯示，提升可讀性
 * 5. 響應式設計，適配不同螢幕尺寸
 *
 * @param props - 元件屬性
 * @returns 訂單預覽模態元件
 */
export function OrderPreviewModal({
  orderId,
  open,
  onOpenChange,
  onShip,
  onRecordPayment,
  onRefund,
}: OrderPreviewModalProps) {
  // 使用已升級的 hook 來獲取訂單詳情 - 現在直接返回純淨的 ProcessedOrder 對象
  const { data: order, isLoading, error } = useOrderDetail(orderId);

  /**
   * 根據訂單狀態返回不同的 Badge 樣式
   *
   * @param status - 訂單狀態字串
   * @returns 對應狀態的 Badge 元件
   */
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
          <Badge
            variant="default"
            className="bg-green-100 text-green-800"
            data-oid="8yob0w_"
          >
            {displayText}
          </Badge>
        );

      case "cancelled":
      case "refunded":
        return (
          <Badge variant="destructive" data-oid=":_h7:5c">
            {displayText}
          </Badge>
        );

      case "pending":
      case "processing":
      case "partial":
      default:
        return (
          <Badge variant="secondary" data-oid="6wx2_6:">
            {displayText}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="oo1j65q">
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
        data-oid="u289xs_"
      >
        <DialogHeader data-oid="cx87_5b">
          <DialogTitle className="text-2xl" data-oid="om4k8de">
            訂單詳情
          </DialogTitle>
          {order && (
            <DialogDescription data-oid="_b4yf3w">
              訂單編號: {order.order_number}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* 核心內容的 div 容器和邏輯完全不變 */}
        <div
          className="flex-grow overflow-y-auto pr-4 space-y-6"
          data-oid="ttqpxie"
        >
          {isLoading && <p data-oid="x6ul-0p">載入中...</p>}
          {error && (
            <p className="text-destructive" data-oid="ur5e:r5">
              讀取失敗：{error.message}
            </p>
          )}

          {order && (
            <>
              {/* --- 狀態面板 --- */}
              <div className="grid grid-cols-2 gap-4" data-oid="z.v:s9-">
                <Card data-oid="c0c:bnk">
                  <CardHeader
                    className="flex flex-row items-center justify-between pb-2"
                    data-oid="anq0it5"
                  >
                    <CardTitle
                      className="text-sm font-medium"
                      data-oid="gaf61ep"
                    >
                      貨物狀態
                    </CardTitle>
                    <Truck
                      className="h-4 w-4 text-muted-foreground"
                      data-oid="9ox.fsb"
                    />
                  </CardHeader>
                  <CardContent data-oid="xogq:y9">
                    {getStatusBadge(order.shipping_status)}
                  </CardContent>
                </Card>
                <Card data-oid="_6z4ulx">
                  <CardHeader
                    className="flex flex-row items-center justify-between pb-2"
                    data-oid="3umg:v8"
                  >
                    <CardTitle
                      className="text-sm font-medium"
                      data-oid="ixlrlra"
                    >
                      付款狀態
                    </CardTitle>
                    <CreditCard
                      className="h-4 w-4 text-muted-foreground"
                      data-oid="9h3-yqr"
                    />
                  </CardHeader>
                  <CardContent data-oid="6i1d.or">
                    {getStatusBadge(order.payment_status)}
                  </CardContent>
                </Card>
              </div>

              {/* --- 客戶資訊卡片 --- */}
              <Card data-oid="orsr7-s">
                <CardHeader data-oid=".kgi:va">
                  <CardTitle
                    className="flex items-center text-lg"
                    data-oid="36ukkr6"
                  >
                    <UserCircle className="mr-2 h-5 w-5" data-oid="ufyj4ag" />
                    客戶資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm" data-oid="h7b2om7">
                  <div className="flex justify-between" data-oid="ucmk1ox">
                    <span className="text-muted-foreground" data-oid="e6-e75r">
                      名稱
                    </span>
                    <span data-oid="pbx_vni">{order.customer?.name}</span>
                  </div>
                  <div className="flex justify-between" data-oid="dteanni">
                    <span className="text-muted-foreground" data-oid="yuzmkh0">
                      電話
                    </span>
                    <span data-oid=":kxbvy:">{order.customer?.phone}</span>
                  </div>
                </CardContent>
              </Card>

              {/* --- 訂單品項卡片 --- */}
              <Card data-oid="_jvk2ln">
                <CardHeader data-oid="1_n1rlb">
                  <CardTitle
                    className="flex items-center text-lg"
                    data-oid="lhxu92d"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" data-oid="5qoaumq" />
                    訂單品項
                  </CardTitle>
                </CardHeader>
                <CardContent data-oid="lt3ofye">
                  <Table data-oid="eyjcdbk">
                    <TableHeader data-oid="lnkst__">
                      <TableRow
                        className="border-b hover:bg-transparent"
                        data-oid="e2mdci0"
                      >
                        <TableHead
                          className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid="3ekq:7n"
                        >
                          品項 (SKU)
                        </TableHead>
                        <TableHead
                          className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                          data-oid="wileitl"
                        >
                          數量
                        </TableHead>
                        <TableHead
                          className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                          data-oid="b87gxa."
                        >
                          小計
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid=".6fnme4">
                      {order.items?.map((item: ProcessedOrderItem) => (
                        <TableRow key={item.id} data-oid="cmgqjkq">
                          <TableCell data-oid=":.84089">
                            <div className="font-medium" data-oid="ela-4qb">
                              {item.product_name}
                            </div>
                            <div
                              className="text-xs text-muted-foreground"
                              data-oid="031u_hs"
                            >
                              {item.sku}
                            </div>
                          </TableCell>
                          <TableCell className="text-center" data-oid="v9alu95">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right" data-oid="_m9jg3k">
                            ${(item.price * item.quantity).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* --- 訂單總計 --- */}
              <div className="space-y-2 text-sm" data-oid="ay7kygr">
                <div className="flex justify-between" data-oid="th09d7q">
                  <span className="text-muted-foreground" data-oid="hyatcqh">
                    商品小計
                  </span>
                  <span data-oid="8q82kxm">
                    ${order.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between" data-oid="eqmam46">
                  <span className="text-muted-foreground" data-oid="2o0k3zb">
                    運費
                  </span>
                  <span data-oid="ipnft81">
                    ${(order.shipping_fee || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between" data-oid="297p-.a">
                  <span className="text-muted-foreground" data-oid="e:.m9n1">
                    折扣
                  </span>
                  <span className="text-green-600" data-oid="jrxyjkj">
                    -${order.discount_amount.toLocaleString()}
                  </span>
                </div>
                <Separator className="my-2" data-oid="f4bwwx4" />
                <div
                  className="flex justify-between font-bold text-base"
                  data-oid="eu06uk4"
                >
                  <span data-oid="tcgiy_m">總計</span>
                  <span data-oid="yf_ub1l">
                    ${order.grand_total.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* 🎯 底部操作按鈕區域 */}
        <DialogFooter
          className="p-6 pt-4 border-t sm:justify-between flex-wrap gap-2"
          data-oid="f8i_q5-"
        >
          <div className="flex gap-2" data-oid="0a-ssi.">
            {order && (
              <>
                <Button
                  variant="default"
                  onClick={() => onRecordPayment(order)}
                  disabled={order.payment_status === "paid"}
                  data-oid="bbpi1rh"
                >
                  記錄收款
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onRefund(order)}
                  disabled={
                    order.payment_status !== "paid" &&
                    order.payment_status !== "partial"
                  }
                  data-oid="of6i3gc"
                >
                  處理退款
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2" data-oid="83su50y">
            {order && (
              <Button
                variant="secondary"
                onClick={() => onShip(order.id)}
                disabled={
                  order.payment_status !== "paid" ||
                  order.shipping_status !== "pending"
                }
                data-oid="ibzgqzm"
              >
                執行出貨
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-oid="4:fk6jm"
            >
              關閉
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
