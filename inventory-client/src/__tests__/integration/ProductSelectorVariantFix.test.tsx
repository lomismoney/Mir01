import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductSelector } from '@/components/inventory/ProductSelector';
import apiClient from '@/lib/apiClient';
import { SessionProvider } from 'next-auth/react';

// Mock dependencies
jest.mock('@/lib/apiClient', () => ({
  GET: jest.fn(),
  POST: jest.fn(),
  PUT: jest.fn(),
  DELETE: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { id: 1 }, accessToken: 'test-token' },
    status: 'authenticated',
  })),
  SessionProvider: ({ children }: any) => children,
}));

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <SessionProvider session={{ user: { id: 1 }, accessToken: 'test-token' } as any}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SessionProvider>
  );
};

describe('ProductSelector 變體過濾修復 - 整合測試', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('完整場景：選擇不同商品時應該顯示正確的變體', async () => {
    // Mock 資料設置
    const mockProducts = {
      data: [
        { id: 5, name: '純棉圓領T恤', variants: [] },
        { id: 10, name: 'iPhone 15 Pro', variants: [] },
        { id: 15, name: '無線滑鼠', variants: [] },
      ],
    };

    // 模擬後端 bug：總是返回所有變體
    const mockAllVariants = {
      data: {
        data: [
          // T恤變體
          {
            id: 1,
            sku: 'TSHIRT-WHITE-S',
            price: '299',
            product_id: 5,
            product: { id: 5, name: '純棉圓領T恤' },
            attribute_values: [
              { value: '白色', attribute: { name: '顏色' } },
              { value: 'S', attribute: { name: '尺寸' } },
            ],
          },
          {
            id: 2,
            sku: 'TSHIRT-WHITE-M',
            price: '299',
            product_id: 5,
            product: { id: 5, name: '純棉圓領T恤' },
            attribute_values: [
              { value: '白色', attribute: { name: '顏色' } },
              { value: 'M', attribute: { name: '尺寸' } },
            ],
          },
          // iPhone 變體
          {
            id: 3,
            sku: 'IPHONE-15-PRO-GOLD-256',
            price: '35000',
            product_id: 10,
            product: { id: 10, name: 'iPhone 15 Pro' },
            attribute_values: [
              { value: '金色', attribute: { name: '顏色' } },
              { value: '256GB', attribute: { name: '容量' } },
            ],
          },
          {
            id: 4,
            sku: 'IPHONE-15-PRO-BLACK-512',
            price: '42000',
            product_id: 10,
            product: { id: 10, name: 'iPhone 15 Pro' },
            attribute_values: [
              { value: '黑色', attribute: { name: '顏色' } },
              { value: '512GB', attribute: { name: '容量' } },
            ],
          },
          // 滑鼠變體
          {
            id: 5,
            sku: 'MOUSE-WIRELESS-BLACK',
            price: '599',
            product_id: 15,
            product: { id: 15, name: '無線滑鼠' },
            attribute_values: [
              { value: '黑色', attribute: { name: '顏色' } },
            ],
          },
          {
            id: 6,
            sku: 'MOUSE-WIRELESS-WHITE',
            price: '599',
            product_id: 15,
            product: { id: 15, name: '無線滑鼠' },
            attribute_values: [
              { value: '白色', attribute: { name: '顏色' } },
            ],
          },
        ],
      },
    };

    // 設置 mock
    mockApiClient.GET.mockImplementation((url: string) => {
      if (url === '/api/products') {
        return Promise.resolve({ data: mockProducts, error: null });
      }
      
      if (url === '/api/products/variants') {
        // 模擬後端 bug：無論請求什麼都返回所有變體
        return Promise.resolve({ data: mockAllVariants, error: null });
      }
      
      return Promise.resolve({ data: null, error: null });
    });

    const onValueChange = jest.fn();
    
    render(
      <ProductSelector 
        onValueChange={onValueChange}
        placeholder="選擇商品"
      />,
      { wrapper: createWrapper() }
    );

    // === 場景 1：選擇 iPhone ===
    fireEvent.click(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('iPhone 15 Pro'));
    
    // 等待變體載入
    await waitFor(() => {
      expect(screen.getByText('IPHONE-15-PRO-GOLD-256')).toBeInTheDocument();
    });
    
    // 驗證：只顯示 iPhone 的變體
    expect(screen.getByText('IPHONE-15-PRO-GOLD-256')).toBeInTheDocument();
    expect(screen.getByText('IPHONE-15-PRO-BLACK-512')).toBeInTheDocument();
    
    // 驗證：不顯示其他產品的變體
    expect(screen.queryByText('TSHIRT-WHITE-S')).not.toBeInTheDocument();
    expect(screen.queryByText('TSHIRT-WHITE-M')).not.toBeInTheDocument();
    expect(screen.queryByText('MOUSE-WIRELESS-BLACK')).not.toBeInTheDocument();
    expect(screen.queryByText('MOUSE-WIRELESS-WHITE')).not.toBeInTheDocument();

    // 選擇一個 iPhone 變體
    fireEvent.click(screen.getByText('IPHONE-15-PRO-GOLD-256'));
    
    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledWith(3, expect.objectContaining({
        id: 3,
        product_id: 10,
      }));
    });

    // === 場景 2：切換到 T恤 ===
    fireEvent.click(screen.getByRole('combobox'));
    
    // 返回商品選擇
    const backButton = screen.getByText('← 返回商品選擇');
    fireEvent.click(backButton);
    
    await waitFor(() => {
      expect(screen.getByText('純棉圓領T恤')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('純棉圓領T恤'));
    
    // 等待 T恤 變體載入
    await waitFor(() => {
      expect(screen.getByText('TSHIRT-WHITE-S')).toBeInTheDocument();
    });
    
    // 驗證：只顯示 T恤 的變體
    expect(screen.getByText('TSHIRT-WHITE-S')).toBeInTheDocument();
    expect(screen.getByText('TSHIRT-WHITE-M')).toBeInTheDocument();
    
    // 驗證：不顯示其他產品的變體
    expect(screen.queryByText('IPHONE-15-PRO-GOLD-256')).not.toBeInTheDocument();
    expect(screen.queryByText('IPHONE-15-PRO-BLACK-512')).not.toBeInTheDocument();
    expect(screen.queryByText('MOUSE-WIRELESS-BLACK')).not.toBeInTheDocument();
    expect(screen.queryByText('MOUSE-WIRELESS-WHITE')).not.toBeInTheDocument();

    // === 場景 3：切換到滑鼠 ===
    // 選擇一個變體來關閉對話框
    fireEvent.click(screen.getByText('TSHIRT-WHITE-S'));
    
    await waitFor(() => {
      expect(screen.queryByText('TSHIRT-WHITE-S')).not.toBeInTheDocument();
    });
    
    // 重新打開選擇器
    const comboboxButton = screen.getByRole('combobox');
    fireEvent.click(comboboxButton);
    
    // 先返回商品選擇
    await waitFor(() => {
      expect(screen.getByText('← 返回商品選擇')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('← 返回商品選擇'));
    
    await waitFor(() => {
      expect(screen.getByText('無線滑鼠')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('無線滑鼠'));
    
    // 等待滑鼠變體載入
    await waitFor(() => {
      expect(screen.getByText('MOUSE-WIRELESS-BLACK')).toBeInTheDocument();
    });
    
    // 驗證：只顯示滑鼠的變體
    expect(screen.getByText('MOUSE-WIRELESS-BLACK')).toBeInTheDocument();
    expect(screen.getByText('MOUSE-WIRELESS-WHITE')).toBeInTheDocument();
    
    // 驗證：不顯示其他產品的變體
    expect(screen.queryByText('TSHIRT-WHITE-S')).not.toBeInTheDocument();
    expect(screen.queryByText('TSHIRT-WHITE-M')).not.toBeInTheDocument();
    expect(screen.queryByText('IPHONE-15-PRO-GOLD-256')).not.toBeInTheDocument();
    expect(screen.queryByText('IPHONE-15-PRO-BLACK-512')).not.toBeInTheDocument();
  });

  it('邊界情況：當產品沒有變體時應該顯示正確的提示', async () => {
    // Mock 沒有變體的產品
    const mockProducts = {
      data: [
        { id: 20, name: '簡單商品', variants: [] },
      ],
    };

    mockApiClient.GET.mockImplementation((url: string) => {
      if (url === '/api/products') {
        return Promise.resolve({ data: mockProducts, error: null });
      }
      
      if (url === '/api/products/variants') {
        // 返回空陣列
        return Promise.resolve({ data: { data: [] }, error: null });
      }
      
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <ProductSelector onValueChange={jest.fn()} />,
      { wrapper: createWrapper() }
    );

    fireEvent.click(screen.getByRole('combobox'));
    await waitFor(() => {
      expect(screen.getByText('簡單商品')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('簡單商品'));
    
    // 應該顯示無規格的提示
    await waitFor(() => {
      expect(screen.getByText(/此商品暫無規格/)).toBeInTheDocument();
    });
  });
});