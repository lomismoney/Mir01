'use client'; // 因為使用了 useParams，此頁面需為客戶端組件

import React from 'react';
import { useParams } from 'next/navigation';
import { OrderDetailComponent } from '@/components/orders/OrderDetailComponent';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Truck, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useOrderDetail, useConfirmOrderPayment, useCreateOrderShipment } from '@/hooks/queries/useEntityQueries';
import { Badge } from '@/components/ui/badge';

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = Number(params.id);

    // 數據獲取邏輯上移到頁面組件
    const { data: order, isLoading, isError, error } = useOrderDetail(orderId);
    const { mutate: confirmPayment, isPending: isConfirming } = useConfirmOrderPayment();
    const { mutate: createShipment, isPending: isShipping } = useCreateOrderShipment();

    // 🎯 useOrderDetail 的 select 函數已經處理好資料格式，直接使用純淨的訂單物件

    const handleConfirmPayment = () => {
        if (!orderId) return;
        confirmPayment(orderId);
    };

    const handleCreateShipment = () => {
        if (!orderId) return;
        // 實際應用中，這裡會彈出一個表單讓用戶填寫物流單號
        const shipmentData = { tracking_number: 'TEMP-TRACKING-12345' };
        createShipment({ orderId, data: shipmentData });
    };

    // 🎯 狀態徽章樣式函數
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
                return <Badge className="bg-green-100 text-green-800">{displayText}</Badge>;
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

    // 載入和錯誤狀態處理
    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/orders">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回訂單列表
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">訂單詳情</h1>
                        <p className="text-muted-foreground">載入中...</p>
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
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/orders">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回訂單列表
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">訂單詳情</h1>
                        <p className="text-red-500">載入失敗: {error?.message}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 🎯 指揮艦橋頁眉 - 統一的資訊中樞 */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                        <Link href="/orders">
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">返回訂單列表</span>
                        </Link>
                    </Button>
                    <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                        訂單編號：{order?.order_number || `#${orderId}`}
                    </h1>
                    {/* 訂單狀態徽章 */}
                    {order && (
                        <div className="hidden items-center gap-2 md:ml-auto md:flex">
                            {getStatusBadge(order.shipping_status)}
                            {getStatusBadge(order.payment_status)}
                        </div>
                    )}
                </div>
                
                {/* 主要操作按鈕 */}
                <div className="flex items-center gap-2">
                    {order?.payment_status === 'pending' && (
                        <Button 
                            variant="outline"
                            onClick={handleConfirmPayment} 
                            disabled={isConfirming}
                        >
                            <CreditCard className="h-4 w-4 mr-2" />
                            {isConfirming ? '確認中...' : '確認收款'}
                        </Button>
                    )}
                    {order?.shipping_status === 'pending' && (
                        <Button 
                            onClick={handleCreateShipment} 
                            disabled={isShipping}
                        >
                            <Truck className="h-4 w-4 mr-2" />
                            {isShipping ? '出貨中...' : '執行出貨'}
                        </Button>
                    )}
                </div>
            </div>
            
            {/* 訂單詳情組件 - 現在只負責展示 */}
            <OrderDetailComponent orderId={orderId} />
        </div>
    );
} 