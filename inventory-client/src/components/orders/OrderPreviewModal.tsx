/**
 * 訂單預覽 Modal 組件
 * 採用現代電商平台設計風格，提供快速查看訂單詳情的功能
 */
"use client";

import React from 'react';
import { X, Package, Truck, CreditCard, User, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useOrderDetail } from '@/hooks/queries/useEntityQueries';
import { ProcessedOrder, ProcessedOrderItem, PaymentRecord } from '@/types/api-helpers';
import { TooltipProvider } from '@/components/ui/tooltip';

interface OrderPreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number | null;
  onEdit: (order: ProcessedOrder) => void;
  onPrint: (order: ProcessedOrder) => void;
  onCancel: (order: ProcessedOrder) => void;
  onShipOrder: (order: ProcessedOrder) => void;
  onRecordPayment: (order: ProcessedOrder) => void;
  onRefund: (order: ProcessedOrder) => void;
}

// 狀態配置
const statusConfig = {
  payment: {
    pending: { label: '待付款', icon: Clock, className: 'text-amber-600 bg-amber-50' },
    partial: { label: '部分付款', icon: Clock, className: 'text-blue-600 bg-blue-50' },
    paid: { label: '已付款', icon: CheckCircle, className: 'text-green-600 bg-green-50' },
    overdue: { label: '逾期', icon: XCircle, className: 'text-red-600 bg-red-50' },
  },
  shipping: {
    pending: { label: '待出貨', icon: Clock, className: 'text-amber-600 bg-amber-50' },
    processing: { label: '處理中', icon: Package, className: 'text-blue-600 bg-blue-50' },
    shipped: { label: '已出貨', icon: Truck, className: 'text-green-600 bg-green-50' },
    delivered: { label: '已送達', icon: CheckCircle, className: 'text-green-600 bg-green-50' },
    cancelled: { label: '已取消', icon: XCircle, className: 'text-red-600 bg-red-50' },
  },
};

// 格式化金額
const formatCurrency = (amount: number): string => {
  return `NT$ ${amount.toLocaleString('zh-TW')}`;
};

export function OrderPreviewModal({
  open,
  onOpenChange,
  orderId,
  onEdit,
  onPrint,
  onCancel,
  onShipOrder,
  onRecordPayment,
  onRefund,
}: OrderPreviewModalProps) {
  const router = useRouter();
  const { data: order, isLoading, error } = useOrderDetail(orderId);

  if (!orderId || !order || isLoading) return null;

  const paymentStatus = statusConfig.payment[order.payment_status as keyof typeof statusConfig.payment] || statusConfig.payment.pending;
  const shippingStatus = statusConfig.shipping[order.shipping_status as keyof typeof statusConfig.shipping] || statusConfig.shipping.pending;

  const handleViewDetails = () => {
    router.push(`/orders/${order.id}`);
    onOpenChange(false);
  };

  // 取得預設地址
  const defaultAddress = order.customer?.addresses?.find(a => a.is_default) || 
                        order.customer?.addresses?.[0];

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 gap-0 overflow-hidden">
          {/* 隱藏的標題 for a11y */}
          <DialogTitle className="sr-only">訂單 {order.order_number} 預覽</DialogTitle>
          
          {/* Header */}
          <div className="bg-muted/30 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{order.order_number}</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {new Date(order.created_at).toLocaleDateString('zh-TW')}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea className="max-h-[calc(100vh-200px)]">
            <div className="p-6 space-y-6">
              {/* 狀態卡片組 */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">付款狀態</p>
                        <div className="flex items-center gap-2 mt-1">
                          <paymentStatus.icon className="h-4 w-4" />
                          <span className="font-medium">{paymentStatus.label}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn("font-normal", paymentStatus.className)}>
                        {paymentStatus.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">出貨狀態</p>
                        <div className="flex items-center gap-2 mt-1">
                          <shippingStatus.icon className="h-4 w-4" />
                          <span className="font-medium">{shippingStatus.label}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn("font-normal", shippingStatus.className)}>
                        {shippingStatus.label}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 客戶資訊 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">客戶資訊</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">姓名</span>
                      <span className="font-medium">{order.customer?.name || '-'}</span>
                    </div>
                    {order.customer?.phone && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">電話</span>
                        <span>{order.customer.phone}</span>
                      </div>
                    )}
                    {defaultAddress && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          地址
                        </span>
                        <span className="text-right max-w-xs">
                          {defaultAddress.address}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 商品明細 */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-medium">商品明細</h3>
                  </div>
                  <div className="space-y-3">
                    {order.items.map((item: ProcessedOrderItem) => (
                      <div key={item.id} className="flex items-start justify-between py-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.product_name}</p>
                          {item.sku && (
                            <p className="text-xs text-muted-foreground mt-0.5">SKU: {item.sku}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(item.price)} × {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-medium ml-4">
                          {formatCurrency(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-3" />

                  {/* 費用明細 */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">小計</span>
                      <span>{formatCurrency(order.subtotal)}</span>
                    </div>
                    {order.shipping_fee !== null && order.shipping_fee > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">運費</span>
                        <span>{formatCurrency(order.shipping_fee)}</span>
                      </div>
                    )}
                    {order.discount_amount && order.discount_amount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>折扣</span>
                        <span>-{formatCurrency(order.discount_amount)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-medium">
                      <span>總計</span>
                      <span className="text-base">{formatCurrency(order.grand_total)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 付款資訊 */}
              {order.payment_records && order.payment_records.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">付款紀錄</h3>
                    </div>
                    <div className="space-y-2">
                      {order.payment_records.map((record: PaymentRecord, index: number) => (
                        <div key={index} className="flex justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {new Date(record.payment_date).toLocaleDateString('zh-TW')}
                            </span>
                            <span>{record.payment_method}</span>
                          </div>
                          <span className="font-medium">{formatCurrency(record.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions */}
          <div className="border-t bg-muted/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={handleViewDetails}>
                查看完整詳情
              </Button>
              <Button onClick={() => onEdit(order)}>
                編輯訂單
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
} 