'use client';

import React from 'react';
import { useOrderDetail, useUpdateOrderItemStatus } from '@/hooks/queries/useEntityQueries';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface OrderDetailComponentProps {
  orderId: number;
}

export function OrderDetailComponent({ orderId }: OrderDetailComponentProps) {
    const { data: order, isLoading, isError, error } = useOrderDetail(orderId);
    const { mutate: updateItemStatus, isPending } = useUpdateOrderItemStatus();
    
    // 🎯 狀態中文對照表
    const getStatusText = (status: string) => {
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
            'completed': '已完成',
            // 項目狀態
            '待處理': '待處理',
            '已叫貨': '已叫貨',
            '已出貨': '已出貨',
            '完成': '完成'
        };
        return statusMap[status] || status;
    };
    
    // 可用的項目狀態選項
    const statusOptions = [
        { value: '待處理', label: '待處理' },
        { value: '已叫貨', label: '已叫貨' },
        { value: '已出貨', label: '已出貨' },
        { value: '完成', label: '完成' },
    ];
    
    // 處理狀態更新
    const handleStatusChange = (itemId: number, newStatus: string) => {
        updateItemStatus({
            orderItemId: itemId,
            status: newStatus,
        });
    };

    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2"><CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
            </div>
        );
    }

    if (isError) {
        return <div className="text-red-500">無法加載訂單詳情: {error?.message}</div>;
    }

    if (!order) {
        return <div>找不到訂單資料。</div>;
    }

    // 🎯 計算總計資訊
    const subtotal = order.items?.reduce((acc: number, item: any) => 
        acc + (item.price * item.quantity), 0) || 0;

    return (
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
                                    <TableHead>商品名稱</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead className="text-right">單價</TableHead>
                                    <TableHead className="text-center">數量</TableHead>
                                    <TableHead className="text-right">小計</TableHead>
                                    <TableHead>項目狀態</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {order.items?.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div>
                                                    <div className="font-medium">{item.product_name}</div>
                                                    {item.custom_specifications && (
                                                        <Badge variant="outline" className="mt-1">訂製</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            {/* 🎯 優雅地顯示訂製規格 */}
                                            {item.custom_specifications && (
                                                <div className="mt-2 p-2 bg-muted rounded-md">
                                                    <div className="text-xs font-medium text-muted-foreground">訂製規格：</div>
                                                    <div className="text-sm mt-1">
                                                        {Object.entries(
                                                            typeof item.custom_specifications === 'string' 
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
                                        <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                                        <TableCell className="text-right">${item.price.toLocaleString()}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right font-medium">${(item.price * item.quantity).toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={item.status}
                                                    onValueChange={(newStatus) => handleStatusChange(item.id, newStatus)}
                                                    disabled={isPending}
                                                >
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {statusOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {isPending && (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
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
                            <span>{new Date(order.created_at).toLocaleString('zh-TW')}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">貨物狀態</span>
                            <Badge variant={order.shipping_status === 'shipped' ? 'default' : 'secondary'}>
                                {getStatusText(order.shipping_status)}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">付款狀態</span>
                            <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                                {getStatusText(order.payment_status)}
                            </Badge>
                        </div>
                        
                        {/* 金額明細 */}
                        <div className="pt-3 mt-3 border-t space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">商品小計</span>
                                <span>${subtotal.toLocaleString()}</span>
                            </div>
                            {(order.shipping_fee && order.shipping_fee > 0) && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">運費</span>
                                    <span>${order.shipping_fee.toLocaleString()}</span>
                                </div>
                            )}
                            {order.discount_amount > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">折扣</span>
                                    <span className="text-green-600">-${order.discount_amount.toLocaleString()}</span>
                                </div>
                            )}
                            {order.tax > 0 && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">稅額</span>
                                    <span>${order.tax.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between font-medium text-base pt-2 border-t">
                                <span className="text-muted-foreground">訂單總額</span>
                                <span>{new Intl.NumberFormat('zh-TW', { 
                                    style: 'currency', 
                                    currency: 'TWD', 
                                    minimumFractionDigits: 0 
                                }).format(order.grand_total)}</span>
                            </div>
                        </div>
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
                            <span className="font-medium">{order.customer?.name || '未提供'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">聯絡電話</span>
                            <span>{order.customer?.phone || '未提供'}</span>
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
    );
} 