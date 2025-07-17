import { renderHook, act } from '@testing-library/react';
import { useBatchSelection } from '../useBatchSelection';

describe('useBatchSelection Hook', () => {
  const mockBackorderItems = [
    {
      id: 1,
      order_id: 1,
      order_number: 'ORD-001',
      product_variant_id: 1,
      quantity: 5,
      sku: 'PROD-001',
      product_name: '商品A',
    },
    {
      id: 2,
      order_id: 1,
      order_number: 'ORD-001',
      product_variant_id: 2,
      quantity: 3,
      sku: 'PROD-002',
      product_name: '商品B',
    },
    {
      id: 3,
      order_id: 2,
      order_number: 'ORD-002',
      product_variant_id: 1,
      quantity: 2,
      sku: 'PROD-001',
      product_name: '商品A',
    },
  ];

  it('初始狀態應該為空的選擇', () => {
    const { result } = renderHook(() => useBatchSelection());

    expect(result.current.selectedItems).toEqual([]);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isPartialSelected).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('應該能夠選擇單個項目', () => {
    const { result } = renderHook(() => useBatchSelection());

    act(() => {
      result.current.selectItem(mockBackorderItems[0]);
    });

    expect(result.current.selectedItems).toHaveLength(1);
    expect(result.current.selectedItems[0]).toEqual(mockBackorderItems[0]);
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isPartialSelected).toBe(true);
  });

  it('應該能夠取消選擇項目', () => {
    const { result } = renderHook(() => useBatchSelection());

    // 先選擇項目
    act(() => {
      result.current.selectItem(mockBackorderItems[0]);
    });

    expect(result.current.selectedItems).toHaveLength(1);

    // 再取消選擇
    act(() => {
      result.current.deselectItem(mockBackorderItems[0].id);
    });

    expect(result.current.selectedItems).toHaveLength(0);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isPartialSelected).toBe(false);
  });

  it('應該能夠切換項目選擇狀態', () => {
    const { result } = renderHook(() => useBatchSelection());

    // 切換選擇（未選擇 -> 選擇）
    act(() => {
      result.current.toggleItem(mockBackorderItems[0]);
    });

    expect(result.current.selectedItems).toHaveLength(1);

    // 切換選擇（選擇 -> 未選擇）
    act(() => {
      result.current.toggleItem(mockBackorderItems[0]);
    });

    expect(result.current.selectedItems).toHaveLength(0);
  });

  it('應該能夠全選所有項目', () => {
    const { result } = renderHook(() => useBatchSelection(mockBackorderItems));

    act(() => {
      result.current.selectAll(mockBackorderItems);
    });

    expect(result.current.selectedItems).toHaveLength(3);
    expect(result.current.isAllSelected).toBe(true);
    expect(result.current.isPartialSelected).toBe(false);
    expect(result.current.selectedCount).toBe(3);
  });

  it('應該能夠取消全選', () => {
    const { result } = renderHook(() => useBatchSelection());

    // 先全選
    act(() => {
      result.current.selectAll(mockBackorderItems);
    });

    expect(result.current.selectedItems).toHaveLength(3);

    // 取消全選
    act(() => {
      result.current.deselectAll();
    });

    expect(result.current.selectedItems).toHaveLength(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('應該能夠切換全選狀態', () => {
    const { result } = renderHook(() => useBatchSelection(mockBackorderItems));

    // 切換全選（空 -> 全選）
    act(() => {
      result.current.toggleAll(mockBackorderItems);
    });

    expect(result.current.selectedItems).toHaveLength(3);
    expect(result.current.isAllSelected).toBe(true);

    // 切換全選（全選 -> 空）
    act(() => {
      result.current.toggleAll(mockBackorderItems);
    });

    expect(result.current.selectedItems).toHaveLength(0);
    expect(result.current.isAllSelected).toBe(false);
  });

  it('應該能夠檢查項目是否被選擇', () => {
    const { result } = renderHook(() => useBatchSelection());

    act(() => {
      result.current.selectItem(mockBackorderItems[0]);
    });

    expect(result.current.isItemSelected(mockBackorderItems[0].id)).toBe(true);
    expect(result.current.isItemSelected(mockBackorderItems[1].id)).toBe(false);
  });

  it('應該正確計算部分選擇狀態', () => {
    const { result } = renderHook(() => useBatchSelection(mockBackorderItems));

    // 選擇部分項目
    act(() => {
      result.current.selectItem(mockBackorderItems[0]);
      result.current.selectItem(mockBackorderItems[1]);
    });

    expect(result.current.isPartialSelected).toBe(true);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.selectedCount).toBe(2);
  });

  it('應該能夠按訂單分組選擇項目', () => {
    const { result } = renderHook(() => useBatchSelection());

    act(() => {
      result.current.selectByOrder(mockBackorderItems, 1);
    });

    // 應該選擇訂單 1 的兩個項目
    expect(result.current.selectedItems).toHaveLength(2);
    expect(result.current.selectedItems.every(item => item.order_id === 1)).toBe(true);
  });

  it('應該能夠按商品變體分組選擇項目', () => {
    const { result } = renderHook(() => useBatchSelection());

    act(() => {
      result.current.selectByProductVariant(mockBackorderItems, 1);
    });

    // 應該選擇商品變體 1 的兩個項目
    expect(result.current.selectedItems).toHaveLength(2);
    expect(result.current.selectedItems.every(item => item.product_variant_id === 1)).toBe(true);
  });

  it('應該能夠清空選擇', () => {
    const { result } = renderHook(() => useBatchSelection());

    // 先選擇一些項目
    act(() => {
      result.current.selectItem(mockBackorderItems[0]);
      result.current.selectItem(mockBackorderItems[1]);
    });

    expect(result.current.selectedItems).toHaveLength(2);

    // 清空選擇
    act(() => {
      result.current.clearSelection();
    });

    expect(result.current.selectedItems).toHaveLength(0);
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.isAllSelected).toBe(false);
    expect(result.current.isPartialSelected).toBe(false);
  });

  it('應該能夠獲取選擇的項目總數量', () => {
    const { result } = renderHook(() => useBatchSelection());

    act(() => {
      result.current.selectItem(mockBackorderItems[0]); // 數量 5
      result.current.selectItem(mockBackorderItems[1]); // 數量 3
    });

    expect(result.current.getTotalSelectedQuantity()).toBe(8);
  });

  it('應該能夠按門市分組選擇項目', () => {
    const itemsWithStore = mockBackorderItems.map((item, index) => ({
      ...item,
      store_id: index < 2 ? 1 : 2,
    }));

    const { result } = renderHook(() => useBatchSelection());

    act(() => {
      result.current.selectByStore(itemsWithStore, 1);
    });

    // 應該選擇門市 1 的兩個項目
    expect(result.current.selectedItems).toHaveLength(2);
    expect(result.current.selectedItems.every(item => item.store_id === 1)).toBe(true);
  });
});