"use client";

import React, { lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useCreateOrder } from "@/hooks";
import { OrderFormValues } from "@/components/orders/OrderForm";
import { toast } from "sonner";
import { LoadingFallback } from "@/components/ui/skeleton";
import { OrderFormErrorBoundary } from "@/components/orders/OrderFormErrorBoundary";

// 動態導入訂單表單組件
const OrderForm = lazy(() => import("@/components/orders/OrderForm").then(module => ({ default: module.OrderForm })));

/**
 * 新增訂單頁面
 * 
 * 🎯 智能預訂系統：自動處理庫存不足情況
 * 
 * 功能特性：
 * 1. 📦 智能判斷：系統自動根據庫存狀況設定商品類型
 * 2. 🛒 自動預訂：無庫存商品自動轉為預訂狀態
 * 3. 🎯 簡化體驗：無需手動確認，直接建立訂單
 */
export default function NewOrderPage() {
  const router = useRouter();
  const { mutate: createOrder, isPending } = useCreateOrder();

  /**
   * 處理訂單提交邏輯
   * 
   * @param values 表單數據
   */
  const handleSubmit = (values: OrderFormValues) => {
    // 💡 修正：確保所有必填欄位都正確提供，並統一數據格式處理
    const orderData = {
      customer_id: values.customer_id,
      store_id: Number(values.store_id), // 🎯 添加缺失的 store_id，確保是數字類型
      shipping_status: values.shipping_status || 'pending',
      payment_status: values.payment_status || 'pending',
      shipping_fee: values.shipping_fee || 0,
      tax: values.tax || 0,
      discount_amount: values.discount_amount || 0,
      payment_method: values.payment_method || 'cash',
      order_source: values.order_source || 'direct',
      shipping_address: values.shipping_address || '',
      notes: values.notes || '',
      items: values.items.map((item) => ({
        product_variant_id: item.product_variant_id,
        is_stocked_sale: item.is_stocked_sale,
        status: item.status || 'pending',
        quantity: item.quantity,
        price: item.price,
        product_name: item.product_name,
        sku: item.sku,
        custom_specifications: item.custom_specifications 
          ? JSON.stringify(item.custom_specifications) 
          : null,
      })),
    };

    console.log('🎯 提交的訂單數據:', orderData);

    createOrder(orderData, {
      onSuccess: (data) => {
        console.log('✅ 訂單創建成功:', data);
        
        // 💡 修正：適配後端 API 的響應格式
        const response = data as { data?: { id?: number; order_number?: string } };
        const newOrderId = response?.data?.id;
        const orderNumber = response?.data?.order_number;

        // 🎯 Success toast 與前端導航
        toast.success('訂單建立成功！', {
          description: `訂單編號：${orderNumber}`,
        });

        // 🎯 跳轉至訂單詳情頁面
        if (newOrderId) {
          router.push(`/orders/${newOrderId}`);
        } else {
          router.push("/orders");
        }
      },
      onError: (error) => {
        console.error('❌ 訂單創建失敗:', error);
        
        // 🎯 簡化的錯誤處理：所有錯誤都顯示一般錯誤訊息
        toast.error('訂單建立失敗', {
          description: error.message || '請檢查輸入資料並重試。',
        });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">新增訂單</h1>
        <p className="text-muted-foreground">
          建立新的訂單記錄，系統將自動處理庫存狀況。
        </p>
      </div>
      
      <OrderFormErrorBoundary>
        <Suspense fallback={<LoadingFallback type="page" text="載入訂單表單..." />}>
          <OrderForm
            isSubmitting={isPending}
            onSubmit={handleSubmit}
          />
        </Suspense>
      </OrderFormErrorBoundary>
    </div>
  );
}