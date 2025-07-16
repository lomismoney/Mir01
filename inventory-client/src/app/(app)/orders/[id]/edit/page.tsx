"use client";

import React, { lazy, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useOrderDetail,
  useUpdateOrder,
} from "@/hooks";
import { OrderFormValues } from "@/components/orders/OrderForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { LoadingFallback } from "@/components/ui/skeleton";
import type { OrderItem } from "@/types/api-helpers";

// 動態導入訂單表單組件
const OrderForm = lazy(() => import("@/components/orders/OrderForm").then(module => ({ default: module.OrderForm })));
import Link from "next/link";

// 表單骨架屏
const FormSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-10 w-full" />
    </div>
    <div
      className="h-48 w-full rounded-md border-2 border-dashed"
     
    />

    <Skeleton className="h-10 w-32" />
  </div>
);

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

  const { data: order, isLoading, isError, error } = useOrderDetail(orderId);
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();

  const handleUpdateSubmit = (values: OrderFormValues) => {
    // 轉換表單數據為 API 期望的格式
    const orderData = {
      ...values,
      items: values.items.map((item) => ({
        ...item,
        id: item.id,
        custom_specifications: item.custom_specifications
          ? JSON.stringify(item.custom_specifications)
          : null,
      })),
    };

    updateOrder(
      { id: orderId, data: orderData },
      {
        onSuccess: () => {
          router.push(`/orders/${orderId}`);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/orders"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回訂單列表
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              編輯訂單
            </h1>
            <p className="text-muted-foreground">
              載入中...
            </p>
          </div>
        </div>
        <FormSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/orders"
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回訂單列表
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              編輯訂單
            </h1>
            <p className="text-red-500">
              載入失敗: {error?.message}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🎯 直接使用 order，不需要再從 response.data 解包
  const initialData = order
    ? {
        customer_id: order.customer_id,
        shipping_address: order.shipping_address || "",
        payment_method: order.payment_method,
        order_source: order.order_source,
        shipping_status: order.shipping_status,
        payment_status: order.payment_status,
        shipping_fee: order.shipping_fee || 0,
        tax: order.tax_amount,
        discount_amount: order.discount_amount || 0,
        notes: order.notes || "",
        items:
          order.items?.map((item: OrderItem) => ({
            id: item.id,
            product_variant_id: item.product_variant_id,
            is_stocked_sale: item.is_stocked_sale,
            is_backorder: item.is_backorder, // 🎯 修復：加入缺失的 is_backorder 欄位
            status: item.status,
            quantity: item.quantity,
            price: item.price,
            product_name: item.product_name,
            sku: item.sku,
            custom_specifications: item.custom_specifications
              ? JSON.parse(item.custom_specifications)
              : undefined,
          })) || [],
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href={`/orders/${orderId}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回訂單詳情
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            編輯訂單
          </h1>
          <p className="text-muted-foreground">
            正在修改訂單號：{order?.order_number}
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingFallback type="page" text="載入編輯表單..." />}>
        <OrderForm
          initialData={initialData}
          isSubmitting={isUpdating}
          onSubmit={handleUpdateSubmit}
        />
      </Suspense>
    </div>
  );
}
