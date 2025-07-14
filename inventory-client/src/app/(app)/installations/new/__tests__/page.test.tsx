import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useCreateInstallation } from '@/hooks';
import { toast } from 'sonner';
import { CreateInstallationData } from '@/lib/validations/installation';
import NewInstallationPage from '../page';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks', () => ({
  useCreateInstallation: jest.fn(),
  useErrorHandler: jest.fn(() => ({
    handleError: jest.fn(),
  })),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Create a variable to hold the mock implementation
let mockFormData = {
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
};

interface MockInstallationFormProps {
  onSubmit: (data: CreateInstallationData) => void;
  isSubmitting: boolean;
}

jest.mock('@/components/installations', () => ({
  InstallationForm: ({ onSubmit, isSubmitting }: MockInstallationFormProps) => (
    <div data-testid="installation-form">
      <button 
        onClick={() => onSubmit(mockFormData)}
        disabled={isSubmitting}
      >
        Submit
      </button>
    </div>
  ),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseCreateInstallation = useCreateInstallation as jest.MockedFunction<typeof useCreateInstallation>;

describe('NewInstallationPage', () => {
  const mockPush = jest.fn();
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset form data to default values
    mockFormData = {
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
    };
    
    mockUseRouter.mockReturnValue({
      push: mockPush,
    } as ReturnType<typeof useRouter>);

    mockUseCreateInstallation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as ReturnType<typeof useCreateInstallation>);
  });

  describe('頁面渲染', () => {
    it('應該顯示新增安裝單標題', () => {
      render(<NewInstallationPage />);
      
      expect(screen.getByText('新增安裝單')).toBeInTheDocument();
      expect(screen.getByText('填寫以下資訊以建立一筆新的安裝單。')).toBeInTheDocument();
    });

    it('應該顯示安裝單表單', () => {
      render(<NewInstallationPage />);
      
      expect(screen.getByTestId('installation-form')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
    });
  });

  describe('表單提交', () => {
    it('應該成功提交表單', async () => {
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
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

    it('應該處理 null 值', async () => {
      // Update mockFormData to have null values
      mockFormData = {
        customer_name: 'Test Customer',
        customer_phone: null,
        installation_address: 'Test Address',
        installer_user_id: null,
        scheduled_date: null,
        notes: null,
        items: [
          {
            product_variant_id: 1,
            product_name: '',
            sku: '',
            quantity: 1,
            specifications: null,
            notes: null,
          }
        ]
      } as CreateInstallationData;

      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockMutate).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_name: 'Test Customer',
            customer_phone: null,
            installation_address: 'Test Address',
            installer_user_id: null,
            scheduled_date: null,
            notes: null,
            items: expect.arrayContaining([
              expect.objectContaining({
                product_variant_id: 1,
                product_name: '',
                sku: '',
                quantity: 1,
                specifications: null,
                notes: null,
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
  });

  describe('成功處理', () => {
    it('應該在成功時重定向到新建立的安裝單詳情頁', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({ data: { id: 123 } });
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/installations/123');
      });
    });

    it('應該在沒有 ID 時重定向到安裝單列表頁', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({ data: {} });
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/installations');
      });
    });

    it('應該在沒有 data 時重定向到安裝單列表頁', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onSuccess({});
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/installations');
      });
    });

    it('應該在 null 響應時重定向到安裝單列表頁', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onSuccess(null);
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/installations');
      });
    });
  });

  describe('錯誤處理', () => {
    it('應該在失敗時顯示錯誤訊息', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onError(new Error('Creation failed'));
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('安裝單建立失敗', {
          description: 'Creation failed'
        });
      });
    });

    it('應該記錄錯誤到控制台', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMutate.mockImplementation((data, options) => {
        options.onError(new Error('Creation failed'));
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('創建失敗錯誤:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('應該處理沒有錯誤訊息的情況', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onError({ message: null });
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('安裝單建立失敗', {
          description: '請檢查輸入資料並重試。'
        });
      });
    });

    it('應該處理沒有 message 屬性的錯誤', async () => {
      mockMutate.mockImplementation((data, options) => {
        options.onError({});
      });
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('安裝單建立失敗', {
          description: '請檢查輸入資料並重試。'
        });
      });
    });
  });

  describe('載入狀態', () => {
    it('應該在提交時顯示載入狀態', () => {
      mockUseCreateInstallation.mockReturnValue({
        mutate: mockMutate,
        isPending: true,
      } as ReturnType<typeof useCreateInstallation>);
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      expect(submitButton).toBeDisabled();
    });

    it('應該在沒有載入時啟用提交按鈕', () => {
      mockUseCreateInstallation.mockReturnValue({
        mutate: mockMutate,
        isPending: false,
      } as ReturnType<typeof useCreateInstallation>);
      
      render(<NewInstallationPage />);
      
      const submitButton = screen.getByText('Submit');
      expect(submitButton).not.toBeDisabled();
    });
  });
});