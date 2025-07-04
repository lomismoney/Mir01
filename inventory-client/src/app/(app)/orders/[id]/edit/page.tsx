"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useOrderDetail,
  useUpdateOrder,
} from "@/hooks";
import { OrderForm, OrderFormValues } from "@/components/orders/OrderForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// 表單骨架屏
const FormSkeleton = () => (
  <div className="space-y-8" data-oid="gva::jm">
    <div className="space-y-2" data-oid="1fe.17i">
      <Skeleton className="h-4 w-1/4" data-oid="auui4we" />
      <Skeleton className="h-10 w-full" data-oid="r8i-ogl" />
    </div>
    <div className="space-y-2" data-oid="3v3mu-.">
      <Skeleton className="h-4 w-1/4" data-oid="qcqspis" />
      <Skeleton className="h-10 w-full" data-oid="lslpmtr" />
    </div>
    <div
      className="h-48 w-full rounded-md border-2 border-dashed"
      data-oid="i3yzpr4"
    />

    <Skeleton className="h-10 w-32" data-oid="-j7y_r3" />
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
      <div className="space-y-6" data-oid="bh0yumg">
        <div className="flex items-center gap-4" data-oid="3xuomg5">
          <Button variant="outline" size="sm" asChild data-oid="k:u0_tr">
            <Link href="/orders" data-oid="9:ob85q">
              <ArrowLeft className="h-4 w-4 mr-2" data-oid="meg:vn1" />
              返回訂單列表
            </Link>
          </Button>
          <div data-oid="hcaj3p.">
            <h1 className="text-2xl font-bold" data-oid="s90qy.n">
              編輯訂單
            </h1>
            <p className="text-muted-foreground" data-oid="eplo89u">
              載入中...
            </p>
          </div>
        </div>
        <FormSkeleton data-oid="kv1_tl7" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-6" data-oid="b31j6p1">
        <div className="flex items-center gap-4" data-oid="sptviiu">
          <Button variant="outline" size="sm" asChild data-oid=":2erdmh">
            <Link href="/orders" data-oid="ct2_5j9">
              <ArrowLeft className="h-4 w-4 mr-2" data-oid="h4t-6lj" />
              返回訂單列表
            </Link>
          </Button>
          <div data-oid="8uj2hog">
            <h1 className="text-2xl font-bold" data-oid="8svyv62">
              編輯訂單
            </h1>
            <p className="text-red-500" data-oid="7wwx3ts">
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
    <div className="space-y-6" data-oid="vb-upos">
      <div className="flex items-center gap-4" data-oid="l34d4-z">
        <Button variant="outline" size="sm" asChild data-oid="ho82tsk">
          <Link href={`/orders/${orderId}`} data-oid="esr-min">
            <ArrowLeft className="h-4 w-4 mr-2" data-oid="j9f6clg" />
            返回訂單詳情
          </Link>
        </Button>
        <div data-oid="xjfyjc0">
          <h1 className="text-2xl font-bold" data-oid="p:pimix">
            編輯訂單
          </h1>
          <p className="text-muted-foreground" data-oid="gpunqe1">
            正在修改訂單號：{order?.order_number}
          </p>
        </div>
      </div>

      <OrderForm
        initialData={initialData}
        isSubmitting={isUpdating}
        onSubmit={handleUpdateSubmit}
        data-oid="hwp1rsj"
      />
    </div>
  );
}
