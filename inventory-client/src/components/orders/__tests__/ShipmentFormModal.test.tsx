import React from 'react';
import { render, screen } from '@testing-library/react';
import { ShipmentFormModal } from '../ShipmentFormModal';

// 簡化的 Mock 設置
jest.mock('@/hooks', () => ({
  useCreateOrderShipment: () => ({
    mutate: jest.fn(),
    isPending: false,
    isError: false,
    error: null,
  }),
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// 簡化的 UI 組件 Mock
jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <h2 data-testid="dialog-title">{children}</h2>,
  DialogFooter: ({ children }: any) => <div data-testid="dialog-footer">{children}</div>,
}));

jest.mock('@/components/ui/form', () => ({
  Form: ({ children }: any) => <div data-testid="form">{children}</div>,
  FormField: ({ render }: any) => render({ field: { onChange: jest.fn(), value: '' } }),
  FormItem: ({ children }: any) => <div data-testid="form-item">{children}</div>,
  FormLabel: ({ children }: any) => <label data-testid="form-label">{children}</label>,
  FormControl: ({ children }: any) => <div data-testid="form-control">{children}</div>,
  FormMessage: ({ children }: any) => <div data-testid="form-message">{children}</div>,
}));

jest.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input data-testid="input" {...props} />,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, ...props }: any) => (
    <button data-testid="button" {...props}>
      {children}
    </button>
  ),
}));

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: () => ({
    handleSubmit: jest.fn(),
    control: {},
    reset: jest.fn(),
  }),
}));

describe('ShipmentFormModal', () => {
  const defaultProps = {
    orderId: 1,
    open: true,
    onOpenChange: jest.fn(),
  };

  test('基本渲染測試', () => {
    render(<ShipmentFormModal {...defaultProps} />);
    
    expect(screen.getByTestId('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('建立出貨資訊');
    expect(screen.getByTestId('form')).toBeInTheDocument();
  });

  test('當 open 為 false 時不渲染', () => {
    render(<ShipmentFormModal {...defaultProps} open={false} />);
    
    expect(screen.queryByTestId('dialog')).not.toBeInTheDocument();
  });

  test('顯示正確的表單標籤', () => {
    render(<ShipmentFormModal {...defaultProps} />);
    
    expect(screen.getByText('物流公司')).toBeInTheDocument();
    expect(screen.getByText('追蹤單號')).toBeInTheDocument();
  });

  test('顯示正確的按鈕', () => {
    render(<ShipmentFormModal {...defaultProps} />);
    
    const buttons = screen.getAllByTestId('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent('取消');
    expect(buttons[1]).toHaveTextContent('建立出貨');
  });
});
