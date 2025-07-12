import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useParams, useRouter } from 'next/navigation';
import { useInstallation, useUpdateInstallation } from '@/hooks';
import { toast } from 'sonner';
import EditInstallationPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useRouter: jest.fn(),
}));

jest.mock('@/hooks', () => ({
  useInstallation: jest.fn(),
  useUpdateInstallation: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/installations', () => ({
  InstallationForm: ({ onSubmit, onCancel, isSubmitting, initialData }: any) => (
    <div data-testid="installation-form">
      <div>Form with initial data: {JSON.stringify(initialData)}</div>
      <button 
        onClick={() => onSubmit({
          customer_name: 'Test Customer',
          customer_phone: '123456789',
          installation_address: 'Test Address',
          installer_user_id: 1,
          scheduled_date: '2024-01-01',
          notes: 'Test notes',
          items: [
            {
              product_variant_id: 1,
              product_name: 'Test Product',
              sku: 'TEST-SKU',
              quantity: 1,
              specifications: 'Test specs',
              notes: 'Item notes',
            }
          ]
        })}
        disabled={isSubmitting}
      >
        Submit
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

const mockUseParams = useParams as jest.MockedFunction<typeof useParams>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseInstallation = useInstallation as jest.MockedFunction<typeof useInstallation>;
const mockUseUpdateInstallation = useUpdateInstallation as jest.MockedFunction<typeof useUpdateInstallation>;

describe('EditInstallationPage', () => {
  const mockPush = jest.fn();
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as any);

    mockUseUpdateInstallation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  describe('參數驗證', () => {
    it('應該在沒有 ID 參數時顯示錯誤', () => {
      mockUseParams.mockReturnValue({});
      mockUseInstallation.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      expect(screen.getByText('錯誤')).toBeInTheDocument();
      expect(screen.getByText('無效的安裝單 ID')).toBeInTheDocument();
    });

    it('應該在無效 ID 參數時顯示錯誤', () => {
      mockUseParams.mockReturnValue({ id: 'invalid' });
      mockUseInstallation.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      expect(screen.getByText('錯誤')).toBeInTheDocument();
      expect(screen.getByText('無效的安裝單 ID')).toBeInTheDocument();
    });

    it('應該在 ID 為 0 時顯示錯誤', () => {
      mockUseParams.mockReturnValue({ id: '0' });
      mockUseInstallation.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      expect(screen.getByText('錯誤')).toBeInTheDocument();
      expect(screen.getByText('無效的安裝單 ID')).toBeInTheDocument();
    });
  });

  describe('載入狀態', () => {
    it('應該在載入中顯示骨架屏', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      expect(document.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(3);
    });

    it('應該在載入失敗時顯示錯誤訊息', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: { message: 'Network error' },
      } as any);
      
      render(<EditInstallationPage />);
      
      expect(screen.getByText('載入失敗')).toBeInTheDocument();
      expect(screen.getByText('無法載入安裝單資料：Network error')).toBeInTheDocument();
    });

    it('應該在找不到安裝單時顯示錯誤訊息', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: null,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      expect(screen.getByText('找不到安裝單')).toBeInTheDocument();
      expect(screen.getByText('請檢查安裝單 ID 是否正確。')).toBeInTheDocument();
    });
  });

  describe('成功載入', () => {
    const mockInstallation = {
      id: 123,
      installation_number: 'INST-001',
      customer_name: 'John Doe',
      customer_phone: '123456789',
      installation_address: '123 Test St',
      installer_user_id: 1,
      scheduled_date: '2024-01-01',
      notes: 'Test notes',
      updated_at: '2024-01-01T00:00:00Z',
      items: [
        {
          product_variant_id: 1,
          product_name: 'Test Product',
          sku: 'TEST-SKU',
          quantity: 2,
          specifications: 'Test specs',
          notes: 'Item notes',
        }
      ]
    };

    it('應該顯示安裝單編輯表單', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: mockInstallation,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      expect(screen.getByText('編輯安裝單 #INST-001')).toBeInTheDocument();
      expect(screen.getByText('修改安裝單的資訊與項目設定。')).toBeInTheDocument();
      expect(screen.getByTestId('installation-form')).toBeInTheDocument();
    });

    it('應該傳遞正確的初始資料到表單', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: mockInstallation,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      const formText = screen.getByTestId('installation-form').textContent;
      expect(formText).toContain('John Doe');
      expect(formText).toContain('123456789');
      expect(formText).toContain('123 Test St');
      expect(formText).toContain('Test Product');
    });

    it('應該在沒有項目時提供空項目', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: {
          ...mockInstallation,
          items: [],
        },
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      const formText = screen.getByTestId('installation-form').textContent;
      expect(formText).toContain('product_variant_id":0');
      expect(formText).toContain('quantity":1');
    });
  });

  describe('表單提交', () => {
    const mockInstallation = {
      id: 123,
      installation_number: 'INST-001',
      customer_name: 'John Doe',
      customer_phone: '123456789',
      installation_address: '123 Test St',
      installer_user_id: 1,
      scheduled_date: '2024-01-01',
      notes: 'Test notes',
      updated_at: '2024-01-01T00:00:00Z',
      items: []
    };

    it('應該成功提交表單', async () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: mockInstallation,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 123,
            customer_name: 'Test Customer',
            customer_phone: '123456789',
            installation_address: 'Test Address',
            installer_user_id: 1,
            scheduled_date: '2024-01-01',
            notes: 'Test notes',
            items: expect.arrayContaining([
              expect.objectContaining({
                product_variant_id: 1,
                product_name: 'Test Product',
                sku: 'TEST-SKU',
                quantity: 1,
                specifications: 'Test specs',
                notes: 'Item notes',
              })
            ])
          }),
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it('應該在成功時顯示成功訊息並重定向', async () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: mockInstallation,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({ data: { id: 123 } });
      });
      
      render(<EditInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('安裝單更新成功');
        expect(mockPush).toHaveBeenCalledWith('/installations/123');
      });
    });

    it('應該在失敗時顯示錯誤訊息', async () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: mockInstallation,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      mockMutate.mockImplementation((data, options) => {
        options.onError(new Error('Update failed'));
      });
      
      render(<EditInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('安裝單更新失敗', {
          description: 'Update failed'
        });
      });
    });

    it('應該處理沒有錯誤訊息的情況', async () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: mockInstallation,
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      mockMutate.mockImplementation((data, options) => {
        options.onError({ message: null });
      });
      
      render(<EditInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('安裝單更新失敗', {
          description: '請檢查輸入資料並重試。'
        });
      });
    });
  });

  describe('取消操作', () => {
    it('應該在點擊取消時重定向到安裝單詳情頁', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: {
          id: 123,
          installation_number: 'INST-001',
          customer_name: 'John Doe',
          items: []
        },
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      expect(mockPush).toHaveBeenCalledWith('/installations/123');
    });
  });

  describe('項目處理', () => {
    it('應該正確處理有效的 product_variant_id', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: {
          id: 123,
          installation_number: 'INST-001',
          customer_name: 'John Doe',
          items: [
            {
              product_variant_id: 5,
              product_name: 'Test Product',
              sku: 'TEST-SKU',
              quantity: 1,
              specifications: 'Test specs',
              notes: 'Item notes',
            }
          ]
        },
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      const formText = screen.getByTestId('installation-form').textContent;
      expect(formText).toContain('product_variant_id":5');
    });

    it('應該將 null product_variant_id 轉換為 0', () => {
      mockUseParams.mockReturnValue({ id: '123' });
      mockUseInstallation.mockReturnValue({
        data: {
          id: 123,
          installation_number: 'INST-001',
          customer_name: 'John Doe',
          items: [
            {
              product_variant_id: null,
              product_name: 'Test Product',
              sku: 'TEST-SKU',
              quantity: 1,
              specifications: 'Test specs',
              notes: 'Item notes',
            }
          ]
        },
        isLoading: false,
        isError: false,
        error: null,
      } as any);
      
      render(<EditInstallationPage />);
      
      const formText = screen.getByTestId('installation-form').textContent;
      expect(formText).toContain('product_variant_id":0');
    });
  });
});