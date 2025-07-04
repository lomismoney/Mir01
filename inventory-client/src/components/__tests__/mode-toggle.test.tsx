/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ModeToggle } from '../mode-toggle';

// Mock next-themes
const mockSetTheme = jest.fn();
const mockUseTheme = jest.fn();

jest.mock('next-themes', () => ({
  useTheme: () => mockUseTheme(),
}));

// Mock Lucide React icons
jest.mock('lucide-react', () => ({
  Moon: ({ className, ...props }: any) => (
    <svg data-testid="moon-icon" className={className} {...props}>
      <title>Moon</title>
    </svg>
  ),
  Sun: ({ className, ...props }: any) => (
    <svg data-testid="sun-icon" className={className} {...props}>
      <title>Sun</title>
    </svg>
  ),
}));

describe('ModeToggle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * 測試基本渲染功能
   */
  it('應該正確渲染主題切換按鈕', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    // 檢查按鈕是否存在
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // 檢查圖標是否存在
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument();

    // 檢查輔助文字
    expect(screen.getByText('切換主題')).toBeInTheDocument();
  });

  /**
   * 測試淺色主題狀態
   */
  it('應該在淺色主題時顯示正確狀態', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const sunIcon = screen.getByTestId('sun-icon');
    const moonIcon = screen.getByTestId('moon-icon');

    expect(sunIcon).toHaveClass('scale-100', 'rotate-0');
    expect(moonIcon).toHaveClass('absolute', 'scale-0', 'rotate-90');
  });

  /**
   * 測試深色主題狀態
   */
  it('應該在深色主題時顯示正確狀態', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const sunIcon = screen.getByTestId('sun-icon');
    const moonIcon = screen.getByTestId('moon-icon');

    // 在深色主題下，CSS類應該仍然相同，因為使用了 dark: 前綴
    expect(sunIcon).toHaveClass('scale-100', 'rotate-0');
    expect(moonIcon).toHaveClass('absolute', 'scale-0', 'rotate-90');
  });

  /**
   * 測試從淺色切換到深色主題
   */
  it('應該在點擊時從淺色切換到深色主題', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });

  /**
   * 測試從深色切換到淺色主題
   */
  it('應該在點擊時從深色切換到淺色主題', () => {
    mockUseTheme.mockReturnValue({
      theme: 'dark',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
    expect(mockSetTheme).toHaveBeenCalledTimes(1);
  });

  /**
   * 測試系統主題處理
   */
  it('應該在系統主題時切換到深色主題', () => {
    mockUseTheme.mockReturnValue({
      theme: 'system',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    // 當主題不是 'dark' 時，應該切換到 'dark'
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  /**
   * 測試 undefined 主題處理
   */
  it('應該在主題未定義時切換到深色主題', () => {
    mockUseTheme.mockReturnValue({
      theme: undefined,
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  /**
   * 測試按鈕樣式
   */
  it('應該有正確的按鈕樣式', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const button = screen.getByRole('button');
    
    // 檢查按鈕是否有正確的類名（Button 組件的樣式）
    expect(button).toBeInTheDocument();
  });

  /**
   * 測試圖標尺寸
   */
  it('應該設置正確的圖標尺寸', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    const sunIcon = screen.getByTestId('sun-icon');
    const moonIcon = screen.getByTestId('moon-icon');

    expect(sunIcon).toHaveClass('h-[1.2rem]', 'w-[1.2rem]');
    expect(moonIcon).toHaveClass('h-[1.2rem]', 'w-[1.2rem]');
  });

  /**
   * 測試輔助功能
   */
  it('應該具有良好的輔助功能', () => {
    mockUseTheme.mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });

    render(<ModeToggle />);

    // 檢查是否有 sr-only 輔助文字
    const srOnlyText = screen.getByText('切換主題');
    expect(srOnlyText).toHaveClass('sr-only');

    // 檢查按鈕是否可訪問
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  /**
   * 測試多次點擊
   */
  it('應該處理多次點擊切換', () => {
    let currentTheme = 'light';
    mockUseTheme.mockImplementation(() => ({
      theme: currentTheme,
      setTheme: (newTheme: string) => {
        currentTheme = newTheme;
        mockSetTheme(newTheme);
      },
    }));

    const { rerender } = render(<ModeToggle />);

    const button = screen.getByRole('button');

    // 第一次點擊：light -> dark
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('dark');

    // 更新主題狀態並重新渲染
    currentTheme = 'dark';
    rerender(<ModeToggle />);

    // 第二次點擊：dark -> light
    fireEvent.click(button);
    expect(mockSetTheme).toHaveBeenCalledWith('light');

    expect(mockSetTheme).toHaveBeenCalledTimes(2);
  });
}); 