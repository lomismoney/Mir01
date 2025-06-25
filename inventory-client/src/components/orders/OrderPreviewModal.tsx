'use client';

import { useState } from 'react';
import { useOrderDetail } from '@/hooks/queries/useEntityQueries';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Truck, CreditCard, ShoppingCart } from 'lucide-react';
import { ProcessedOrder, ProcessedOrderItem } from '@/types/api-helpers';

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
export function OrderPreviewModal({ orderId, open, onOpenChange, onShip, onRecordPayment, onRefund }: OrderPreviewModalProps) {
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
      'pending': '待付款',
      'paid': '已付款',
      'partial': '部分付款',
      'refunded': '已退款',
      // 出貨狀態
      'processing': '處理中',
      'shipped': '已出貨',
      'delivered': '已送達',
      'cancelled': '已取消',
      'completed': '已完成'
    };

    const displayText = statusMap[status] || status;

    switch (status) {
      case 'completed':
      case 'paid':
      case 'shipped':
      case 'delivered':
        return <Badge variant="default" className="bg-green-100 text-green-800">{displayText}</Badge>;
      case 'cancelled':
      case 'refunded':
        return <Badge variant="destructive">{displayText}</Badge>;
      case 'pending':
      case 'processing':
      case 'partial':
      default:
        return <Badge variant="secondary">{displayText}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">訂單詳情</DialogTitle>
          {order && <DialogDescription>訂單編號: {order.order_number}</DialogDescription>}
        </DialogHeader>

        {/* 核心內容的 div 容器和邏輯完全不變 */}
        <div className="flex-grow overflow-y-auto pr-4 space-y-6">
          {isLoading && <p>載入中...</p>}
          {error && <p className="text-destructive">讀取失敗：{error.message}</p>}
          
          {order && (
            <>
              {/* --- 狀態面板 --- */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">貨物狀態</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>{getStatusBadge(order.shipping_status)}</CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">付款狀態</CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>{getStatusBadge(order.payment_status)}</CardContent>
                </Card>
              </div>

              {/* --- 客戶資訊卡片 --- */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <UserCircle className="mr-2 h-5 w-5" />
                    客戶資訊
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">名稱</span>
                    <span>{order.customer?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">電話</span>
                    <span>{order.customer?.phone}</span>
                  </div>
                </CardContent>
              </Card>

              {/* --- 訂單品項卡片 --- */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    訂單品項
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b hover:bg-transparent">
                        <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">品項 (SKU)</TableHead>
                        <TableHead className="text-center h-12 px-4 align-middle font-medium text-muted-foreground">數量</TableHead>
                        <TableHead className="text-right h-12 px-4 align-middle font-medium text-muted-foreground">小計</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.items?.map((item: ProcessedOrderItem) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-xs text-muted-foreground">{item.sku}</div>
                          </TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">${(item.price * item.quantity).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* --- 訂單總計 --- */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">商品小計</span>
                  <span>${order.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">運費</span>
                  <span>${(order.shipping_fee || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">折扣</span>
                  <span className="text-green-600">-${order.discount_amount.toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold text-base">
                  <span>總計</span>
                  <span>${order.grand_total.toLocaleString()}</span>
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* 🎯 底部操作按鈕區域 */}
        <DialogFooter className="p-6 pt-4 border-t sm:justify-between flex-wrap gap-2">
          <div className="flex gap-2">
            {order && (
              <>
                <Button 
                  variant="default" 
                  onClick={() => onRecordPayment(order)} 
                  disabled={order.payment_status === 'paid'}
                >
                  記錄收款
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => onRefund(order)} 
                  disabled={order.payment_status !== 'paid' && order.payment_status !== 'partial'}
                >
                  處理退款
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {order && (
              <Button 
                variant="secondary" 
                onClick={() => onShip(order.id)} 
                disabled={order.payment_status !== 'paid' || order.shipping_status !== 'pending'}
              >
                執行出貨
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>關閉</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 