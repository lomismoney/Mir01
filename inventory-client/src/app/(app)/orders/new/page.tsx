"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useCreateOrder } from "@/hooks";
import { OrderForm, OrderFormValues } from "@/components/orders/OrderForm";
// StockCheckDialog 已移除，預訂系統現在為自動模式
import { toast } from "sonner";

/**
 * 擴展的錯誤介面，支援庫存檢查結構化異常
 */
interface StockCheckError extends Error {
  stockCheckResults?: any[];
  insufficientStockItems?: any[];
}

/**
 * 新增訂單頁面
 * 
 * 🎯 預訂系統整合：完整支援庫存不足處理流程
 * 
 * 功能特性：
 * 1. 📦 正常建單：庫存充足時的標準流程
 * 2. ⚠️ 庫存警告：庫存不足時的智能提示
 * 3. 🛒 預訂模式：用戶確認後的強制建單
 * 4. 🎯 用戶體驗：清晰的錯誤處理和狀態回饋
 */
export default function NewOrderPage() {
  const router = useRouter();
  const { mutate: createOrder, isPending } = useCreateOrder();

  // 🎯 預訂系統：自動模式，不需要額外狀態管理

  /**
   * 處理訂單提交邏輯
   * 
   * @param values 表單數據
   * @param forceCreate 是否強制建單（忽略庫存限制）
   */
  const handleSubmit = (values: OrderFormValues, forceCreate: boolean = false) => {
    // 💡 修正：確保所有必填欄位都正確提供，並統一數據格式處理
    const orderData = {
      customer_id: values.customer_id,
      shipping_status: values.shipping_status || 'pending',
      payment_status: values.payment_status || 'pending',
      shipping_fee: values.shipping_fee || 0,
      tax: values.tax || 0, // 🎯 對應後端的 'tax' 欄位
      discount_amount: values.discount_amount || 0,
      payment_method: values.payment_method,
      order_source: values.order_source,
      shipping_address: values.shipping_address,
      notes: values.notes || null,
      // 🎯 預訂系統：添加強制建單參數
      force_create_despite_stock: forceCreate ? 1 : 0,
      items: values.items.map((item) => ({
        product_variant_id: item.product_variant_id || null,
        is_stocked_sale: item.is_stocked_sale,
        status: item.status || 'pending',
        custom_specifications: item.custom_specifications
          ? JSON.stringify(item.custom_specifications) // 🎯 確保 JSON 字串格式
          : null,
        product_name: item.product_name,
        sku: item.sku,
        price: Number(item.price), // 🎯 確保是數字格式
        quantity: Number(item.quantity), // 🎯 確保是數字格式
      })),
    };

    console.log('📤 發送到後端的訂單數據:', JSON.stringify(orderData, null, 2));

    createOrder(orderData, {
      onSuccess: (data) => {
        // 🎯 成功建立訂單
        const newOrderId = (data as any)?.data?.id;
        const orderNumber = (data as any)?.data?.order_number;
        
        // 根據是否為預訂模式顯示不同的成功訊息
        if (forceCreate) {
          toast.success('預訂訂單建立成功！', {
            description: `訂單編號：${orderNumber}，部分商品將於補貨後出貨`,
          });
        } else {
          toast.success('訂單建立成功！', {
            description: `訂單編號：${orderNumber}`,
          });
        }

        // 🎯 訂單建立成功，準備導航

        // 導航到訂單詳情或訂單列表
        if (newOrderId) {
          router.push(`/orders/${newOrderId}`);
        } else {
          router.push("/orders");
        }
      },
      onError: (error) => {
        console.error('❌ 訂單創建失敗:', error);
        
        // 🎯 預訂系統：智能錯誤處理 - 自動預訂模式
        const stockError = error as StockCheckError;
        const isStockError =
          stockError?.stockCheckResults || stockError?.insufficientStockItems;

        // 檢查此次提交是否已經帶有 forceCreate 標記
        const alreadyForced = forceCreate;

        if (isStockError && !alreadyForced) {
          console.log('⚠️ 庫存不足，立即轉為預訂模式重新提交');

          // 直接重新提交，啟用強制建單模式
          const forceOrder = {
            ...orderData,
            force_create_despite_stock: 1,
          } as typeof orderData;

          createOrder(forceOrder, {
            onSuccess: (data) => {
              // 🎯 成功建立訂單
              const newOrderId = (data as any)?.data?.id;
              const orderNumber = (data as any)?.data?.order_number;
              
              // 根據是否為預訂模式顯示不同的成功訊息
              if (forceCreate) {
                toast.success('預訂訂單建立成功！', {
                  description: `訂單編號：${orderNumber}，部分商品將於補貨後出貨`,
                });
              } else {
                toast.success('訂單建立成功！', {
                  description: `訂單編號：${orderNumber}`,
                });
              }

              // 🎯 訂單建立成功，準備導航

              // 導航到訂單詳情或訂單列表
              if (newOrderId) {
                router.push(`/orders/${newOrderId}`);
              } else {
                router.push("/orders");
              }
            },
            onError: (err) => {
              // 如果強制建單仍然失敗，則顯示錯誤
              console.error('❌ 預訂訂單仍然失敗:', err);
              toast.error('預訂訂單建立失敗', {
                description: err.message || '請稍後再試',
              });
            },
          });

          toast.info('部分商品庫存不足，系統已自動轉為預訂訂單', {
            description: '商品將於補貨後自動出貨',
          });
        } else {
          // 🎯 其他類型的錯誤：顯示一般錯誤訊息
          toast.error('訂單建立失敗', {
            description: error.message || '請檢查輸入資料並重試。',
          });
        }
      },
    });
  };

  // 🎯 預訂系統現在為自動模式，不需要用戶交互函數

  return (
    <div className="space-y-6" data-oid="dx7m__r">
      <div data-oid="dfcxmsl">
        <h2 className="text-2xl font-bold" data-oid="gwvvljp">
          新增訂單
        </h2>
        <p className="text-muted-foreground" data-oid="90rzrrg">
          填寫以下資訊以創建一筆新的銷售訂單。
        </p>
      </div>
      
      <OrderForm
        isSubmitting={isPending}
        onSubmit={(values) => handleSubmit(values, false)} // 初始提交，不強制建單
        data-oid="r4y513s"
      />

      {/* 🎯 預訂系統：自動模式，不需要對話框 */}
    </div>
  );
}
