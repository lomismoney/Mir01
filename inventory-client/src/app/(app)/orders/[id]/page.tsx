'use client'; // 因為使用了 useParams，此頁面需為客戶端組件

import React from 'react';
import { useParams } from 'next/navigation';
import { OrderDetailComponent } from '@/components/orders/OrderDetailComponent';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Truck } from 'lucide-react';
import Link from 'next/link';
import { useOrderDetail, useConfirmOrderPayment, useCreateOrderShipment } from '@/hooks/queries/useEntityQueries';

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
            {/* 標題、返回按鈕和操作按鈕 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/orders">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            返回訂單列表
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">訂單詳情</h1>
                        <p className="text-muted-foreground">查看訂單 #{orderId} 的完整資訊</p>
                    </div>
                </div>
                
                {/* 操作按鈕區域 */}
                <div className="flex gap-2">
                    {order?.payment_status === 'pending' && (
                        <Button onClick={handleConfirmPayment} disabled={isConfirming}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            {isConfirming ? '確認中...' : '確認收款'}
                        </Button>
                    )}
                    {order?.shipping_status === 'pending' && (
                        <Button onClick={handleCreateShipment} disabled={isShipping} variant="outline">
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