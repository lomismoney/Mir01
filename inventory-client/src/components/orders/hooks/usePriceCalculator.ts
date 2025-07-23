import { useMemo } from "react";
import { UseFormReturn } from "react-hook-form";
import { OrderFormValues } from "./useOrderForm";
import { MoneyHelper } from "@/lib/money-helper";

interface UsePriceCalculatorProps {
  form: UseFormReturn<OrderFormValues>;
}

export function usePriceCalculator({ form }: UsePriceCalculatorProps) {
  // 使用單一 watch 調用來獲取所有需要的值，避免多次訂閱
  const watchedValues = form.watch([
    "items", 
    "shipping_fee", 
    "discount_amount",
    "is_tax_inclusive",
    "tax_rate"
  ]);
  
  const items = watchedValues[0] || [];
  const shippingFee = watchedValues[1] || 0;
  const discountAmount = watchedValues[2] || 0;
  const isTaxInclusive = watchedValues[3] ?? true;
  const taxRate = watchedValues[4] ?? 5;

  // 使用 useMemo 來優化計算
  const { subtotal, tax, grandTotal } = useMemo(() => {
    // 計算商品小計
    const calculatedSubtotal = items.reduce((acc, item) => {
      const itemTotal = (item.price ?? 0) * (item.quantity || 0);
      return acc + itemTotal;
    }, 0);

    let calculatedTax = 0;
    let calculatedGrandTotal = 0;

    // 根據含稅狀態計算稅金
    if (isTaxInclusive) {
      // 含稅訂單：從總價反推稅額
      // 先計算含稅的小計（商品總價 + 運費 - 折扣）
      const taxableAmount = calculatedSubtotal + shippingFee - discountAmount;
      calculatedTax = MoneyHelper.calculateTaxFromPriceWithTax(taxableAmount, taxRate);
      // 總金額就是含稅價
      calculatedGrandTotal = Math.max(0, taxableAmount);
    } else {
      // 未稅訂單：計算稅額後加到總價
      // 計算應稅金額（商品總價 - 折扣，運費通常不課稅）
      const taxableAmount = calculatedSubtotal - discountAmount;
      calculatedTax = MoneyHelper.calculateTaxFromPriceWithoutTax(taxableAmount, taxRate);
      // 總金額 = 商品總價 + 運費 + 稅金 - 折扣
      calculatedGrandTotal = Math.max(
        0,
        calculatedSubtotal + shippingFee + calculatedTax - discountAmount
      );
    }

    return {
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      grandTotal: calculatedGrandTotal,
    };
  }, [items, shippingFee, discountAmount, isTaxInclusive, taxRate]);

  // 當稅金計算值改變時，更新表單中的 tax 欄位
  // 這樣可以確保提交時送出正確的稅金值
  useMemo(() => {
    const currentTax = form.getValues("tax");
    if (Math.abs(currentTax - tax) > 0.01) {
      form.setValue("tax", tax);
    }
  }, [tax, form]);

  return {
    items,
    shippingFee,
    tax,
    discountAmount,
    subtotal,
    grandTotal,
    isTaxInclusive,
    taxRate,
  };
}