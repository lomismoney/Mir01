import React from 'react';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../theme-provider';

// 模擬 next-themes
jest.mock('next-themes', () => ({
  ThemeProvider: ({ 
    children, 
    attribute, 
    defaultTheme, 
    storageKey, 
    enableSystem, 
    disableTransitionOnChange,
    ...otherProps 
  }: any) => (
    <div 
      data-testid="theme-provider" 
      data-attribute={attribute}
      data-default-theme={defaultTheme}
      data-storage-key={storageKey}
      data-enable-system={enableSystem}
      data-disable-transition-on-change={disableTransitionOnChange}
      {...otherProps}
    >
      {children}
    </div>
  ),
}));

/**
 * ThemeProvider 組件測試套件
 * 
 * 測試覆蓋範圍：
 * 1. 基本渲染功能
 * 2. 屬性傳遞
 * 3. 子組件渲染
 */
describe('ThemeProvider', () => {
  /**
   * 測試基本渲染功能
   * 驗證組件能夠正常渲染而不出錯
   */
  it('應該正確渲染 ThemeProvider', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <div>測試內容</div>
      </ThemeProvider>
    );
    
    expect(getByTestId('theme-provider')).toBeInTheDocument();
  });

  /**
   * 測試子組件渲染
   * 驗證子組件是否正確顯示
   */
  it('應該正確渲染子組件', () => {
    const { getByText } = render(
      <ThemeProvider>
        <div>測試子組件</div>
        <span>另一個子組件</span>
      </ThemeProvider>
    );
    
    expect(getByText('測試子組件')).toBeInTheDocument();
    expect(getByText('另一個子組件')).toBeInTheDocument();
  });

  /**
   * 測試屬性傳遞
   * 驗證額外的屬性是否正確傳遞給 NextThemesProvider
   */
  it('應該正確傳遞額外的屬性', () => {
    const customAttribute = 'light';
    const customStorageKey = 'my-app-theme';
    
    const { getByTestId } = render(
      <ThemeProvider 
        attribute="class"
        defaultTheme={customAttribute}
        storageKey={customStorageKey}
      >
        <div>測試內容</div>
      </ThemeProvider>
    );
    
    const provider = getByTestId('theme-provider');
    expect(provider).toHaveAttribute('data-attribute', 'class');
    expect(provider).toHaveAttribute('data-default-theme', customAttribute);
    expect(provider).toHaveAttribute('data-storage-key', customStorageKey);
  });

  /**
   * 測試 data-oid 屬性
   * 驗證組件是否包含正確的追蹤屬性
   */
  it('應該包含正確的 data-oid 屬性', () => {
    const { getByTestId } = render(
      <ThemeProvider>
        <div>測試內容</div>
      </ThemeProvider>
    );
    
    const provider = getByTestId('theme-provider');
    expect(provider).toHaveAttribute('data-oid', '5.h8q40');
  });

  /**
   * 測試空子組件
   * 驗證當沒有子組件時的行為
   */
  it('應該能夠處理空子組件', () => {
    const { getByTestId } = render(
      <ThemeProvider />
    );
    
    expect(getByTestId('theme-provider')).toBeInTheDocument();
  });

  /**
   * 測試多個屬性組合
   * 驗證多個屬性同時傳遞時的行為
   */
  it('應該正確處理多個屬性', () => {
    const { getByTestId } = render(
      <ThemeProvider 
        attribute="class"
        defaultTheme="dark"
        enableSystem={true}
        disableTransitionOnChange={false}
      >
        <div>測試內容</div>
      </ThemeProvider>
    );
    
    const provider = getByTestId('theme-provider');
    expect(provider).toHaveAttribute('data-attribute', 'class');
    expect(provider).toHaveAttribute('data-default-theme', 'dark');
    expect(provider).toHaveAttribute('data-enable-system', 'true');
    expect(provider).toHaveAttribute('data-disable-transition-on-change', 'false');
  });
}); 