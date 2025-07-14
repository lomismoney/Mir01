import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { CustomerForm } from '../CustomerForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// 修復：使用正確的 hooks 導入路徑
jest.mock('@/hooks', () => ({
  useCheckCustomerExistence: jest.fn(),
}));

// Mock the useDebounce hook
jest.mock('@/hooks/use-debounce', () => ({
  useDebounce: (value: unknown) => value,
}));

// 修復：從正確位置導入 mock hooks
const mockHooks = jest.requireMock<typeof import('@/hooks')>('@/hooks');
const useCheckCustomerExistence = mockHooks.useCheckCustomerExistence as jest.Mock;

describe('CustomerForm', () => {
  const mockOnSubmit = jest.fn();
  const mockRefetch = jest.fn();

  // Create a new QueryClient for each test
  const queryClient = new QueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    (useCheckCustomerExistence as jest.Mock).mockReturnValue({
      data: { exists: false },
      refetch: mockRefetch,
    });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      isSubmitting: false,
      onSubmit: mockOnSubmit,
    };
    return render(<CustomerForm {...defaultProps} {...props} />, { wrapper });
  };

  test('should render form fields correctly', () => {
    renderComponent();
    expect(screen.getByLabelText('客戶姓名')).toBeInTheDocument();
    expect(screen.getByLabelText('聯絡電話')).toBeInTheDocument();
    expect(screen.getByLabelText('此為公司戶')).toBeInTheDocument();
    expect(screen.getByLabelText('客戶行業別')).toBeInTheDocument();
    expect(screen.getByLabelText('付款類別')).toBeInTheDocument();
    expect(screen.getByLabelText('主要聯絡地址')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '新增地址' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '儲存客戶' })).toBeInTheDocument();
  });

  test('should show company name and tax id fields when company checkbox is clicked', async () => {
    const user = userEvent.setup();
    renderComponent();

    const companyCheckbox = screen.getByLabelText('此為公司戶');
    await user.click(companyCheckbox);

    expect(screen.getByLabelText('公司抬頭')).toBeInTheDocument();
    expect(screen.getByLabelText('統一編號')).toBeInTheDocument();
  });

  test('form state should update on user input', async () => {
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText('客戶姓名');
    await user.type(nameInput, '新客戶');
    expect(nameInput).toHaveValue('新客戶');

    const phoneInput = screen.getByLabelText('聯絡電話');
    await user.type(phoneInput, '0912345678');
    expect(phoneInput).toHaveValue('0912345678');
  });

  test('should dynamically add and remove addresses', async () => {
    const user = userEvent.setup();
    renderComponent();

    const addAddressButton = screen.getByRole('button', { name: '新增地址' });
    await user.click(addAddressButton);

    const address1Input = screen.getByPlaceholderText('地址 1');
    await user.type(address1Input, '第一條地址');
    expect(screen.getByDisplayValue('第一條地址')).toBeInTheDocument();
    
    await user.click(addAddressButton);
    const address2Input = screen.getByPlaceholderText('地址 2');
    await user.type(address2Input, '第二條地址');
    expect(screen.getByDisplayValue('第二條地址')).toBeInTheDocument();
    
    const deleteButton = screen.getByTestId('delete-address-0');
    await user.click(deleteButton);

    expect(screen.queryByDisplayValue('第一條地址')).not.toBeInTheDocument();
    expect(screen.getByDisplayValue('第二條地址')).toBeInTheDocument();
  });

  test('submit button should be disabled when isSubmitting is true', () => {
    renderComponent({ isSubmitting: true });
    expect(screen.getByRole('button', { name: '儲存中...' })).toBeDisabled();
  });

  test('should populate form with initialData', () => {
    const initialData = {
      name: '既有客戶',
      phone: '0987654321',
      is_company: true,
      tax_id: '12345678',
      addresses: [{ address: '舊地址', is_default: true, id:1 }],
    };
    renderComponent({ initialData });

    expect(screen.getByLabelText('公司抬頭')).toHaveValue('既有客戶');
    expect(screen.getByLabelText('聯絡電話')).toHaveValue('0987654321');
    expect(screen.getByLabelText('此為公司戶')).toBeChecked();
    expect(screen.getByLabelText('統一編號')).toHaveValue('12345678');
    expect(screen.getByPlaceholderText('地址 1')).toHaveValue('舊地址');
  });

  test('should call onSubmit with correct values when form is submitted', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.type(screen.getByLabelText('客戶姓名'), '測試提交');
    
    // 使用 userEvent 與 combobox/option role 來與 shadcn/ui 的 Select 互動
    await user.click(screen.getByRole('combobox', { name: '客戶行業別' }));
    await user.click(await screen.findByRole('option', { name: '設計師' }));

    await user.click(screen.getByRole('combobox', { name: '付款類別' }));
    await user.click(await screen.findByRole('option', { name: '月結客戶' }));

    const submitButton = screen.getByRole('button', { name: '儲存客戶' });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: '測試提交',
          industry_type: '設計師',
          payment_type: '月結客戶',
        }),
        expect.anything()
      );
    });
  });

  test('should show warning when customer name exists', async () => {
    (useCheckCustomerExistence as jest.Mock).mockReturnValue({
      data: { exists: true },
      refetch: mockRefetch,
    });
    const user = userEvent.setup();
    renderComponent();

    const nameInput = screen.getByLabelText('客戶姓名');
    await user.type(nameInput, '重複客戶');

    await waitFor(() => {
        expect(mockRefetch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByText(/警告：系統中已存在同名客戶/)).toBeInTheDocument();
    });
  });

  test('should automatically set first added address as default', async () => {
    const user = userEvent.setup();
    renderComponent();

    const addAddressButton = screen.getByRole('button', { name: '新增地址' });
    await user.click(addAddressButton);

    expect(screen.getByLabelText('設為預設')).toBeChecked();
  });

  test('should uncheck old default address when a new one is set', async () => {
    const user = userEvent.setup();
    renderComponent();

    const addAddressButton = screen.getByRole('button', { name: '新增地址' });
    await user.click(addAddressButton); // address 1, default
    await user.click(addAddressButton); // address 2

    const checkboxes = screen.getAllByLabelText('設為預設');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    await user.click(checkboxes[1]); // Set address 2 as default

    await waitFor(() => {
        expect(checkboxes[0]).not.toBeChecked();
        expect(checkboxes[1]).toBeChecked();
    });
  });
}); 