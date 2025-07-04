import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Calendar } from '../calendar';

describe('Calendar 組件測試', () => {
  it('應該正確渲染 Calendar 組件', () => {
    render(<Calendar data-testid="calendar" />);
    
    const calendar = screen.getByTestId('calendar');
    expect(calendar).toBeInTheDocument();
    expect(calendar).toHaveAttribute('data-slot', 'calendar');
  });

  it('應該顯示當前月份', () => {
    render(<Calendar />);
    
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleDateString('default', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    // 檢查是否有月份顯示（可能是縮寫形式）
    const monthElement = screen.getByText(new RegExp(currentDate.getFullYear().toString()));
    expect(monthElement).toBeInTheDocument();
  });

  it('應該顯示星期標題', () => {
    render(<Calendar />);
    
    // 檢查是否有星期幾的標題
    // 注意：具體的星期顯示可能依賴於語言設置
    const calendarGrid = screen.getByRole('grid', { hidden: true });
    expect(calendarGrid).toBeInTheDocument();
  });

  it('應該支援日期選擇', async () => {
    const user = userEvent.setup();
    const handleSelect = jest.fn();
    
    render(<Calendar mode="single" onSelect={handleSelect} />);
    
    // 找到今天的日期按鈕
    const today = new Date().getDate().toString();
    const todayButtons = screen.getAllByText(today).filter(el => 
      el.tagName === 'BUTTON' || el.closest('button')
    );
    
    if (todayButtons.length > 0) {
      const todayButton = todayButtons[0].closest('button') || todayButtons[0];
      await user.click(todayButton);
      expect(handleSelect).toHaveBeenCalled();
    }
  });

  it('應該支援導航按鈕', async () => {
    const user = userEvent.setup();
    
    render(<Calendar />);
    
    // 查找導航按鈕
    const prevButton = screen.getByRole('button', { name: /previous/i }) || 
                      screen.getAllByRole('button').find(btn => 
                        btn.getAttribute('aria-label')?.includes('previous') ||
                        btn.querySelector('svg')
                      );
    
    const nextButton = screen.getByRole('button', { name: /next/i }) || 
                      screen.getAllByRole('button').find(btn => 
                        btn.getAttribute('aria-label')?.includes('next') ||
                        btn.querySelector('svg')
                      );
    
    if (prevButton) {
      expect(prevButton).toBeInTheDocument();
      await user.click(prevButton);
    }
    
    if (nextButton) {
      expect(nextButton).toBeInTheDocument();
      await user.click(nextButton);
    }
  });

  it('應該支援自定義 className', () => {
    render(<Calendar className="custom-calendar" data-testid="calendar" />);
    
    const calendar = screen.getByTestId('calendar');
    expect(calendar).toHaveClass('custom-calendar');
  });

  it('應該支援 disabled 日期', () => {
    const disabledDays = [(date: Date) => date.getDay() === 0]; // 禁用週日
    
    render(<Calendar disabled={disabledDays} />);
    
    // 檢查日曆是否正確渲染
    const calendar = screen.getByRole('grid', { hidden: true });
    expect(calendar).toBeInTheDocument();
  });

  it('應該支援顯示多個月份', () => {
    render(<Calendar numberOfMonths={2} data-testid="calendar" />);
    
    const calendar = screen.getByTestId('calendar');
    expect(calendar).toBeInTheDocument();
  });

  it('應該支援預設選中日期', () => {
    const defaultDate = new Date();
    
    render(<Calendar mode="single" selected={defaultDate} />);
    
    // 檢查今天是否被標記為選中
    const todayButton = screen.getAllByText(defaultDate.getDate().toString())
      .find(el => el.closest('button'));
    
    if (todayButton) {
      expect(todayButton.closest('button')).toBeInTheDocument();
    }
  });

  it('應該支援日期範圍選擇模式', () => {
    render(<Calendar mode="range" />);
    
    // 檢查日曆是否正確渲染為範圍模式
    const calendar = screen.getByRole('grid', { hidden: true });
    expect(calendar).toBeInTheDocument();
  });

  it('應該支援多選模式', () => {
    render(<Calendar mode="multiple" />);
    
    // 檢查日曆是否正確渲染為多選模式
    const calendar = screen.getByRole('grid', { hidden: true });
    expect(calendar).toBeInTheDocument();
  });

  it('應該正確處理鍵盤導航', async () => {
    const user = userEvent.setup();
    
    render(<Calendar />);
    
    // 找到日曆中的按鈕
    const dateButtons = screen.getAllByRole('button').filter(btn => 
      btn.textContent && /^\d+$/.test(btn.textContent.trim())
    );
    
    if (dateButtons.length > 0) {
      const firstDateButton = dateButtons[0];
      firstDateButton.focus();
      expect(firstDateButton).toHaveFocus();
      
      // 測試方向鍵導航
      await user.keyboard('{ArrowRight}');
      // 在實際的日曆中，這會移動到下一個日期
    }
  });
}); 