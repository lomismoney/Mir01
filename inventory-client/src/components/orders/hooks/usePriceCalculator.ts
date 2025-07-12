import { UseFormReturn } from "react-hook-form";
import { OrderFormValues } from "./useOrderForm";

interface UsePriceCalculatorProps {
  form: UseFormReturn<OrderFormValues>;
}

export function usePriceCalculator({ form }: UsePriceCalculatorProps) {
  // 實時價格計算
  const items = form.watch("items");
  const shippingFee = form.watch("shipping_fee") || 0;
  const tax = form.watch("tax") || 0;
  const discountAmount = form.watch("discount_amount") || 0;

  const subtotal =
    items?.reduce((acc, item) => {
      const itemTotal = (item.price ?? 0) * (item.quantity || 0);
      return acc + itemTotal;
    }, 0) || 0;

  const grandTotal = Math.max(0, subtotal + shippingFee + tax - discountAmount);

  return {
    items,
    shippingFee,
    tax,
    discountAmount,
    subtotal,
    grandTotal,
  };
}