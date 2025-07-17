import { useState, useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { useAppFieldArray } from "@/hooks/useAppFieldArray";
import { type Variant } from "@/components/ui/ProductSelector";
import { OrderFormValues } from "./useOrderForm";

interface UseProductManagerProps {
  form: UseFormReturn<OrderFormValues>;
}

export function useProductManager({ form }: UseProductManagerProps) {
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // 初始化 useFieldArray 來管理 items 字段
  const { fields, append, remove, update, replace } = useAppFieldArray({
    control: form.control,
    name: "items",
  });

  // 🎯 計算已選中的標準品項 ID（用於同步 ProductSelector 的狀態）
  const selectedVariantIds = useMemo(
    () =>
      fields
        .map((field) => field.product_variant_id)
        .filter((id): id is number => id !== null && id !== undefined),
    [fields]
  );

  // 處理從 ProductSelector 回傳的選擇結果
  const handleProductSelect = (selectedVariants: Variant[]) => {
    const currentItems = fields;

    selectedVariants.forEach((variant) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.product_variant_id === Number(variant.id)
      );

      if (existingIndex !== -1) {
        update(existingIndex, {
          ...currentItems[existingIndex],
          price: Number(variant.price) || 0,
          imageUrl: variant.imageUrl || null, // 🎯 確保更新時也包含圖片資訊
        });
      } else {
        // 🎯 正確設置商品類型標記
        const hasStock = variant.stock > 0;
        append({
          product_variant_id: Number(variant.id),
          is_stocked_sale: hasStock, // 有庫存才是現貨銷售
          is_backorder: !hasStock, // 無庫存則為預訂商品
          status: "pending",
          quantity: 1,
          price: Number(variant.price) || 0,
          product_name: variant.productName
            ? `${variant.productName} - ${variant.specifications}`
            : variant.specifications || `商品 ${variant.sku}`,
          sku: variant.sku || `SKU-${variant.id}`,
          custom_specifications: undefined,
          imageUrl: variant.imageUrl || null,
          stock: variant.stock || 0, // 🎯 添加庫存信息
        });
      }
    });

    setIsSelectorOpen(false);
  };

  // 處理新增訂製商品
  const handleAddCustomItem = (item: any) => {
    append({
      product_variant_id: item.product_variant_id,
      is_stocked_sale: false, // 🎯 訂製商品永遠不是現貨銷售
      is_backorder: false, // 🎯 訂製商品也不是預訂（是特殊類型）
      status: "pending",
      quantity: item.quantity,
      price: item.price,
      product_name: item.custom_product_name,
      sku: item.sku,
      custom_specifications: item.custom_specifications,
      imageUrl: item.imageUrl || null,
      stock: 0, // 🎯 訂製商品沒有庫存概念
    });

    setIsSelectorOpen(false);
  };

  return {
    isSelectorOpen,
    setIsSelectorOpen,
    fields,
    append,
    remove,
    update,
    replace,
    selectedVariantIds,
    handleProductSelect,
    handleAddCustomItem,
  };
}