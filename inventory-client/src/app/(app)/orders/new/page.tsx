"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useCreateOrder } from "@/hooks/queries/useEntityQueries";
import { OrderForm, OrderFormValues } from "@/components/orders/OrderForm";
import { toast } from "sonner";

export default function NewOrderPage() {
  const router = useRouter();
  const { mutate: createOrder, isPending } = useCreateOrder();

  const handleSubmit = (values: OrderFormValues) => {
    // 轉換表單數據為 API 期望的格式
    const orderData = {
      ...values,
      items: values.items.map((item) => ({
        ...item,
        custom_specifications: item.custom_specifications
          ? JSON.stringify(item.custom_specifications)
          : null,
      })),
    };

    createOrder(orderData as any, {
      onSuccess: (data) => {
        const newOrderId = (data as any)?.data?.id;
        if (newOrderId) {
          router.push(`/orders/${newOrderId}`);
        } else {
          router.push("/orders");
        }
      },
    });
  };

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
        onSubmit={handleSubmit}
        data-oid="r4y513s"
      />
    </div>
  );
}
