/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AttributeValuesManager } from '../AttributeValuesManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 修復：使用正確的 hooks 導入路徑
jest.mock('@/hooks', () => ({
  useAttributeValues: jest.fn(),
}));

// 修復：從正確位置導入 mock hooks
const mockHooks = require('@/hooks');
const mockUseAttributeValues = mockHooks.useAttributeValues as jest.Mock;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const defaultProps = {
  attribute: {
    id: 1,
    name: '顏色',
    values: [
      { id: 1, value: '紅色', attribute_id: 1, created_at: new Date().toISOString() }, 
      { id: 2, value: '藍色', attribute_id: 1, created_at: new Date().toISOString() }
    ],
    products_count: 5,
    created_at: new Date().toISOString(),
  },
  onEdit: jest.fn(),
  onDelete: jest.fn(),
  onCreateValue: jest.fn(),
  onDeleteValue: jest.fn(),
  newValueInput: '',
  setNewValueInput: jest.fn(),
  showValueInput: false,
  setShowValueInput: jest.fn(),
  createValuePending: false,
};

const renderComponent = (queryClient: QueryClient, props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <QueryClientProvider client={queryClient}>
      <AttributeValuesManager {...mergedProps} />
    </QueryClientProvider>
  );
};

describe('AttributeValuesManager', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    jest.clearAllMocks();
  });

  test('應該正確渲染標題、統計數據和規格值列表', async () => {
    mockUseAttributeValues.mockReturnValue({
      data: { data: defaultProps.attribute.values },
      isLoading: false,
    });
    renderComponent(queryClient);

    expect(screen.getByRole('heading', { name: '顏色' })).toBeInTheDocument();
    expect(screen.getByText(defaultProps.attribute.values.length.toString())).toBeInTheDocument();
    expect(screen.getByText(defaultProps.attribute.products_count.toString())).toBeInTheDocument();
    
    await waitFor(() => {
        expect(screen.getByText('紅色')).toBeInTheDocument();
        expect(screen.getByText('藍色')).toBeInTheDocument();
    });
  });

  test('當載入中時，應顯示載入動畫', () => {
    mockUseAttributeValues.mockReturnValue({ data: undefined, isLoading: true });
    renderComponent(queryClient);
    expect(screen.getByRole('status', { name: /loading values/i })).toBeInTheDocument();
  });

  test('當沒有規格值時，應顯示空狀態提示', async () => {
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    renderComponent(queryClient);
    await waitFor(() => {
        expect(screen.getByText('尚未建立任何規格值')).toBeInTheDocument();
    });
  });

  test('點擊編輯和刪除規格按鈕時，應呼叫對應的 props', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({
        data: { data: defaultProps.attribute.values },
        isLoading: false,
    });
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    renderComponent(queryClient, { onEdit, onDelete });

    // 尋找下拉選單按鈕（通過 data-slot 屬性）
    const dropdownTrigger = screen.getByRole('button', { 
      name: (accessibleName, element) => {
        return element?.getAttribute('data-slot') === 'dropdown-menu-trigger';
      }
    });
    await user.click(dropdownTrigger);
    
    await user.click(await screen.findByText('編輯規格名稱'));
    expect(onEdit).toHaveBeenCalledTimes(1);
    
    // 重新打開 DropdownMenu
    await user.click(dropdownTrigger);
    await user.click(await screen.findByText('刪除規格'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  test('點擊新增規格值按鈕後，應呼叫 setShowValueInput', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    const setShowValueInput = jest.fn();
    renderComponent(queryClient, { setShowValueInput });

    await user.click(screen.getByRole('button', { name: /新增規格值/i }));
    expect(setShowValueInput).toHaveBeenCalledWith(true);
  });

  test('在輸入框中輸入並新增後，應呼叫 onCreateValue', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    const onCreateValue = jest.fn();
    
    renderComponent(queryClient, { 
      onCreateValue,
      showValueInput: true,
      newValueInput: '新顏色'
    });

    const createButton = screen.getByRole('button', { name: '新增' });
    await user.click(createButton);
    expect(onCreateValue).toHaveBeenCalledTimes(1);
  });

  test('點擊刪除規格值按鈕時，應呼叫 onDeleteValue 並傳入正確參數', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({
        data: { data: defaultProps.attribute.values },
        isLoading: false,
    });
    const onDeleteValue = jest.fn();
    renderComponent(queryClient, { onDeleteValue });
    
    const deleteButton = screen.getByRole('button', { name: /刪除規格值 紅色/i });
    await user.click(deleteButton);

    expect(onDeleteValue).toHaveBeenCalledTimes(1);
    expect(onDeleteValue).toHaveBeenCalledWith(1, '紅色');
  });

  test('在輸入框中按 Enter 鍵應新增規格值', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    const onCreateValue = jest.fn();
    const setNewValueInput = jest.fn();
    
    renderComponent(queryClient, { 
      onCreateValue,
      setNewValueInput,
      showValueInput: true,
      newValueInput: '新顏色'
    });

    const input = screen.getByPlaceholderText('輸入新的顏色值');
    await user.type(input, '{Enter}');
    
    expect(onCreateValue).toHaveBeenCalledTimes(1);
  });

  test('在輸入框中按 Escape 鍵應取消輸入', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    const setShowValueInput = jest.fn();
    const setNewValueInput = jest.fn();
    
    renderComponent(queryClient, { 
      setShowValueInput,
      setNewValueInput,
      showValueInput: true,
      newValueInput: '測試輸入'
    });

    const input = screen.getByPlaceholderText('輸入新的顏色值');
    await user.type(input, '{Escape}');
    
    expect(setShowValueInput).toHaveBeenCalledWith(false);
    expect(setNewValueInput).toHaveBeenCalledWith('');
  });

  test('點擊取消按鈕應關閉輸入框並清空輸入', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    const setShowValueInput = jest.fn();
    const setNewValueInput = jest.fn();
    
    renderComponent(queryClient, { 
      setShowValueInput,
      setNewValueInput,
      showValueInput: true,
      newValueInput: '測試輸入'
    });

    const cancelButton = screen.getByRole('button', { name: '取消' });
    await user.click(cancelButton);
    
    expect(setShowValueInput).toHaveBeenCalledWith(false);
    expect(setNewValueInput).toHaveBeenCalledWith('');
  });

  test('當 createValuePending 為 true 時，新增按鈕應顯示載入狀態', () => {
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    
    renderComponent(queryClient, { 
      showValueInput: true,
      newValueInput: '新顏色',
      createValuePending: true
    });

    // Find the button by its disabled state and check if it contains the loader
    const buttons = screen.getAllByRole('button');
    const createButton = buttons.find(button => button.disabled);
    expect(createButton).toBeInTheDocument();
    
    // Check for loader icon by its class name
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  test('當輸入為空時，新增按鈕應被禁用', () => {
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    
    renderComponent(queryClient, { 
      showValueInput: true,
      newValueInput: '',
      createValuePending: false
    });

    expect(screen.getByRole('button', { name: '新增' })).toBeDisabled();
  });

  test('當輸入只有空白字符時，新增按鈕應被禁用', () => {
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    
    renderComponent(queryClient, { 
      showValueInput: true,
      newValueInput: '   ',
      createValuePending: false
    });

    expect(screen.getByRole('button', { name: '新增' })).toBeDisabled();
  });

  test('輸入框變化時應呼叫 setNewValueInput', async () => {
    const user = userEvent.setup();
    mockUseAttributeValues.mockReturnValue({ data: { data: [] }, isLoading: false });
    const setNewValueInput = jest.fn();
    
    renderComponent(queryClient, { 
      setNewValueInput,
      showValueInput: true,
      newValueInput: ''
    });

    const input = screen.getByPlaceholderText('輸入新的顏色值');
    await user.type(input, '新顏色');
    
    // Check that setNewValueInput was called (it will be called for each character)
    expect(setNewValueInput).toHaveBeenCalled();
    expect(setNewValueInput).toHaveBeenCalledWith('新');
    expect(setNewValueInput).toHaveBeenCalledWith('顏');
    expect(setNewValueInput).toHaveBeenCalledWith('色');
  });
});