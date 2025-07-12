/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AttributesClientPage from '../AttributesClientPage';
import * as useAdminAuth from '@/hooks/use-admin-auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';

// Mock Sonner
jest.mock('sonner');

// Mock hooks
jest.mock('@/hooks/use-admin-auth', () => ({
  useAdminAuth: jest.fn(),
}));

// 修復：使用正確的 hooks 導入路徑
jest.mock('@/hooks', () => ({
  useAttributes: jest.fn(),
  useCreateAttribute: jest.fn(),
  useUpdateAttribute: jest.fn(),
  useDeleteAttribute: jest.fn(),
  // Mock other hooks used in AttributeValuesManager if any
  useCreateAttributeValue: jest.fn(),
  useUpdateAttributeValue: jest.fn(),
  useDeleteAttributeValue: jest.fn(),
  useAttributeValues: jest.fn(),
}));

const mockUseAdminAuth = useAdminAuth.useAdminAuth as jest.Mock;

// Mock console.warn 以避免 Radix UI 的警告
const originalConsoleWarn = console.warn;
beforeAll(() => {
  console.warn = jest.fn((message) => {
    // 忽略 Radix UI Dialog 的 Missing Description 警告
    if (message && message.includes && message.includes('Missing `Description`')) {
      return;
    }
    originalConsoleWarn(message);
  });
});

afterAll(() => {
  console.warn = originalConsoleWarn;
});

// 修復：導入正確的 mock hooks
const mockHooks = require('@/hooks');
const mockUseAttributes = mockHooks.useAttributes as jest.Mock;
const mockUseCreateAttribute = mockHooks.useCreateAttribute as jest.Mock;
const mockUseUpdateAttribute = mockHooks.useUpdateAttribute as jest.Mock;
const mockUseDeleteAttribute = mockHooks.useDeleteAttribute as jest.Mock;
const mockUseCreateAttributeValue = mockHooks.useCreateAttributeValue as jest.Mock;
const mockUseUpdateAttributeValue = mockHooks.useUpdateAttributeValue as jest.Mock;
const mockUseDeleteAttributeValue = mockHooks.useDeleteAttributeValue as jest.Mock;
const mockUseAttributeValues = mockHooks.useAttributeValues as jest.Mock;

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderComponent = (queryClient: QueryClient) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <AttributesClientPage />
    </QueryClientProvider>
  );
};

