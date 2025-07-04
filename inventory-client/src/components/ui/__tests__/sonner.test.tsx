import React from 'react';
import { render } from '@testing-library/react';
import { Toaster } from '../sonner';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light',
    themes: ['light', 'dark', 'system'],
    setTheme: jest.fn(),
    systemTheme: 'light',
    resolvedTheme: 'light',
  })),
}));

// Mock sonner
jest.mock('sonner', () => ({
  Toaster: ({ theme, className, style, ...props }: any) => (
    <div 
      data-testid="toaster" 
      data-theme={theme}
      className={className}
      style={style}
      {...props}
    />
  ),
}));

// Import mocked modules
import { useTheme } from 'next-themes';

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('Toaster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('應該正確渲染 Toaster', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      themes: ['light', 'dark', 'system'],
      setTheme: jest.fn(),
      systemTheme: 'light',
      resolvedTheme: 'light',
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toBeInTheDocument();
  });

  test('應該使用當前主題', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      themes: ['light', 'dark', 'system'],
      setTheme: jest.fn(),
      systemTheme: 'dark',
      resolvedTheme: 'dark',
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toHaveAttribute('data-theme', 'dark');
  });

  test('當沒有主題時應該使用默認主題', () => {
    mockUseTheme.mockReturnValue({
      theme: undefined,
      themes: ['light', 'dark', 'system'],
      setTheme: jest.fn(),
      systemTheme: 'light',
      resolvedTheme: 'light',
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toHaveAttribute('data-theme', 'system');
  });

  test('應該應用正確的 className', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      themes: ['light', 'dark', 'system'],
      setTheme: jest.fn(),
      systemTheme: 'light',
      resolvedTheme: 'light',
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toHaveClass('toaster', 'group');
  });

  test('應該設置正確的 CSS 變數', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      themes: ['light', 'dark', 'system'],
      setTheme: jest.fn(),
      systemTheme: 'light',
      resolvedTheme: 'light',
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('toaster');
    const style = toaster.style;
    
    expect(style.getPropertyValue('--normal-bg')).toBe('var(--popover)');
    expect(style.getPropertyValue('--normal-text')).toBe('var(--popover-foreground)');
    expect(style.getPropertyValue('--normal-border')).toBe('var(--border)');
  });

  test('應該傳遞額外的 props', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      themes: ['light', 'dark', 'system'],
      setTheme: jest.fn(),
      systemTheme: 'light',
      resolvedTheme: 'light',
    });

    const { getByTestId } = render(
      <Toaster position="top-center" duration={5000} />
    );
    
    const toaster = getByTestId('toaster');
    expect(toaster).toHaveAttribute('position', 'top-center');
    expect(toaster).toHaveAttribute('duration', '5000');
  });

  test('應該支持系統主題', () => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      themes: ['light', 'dark', 'system'],
      setTheme: jest.fn(),
      systemTheme: 'light',
      resolvedTheme: 'light',
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('toaster');
    expect(toaster).toHaveAttribute('data-theme', 'system');
  });
}); 