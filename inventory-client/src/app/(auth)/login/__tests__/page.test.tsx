import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoginPage from '../page';
import { loginAction } from '@/actions/auth';
import { toast } from 'sonner';

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn()
  }
}));

// Mock auth action
jest.mock('@/actions/auth', () => ({
  loginAction: jest.fn()
}));

// Mock React's useActionState
const mockUseActionState = jest.fn();
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useActionState: (action: any, initialState: any) => mockUseActionState(action, initialState),
  useEffect: jest.requireActual('react').useEffect
}));

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, disabled, ...props }: any) => (
    <button {...props} disabled={disabled}>{children}</button>
  )
}));

jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className} data-testid="card-title">{children}</div>
}));

jest.mock('@/components/ui/input', () => ({
  Input: ({ className, ...props }: any) => <input {...props} className={className} />
}));

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, ...props }: any) => <label {...props}>{children}</label>
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: ({ id, ...props }: any) => <input type="checkbox" id={id} {...props} />
}));

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant, className }: any) => (
    <div data-testid="alert" data-variant={variant} className={className}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>
}));

jest.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle-icon" />,
  Eye: () => <div data-testid="eye-icon" />,
  EyeOff: () => <div data-testid="eye-off-icon" />,
  Loader2: () => <div data-testid="loader-icon" />
}));

describe('LoginPage', () => {
  const mockFormAction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseActionState.mockReturnValue([undefined, mockFormAction, false]);
  });

  it('should render login form with all elements', () => {
    render(<LoginPage />);

    // Check card structure
    expect(screen.getByTestId('card')).toBeInTheDocument();
    expect(screen.getByTestId('card-header')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toBeInTheDocument();
    expect(screen.getByTestId('card-title')).toHaveTextContent('歡迎回來');
    expect(screen.getByTestId('card-description')).toBeInTheDocument();
    expect(screen.getByText('請輸入您的帳號密碼以登入系統。')).toBeInTheDocument();

    // Check form elements
    expect(screen.getByLabelText('帳號')).toBeInTheDocument();
    expect(screen.getByLabelText('密碼')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('superadmin')).toBeInTheDocument();
    
    // Check submit button
    expect(screen.getByRole('button', { name: '登入' })).toBeInTheDocument();
    
    // Check hint text
    expect(screen.getByText('預設帳號：superadmin')).toBeInTheDocument();
  });

  it('should display error message when state has error', () => {
    const errorMessage = '帳號或密碼錯誤';
    mockUseActionState.mockReturnValue([
      { error: errorMessage },
      mockFormAction,
      false
    ]);

    render(<LoginPage />);

    // Check error alert
    expect(screen.getByTestId('alert')).toBeInTheDocument();
    expect(screen.getByTestId('alert')).toHaveAttribute('data-variant', 'destructive');
    expect(screen.getByTestId('alert-description')).toHaveTextContent(errorMessage);
    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument();

    // Check that inputs have error styling
    const usernameInput = screen.getByPlaceholderText('superadmin');
    const passwordInput = screen.getByLabelText('密碼');
    expect(usernameInput).toHaveClass('border-destructive');
    expect(passwordInput).toHaveClass('border-destructive');
  });

  it('should show toast error when state has error', () => {
    const errorMessage = '登入失敗';
    mockUseActionState.mockReturnValue([
      { error: errorMessage },
      mockFormAction,
      false
    ]);

    render(<LoginPage />);

    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  it('should show loading state when isPending is true', () => {
    mockUseActionState.mockReturnValue([undefined, mockFormAction, true]);

    render(<LoginPage />);

    const submitButton = screen.getByRole('button');
    expect(submitButton).toHaveTextContent('登入中...');
    expect(submitButton).toBeDisabled();
  });

  it('should submit form with correct action', () => {
    render(<LoginPage />);

    // Form is identified by its structure, not role
    const usernameInput = screen.getByPlaceholderText('superadmin');
    const form = usernameInput.closest('form');
    expect(form).toBeInTheDocument();
    
    // Verify that useActionState was called with loginAction
    expect(mockUseActionState).toHaveBeenCalledWith(loginAction, undefined);
  });

  it('should have required attributes on input fields', () => {
    render(<LoginPage />);

    const usernameInput = screen.getByPlaceholderText('superadmin');
    const passwordInput = screen.getByLabelText('密碼');

    expect(usernameInput).toHaveAttribute('required');
    expect(usernameInput).toHaveAttribute('type', 'text');
    expect(usernameInput).toHaveAttribute('name', 'username');
    expect(usernameInput).toHaveAttribute('id', 'username');

    expect(passwordInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveAttribute('name', 'password');
    expect(passwordInput).toHaveAttribute('id', 'password');
  });

  it('should not show error alert when no error in state', () => {
    render(<LoginPage />);

    expect(screen.queryByTestId('alert')).not.toBeInTheDocument();
  });

  it('should not call toast.error when no error in state', () => {
    render(<LoginPage />);

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should update toast when error changes', () => {
    const { rerender } = render(<LoginPage />);

    // Initially no error
    expect(toast.error).not.toHaveBeenCalled();

    // Update with error
    const errorMessage = '新的錯誤訊息';
    mockUseActionState.mockReturnValue([
      { error: errorMessage },
      mockFormAction,
      false
    ]);
    
    rerender(<LoginPage />);

    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });
});