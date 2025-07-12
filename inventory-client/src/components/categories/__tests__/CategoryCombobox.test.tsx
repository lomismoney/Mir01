import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryCombobox } from '../CategoryCombobox';
import { Category } from '@/types/category';

// Mock data
const mockCategories: (Category & { displayPath: string; hasChildren: boolean })[] = [
  {
    id: 1,
    name: '電子產品',
    description: '所有電子產品',
    parent_id: null,
    deleted_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    displayPath: '電子產品',
    hasChildren: true,
  },
  {
    id: 2,
    name: '手機',
    description: '手機類產品',
    parent_id: 1,
    deleted_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    displayPath: '電子產品 > 手機',
    hasChildren: true,
  },
  {
    id: 3,
    name: '智慧型手機',
    description: '智慧型手機',
    parent_id: 2,
    deleted_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    displayPath: '電子產品 > 手機 > 智慧型手機',
    hasChildren: false,
  },
  {
    id: 4,
    name: '配件',
    description: '各類配件',
    parent_id: null,
    deleted_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    displayPath: '配件',
    hasChildren: false,
  },
];

describe('CategoryCombobox', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('應該正確顯示預設文字', () => {
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('選擇分類...');
  });

  it('應該顯示選中的分類路徑', () => {
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={3}
        onChange={mockOnChange}
      />
    );

    expect(screen.getByRole('combobox')).toHaveTextContent('電子產品 > 手機 > 智慧型手機');
  });

  it('應該在點擊時打開下拉選單', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole('combobox');
    await user.click(button);

    expect(screen.getByPlaceholderText('搜尋分類...')).toBeInTheDocument();
    expect(screen.getByText('不指定分類')).toBeInTheDocument();
  });

  it('應該顯示所有分類選項', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));

    mockCategories.forEach(category => {
      expect(screen.getByText(category.displayPath)).toBeInTheDocument();
    });
  });

  it('應該在父分類旁顯示"含子分類"標籤', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));

    const parentCategories = mockCategories.filter(c => c.hasChildren);
    expect(screen.getAllByText('（含子分類）')).toHaveLength(parentCategories.length);
  });

  it('應該禁用父分類的選擇', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));

    // 嘗試點擊父分類
    const parentCategory = screen.getByText('電子產品');
    await user.click(parentCategory);

    expect(mockOnChange).not.toHaveBeenCalled();
    // 下拉選單應該仍然開啟
    expect(screen.getByPlaceholderText('搜尋分類...')).toBeInTheDocument();
  });

  it('應該允許選擇沒有子分類的分類', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));

    const leafCategory = screen.getByText('配件');
    await user.click(leafCategory);

    expect(mockOnChange).toHaveBeenCalledWith(4);
  });

  it('應該允許選擇"不指定分類"', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={3}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    await user.click(screen.getByText('不指定分類'));

    expect(mockOnChange).toHaveBeenCalledWith(null);
  });

  it('應該支援搜尋功能', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    const searchInput = screen.getByPlaceholderText('搜尋分類...');
    
    await user.type(searchInput, '手機');

    // 應該顯示包含"手機"的分類
    expect(screen.getByText('電子產品 > 手機')).toBeInTheDocument();
    expect(screen.getByText('電子產品 > 手機 > 智慧型手機')).toBeInTheDocument();
    
    // 不應該顯示不包含"手機"的分類
    expect(screen.queryByText('配件')).not.toBeInTheDocument();
  });

  it('應該在 disabled 時禁用按鈕', () => {
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
        disabled={true}
      />
    );

    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('應該顯示選中狀態的勾選圖標', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={3}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));

    // 使用 getAllByText 因為有多個相同文字的元素
    const items = screen.getAllByText('電子產品 > 手機 > 智慧型手機');
    // 找到在 CommandItem 裡面的那個
    const commandItem = items.find(item => item.closest('[role="option"]'));
    const selectedItem = commandItem?.closest('[role="option"]');
    const checkIcon = selectedItem?.querySelector('svg');
    expect(checkIcon).toHaveClass('opacity-100');
  });

  it('應該處理空分類列表', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={[]}
        value={null}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));

    // 空列表時只會顯示"不指定分類"選項
    expect(screen.getByText('不指定分類')).toBeInTheDocument();
    
    // 嘗試搜尋時才會顯示"找不到分類"
    const searchInput = screen.getByPlaceholderText('搜尋分類...');
    await user.type(searchInput, '測試');
    
    await waitFor(() => {
      expect(screen.getByText('找不到分類。')).toBeInTheDocument();
    });
  });

  it('應該在選擇後關閉下拉選單', async () => {
    const user = userEvent.setup();
    render(
      <CategoryCombobox
        categories={mockCategories}
        value={null}
        onChange={mockOnChange}
      />
    );

    await user.click(screen.getByRole('combobox'));
    expect(screen.getByPlaceholderText('搜尋分類...')).toBeInTheDocument();

    await user.click(screen.getByText('配件'));

    // 下拉選單應該關閉
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('搜尋分類...')).not.toBeInTheDocument();
    });
  });

  it('應該使用 truncate 類別來處理長文字', () => {
    const longPathCategory = {
      ...mockCategories[0],
      id: 99,
      displayPath: '這是一個非常長的分類路徑 > 包含很多層級 > 測試文字截斷功能 > 確保UI不會破版',
    };

    render(
      <CategoryCombobox
        categories={[longPathCategory]}
        value={99}
        onChange={mockOnChange}
      />
    );

    const button = screen.getByRole('combobox');
    const textSpan = button.querySelector('.truncate');
    expect(textSpan).toBeInTheDocument();
  });
});