/**
 * 訂單預覽 Modal 組件
 * 採用「整合式儀表板」設計
 */
"use client";

import React from 'react';
import { 
  X, Package, Truck, CreditCard, User, CheckCircle, 
  Clock, XCircle, MapPin, Phone, Calendar, Hash,
  Receipt, ShoppingBag, Printer, Edit3, Ban, DollarSign,
  RotateCcw, FileText, AlertCircle, StickyNote, History,
  NotebookText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ProductStatusBadge } from '@/components/orders/ProductStatusBadge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useOrderDetail } from '@/hooks/queries/useEntityQueries';
import { ProcessedOrder, ProcessedOrderItem, PaymentRecord } from '@/types/api-helpers';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

// 狀態配置 - 使用 Shadcn/UI 標準變體
const statusConfig = {
  payment: {
    pending: { 
      label: '待付款', 
      icon: Clock, 
      variant: 'outline' as const,
      className: ''
    },
    partial: { 
      label: '部分付款', 
      icon: Clock, 
      variant: 'default' as const,
      className: ''
    },
    paid: { 
      label: '已付款', 
      icon: CheckCircle, 
      variant: 'secondary' as const,
      className: ''
    },
    overdue: { 
      label: '逾期', 
      icon: XCircle, 
      variant: 'destructive' as const,
      className: ''
    },
  },
  shipping: {
    pending: { 
      label: '待出貨', 
      icon: Clock, 
      variant: 'outline' as const,
      className: ''
    },
    processing: { 
      label: '處理中', 
      icon: Package, 
      variant: 'default' as const,
      className: ''
    },
    shipped: { 
      label: '已出貨', 
      icon: Truck, 
      variant: 'secondary' as const,
      className: ''
    },
    delivered: { 
      label: '已送達', 
      icon: CheckCircle, 
      variant: 'secondary' as const,
      className: ''
    },
    cancelled: { 
      label: '已取消', 
      icon: XCircle, 
      variant: 'secondary' as const,
      className: ''
    },
  },
};

