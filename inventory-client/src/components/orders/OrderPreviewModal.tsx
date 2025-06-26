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
            data-oid="ihao9cu"
          >
            {displayText}
          </Badge>
        );

      case "cancelled":
      case "refunded":
        return (
          <Badge variant="destructive" data-oid="9ooxbhl">
            {displayText}
          </Badge>
        );

      case "pending":
      case "processing":
      case "partial":
      default:
        return (
          <Badge variant="secondary" data-oid="r86:3z1">
            {displayText}
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="ph1fmv_">
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] flex flex-col"
        data-oid="qgu8c5f"
      >
        <DialogHeader data-oid="e6eexxs">
          <DialogTitle className="text-2xl" data-oid=":046lyh">
            訂單詳情
          </DialogTitle>
          {order && (
            <DialogDescription data-oid="c1m5bjl">
              訂單編號: {order.order_number}
            </DialogDescription>
          )}
        </DialogHeader>

        {/* 核心內容的 div 容器和邏輯完全不變 */}
        <div
          className="flex-grow overflow-y-auto pr-4 space-y-6"
          data-oid="-ce30i8"
        >
          {isLoading && <p data-oid="qeqevm0">載入中...</p>}
          {error && (
            <p className="text-destructive" data-oid="y9:lsv2">
              讀取失敗：{error.message}
            </p>
          )}

          {order && (
            <>
              {/* --- 狀態面板 --- */}
              <div className="grid grid-cols-2 gap-4" data-oid="si5wsri">
                <Card data-oid="5s8:d1h">
                  <CardHeader
                    className="flex flex-row items-center justify-between pb-2"
                    data-oid="_:hkg-z"
                  >
                    <CardTitle
                      className="text-sm font-medium"
                      data-oid="najce:y"
                    >
                      貨物狀態
                    </CardTitle>
                    <Truck
                      className="h-4 w-4 text-muted-foreground"
                      data-oid="y-uf2tn"
                    />
                  </CardHeader>
                  <CardContent data-oid="msrf_bb">
                    {getStatusBadge(order.shipping_status)}
                  </CardContent>
                </Card>
                <Card data-oid="-dyz9h.">
                  <CardHeader
                    className="flex flex-row items-center justify-between pb-2"
                    data-oid="rwi:ppu"
                  >
                    <CardTitle
                      className="text-sm font-medium"
                      data-oid="prx15-3"
                    >
                      付款狀態
                    </CardTitle>
                    <CreditCard
                      className="h-4 w-4 text-muted-foreground"
                      data-oid="8x8j4gc"
                    />
                  </CardHeader>
                  <CardContent data-oid="15p6ao1">
                    {getStatusBadge(order.payment_status)}
                  </CardContent>
                </Card>
              </div>

              {/* --- 客戶資訊卡片 --- */}
              <Card data-oid="reo2_h6">
                <CardHeader data-oid="nedepio">
                  <CardTitle
                    className="flex items-center text-lg"
                    data-oid="qqeeuh_"
                  >
                    <UserCircle className="mr-2 h-5 w-5" data-oid="b4i_2r7" />
                    客戶資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm" data-oid="nf489ks">
                  <div className="flex justify-between" data-oid="5:l_mrq">
                    <span className="text-muted-foreground" data-oid="nbbm-an">
                      名稱
                    </span>
                    <span data-oid="_oojdyx">{order.customer?.name}</span>
                  </div>
                  <div className="flex justify-between" data-oid="4d.umd4">
                    <span className="text-muted-foreground" data-oid="tkec002">
                      電話
                    </span>
                    <span data-oid="o.asuhc">{order.customer?.phone}</span>
                  </div>
                </CardContent>
              </Card>

              {/* --- 訂單品項卡片 --- */}
              <Card data-oid="m8z--im">
                <CardHeader data-oid="3_:payu">
                  <CardTitle
                    className="flex items-center text-lg"
                    data-oid="bta6bb5"
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" data-oid="kipk386" />
                    訂單品項
                  </CardTitle>
                </CardHeader>
                <CardContent data-oid="qq0pf5c">
                  <Table data-oid="ar1z9mu">
                    <TableHeader data-oid="gq:kct8">
                      <TableRow
                        className="border-b hover:bg-transparent"
                        data-oid="r2g_84h"
                      >
                        <TableHead
                          className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid=":hjjbw."
                        >
                          品項 (SKU)
                        </TableHead>
                        <TableHead
                          className="text-center h-12 px-4 align-middle font-medium text-muted-foreground"
                          data-oid="jx_obva"
                        >
                          數量
                        </TableHead>
                        <TableHead
                          className="text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                          data-oid="eicp3gg"
                        >
                          小計
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid="a2yxq7e">
                      {order.items?.map((item: ProcessedOrderItem) => (
                        <TableRow key={item.id} data-oid="a-kc.iy">
                          <TableCell data-oid="2xbhon2">
                            <div className="font-medium" data-oid="99ry821">
                              {item.product_name}
                            </div>
                            <div
                              className="text-xs text-muted-foreground"
                              data-oid="8nr7fl8"
                            >
                              {item.sku}
                            </div>
                          </TableCell>
                          <TableCell className="text-center" data-oid="us-82dw">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right" data-oid="54e76hv">
                            ${(item.price * item.quantity).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* --- 訂單總計 --- */}
              <div className="space-y-2 text-sm" data-oid="gl4r85:">
                <div className="flex justify-between" data-oid="qk42m8z">
                  <span className="text-muted-foreground" data-oid="b5amux1">
                    商品小計
                  </span>
                  <span data-oid="9f9ftdg">
                    ${order.subtotal.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between" data-oid="g211_:h">
                  <span className="text-muted-foreground" data-oid="_g3r7r4">
                    運費
                  </span>
                  <span data-oid="atk1t.d">
                    ${(order.shipping_fee || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between" data-oid="9-33vfz">
                  <span className="text-muted-foreground" data-oid="fqk46yw">
                    折扣
                  </span>
                  <span className="text-green-600" data-oid="m9dkr00">
                    -${order.discount_amount.toLocaleString()}
                  </span>
                </div>
                <Separator className="my-2" data-oid="_8vcdlh" />
                <div
                  className="flex justify-between font-bold text-base"
                  data-oid="56mcmy9"
                >
                  <span data-oid="4ddxv1f">總計</span>
                  <span data-oid="k3twz0x">
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
          data-oid="vvk_8q."
        >
          <div className="flex gap-2" data-oid="1mn12ae">
            {order && (
              <>
                <Button
                  variant="default"
                  onClick={() => onRecordPayment(order)}
                  disabled={order.payment_status === "paid"}
                  data-oid="x0yqbx0"
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
                  data-oid="8f8eliz"
                >
                  處理退款
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2" data-oid="7_h6atg">
            {order && (
              <Button
                variant="secondary"
                onClick={() => onShip(order.id)}
                disabled={
                  order.payment_status !== "paid" ||
                  order.shipping_status !== "pending"
                }
                data-oid="j:z31qx"
              >
                執行出貨
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-oid="8s9fpwt"
            >
              關閉
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
