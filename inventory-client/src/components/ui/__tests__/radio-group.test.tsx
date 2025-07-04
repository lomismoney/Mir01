import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup, RadioGroupItem } from '../radio-group';
import { Label } from '../label';

describe('RadioGroup 組件測試', () => {
  it('應該正確渲染 RadioGroup', () => {
    render(
      <RadioGroup data-testid="radio-group">
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="option1" />
          <Label htmlFor="option1">選項 1</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option2" id="option2" />
          <Label htmlFor="option2">選項 2</Label>
        </div>
      </RadioGroup>
    );
    
    const radioGroup = screen.getByTestId('radio-group');
    expect(radioGroup).toBeInTheDocument();
    expect(radioGroup).toHaveRole('radiogroup');
  });

  it('應該渲染 RadioGroupItem', () => {
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" data-testid="radio1" />
        <RadioGroupItem value="option2" data-testid="radio2" />
      </RadioGroup>
    );
    
    const radio1 = screen.getByTestId('radio1');
    const radio2 = screen.getByTestId('radio2');
    
    expect(radio1).toBeInTheDocument();
    expect(radio1).toHaveRole('radio');
    expect(radio1).toHaveAttribute('value', 'option1');
    
    expect(radio2).toBeInTheDocument();
    expect(radio2).toHaveRole('radio');
    expect(radio2).toHaveAttribute('value', 'option2');
  });

  it('應該支援點擊選擇', async () => {
    const user = userEvent.setup();
    const handleValueChange = jest.fn();
    
    render(
      <RadioGroup onValueChange={handleValueChange}>
        <RadioGroupItem value="option1" data-testid="radio1" />
        <RadioGroupItem value="option2" data-testid="radio2" />
      </RadioGroup>
    );
    
    const radio1 = screen.getByTestId('radio1');
    const radio2 = screen.getByTestId('radio2');
    
    await user.click(radio1);
    expect(handleValueChange).toHaveBeenCalledWith('option1');
    
    await user.click(radio2);
    expect(handleValueChange).toHaveBeenCalledWith('option2');
  });

  it('應該支援預設值', () => {
    render(
      <RadioGroup defaultValue="option2">
        <RadioGroupItem value="option1" data-testid="radio1" />
        <RadioGroupItem value="option2" data-testid="radio2" />
      </RadioGroup>
    );
    
    const radio1 = screen.getByTestId('radio1');
    const radio2 = screen.getByTestId('radio2');
    
    expect(radio1).not.toBeChecked();
    expect(radio2).toBeChecked();
  });

  it('應該支援受控值', () => {
    const { rerender } = render(
      <RadioGroup value="option1">
        <RadioGroupItem value="option1" data-testid="radio1" />
        <RadioGroupItem value="option2" data-testid="radio2" />
      </RadioGroup>
    );
    
    let radio1 = screen.getByTestId('radio1');
    let radio2 = screen.getByTestId('radio2');
    
    expect(radio1).toBeChecked();
    expect(radio2).not.toBeChecked();
    
    rerender(
      <RadioGroup value="option2">
        <RadioGroupItem value="option1" data-testid="radio1" />
        <RadioGroupItem value="option2" data-testid="radio2" />
      </RadioGroup>
    );
    
    radio1 = screen.getByTestId('radio1');
    radio2 = screen.getByTestId('radio2');
    
    expect(radio1).not.toBeChecked();
    expect(radio2).toBeChecked();
  });

  it('應該支援 disabled 狀態', () => {
    render(
      <RadioGroup disabled>
        <RadioGroupItem value="option1" data-testid="radio1" />
        <RadioGroupItem value="option2" data-testid="radio2" />
      </RadioGroup>
    );
    
    const radio1 = screen.getByTestId('radio1');
    const radio2 = screen.getByTestId('radio2');
    
    expect(radio1).toBeDisabled();
    expect(radio2).toBeDisabled();
  });

  it('應該支援鍵盤導航', async () => {
    const user = userEvent.setup();
    
    render(
      <RadioGroup>
        <RadioGroupItem value="option1" data-testid="radio1" />
        <RadioGroupItem value="option2" data-testid="radio2" />
        <RadioGroupItem value="option3" data-testid="radio3" />
      </RadioGroup>
    );
    
    const radio1 = screen.getByTestId('radio1');
    
    // 聚焦第一個選項
    radio1.focus();
    expect(radio1).toHaveFocus();
    
    // 使用方向鍵導航
    await user.keyboard('{ArrowDown}');
    const radio2 = screen.getByTestId('radio2');
    expect(radio2).toHaveFocus();
  });

  it('應該支援自定義 className', () => {
    render(
      <RadioGroup className="custom-radio-group" data-testid="radio-group">
        <RadioGroupItem value="option1" className="custom-radio-item" data-testid="radio1" />
      </RadioGroup>
    );
    
    const radioGroup = screen.getByTestId('radio-group');
    const radioItem = screen.getByTestId('radio1');
    
    expect(radioGroup).toHaveClass('custom-radio-group');
    expect(radioItem).toHaveClass('custom-radio-item');
  });

  it('應該與 Label 正確配合使用', async () => {
    const user = userEvent.setup();
    
    render(
      <RadioGroup>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="option1" id="r1" data-testid="radio1" />
          <Label htmlFor="r1" data-testid="label1">選項 1</Label>
        </div>
      </RadioGroup>
    );
    
    const radio1 = screen.getByTestId('radio1');
    const label1 = screen.getByTestId('label1');
    
    // 點擊標籤應該選中對應的 radio
    await user.click(label1);
    expect(radio1).toBeChecked();
  });
}); 