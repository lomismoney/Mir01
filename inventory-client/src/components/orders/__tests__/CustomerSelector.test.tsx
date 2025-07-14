import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomerSelector } from '../CustomerSelector';
import { Customer } from '@/types/api-helpers';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useCustomers: jest.fn(),
}));

jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: jest.fn((value) => value),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('@/components/ui/popover', () => ({
  Popover: ({ children, open, onOpenChange }: any) => (
    <div data-testid="popover" data-open={open} onClick={() => onOpenChange && onOpenChange(!open)}>
      {children}
    </div>
  ),
  PopoverTrigger: ({ children }: any) => (
    <div data-testid="popover-trigger">{children}</div>
  ),
  PopoverContent: ({ children }: any) => (
    <div data-testid="popover-content">{children}</div>
  ),
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, ...props }: any) => (
    <input
      {...props}
      value={value}
      onChange={onChange}
      data-testid="search-input"
    />
  ),
}));

// Import mocked modules
import { useCustomers } from '@/hooks';
import { useDebounce } from '@/hooks/use-debounce';

const mockUseCustomers = useCustomers as jest.MockedFunction<typeof useCustomers>;
const mockUseDebounce = useDebounce as jest.MockedFunction<typeof useDebounce>;

describe('CustomerSelector', () => {
  const mockCustomers: Customer[] = [
    {
      id: 1,
      name: '王小明',
      phone: '0912345678',
      contact_address: '台北市信義區',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: 2,
      name: '李美花',
      phone: '0987654321',
      contact_address: '台中市西屯區',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ];

  const defaultProps = {
    selectedCustomerId: null,
    onSelectCustomer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDebounce.mockImplementation((value) => value);
    mockUseCustomers.mockReturnValue({
      data: { data: mockCustomers },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);
  });

  describe('基本渲染', () => {
    test('當沒有選擇客戶時應該顯示佔位符文字', () => {
      render(<CustomerSelector {...defaultProps} />);

      expect(screen.getByText('請選擇客戶...')).toBeInTheDocument();
    });

    test('當有選擇客戶時應該顯示客戶名稱', () => {
      render(
        <CustomerSelector
          {...defaultProps}
          selectedCustomerId={1}
        />
      );

      // 查找觸發按鈕內的客戶名稱
      const trigger = screen.getByRole('combobox');
      expect(trigger).toHaveTextContent('王小明');
    });

    test('應該渲染觸發按鈕', () => {
      render(<CustomerSelector {...defaultProps} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });

  describe('下拉功能', () => {
    test('點擊觸發按鈕應該開啟下拉選單', async () => {
      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    test('應該顯示搜尋輸入框', async () => {
      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', '搜尋客戶名稱或電話...');
    });
  });

  describe('客戶列表顯示', () => {
    test('應該顯示所有客戶', async () => {
      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('王小明')).toBeInTheDocument();
      expect(screen.getByText('李美花')).toBeInTheDocument();
    });

    test('應該顯示客戶電話', async () => {
      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('0912345678')).toBeInTheDocument();
      expect(screen.getByText('0987654321')).toBeInTheDocument();
    });

    test('當載入中時應該顯示載入訊息', async () => {
      mockUseCustomers.mockReturnValue({
        data: { data: [] },
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('載入中...')).toBeInTheDocument();
    });

    test('當沒有客戶資料時應該顯示空狀態訊息', async () => {
      mockUseCustomers.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('尚無客戶資料')).toBeInTheDocument();
    });
  });

  describe('搜尋功能', () => {
    test('應該可以搜尋客戶名稱', async () => {
      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, '王');

      // 應該調用 useDebounce
      expect(mockUseDebounce).toHaveBeenCalledWith('王', 300);
    });

    test('當搜尋無結果時應該顯示無結果訊息', async () => {
      mockUseCustomers.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('找不到符合的客戶')).toBeInTheDocument();
    });
  });

  describe('客戶選擇', () => {
    test('點擊客戶應該調用 onSelectCustomer', async () => {
      const user = userEvent.setup();
      const onSelectCustomer = jest.fn();

      render(
        <CustomerSelector
          {...defaultProps}
          onSelectCustomer={onSelectCustomer}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const customerButton = screen.getByText('王小明');
      await user.click(customerButton);

      expect(onSelectCustomer).toHaveBeenCalledWith(mockCustomers[0]);
    });

    test('已選擇的客戶應該顯示勾選標記', async () => {
      const user = userEvent.setup();
      render(
        <CustomerSelector
          {...defaultProps}
          selectedCustomerId={1}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      // 檢查是否有勾選標記（透過 data 屬性或 aria 狀態）
      const customerButtons = screen.getAllByText('王小明');
      const selectedItem = customerButtons.find(item => 
        item.closest('button')?.classList.contains('bg-accent')
      );
      expect(selectedItem).toBeTruthy();
    });
  });

  describe('新增客戶功能', () => {
    test('當提供 onAddNewCustomer 時應該顯示新增按鈕', async () => {
      const user = userEvent.setup();
      const onAddNewCustomer = jest.fn();

      render(
        <CustomerSelector
          {...defaultProps}
          onAddNewCustomer={onAddNewCustomer}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('新增客戶')).toBeInTheDocument();
    });

    test('點擊新增客戶按鈕應該調用 onAddNewCustomer', async () => {
      const user = userEvent.setup();
      const onAddNewCustomer = jest.fn();

      render(
        <CustomerSelector
          {...defaultProps}
          onAddNewCustomer={onAddNewCustomer}
        />
      );

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      const addButton = screen.getByText('新增客戶');
      await user.click(addButton);

      expect(onAddNewCustomer).toHaveBeenCalled();
    });

    test('當沒有提供 onAddNewCustomer 時不應該顯示新增按鈕', async () => {
      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.queryByText('新增客戶')).not.toBeInTheDocument();
    });
  });

  describe('緩存功能', () => {
    test('應該緩存已選擇的客戶資訊', () => {
      const { rerender } = render(
        <CustomerSelector
          {...defaultProps}
          selectedCustomerId={1}
        />
      );

      // 模擬客戶資料變更但選擇的客戶ID保持不變
      mockUseCustomers.mockReturnValue({
        data: { data: [] },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      rerender(
        <CustomerSelector
          {...defaultProps}
          selectedCustomerId={1}
        />
      );

      // 應該仍然顯示緩存的客戶名稱
      expect(screen.getByText('王小明')).toBeInTheDocument();
    });
  });

  describe('錯誤處理', () => {
    test('應該處理無效的 API 響應', () => {
      mockUseCustomers.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      render(<CustomerSelector {...defaultProps} />);

      expect(screen.getByText('請選擇客戶...')).toBeInTheDocument();
    });

    test('應該處理非陣列的客戶資料', async () => {
      mockUseCustomers.mockReturnValue({
        data: { data: 'invalid' },
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const user = userEvent.setup();
      render(<CustomerSelector {...defaultProps} />);

      const trigger = screen.getByRole('combobox');
      await user.click(trigger);

      expect(screen.getByText('尚無客戶資料')).toBeInTheDocument();
    });
  });
}); 