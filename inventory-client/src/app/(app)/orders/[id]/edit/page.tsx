'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useOrderDetail, useUpdateOrder } from '@/hooks/queries/useEntityQueries';
import { OrderForm, OrderFormValues } from '@/components/orders/OrderForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// 表單骨架屏
const FormSkeleton = () => (
  <div className="space-y-8">
    <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
    <div className="space-y-2"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-10 w-full" /></div>
    <div className="h-48 w-full rounded-md border-2 border-dashed" />
    <Skeleton className="h-10 w-32" />
  </div>
);

export default function EditOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = Number(params.id);

  const { data: response, isLoading, isError, error } = useOrderDetail(orderId);
  const { mutate: updateOrder, isPending: isUpdating } = useUpdateOrder();

  const handleUpdateSubmit = (values: OrderFormValues) => {
    // 轉換表單數據為 API 期望的格式
    const orderData = {
      ...values,
      items: values.items.map(item => ({
        ...item,
        id: item.id,
        custom_specifications: item.custom_specifications ? 
          JSON.stringify(item.custom_specifications) : null
      }))
    };

    updateOrder(
      { id: orderId, data: orderData as any },
      {
        onSuccess: () => {
          router.push(`/orders/${orderId}`);
        },
      }
    );
  };

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
            <h1 className="text-2xl font-bold">編輯訂單</h1>
            <p className="text-muted-foreground">載入中...</p>
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/orders">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回訂單列表
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">編輯訂單</h1>
            <p className="text-red-500">載入失敗: {error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  // 轉換 API 數據為表單所需格式
  const orderData = (response as any)?.data;
  const initialData = orderData ? {
    customer_id: orderData.customer_id,
    shipping_address: orderData.shipping_address,
    payment_method: orderData.payment_method,
    order_source: orderData.order_source,
    shipping_status: orderData.shipping_status,
    payment_status: orderData.payment_status,
    shipping_fee: parseFloat(orderData.shipping_fee || '0'),
    tax: parseFloat(orderData.tax || '0'),
    discount_amount: parseFloat(orderData.discount_amount || '0'),
    notes: orderData.notes || '',
    items: orderData.items?.map((item: any) => ({
      id: item.id,
      product_variant_id: item.product_variant_id,
      is_stocked_sale: item.is_stocked_sale,
      status: item.status,
      quantity: item.quantity,
      price: parseFloat(item.price || '0'),
      product_name: item.product_name,
      sku: item.sku,
      custom_specifications: item.custom_specifications ? 
        JSON.parse(item.custom_specifications) : undefined,
    })) || []
  } : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回訂單詳情
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">編輯訂單</h1>
          <p className="text-muted-foreground">
            正在修改訂單號：{orderData?.order_number}
          </p>
        </div>
      </div>

      <OrderForm
        initialData={initialData}
        isSubmitting={isUpdating}
        onSubmit={handleUpdateSubmit}
      />
    </div>
  );
} 