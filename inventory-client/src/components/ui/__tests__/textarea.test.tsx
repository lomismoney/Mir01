import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Textarea } from '../textarea';

describe('Textarea 組件測試', () => {
  it('應該正確渲染 Textarea', () => {
    render(<Textarea placeholder="輸入文字" data-testid="textarea" />);
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toHaveAttribute('placeholder', '輸入文字');
  });

  it('應該支援受控輸入', async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    
    render(
      <Textarea 
        value="初始文字" 
        onChange={handleChange}
        data-testid="textarea" 
      />
    );
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveValue('初始文字');
    
    await user.clear(textarea);
    await user.type(textarea, '新的文字');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('應該支援非受控輸入', async () => {
    const user = userEvent.setup();
    
    render(<Textarea defaultValue="預設文字" data-testid="textarea" />);
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveValue('預設文字');
    
    await user.clear(textarea);
    await user.type(textarea, '使用者輸入的文字');
    
    expect(textarea).toHaveValue('使用者輸入的文字');
  });

  it('應該支援 disabled 狀態', () => {
    render(<Textarea disabled data-testid="textarea" />);
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toBeDisabled();
  });

  it('應該支援自定義 className', () => {
    render(
      <Textarea 
        className="custom-textarea-class" 
        data-testid="textarea" 
      />
    );
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('custom-textarea-class');
  });

  it('應該包含基本樣式類別', () => {
    render(<Textarea data-testid="textarea" />);
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveClass('flex', 'w-full', 'rounded-md');
    expect(textarea).toHaveClass('border', 'bg-transparent');
  });

  it('應該支援 ref', () => {
    const ref = React.createRef<HTMLTextAreaElement>();
    
    render(<Textarea ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });

  it('應該支援其他 textarea 屬性', () => {
    render(
      <Textarea 
        rows={5}
        cols={30}
        maxLength={100}
        data-testid="textarea"
      />
    );
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveAttribute('cols', '30');
    expect(textarea).toHaveAttribute('maxlength', '100');
  });

  it('應該是 textarea 元素', () => {
    render(<Textarea data-testid="textarea" />);
    
    const textarea = screen.getByTestId('textarea');
    expect(textarea.tagName).toBe('TEXTAREA');
  });
}); 