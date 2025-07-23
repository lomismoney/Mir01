import { renderHook } from '@testing-library/react';
import { usePriceCalculator } from '../usePriceCalculator';
import { UseFormReturn } from 'react-hook-form';

// Mock react-hook-form
const mockSetValue = jest.fn();
const mockWatch = jest.fn();
const mockGetValues = jest.fn();

const createMockForm = (watchValues: any = {}): Partial<UseFormReturn<any>> => {
  mockWatch.mockImplementation((fields: string | string[]) => {
    // 如果是陣列，返回對應的值陣列
    if (Array.isArray(fields)) {
      return fields.map(field => watchValues[field]);
    }
    // 如果是字串，返回單一值
    if (typeof fields === 'string') {
      return watchValues[fields];
    }
    return watchValues;
  });

  mockGetValues.mockImplementation((field?: string) => {
    if (field) {
      return watchValues[field] || 0;
    }
    return watchValues;
  });

  return {
    setValue: mockSetValue,
    watch: mockWatch,
    getValues: mockGetValues,
  } as Partial<UseFormReturn<any>>;
};

describe('usePriceCalculator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate subtotal correctly', () => {
    const form = createMockForm({
      items: [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
      ],
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    expect(result.current.subtotal).toBe(350); // (100 * 2) + (50 * 3)
  });

  it('should calculate grand total for tax-exclusive orders', () => {
    const form = createMockForm({
      items: [{ price: 1000, quantity: 1 }],
      shipping_fee: 100,
      discount_amount: 50,
      is_tax_inclusive: false,
      tax_rate: 5,
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    // 商品小計: 1000
    // 運費: 100
    // 折扣: -50
    // 未稅小計: 1050
    // 應稅金額: 1000 - 50 = 950 (運費不課稅)
    // 稅金: 950 * 5% = 47.5
    // 總計: 1050 + 47.5 = 1097.5
    expect(result.current.subtotal).toBe(1000);
    expect(result.current.tax).toBe(47.5);
    expect(result.current.grandTotal).toBe(1097.5);
  });

  it('should calculate grand total for tax-inclusive orders', () => {
    const form = createMockForm({
      items: [{ price: 1000, quantity: 1 }],
      shipping_fee: 100,
      discount_amount: 50,
      is_tax_inclusive: true,
      tax_rate: 5,
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    // 商品小計: 1000
    // 運費: 100
    // 折扣: -50
    // 含稅總額: 1050
    // 應稅金額: 1000 + 100 - 50 = 1050
    // 反推稅金: 1050 / 1.05 * 0.05 = 50
    expect(result.current.subtotal).toBe(1000);
    expect(result.current.tax).toBe(50);
    expect(result.current.grandTotal).toBe(1050);
  });

  it('should update form tax value when calculation changes', () => {
    const form = createMockForm({
      items: [{ price: 100, quantity: 1 }],
      is_tax_inclusive: false,
      tax_rate: 5,
    });

    renderHook(() => usePriceCalculator({ form } as any));

    // 驗證 setValue 被調用來更新 tax 欄位
    expect(mockSetValue).toHaveBeenCalledWith('tax', 5);
  });

  it('should handle empty items array', () => {
    const form = createMockForm({
      items: [],
      shipping_fee: 100,
      discount_amount: 0,
      is_tax_inclusive: false,
      tax_rate: 5,
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    expect(result.current.subtotal).toBe(0);
    expect(result.current.tax).toBe(0);
    expect(result.current.grandTotal).toBe(100); // 只有運費
  });

  it('should handle null or undefined values', () => {
    const form = createMockForm({
      items: [
        { price: null, quantity: 2 },
        { price: 100, quantity: null },
      ],
      shipping_fee: null,
      discount_amount: undefined,
      is_tax_inclusive: false,
      tax_rate: 5,
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    expect(result.current.subtotal).toBe(0);
    expect(result.current.tax).toBe(0);
    expect(result.current.grandTotal).toBe(0);
  });

  it('should handle different tax rates', () => {
    const form = createMockForm({
      items: [{ price: 1000, quantity: 1 }],
      shipping_fee: 0,
      discount_amount: 0,
      is_tax_inclusive: false,
      tax_rate: 10,
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    expect(result.current.tax).toBe(100); // 1000 * 10%
    expect(result.current.grandTotal).toBe(1100);
  });

  it('should handle zero tax rate', () => {
    // 先設定初始值為較高的稅金，以測試是否會被正確覆蓋
    const form = createMockForm({
      items: [{ price: 1000, quantity: 1 }],
      shipping_fee: 0,
      discount_amount: 0,
      is_tax_inclusive: false,
      tax_rate: 0,
      tax: 100, // 初始稅金值設為 100，應該被計算後的 0 覆蓋
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    // 等待一個 tick 讓 setValue 生效
    expect(result.current.tax).toBe(0);
    expect(result.current.grandTotal).toBe(1000);
    
    // 驗證 setValue 被調用以更新稅金為 0
    expect(mockSetValue).toHaveBeenCalledWith('tax', 0);
  });

  it('should recalculate when dependencies change', () => {
    const initialValues = {
      items: [{ price: 100, quantity: 1 }],
      is_tax_inclusive: false,
      tax_rate: 5,
      tax: 5,
    };

    const form = createMockForm(initialValues);
    const { result, rerender } = renderHook(() => usePriceCalculator({ form } as any));

    expect(result.current.grandTotal).toBe(105);

    // 模擬數值變更 - 更新 mock 實現
    const updatedValues = {
      ...initialValues,
      items: [{ price: 200, quantity: 1 }],
      tax: 10,
    };
    
    mockWatch.mockImplementation((fields: string | string[]) => {
      if (Array.isArray(fields)) {
        return fields.map(field => updatedValues[field]);
      }
      if (typeof fields === 'string') {
        return updatedValues[fields];
      }
      return updatedValues;
    });
    
    mockGetValues.mockImplementation((field?: string) => {
      if (field) {
        return updatedValues[field] || 0;
      }
      return updatedValues;
    });

    rerender();

    expect(result.current.grandTotal).toBe(210);
  });

  it('should handle complex scenarios with multiple items', () => {
    const form = createMockForm({
      items: [
        { price: 999.99, quantity: 2 },
        { price: 333.33, quantity: 3 },
        { price: 100.5, quantity: 1 },
      ],
      shipping_fee: 123.45,
      discount_amount: 67.89,
      is_tax_inclusive: true,
      tax_rate: 5,
    });

    const { result } = renderHook(() => usePriceCalculator({ form } as any));

    // 商品小計: (999.99 * 2) + (333.33 * 3) + (100.5 * 1) = 3100.47
    // 含稅總額: 3100.47 + 123.45 - 67.89 = 3156.03
    // 反推稅金: 3156.03 / 1.05 * 0.05 ≈ 150.29
    expect(result.current.subtotal).toBeCloseTo(3100.47, 2);
    expect(result.current.grandTotal).toBe(3156.03);
    expect(result.current.tax).toBeCloseTo(150.29, 2);
  });
});