describe('AttributesClientPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    jest.clearAllMocks();

    // 為所有測試設置通用的預設模擬回傳值
    mockUseAdminAuth.mockReturnValue({
      isAuthorized: true,
      isLoading: false,
    });

    // 修復：設置正確的空數據結構
    mockUseAttributes.mockReturnValue({
      data: { data: [], meta: {} },
      isLoading: true,
      error: null,
    });

    mockUseCreateAttribute.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });
    
    mockUseUpdateAttribute.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockUseDeleteAttribute.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockUseCreateAttributeValue.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockUseUpdateAttributeValue.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockUseDeleteAttributeValue.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    });

    // 為 AttributeValuesManager 內部的 hook 提供模擬
    mockUseAttributeValues.mockReturnValue({
      data: { data: [], meta: {} },
      isLoading: false,
      error: null,
    });
  });

  // 修復：將數據結構放在正確的位置
  const mockAttributesData = [
    { id: 1, name: '顏色', values: [{ id: 1, value: '紅色' }] },
    { id: 2, name: '尺寸', values: [{ id: 2, value: '大' }] },
  ];

  const mockAttributes = {
    data: mockAttributesData,
    meta: {},
  };

  test('權限不足時，顯示權限不足訊息', () => {
    mockUseAdminAuth.mockReturnValue({ isAuthorized: false, isLoading: false });
    renderComponent(queryClient);
    expect(screen.getByText('權限不足')).toBeInTheDocument();
  });

  test('載入中，顯示載入動畫', () => {
    mockUseAdminAuth.mockReturnValue({ isAuthorized: true, isLoading: true });
    renderComponent(queryClient);
    expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
  });

  test('成功載入後，渲染頁面標題與規格列表', async () => {
    // 修復：使用正確的數據結構
    mockUseAttributes.mockReturnValue({ 
      data: mockAttributes, 
      isLoading: false,
      error: null 
    });
    renderComponent(queryClient);
    
    expect(screen.getByRole('heading', { name: '規格管理' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('顏色')).toBeInTheDocument();
      expect(screen.getByText('尺寸')).toBeInTheDocument();
    });
  });

  test('搜尋功能可以正常篩選規格', async () => {
    const user = userEvent.setup();
    // 修復：使用正確的數據結構
    mockUseAttributes.mockReturnValue({ 
      data: mockAttributes, 
      isLoading: false,
      error: null 
    });
    renderComponent(queryClient);

    await waitFor(() => {
        expect(screen.getByText('顏色')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('搜索規格...');
    await user.type(searchInput, '顏色');

    await waitFor(() => {
        expect(screen.getByText('顏色')).toBeInTheDocument();
        expect(screen.queryByText('尺寸')).not.toBeInTheDocument();
    });
  });

  test('可以成功新增規格', async () => {
    const user = userEvent.setup();
    const createMutateAsync = jest.fn().mockResolvedValue({});
    // 修復：使用正確的數據結構
    mockUseAttributes.mockReturnValue({ 
      data: mockAttributes, 
      isLoading: false,
      error: null 
    });
    mockUseCreateAttribute.mockReturnValue({ mutateAsync: createMutateAsync, isPending: false });

    renderComponent(queryClient);

    await user.click(screen.getByRole('button', { name: /新增規格/i }));

    const dialogTitle = await screen.findByRole('heading', { name: '新增規格' });
    expect(dialogTitle).toBeInTheDocument();

    const nameInput = screen.getByLabelText('規格名稱');
    await user.type(nameInput, '新規格');
    
    await user.click(screen.getByRole('button', { name: '新增' }));

    await waitFor(() => {
      expect(createMutateAsync).toHaveBeenCalledWith({ name: '新規格' });
      expect(toast.success).toHaveBeenCalledWith('規格新增成功！');
    });
  });

  test('可以成功更新規格', async () => {
    const user = userEvent.setup();
    const updateMutateAsync = jest.fn().mockResolvedValue({});
    // 修復：使用正確的數據結構
    mockUseAttributes.mockReturnValue({ 
      data: mockAttributes, 
      isLoading: false,
      error: null 
    });
    mockUseUpdateAttribute.mockReturnValue({ mutateAsync: updateMutateAsync, isPending: false });

    renderComponent(queryClient);
    
    await waitFor(() => {
        expect(screen.getByText('顏色')).toBeInTheDocument();
    });

    // 點擊顏色規格以選中它
    await user.click(screen.getByText('顏色'));

    // 等待 AttributeValuesManager 出現，先點擊三點菜單
    const moreButton = await screen.findByRole('button', { name: '' }); // MoreVertical 按鈕沒有 name
    await user.click(moreButton);
    
    // 然後找到編輯菜單項
    const editMenuItem = await screen.findByRole('menuitem', { name: /編輯規格名稱/i });
    await user.click(editMenuItem);

    const dialogTitle = await screen.findByRole('heading', { name: '編輯規格' });
    expect(dialogTitle).toBeInTheDocument();
    
    const nameInput = screen.getByLabelText('規格名稱');
    await user.clear(nameInput);
    await user.type(nameInput, '更新後的顏色');
    
    await user.click(screen.getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(updateMutateAsync).toHaveBeenCalledWith({ id: 1, body: { name: '更新後的顏色' } });
      expect(toast.success).toHaveBeenCalledWith('規格更新成功！');
    });
  });
  
  test('可以成功刪除規格', async () => {
    const user = userEvent.setup();
    const deleteMutateAsync = jest.fn().mockResolvedValue({});
    // 修復：使用正確的數據結構
    mockUseAttributes.mockReturnValue({ 
      data: mockAttributes, 
      isLoading: false,
      error: null 
    });
    mockUseDeleteAttribute.mockReturnValue({ mutateAsync: deleteMutateAsync, isPending: false });

    renderComponent(queryClient);

    await waitFor(() => {
        expect(screen.getByText('顏色')).toBeInTheDocument();
    });

    await user.click(screen.getByText('顏色'));
    
    // 增加 waitFor確保 AttributeValuesManager 渲染完成，先點擊三點菜單
    const moreButton = await screen.findByRole('button', { name: '' }); // MoreVertical 按鈕沒有 name
    await user.click(moreButton);
    
    // 然後找到刪除菜單項
    const deleteMenuItem = await screen.findByRole('menuitem', { name: /刪除規格/i });
    await user.click(deleteMenuItem);
    
    const dialogTitle = await screen.findByRole('heading', { name: '確認刪除規格' });
    expect(dialogTitle).toBeInTheDocument();
    
    const confirmButton = screen.getByRole('button', { name: /確認刪除/i });
    await user.click(confirmButton);
    
    await waitFor(() => {
        expect(deleteMutateAsync).toHaveBeenCalledWith({ id: 1 });
        expect(toast.success).toHaveBeenCalledWith('規格刪除成功！');
    });
  });

  test('點擊規格後，右側應顯示 AttributeValuesManager', async () => {
    const user = userEvent.setup();
    // 修復：使用正確的數據結構
    mockUseAttributes.mockReturnValue({ 
      data: mockAttributes, 
      isLoading: false,
      error: null 
    });
    renderComponent(queryClient);

    await waitFor(() => {
        expect(screen.getByText('顏色')).toBeInTheDocument();
    });
    
    await user.click(screen.getByText('顏色'));

    // 增加 waitFor 以確保非同步渲染完成
    await waitFor(() => {
        expect(screen.getByRole('heading', { name: '顏色' })).toBeInTheDocument();
        expect(screen.getByText('管理此規格類型的所有值')).toBeInTheDocument();
    });
  });
}); 