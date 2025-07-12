import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppFieldArray } from "@/hooks/useAppFieldArray";
import { ProcessedOrder, ProcessedOrderItem } from "@/types/api-helpers";
import { useEffect } from "react";

/**
 * 表單數據接口定義
 */
export interface RefundFormItem {
  order_item_id: number;
  quantity: number;
  product_name?: string;
  sku?: string;
  price?: number;
  max_quantity?: number;
  is_selected: boolean;
}

export interface RefundFormValues {
  reason: string;
  notes?: string;
  should_restock: boolean;
  items: RefundFormItem[];
}

/**
 * 簡化的 Zod Schema 定義
 */
const RefundFormSchema = z.object({
  reason: z
    .string()
    .min(10, "退款原因至少需要 10 個字符")
    .max(500, "退款原因不能超過 500 個字符"),
  notes: z.string().optional(),
  should_restock: z.boolean(),
  items: z
    .array(
      z.object({
        order_item_id: z.number(),
        quantity: z.number().min(1, "退貨數量必須大於 0"),
        product_name: z.string().optional(),
        sku: z.string().optional(),
        price: z.number().optional(),
        max_quantity: z.number().optional(),
        is_selected: z.boolean(),
      }),
    )
    .min(1, "至少必須選擇一項退款商品"),
});

interface UseRefundFormProps {
  open: boolean;
  fullOrder: ProcessedOrder | null;
}

export function useRefundForm({ open, fullOrder }: UseRefundFormProps) {
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(RefundFormSchema),
    defaultValues: {
      reason: "",
      notes: "",
      should_restock: false,
      items: [],
    },
  });

  const { fields, replace, update } = useAppFieldArray({
    control: form.control,
    name: "items",
  });

  // 初始化品項列表 - 簡化邏輯
  useEffect(() => {
    if (open && fullOrder?.items?.length) {
      const formattedItems: RefundFormItem[] = fullOrder.items.map(
        (item: ProcessedOrderItem) => ({
          order_item_id: item.id,
          quantity: 0,
          product_name: item.product_name,
          sku: item.sku,
          price: item.price,
          max_quantity: item.quantity,
          is_selected: false,
        }),
      );

      replace(formattedItems);
      form.reset({
        reason: "",
        notes: "",
        should_restock: false,
        items: formattedItems,
      });
    }
  }, [open, fullOrder, replace, form]);

  // 重置表單 - 簡化邏輯
  useEffect(() => {
    if (!open) {
      form.reset();
      replace([]);
    }
  }, [open, form, replace]);

  return {
    form,
    fields,
    update,
    RefundFormSchema,
  };
}