// 格式化金額
const formatCurrency = (amount: number): string => {
  return `NT$ ${Math.round(amount).toLocaleString('zh-TW')}`;
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

  // 計算付款進度
  const paymentProgress = order.paid_amount / order.grand_total * 100;
  const remainingAmount = order.grand_total - order.paid_amount;
  const hasCustomItems = order.items.some(item => !item.is_stocked_sale);

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl lg:max-w-6xl max-h-[90vh] flex flex-col p-0">
          {/* 隱藏的標題 for a11y */}
          <DialogTitle className="sr-only">訂單 {order.order_number} 預覽</DialogTitle>
          
          {/* === 頂部標題與狀態欄 (維持不變) === */}
          <div className="flex items-center justify-between p-6 pb-4 border-b">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{order.order_number}</h2>
                <p className="text-sm text-muted-foreground">
                  創建於 {new Date(order.created_at).toLocaleDateString('zh-TW', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={paymentStatus.variant} className={cn("px-3 py-1", paymentStatus.className)}>
                <paymentStatus.icon className="h-4 w-4 mr-1" />
                {paymentStatus.label}
              </Badge>
              <Badge variant={shippingStatus.variant} className={cn("px-3 py-1", shippingStatus.className)}>
                <shippingStatus.icon className="h-4 w-4 mr-1" />
                {shippingStatus.label}
              </Badge>
            </div>
          </div>

          {/* === 核心：整合後的雙欄式佈局 === */}
          <div className="grid md:grid-cols-3 flex-grow overflow-y-auto">
            
            {/* --- 👈 左側主內容區 (單一容器) --- */}
            <div className="md:col-span-2 p-6 space-y-8">
              
              {/* 1. 訂單品項 */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg flex items-center">
                  <Package className="h-5 w-5 mr-3 text-muted-foreground" />
                  訂單品項
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>商品名稱</TableHead>
                      <TableHead className="text-center w-20">數量</TableHead>
                      <TableHead className="text-right w-32 whitespace-nowrap">單價</TableHead>
                      <TableHead className="text-right w-36 whitespace-nowrap">小計</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item: ProcessedOrderItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{item.product_name}</p>
                              {/* 🎯 統一的商品狀態徽章 */}
                              <ProductStatusBadge item={item} />
                            </div>
                            {item.sku && (
                              <p className="text-xs text-muted-foreground">
                                SKU: {item.sku}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-sm whitespace-nowrap">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm whitespace-nowrap">
                          {formatCurrency(item.price * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 付款紀錄 - 只有在有紀錄時才顯示分隔線和內容 */}
              {order.payment_records && order.payment_records.length > 0 && (
                <>
                  <Separator />
                  
                  {/* 2. 付款紀錄 */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg flex items-center">
                      <History className="h-5 w-5 mr-3 text-muted-foreground" />
                      付款紀錄
                      <Badge variant="secondary" className="ml-3 text-xs">
                        {order.payment_records.length} 筆
                      </Badge>
                    </h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>付款日期</TableHead>
                          <TableHead>付款方式</TableHead>
                          <TableHead className="text-right w-32 whitespace-nowrap">金額</TableHead>
                          <TableHead>備註</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.payment_records.map((record: PaymentRecord, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="text-sm">
                              {new Date(record.payment_date).toLocaleDateString('zh-TW', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {record.payment_method}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-sm whitespace-nowrap">
                              {formatCurrency(record.amount)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {record.notes || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </div>

            {/* --- 👉 右側邊欄 (極簡主義一體式設計) --- */}
            <div className="md:col-span-1 p-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>訂單資訊</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* 1. 訂單總計區 */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">訂單總計</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">商品小計</span>
                        <span className="whitespace-nowrap text-right min-w-[100px]">{formatCurrency(order.subtotal)}</span>
                      </div>
                      
                      {order.shipping_fee !== null && order.shipping_fee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">運費</span>
                          <span className="whitespace-nowrap text-right min-w-[100px]">{formatCurrency(order.shipping_fee)}</span>
                        </div>
                      )}
                      
                      {order.discount_amount && order.discount_amount > 0 && (
                        <div className="flex justify-between text-sm text-success">
                          <span>折扣優惠</span>
                          <span className="whitespace-nowrap text-right min-w-[100px]">-{formatCurrency(order.discount_amount)}</span>
                        </div>
                      )}
                      
                      <Separator className="my-2" />
                      
                      <div className="flex justify-between font-bold text-base pt-1">
                        <span>總計</span>
                        <span className="text-primary whitespace-nowrap text-right min-w-[100px]">{formatCurrency(order.grand_total)}</span>
                      </div>

                      {/* 付款進度 */}
                      <div className="space-y-2 pt-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">付款進度</span>
                          <span className="font-medium">{Math.round(paymentProgress)}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${paymentProgress}%` }}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">已付</p>
                            <p className="font-semibold text-success whitespace-nowrap">
                              {formatCurrency(order.paid_amount)}
                            </p>
                          </div>
                          {remainingAmount > 0 && (
                            <div className="text-right">
                              <p className="text-muted-foreground">待付</p>
                              <p className="font-semibold text-warning whitespace-nowrap">
                                {formatCurrency(remainingAmount)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* 2. 客戶資訊區 */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">客戶資訊</h3>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">客戶姓名</p>
                        <p className="text-sm font-medium">{order.customer?.name || '-'}</p>
                      </div>
                      
                      {order.customer?.phone && (
                        <div>
                          <p className="text-xs text-muted-foreground">聯絡電話</p>
                          <div className="text-sm font-medium flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.customer.phone}
                          </div>
                        </div>
                      )}
                      
                      {defaultAddress && (
                        <div>
                          <p className="text-xs text-muted-foreground">
                            {defaultAddress.is_default ? '預設地址' : '送貨地址'}
                          </p>
                          <div className="text-sm font-medium flex items-start gap-1">
                            <MapPin className="h-3 w-3 mt-0.5" />
                            <span className="flex-1">{defaultAddress.address}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* 3. 訂單備註區 */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">訂單備註</h3>
                    <p className="text-sm">
                      {order.notes || "無"}
                    </p>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>

          {/* === 底部操作欄 (維持不變) === */}
          <DialogFooter className="p-6 pt-4 border-t flex justify-between">
            <div className="flex items-center justify-between w-full">
              <div className="flex gap-2">
                {/* 查看詳情、列印等輔助按鈕 */}
                <Button variant="outline" size="sm" onClick={handleViewDetails}>
                  <FileText className="h-4 w-4 mr-2" />
                  查看完整詳情
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => onPrint(order)}>
                      <Printer className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>列印訂單</TooltipContent>
                </Tooltip>
              </div>

              <div className="flex gap-2">
                {/* 出貨、退款等主要操作按鈕 */}
                {order.shipping_status === 'pending' && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => onShipOrder(order)}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    出貨
                  </Button>
                )}

                {order.payment_status !== 'paid' && order.payment_status !== 'cancelled' && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => onRecordPayment(order)}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    記錄付款
                  </Button>
                )}

                {order.payment_status === 'paid' && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => onRefund(order)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    退款
                  </Button>
                )}

                {order.shipping_status !== 'shipped' && 
                 order.shipping_status !== 'delivered' && 
                 order.shipping_status !== 'cancelled' && (
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(order)}
                  >
                    <Ban className="h-4 w-4 mr-2" />
                    取消訂單
                  </Button>
                )}

                <Button size="sm" onClick={() => onEdit(order)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  編輯訂單
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
} 