import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { OrderFormValues } from "./useOrderForm";

interface UsePriceCalculatorProps {
  form: UseFormReturn<OrderFormValues>;
}

export function usePriceCalculator({ form }: UsePriceCalculatorProps) {
  // 使用單一 watch 調用來獲取所有需要的值，避免多次訂閱
  const watchedValues = form.watch(["items", "shipping_fee", "tax", "discount_amount"]);
  
  const items = watchedValues[0] || [];
  const shippingFee = watchedValues[1] || 0;
  const tax = watchedValues[2] || 0;
  const discountAmount = watchedValues[3] || 0;

  // 使用 useMemo 來優化計算
  const { subtotal, grandTotal } = useMemo(() => {
    const calculatedSubtotal = items.reduce((acc, item) => {
      const itemTotal = (item.price ?? 0) * (item.quantity || 0);
      return acc + itemTotal;
    }, 0);

    const calculatedGrandTotal = Math.max(
      0,
      calculatedSubtotal + shippingFee + tax - discountAmount
    );

    return {
      subtotal: calculatedSubtotal,
      grandTotal: calculatedGrandTotal,
    };
  }, [items, shippingFee, tax, discountAmount]);

  return {
    items,
    shippingFee,
    tax,
    discountAmount,
    subtotal,
    grandTotal,
  };
}