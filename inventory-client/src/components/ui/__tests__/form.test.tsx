import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../form';
import { Input } from '../input';
import { Button } from '../button';

// 測試用表單組件
const TestForm = ({ onSubmit = jest.fn() }) => {
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel data-testid="email-label">電子郵件</FormLabel>
              <FormControl>
                <Input {...field} type="email" data-testid="email-input" />
              </FormControl>
              <FormDescription data-testid="email-description">
                請輸入您的電子郵件地址
              </FormDescription>
              <FormMessage data-testid="email-message" />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel data-testid="password-label">密碼</FormLabel>
              <FormControl>
                <Input {...field} type="password" data-testid="password-input" />
              </FormControl>
              <FormMessage data-testid="password-message" />
            </FormItem>
          )}
        />
        
        <Button type="submit" data-testid="submit-button">
          登入
        </Button>
      </form>
    </Form>
  );
};

describe('Form 組件測試', () => {
  it('應該正確渲染表單組件', () => {
    render(<TestForm />);
    
    expect(screen.getByTestId('email-label')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-label')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
  });

  it('應該正確顯示標籤文字', () => {
    render(<TestForm />);
    
    expect(screen.getByTestId('email-label')).toHaveTextContent('電子郵件');
    expect(screen.getByTestId('password-label')).toHaveTextContent('密碼');
  });

  it('應該正確顯示描述文字', () => {
    render(<TestForm />);
    
    expect(screen.getByTestId('email-description')).toHaveTextContent(
      '請輸入您的電子郵件地址'
    );
  });

  it('應該支援用戶輸入', async () => {
    const user = userEvent.setup();
    
    render(<TestForm />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    
    expect(emailInput).toHaveValue('test@example.com');
    expect(passwordInput).toHaveValue('password123');
  });

  it('應該支援表單提交', async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    
    render(<TestForm onSubmit={handleSubmit} />);
    
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('submit-button');
    
    await user.type(emailInput, 'user@test.com');
    await user.type(passwordInput, 'secret123');
    await user.click(submitButton);
    
    expect(handleSubmit).toHaveBeenCalledWith(
      {
        email: 'user@test.com',
        password: 'secret123',
      },
      expect.any(Object) // React event object
    );
  });

  it('應該正確處理驗證錯誤', async () => {
    const user = userEvent.setup();
    
    const FormWithValidation = () => {
      const form = useForm({
        defaultValues: {
          email: '',
        },
      });

      return (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(() => {})}>
            <FormField
              control={form.control}
              name="email"
              rules={{
                required: '電子郵件為必填項目',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: '請輸入有效的電子郵件格式',
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>電子郵件</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="email-input" />
                  </FormControl>
                  <FormMessage data-testid="email-error" />
                </FormItem>
              )}
            />
            <Button type="submit" data-testid="submit">提交</Button>
          </form>
        </Form>
      );
    };

    render(<FormWithValidation />);
    
    const submitButton = screen.getByTestId('submit');
    
    // 未填寫就提交
    await user.click(submitButton);
    
    // 應該顯示錯誤訊息
    expect(screen.getByTestId('email-error')).toHaveTextContent(
      '電子郵件為必填項目'
    );
  });

  it('應該支援自定義 className', () => {
    const CustomForm = () => {
      const form = useForm();
      
      return (
        <Form {...form}>
          <FormField
            control={form.control}
            name="test"
            render={() => (
              <FormItem className="custom-item" data-testid="form-item">
                <FormLabel className="custom-label" data-testid="form-label">
                  測試標籤
                </FormLabel>
                <FormControl className="custom-control">
                  <Input data-testid="form-input" />
                </FormControl>
                <FormDescription className="custom-desc" data-testid="form-desc">
                  測試描述
                </FormDescription>
                <FormMessage className="custom-message" />
              </FormItem>
            )}
          />
        </Form>
      );
    };
    
    render(<CustomForm />);
    
    expect(screen.getByTestId('form-item')).toHaveClass('custom-item');
    expect(screen.getByTestId('form-label')).toHaveClass('custom-label');
    expect(screen.getByTestId('form-desc')).toHaveClass('custom-desc');
    // FormMessage 只在有錯誤時顯示，這個測試無法驗證自定義類別
  });

  it('應該支援多個表單欄位', async () => {
    const user = userEvent.setup();
    
    const MultiFieldForm = () => {
      const form = useForm({
        defaultValues: {
          firstName: '',
          lastName: '',
          age: '',
        },
      });

      return (
        <Form {...form}>
          <form className="space-y-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>名字</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="first-name" />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓氏</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="last-name" />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>年齡</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" data-testid="age" />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      );
    };
    
    render(<MultiFieldForm />);
    
    const firstNameInput = screen.getByTestId('first-name');
    const lastNameInput = screen.getByTestId('last-name');
    const ageInput = screen.getByTestId('age');
    
    await user.type(firstNameInput, '小明');
    await user.type(lastNameInput, '王');
    await user.type(ageInput, '25');
    
    expect(firstNameInput).toHaveValue('小明');
    expect(lastNameInput).toHaveValue('王');
    expect(ageInput).toHaveValue(25);
  });
}); 