import { RefundFormItem } from "./useRefundForm";

interface UseRefundItemsProps {
  fields: RefundFormItem[];
  update: (index: number, value: RefundFormItem) => void;
}

export function useRefundItems({ fields, update }: UseRefundItemsProps) {
  
  // 簡化項目選擇邏輯
  const handleItemSelect = (itemIndex: number, checked: boolean) => {
    const currentItem = fields[itemIndex];
    update(itemIndex, {
      ...currentItem,
      is_selected: checked,
      quantity: checked ? 1 : 0, // 選中時預設數量為 1
    });
  };

  // 簡化數量變更邏輯
  const handleQuantityChange = (itemIndex: number, quantity: number) => {
    const currentItem = fields[itemIndex];
    const maxQuantity = currentItem.max_quantity || 1;
    // 直接使用 Math.min/max 簡化邏輯
    const validQuantity = Math.min(Math.max(1, quantity), maxQuantity);

    update(itemIndex, {
      ...currentItem,
      quantity: validQuantity,
    });
  };

  // 簡化全選邏輯
  const handleSelectAll = (checked: boolean) => {
    fields.forEach((_, index) => {
      handleItemSelect(index, checked);
    });
  };

  // 檢查是否全選
  const isAllSelected = fields.length > 0 && fields.every((_, index) => {
    return fields[index]?.is_selected;
  });

  return {
    handleItemSelect,
    handleQuantityChange,
    handleSelectAll,
    isAllSelected,
  };
}