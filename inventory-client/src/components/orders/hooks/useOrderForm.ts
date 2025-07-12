import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";

// 🎯 使用 Zod 提前定義表單驗證規則
const orderFormSchema = z.object({
  customer_id: z.number().min(1, "必須選擇一個客戶"),
  shipping_address: z.string().min(1, "運送地址為必填"),
  payment_method: z.string().min(1, "必須選擇付款方式"),
  order_source: z.string().min(1, "必須選擇客戶來源"),
  shipping_status: z.string(),
  payment_status: z.string(),
  fulfillment_priority: z.enum(["normal", "high", "urgent", "low"]).optional(),
  priority_reason: z.string().optional(),
  shipping_fee: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.number().optional(),
        product_variant_id: z.number().nullable(),
        is_stocked_sale: z.boolean(),
        status: z.string(),
        quantity: z.number().min(1, "數量至少為 1"),
        price: z.number().min(0, "價格不能為負"),
        product_name: z.string().min(1, "商品名稱為必填"),
        sku: z.string().min(1, "SKU 為必填"),
        custom_specifications: z.record(z.string()).optional(),
        imageUrl: z.string().optional().nullable(),
        stock: z.number().optional(), // 🎯 添加庫存字段
      })
    )
    .min(1, "訂單至少需要一個品項"),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

interface UseOrderFormProps {
  initialData?: Partial<OrderFormValues>;
  onSubmit: (values: OrderFormValues) => void;
}

export function useOrderForm({ initialData, onSubmit }: UseOrderFormProps) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialData || {
      shipping_status: "pending",
      payment_status: "pending",
      fulfillment_priority: "normal",
      priority_reason: "",
      shipping_fee: 0,
      tax: 0,
      discount_amount: 0,
      items: [],
    },
  });

  // 當 initialData 變更時，重置表單
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  function handleSubmit(values: OrderFormValues) {
    const orderData: OrderFormValues = {
      ...values,
      items: values.items.map((item) => ({
        ...item,
        custom_specifications: item.custom_specifications
          ? item.custom_specifications
          : undefined,
      })),
    };

    onSubmit(orderData);
  }

  return {
    form,
    handleSubmit,
    orderFormSchema,
  };
}