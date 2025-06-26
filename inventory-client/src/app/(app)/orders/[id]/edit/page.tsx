"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useOrderDetail,
  useUpdateOrder,
} from "@/hooks/queries/useEntityQueries";
import { OrderForm, OrderFormValues } from "@/components/orders/OrderForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// 表單骨架屏
const FormSkeleton = () => (
  <div className="space-y-8" data-oid="a0qo4ig">
    <div className="space-y-2" data-oid="v415dx_">
      <Skeleton className="h-4 w-1/4" data-oid="h912.6l" />
      <Skeleton className="h-10 w-full" data-oid="57fwiul" />
    </div>
    <div className="space-y-2" data-oid="xi_q5lb">
      <Skeleton className="h-4 w-1/4" data-oid="4d8r5sg" />
      <Skeleton className="h-10 w-full" data-oid="8whx-ip" />
    </div>
    <div
      className="h-48 w-full rounded-md border-2 border-dashed"
      data-oid="58uan.f"
    />

    <Skeleton className="h-10 w-32" data-oid="gsvc1lr" />
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
      { id: orderId, data: orderData as any },
      {
        onSuccess: () => {
          router.push(`/orders/${orderId}`);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6" data-oid="n5ry95-">
        <div className="flex items-center gap-4" data-oid="qwymmq.">
          <Button variant="outline" size="sm" asChild data-oid="b1sx1zx">
            <Link href="/orders" data-oid="wo5ytvj">
              <ArrowLeft className="h-4 w-4 mr-2" data-oid="8lve-2x" />
              返回訂單列表
            </Link>
          </Button>
          <div data-oid="rrhar6v">
            <h1 className="text-2xl font-bold" data-oid="2jvhz8s">
              編輯訂單
            </h1>
            <p className="text-muted-foreground" data-oid="84t28cq">
              載入中...
            </p>
          </div>
        </div>
        <FormSkeleton data-oid="cbakgo1" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6" data-oid="n15mj1q">
        <div className="flex items-center gap-4" data-oid="rpvhjhn">
          <Button variant="outline" size="sm" asChild data-oid=".fzp6ml">
            <Link href="/orders" data-oid="3l89qtg">
              <ArrowLeft className="h-4 w-4 mr-2" data-oid="ok3utrm" />
              返回訂單列表
            </Link>
          </Button>
          <div data-oid="kv7yzwt">
            <h1 className="text-2xl font-bold" data-oid="3:o7g.o">
              編輯訂單
            </h1>
            <p className="text-red-500" data-oid="i0uqt9z">
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
          order.items?.map((item: any) => ({
            id: item.id,
            product_variant_id: item.product_variant_id,
            is_stocked_sale: item.is_stocked_sale,
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
    <div className="space-y-6" data-oid="xh-k8.h">
      <div className="flex items-center gap-4" data-oid="i1t7a_p">
        <Button variant="outline" size="sm" asChild data-oid="swt7zvh">
          <Link href={`/orders/${orderId}`} data-oid="rwxg5mz">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="0hmvt28" />
            返回訂單詳情
          </Link>
        </Button>
        <div data-oid="4--q-ed">
          <h1 className="text-2xl font-bold" data-oid="q94ymko">
            編輯訂單
          </h1>
          <p className="text-muted-foreground" data-oid="tir71.6">
            正在修改訂單號：{order?.order_number}
          </p>
        </div>
      </div>

      <OrderForm
        initialData={initialData}
        isSubmitting={isUpdating}
        onSubmit={handleUpdateSubmit}
        data-oid="wrb56n2"
      />
    </div>
  );
}
