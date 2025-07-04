/**
 * Input 組件測試
 * 
 * 測試輸入框組件的各種功能
 */
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../input'

describe('Input 組件', () => {
  it('應該正確渲染基本輸入框', () => {
    render(<Input placeholder="請輸入內容" />)
    
    const input = screen.getByPlaceholderText('請輸入內容')
    expect(input).toBeInTheDocument()
    // 某些瀏覽器可能不會設置預設 type 屬性
    expect(input.tagName.toLowerCase()).toBe('input')
  })

  it('應該支援不同的輸入類型', () => {
    const { rerender } = render(<Input type="email" />)
    
    let input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
    
    rerender(<Input type="password" />)
    input = screen.getByDisplayValue('') // password 沒有 textbox role
    expect(input).toHaveAttribute('type', 'password')
    
    rerender(<Input type="number" />)
    input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('應該支援值的輸入和變化', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    
    await user.type(input, 'Hello World')
    
    expect(input).toHaveValue('Hello World')
    expect(handleChange).toHaveBeenCalled()
  })

  it('應該支援受控組件', () => {
    const { rerender } = render(<Input value="初始值" readOnly />)
    
    const input = screen.getByDisplayValue('初始值')
    expect(input).toHaveValue('初始值')
    
    rerender(<Input value="更新值" readOnly />)
    expect(input).toHaveValue('更新值')
  })

  it('應該支援 placeholder', () => {
    render(<Input placeholder="這是提示文字" />)
    
    const input = screen.getByPlaceholderText('這是提示文字')
    expect(input).toHaveAttribute('placeholder', '這是提示文字')
  })

  it('應該支援 disabled 狀態', () => {
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:pointer-events-none')
    expect(input).toHaveClass('disabled:opacity-50')
  })

  it('應該支援自定義 className', () => {
    render(<Input className="custom-input-class" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input-class')
  })

  it('應該有正確的預設樣式類', () => {
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('flex')
    expect(input).toHaveClass('h-9')
    expect(input).toHaveClass('w-full')
    expect(input).toHaveClass('rounded-md')
    expect(input).toHaveClass('border')
    expect(input).toHaveClass('bg-transparent')
    expect(input).toHaveClass('px-3')
    expect(input).toHaveClass('py-1')
  })

  it('應該支援焦點狀態樣式', () => {
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('focus-visible:border-ring')
    expect(input).toHaveClass('focus-visible:ring-ring/50')
  })

  it('應該支援錯誤狀態樣式', () => {
    render(<Input aria-invalid />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('aria-invalid:border-destructive')
    expect(input).toHaveClass('aria-invalid:ring-destructive/20')
  })

  it('應該有正確的 data 屬性', () => {
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('data-slot', 'input')
  })

  it('應該支援其他 HTML 屬性', () => {
    render(
      <Input 
        id="test-input"
        name="testName"
        maxLength={100}
        minLength={5}
        pattern="[A-Za-z]+"
        required
        aria-label="測試輸入框"
        data-testid="test-input"
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('id', 'test-input')
    expect(input).toHaveAttribute('name', 'testName')
    expect(input).toHaveAttribute('maxlength', '100')
    expect(input).toHaveAttribute('minlength', '5')
    expect(input).toHaveAttribute('pattern', '[A-Za-z]+')
    expect(input).toHaveAttribute('required')
    expect(input).toHaveAttribute('aria-label', '測試輸入框')
    expect(input).toHaveAttribute('data-testid', 'test-input')
  })

  it('應該支援文件輸入', () => {
    render(<Input type="file" />)
    
    // 使用通用選擇器查找文件輸入框
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveClass('file:inline-flex')
    expect(input).toHaveClass('file:h-7')
    expect(input).toHaveClass('file:border-0')
  })

  it('應該支援焦點事件', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    
    const input = screen.getByRole('textbox')
    
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('應該支援鍵盤事件', () => {
    const handleKeyDown = jest.fn()
    const handleKeyUp = jest.fn()
    
    render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />)
    
    const input = screen.getByRole('textbox')
    
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    expect(handleKeyDown).toHaveBeenCalledTimes(1)
    
    fireEvent.keyUp(input, { key: 'Enter', code: 'Enter' })
    expect(handleKeyUp).toHaveBeenCalledTimes(1)
  })

  it('應該在禁用狀態下不觸發事件', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    
    render(<Input disabled onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    
    // 嘗試輸入文字
    await user.type(input, 'test')
    
    expect(handleChange).not.toHaveBeenCalled()
    expect(input).toHaveValue('')
  })
}) 