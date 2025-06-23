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

    return (
        <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">
                {/* 訂單項目卡片 */}
                <Card>
                    <CardHeader><CardTitle>訂單項目</CardTitle></CardHeader>
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
                                        <TableCell>{item.sku}</TableCell>
                                        <TableCell className="text-right">${parseFloat(item.price).toLocaleString()}</TableCell>
                                        <TableCell className="text-center">{item.quantity}</TableCell>
                                        <TableCell className="text-right">${(parseFloat(item.price) * item.quantity).toLocaleString()}</TableCell>
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
            <div className="space-y-6">
                {/* 訂單摘要卡片 */}
                <Card>
                    <CardHeader><CardTitle>訂單摘要</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between"><span>訂單號碼:</span> <span>{order.order_number}</span></div>
                        <div className="flex justify-between"><span>下單時間:</span> <span>{new Date(order.created_at).toLocaleString('zh-TW')}</span></div>
                        <div className="flex justify-between"><span>貨物狀態:</span> <Badge>{order.shipping_status}</Badge></div>
                        <div className="flex justify-between"><span>付款狀態:</span> <Badge>{order.payment_status}</Badge></div>
                        <div className="flex justify-between font-bold"><span>訂單總額:</span> <span>{new Intl.NumberFormat('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 }).format(parseFloat(order.grand_total))}</span></div>
                    </CardContent>
                </Card>

                {/* 客戶資訊卡片 */}
                <Card>
                    <CardHeader><CardTitle>客戶資訊</CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                        <p><strong>客戶名稱:</strong> {order.customer?.name}</p>
                        <p><strong>聯絡電話:</strong> {order.customer?.phone}</p>
                        <p><strong>運送地址:</strong> {order.shipping_address || '未提供'}</p>
                        {order.billing_address && (
                            <p><strong>帳單地址:</strong> {order.billing_address}</p>
                        )}
                        {order.notes && (
                            <div>
                                <strong>備註:</strong>
                                <p className="text-sm text-muted-foreground mt-1">{order.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
} 