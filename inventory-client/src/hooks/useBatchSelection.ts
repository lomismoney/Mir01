import { useState, useCallback, useMemo } from 'react';

export interface BatchSelectableItem {
  id: number;
  order_id: number;
  order_number: string;
  product_variant_id: number;
  quantity: number;
  sku: string;
  product_name: string;
  store_id?: number;
}

export interface UseBatchSelectionReturn {
  selectedItems: BatchSelectableItem[];
  selectedCount: number;
  isAllSelected: boolean;
  isPartialSelected: boolean;
  selectItem: (item: BatchSelectableItem) => void;
  deselectItem: (itemId: number) => void;
  toggleItem: (item: BatchSelectableItem) => void;
  selectAll: (items: BatchSelectableItem[]) => void;
  deselectAll: () => void;
  toggleAll: (items: BatchSelectableItem[]) => void;
  clearSelection: () => void;
  isItemSelected: (itemId: number) => boolean;
  selectByOrder: (items: BatchSelectableItem[], orderId: number) => void;
  selectByProductVariant: (items: BatchSelectableItem[], productVariantId: number) => void;
  selectByStore: (items: BatchSelectableItem[], storeId: number) => void;
  getTotalSelectedQuantity: () => number;
}

export function useBatchSelection(availableItems?: BatchSelectableItem[]): UseBatchSelectionReturn {
  const [selectedItems, setSelectedItems] = useState<BatchSelectableItem[]>([]);

  const selectedCount = selectedItems.length;

  const isAllSelected = useMemo(() => {
    if (!availableItems || availableItems.length === 0) {
      return false;
    }
    return selectedCount === availableItems.length && selectedCount > 0;
  }, [selectedCount, availableItems]);

  const isPartialSelected = useMemo(() => {
    if (!availableItems || availableItems.length === 0) {
      return selectedCount > 0;
    }
    return selectedCount > 0 && selectedCount < availableItems.length;
  }, [selectedCount, availableItems]);

  const selectItem = useCallback((item: BatchSelectableItem) => {
    setSelectedItems(prev => {
      // 防止重複選擇
      if (prev.some(selected => selected.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  }, []);

  const deselectItem = useCallback((itemId: number) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  const toggleItem = useCallback((item: BatchSelectableItem) => {
    setSelectedItems(prev => {
      const isSelected = prev.some(selected => selected.id === item.id);
      if (isSelected) {
        return prev.filter(selected => selected.id !== item.id);
      } else {
        return [...prev, item];
      }
    });
  }, []);

  const selectAll = useCallback((items: BatchSelectableItem[]) => {
    setSelectedItems(items);
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const toggleAll = useCallback((items: BatchSelectableItem[]) => {
    setSelectedItems(prev => {
      if (prev.length === items.length) {
        // 如果已全選，則取消全選
        return [];
      } else {
        // 否則全選
        return items;
      }
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const isItemSelected = useCallback((itemId: number) => {
    return selectedItems.some(item => item.id === itemId);
  }, [selectedItems]);

  // 使用 Set 優化查找性能
  const selectedItemIds = useMemo(() => {
    return new Set(selectedItems.map(item => item.id));
  }, [selectedItems]);

  const isItemSelectedOptimized = useCallback((itemId: number) => {
    return selectedItemIds.has(itemId);
  }, [selectedItemIds]);

  const selectByOrder = useCallback((items: BatchSelectableItem[], orderId: number) => {
    const orderItems = items.filter(item => item.order_id === orderId);
    setSelectedItems(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = [...prev];
      orderItems.forEach(item => {
        if (!existingIds.has(item.id)) {
          newItems.push(item);
        }
      });
      return newItems;
    });
  }, []);

  const selectByProductVariant = useCallback((items: BatchSelectableItem[], productVariantId: number) => {
    const variantItems = items.filter(item => item.product_variant_id === productVariantId);
    setSelectedItems(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = [...prev];
      variantItems.forEach(item => {
        if (!existingIds.has(item.id)) {
          newItems.push(item);
        }
      });
      return newItems;
    });
  }, []);

  const selectByStore = useCallback((items: BatchSelectableItem[], storeId: number) => {
    const storeItems = items.filter(item => item.store_id === storeId);
    setSelectedItems(prev => {
      const existingIds = new Set(prev.map(item => item.id));
      const newItems = [...prev];
      storeItems.forEach(item => {
        if (!existingIds.has(item.id)) {
          newItems.push(item);
        }
      });
      return newItems;
    });
  }, []);

  const getTotalSelectedQuantity = useCallback(() => {
    return selectedItems.reduce((total, item) => total + item.quantity, 0);
  }, [selectedItems]);

  return {
    selectedItems,
    selectedCount,
    isAllSelected,
    isPartialSelected,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    toggleAll,
    clearSelection,
    isItemSelected: isItemSelectedOptimized,
    selectByOrder,
    selectByProductVariant,
    selectByStore,
    getTotalSelectedQuantity,
  };
}