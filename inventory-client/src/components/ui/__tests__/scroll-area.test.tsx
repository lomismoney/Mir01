import React from 'react';
import { render, screen } from '@testing-library/react';
import { ScrollArea } from '../scroll-area';

describe('ScrollArea 組件測試', () => {
  it('應該正確渲染 ScrollArea 組件', () => {
    render(
      <ScrollArea data-testid="scroll-area" className="h-72 w-48">
        <div className="p-4">
          <h4 className="mb-4 text-sm font-medium">標籤</h4>
          <div className="space-y-2">
            <div>項目 1</div>
            <div>項目 2</div>
            <div>項目 3</div>
          </div>
        </div>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(screen.getByText('標籤')).toBeInTheDocument();
    expect(screen.getByText('項目 1')).toBeInTheDocument();
  });

  it('應該支援長內容滾動', () => {
    const longContent = Array.from({ length: 50 }, (_, i) => `項目 ${i + 1}`);
    
    render(
      <ScrollArea className="h-48 w-48" data-testid="scroll-area">
        <div className="p-4">
          {longContent.map((item, index) => (
            <div key={index} className="py-1">
              {item}
            </div>
          ))}
        </div>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(screen.getByText('項目 1')).toBeInTheDocument();
    expect(screen.getByText('項目 50')).toBeInTheDocument();
  });

  it('應該支援自定義尺寸', () => {
    render(
      <ScrollArea className="h-64 w-64" data-testid="scroll-area">
        <div className="space-y-2 p-4">
          <div>內容 1</div>
          <div>內容 2</div>
        </div>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toHaveClass('h-64', 'w-64');
  });

  it('應該支援自定義 className', () => {
    render(
      <ScrollArea className="custom-scroll" data-testid="scroll-area">
        <div>測試內容</div>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toHaveClass('custom-scroll');
  });

  it('應該正確處理空內容', () => {
    render(
      <ScrollArea className="h-32 w-32" data-testid="scroll-area">
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
  });

  it('應該支援複雜內容結構', () => {
    render(
      <ScrollArea className="h-72 w-80" data-testid="scroll-area">
        <div className="p-4">
          <h3 className="font-semibold mb-4">產品清單</h3>
          <div className="space-y-4">
            <div className="border rounded p-3">
              <h4 className="font-medium">產品 A</h4>
              <p className="text-sm text-gray-600">產品 A 的詳細描述</p>
              <div className="mt-2 flex gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  標籤1
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  標籤2
                </span>
              </div>
            </div>
            <div className="border rounded p-3">
              <h4 className="font-medium">產品 B</h4>
              <p className="text-sm text-gray-600">產品 B 的詳細描述</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(screen.getByText('產品清單')).toBeInTheDocument();
    expect(screen.getByText('產品 A')).toBeInTheDocument();
    expect(screen.getByText('產品 B')).toBeInTheDocument();
    expect(screen.getByText('標籤1')).toBeInTheDocument();
  });

  it('應該支援水平滾動', () => {
    render(
      <ScrollArea className="w-72 whitespace-nowrap" data-testid="scroll-area">
        <div className="flex w-max space-x-4 p-4">
          <div className="shrink-0 w-32 h-32 bg-gray-100 rounded">項目 1</div>
          <div className="shrink-0 w-32 h-32 bg-gray-200 rounded">項目 2</div>
          <div className="shrink-0 w-32 h-32 bg-gray-300 rounded">項目 3</div>
          <div className="shrink-0 w-32 h-32 bg-gray-400 rounded">項目 4</div>
          <div className="shrink-0 w-32 h-32 bg-gray-500 rounded">項目 5</div>
        </div>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(screen.getByText('項目 1')).toBeInTheDocument();
    expect(screen.getByText('項目 5')).toBeInTheDocument();
  });

  it('應該支援表格內容滾動', () => {
    render(
      <ScrollArea className="h-48" data-testid="scroll-area">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">姓名</th>
              <th className="text-left p-2">年齡</th>
              <th className="text-left p-2">職業</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 20 }, (_, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">用戶 {i + 1}</td>
                <td className="p-2">{20 + i}</td>
                <td className="p-2">開發者</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('用戶 1')).toBeInTheDocument();
    expect(screen.getByText('用戶 20')).toBeInTheDocument();
  });

  it('應該支援文字內容滾動', () => {
    const longText = `
      這是一段很長的文字內容，用來測試 ScrollArea 組件是否能正確處理文字滾動。
      當內容超出容器高度時，應該出現滾動條讓用戶可以查看所有內容。
      ScrollArea 組件基於 Radix UI 構建，提供了優秀的可訪問性和用戶體驗。
      它支持鍵盤導航，並且在不同瀏覽器中表現一致。
      我們可以自定義滾動條的外觀和行為，以符合設計需求。
      這個組件特別適合用於顯示長列表、文章內容或者其他需要滾動的界面元素。
    `;
    
    render(
      <ScrollArea className="h-32 w-64" data-testid="scroll-area">
        <div className="p-4 text-sm leading-relaxed">
          {longText}
        </div>
      </ScrollArea>
    );
    
    const scrollArea = screen.getByTestId('scroll-area');
    expect(scrollArea).toBeInTheDocument();
    expect(screen.getByText(/這是一段很長的文字內容/)).toBeInTheDocument();
  });
}); 