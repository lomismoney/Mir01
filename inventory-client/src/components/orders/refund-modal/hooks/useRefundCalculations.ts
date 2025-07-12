import { useMemo } from "react";
import { RefundFormValues } from "./useRefundForm";

interface UseRefundCalculationsProps {
  watchedItems: RefundFormValues["items"];
  orderTotal: number;
}

export function useRefundCalculations({ 
  watchedItems, 
  orderTotal 
}: UseRefundCalculationsProps) {
  
  // 簡化計算邏輯 - 使用單一 useMemo 處理所有計算
  const calculations = useMemo(() => {
    if (!watchedItems) {
      return {
        totalRefundAmount: 0,
        selectedItemsCount: 0,
        totalRefundQuantity: 0,
        refundPercentage: 0,
      };
    }

    const selectedItems = watchedItems.filter(item => item.is_selected);
    
    const totalRefundAmount = selectedItems.reduce((total, item) => {
      return total + (item.price || 0) * (item.quantity || 0);
    }, 0);

    const selectedItemsCount = selectedItems.length;
    
    const totalRefundQuantity = selectedItems.reduce((sum, item) => {
      return sum + (item.quantity || 0);
    }, 0);

    const refundPercentage = orderTotal > 0 
      ? (totalRefundAmount / orderTotal) * 100 
      : 0;

    return {
      totalRefundAmount,
      selectedItemsCount,
      totalRefundQuantity,
      refundPercentage,
    };
  }, [watchedItems, orderTotal]);

  return calculations;
}