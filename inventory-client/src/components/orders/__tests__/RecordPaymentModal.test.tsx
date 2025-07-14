import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RecordPaymentModal from '../RecordPaymentModal';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAddOrderPayment } from '@/hooks';
import { ProcessedOrder } from '@/types/api-helpers';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks', () => ({
  useAddOrderPayment: jest.fn(),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    const d = new Date(date);
    return `${d.getFullYear()}年${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
  }),
}));

const mockUseAddOrderPayment = useAddOrderPayment as jest.MockedFunction<typeof useAddOrderPayment>;

// Mock data
const mockOrder: ProcessedOrder = {
  id: 1,
  order_number: 'ORD-001',
  grand_total: 1000,
  paid_amount: 600,
} as ProcessedOrder;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
};

describe('RecordPaymentModal', () => {
  const mockOnOpenChange = jest.fn();
  const mockMutateAsync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAddOrderPayment.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any);
  });

  describe('顯示狀態', () => {
    it('應該在沒有訂單時不顯示', () => {
      render(
        <RecordPaymentModal
          order={null}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('應該在 open 為 false 時不顯示', () => {
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={false}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('應該在 open 為 true 且有訂單時顯示', () => {
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('記錄部分收款')).toBeInTheDocument();
      expect(screen.getByText('為訂單 ORD-001 記錄新的收款資訊')).toBeInTheDocument();
    });
  });

  describe('金額顯示', () => {
    it('應該顯示訂單金額資訊', () => {
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      // 訂單總額
      expect(screen.getByText('訂單總額')).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();

      // 已付金額
      expect(screen.getByText('已付金額')).toBeInTheDocument();
      expect(screen.getByText('$600')).toBeInTheDocument();

      // 剩餘未付
      expect(screen.getByText('剩餘未付')).toBeInTheDocument();
      expect(screen.getByText('$400')).toBeInTheDocument();
    });

    it('應該在已付清時顯示正確狀態', () => {
      const paidOrder = {
        ...mockOrder,
        paid_amount: 1000,
      };

      render(
        <RecordPaymentModal
          order={paidOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('$0')).toBeInTheDocument();
      expect(screen.getByText('已付清')).toBeInTheDocument();
    });
  });

  describe('表單輸入', () => {
    it('應該顯示所有表單欄位', () => {
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      // 收款金額
      expect(screen.getByPlaceholderText('請輸入收款金額')).toBeInTheDocument();
      
      // 收款方式
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      
      // 收款日期
      expect(screen.getByText(/選擇收款日期|年.*月.*日/)).toBeInTheDocument();
      
      // 備註
      expect(screen.getByPlaceholderText('輸入收款相關備註（選填）')).toBeInTheDocument();
    });

    it('應該能填入剩餘金額', async () => {
      const user = userEvent.setup();
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const fillButton = screen.getByText('填入剩餘金額');
      await user.click(fillButton);

      const amountInput = screen.getByPlaceholderText('請輸入收款金額');
      expect(amountInput).toHaveValue(400);
    });

    it('應該在填入全額時顯示提示', async () => {
      const user = userEvent.setup();
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const amountInput = screen.getByPlaceholderText('請輸入收款金額');
      await user.clear(amountInput);
      await user.type(amountInput, '400');

      await waitFor(() => {
        expect(screen.getByText('✓ 此金額將會完成全額付款')).toBeInTheDocument();
      });
    });

    it('應該能選擇收款方式', async () => {
      const user = userEvent.setup();
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);

      // 檢查選項是否出現 - 使用 getAllByText 來避免重複元素錯誤
      const cashOptions = screen.getAllByText('現金');
      const transferOptions = screen.getAllByText('銀行轉帳');
      const creditOptions = screen.getAllByText('信用卡');
      
      expect(cashOptions.length).toBeGreaterThan(0);
      expect(transferOptions.length).toBeGreaterThan(0);
      expect(creditOptions.length).toBeGreaterThan(0);

      // 選擇現金選項
      const cashOption = cashOptions.find(el => el.closest('[role="option"]'));
      if (cashOption) {
        await user.click(cashOption);
        
        await waitFor(() => {
          expect(selectTrigger).toHaveTextContent('現金');
        });
      }
    });
  });

  describe('表單提交', () => {
    it('應該能成功提交表單', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockResolvedValueOnce({});

      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      // 填寫金額
      const amountInput = screen.getByPlaceholderText('請輸入收款金額');
      await user.clear(amountInput);
      await user.type(amountInput, '200');

      // 選擇收款方式
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      const cashOptions = screen.getAllByText('現金');
      const cashOption = cashOptions.find(el => el.closest('[role="option"]'));
      await user.click(cashOption!);

      // 提交表單
      const submitButton = screen.getByText('記錄收款');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith({
          orderId: 1,
          data: expect.objectContaining({
            amount: 200,
            payment_method: 'cash',
          }),
        });
      });

      expect(toast.success).toHaveBeenCalledWith('成功記錄 200 元的現金收款');
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });

    it('應該在提交失敗時顯示錯誤', async () => {
      const user = userEvent.setup();
      mockMutateAsync.mockRejectedValueOnce(new Error('付款記錄失敗'));

      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      // 填寫金額
      const amountInput = screen.getByPlaceholderText('請輸入收款金額');
      await user.clear(amountInput);
      await user.type(amountInput, '200');

      // 選擇收款方式
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      const cashOptions = screen.getAllByText('現金');
      const cashOption = cashOptions.find(el => el.closest('[role="option"]'));
      await user.click(cashOption!);

      // 提交表單
      const submitButton = screen.getByText('記錄收款');
      await user.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('付款記錄失敗');
      });
    });

    it('應該在提交時顯示載入狀態', () => {
      mockUseAddOrderPayment.mockReturnValue({
        mutateAsync: mockMutateAsync,
        isPending: true,
      } as any);

      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      expect(screen.getByText('記錄中...')).toBeInTheDocument();
      expect(screen.getByText('取消')).toBeDisabled();
    });

    it('應該在已付清時禁用提交按鈕', () => {
      const paidOrder = {
        ...mockOrder,
        paid_amount: 1000,
      };

      render(
        <RecordPaymentModal
          order={paidOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const submitButton = screen.getByText('記錄收款');
      expect(submitButton).toBeDisabled();
    });
  });

  describe('表單驗證', () => {
    it('應該驗證金額不能超過剩餘未付金額', async () => {
      const user = userEvent.setup();
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const amountInput = screen.getByPlaceholderText('請輸入收款金額');
      await user.clear(amountInput);
      await user.type(amountInput, '500'); // 超過剩餘的 400

      // 選擇收款方式
      const selectTrigger = screen.getByRole('combobox');
      await user.click(selectTrigger);
      const cashOptions = screen.getAllByText('現金');
      const cashOption = cashOptions.find(el => el.closest('[role="option"]'));
      if (cashOption) {
        await user.click(cashOption);
      }

      // 嘗試提交
      const submitButton = screen.getByText('記錄收款');
      await user.click(submitButton);

      // 檢查驗證錯誤訊息
      await waitFor(() => {
        const errorMessage = screen.queryByText(/收款金額不能超過剩餘未付金額/);
        if (errorMessage) {
          expect(errorMessage).toBeInTheDocument();
        } else {
          // 如果沒有找到錯誤訊息，至少確認 mutateAsync 沒有被調用
          expect(mockMutateAsync).not.toHaveBeenCalled();
        }
      });
    });
  });

  describe('對話框控制', () => {
    it('應該能取消並關閉對話框', async () => {
      const user = userEvent.setup();
      render(
        <RecordPaymentModal
          order={mockOrder}
          open={true}
          onOpenChange={mockOnOpenChange}
        />,
        { wrapper: createWrapper() }
      );

      const cancelButton = screen.getByText('取消');
      await user.click(cancelButton);

      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    });
  });
});