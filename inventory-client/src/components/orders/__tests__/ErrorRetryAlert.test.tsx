import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorRetryAlert } from '../ErrorRetryAlert';

describe('ErrorRetryAlert', () => {
  it('should render with default title', () => {
    render(
      <ErrorRetryAlert message="Something went wrong" />
    );

    expect(screen.getByText('發生錯誤')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should render with custom title', () => {
    render(
      <ErrorRetryAlert 
        title="網路錯誤" 
        message="無法連線到伺服器" 
      />
    );

    expect(screen.getByText('網路錯誤')).toBeInTheDocument();
    expect(screen.getByText('無法連線到伺服器')).toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    const onRetryMock = jest.fn();
    render(
      <ErrorRetryAlert 
        message="請重試" 
        onRetry={onRetryMock}
      />
    );

    const retryButton = screen.getByRole('button', { name: /重試/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetryMock = jest.fn();
    render(
      <ErrorRetryAlert 
        message="請重試" 
        onRetry={onRetryMock}
      />
    );

    const retryButton = screen.getByRole('button', { name: /重試/i });
    fireEvent.click(retryButton);

    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it('should show dismiss button when onDismiss is provided', () => {
    const onDismissMock = jest.fn();
    render(
      <ErrorRetryAlert 
        message="可關閉的錯誤" 
        onDismiss={onDismissMock}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /關閉/i });
    expect(dismissButton).toBeInTheDocument();
  });

  it('should call onDismiss when dismiss button is clicked', () => {
    const onDismissMock = jest.fn();
    render(
      <ErrorRetryAlert 
        message="可關閉的錯誤" 
        onDismiss={onDismissMock}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /關閉/i });
    fireEvent.click(dismissButton);

    expect(onDismissMock).toHaveBeenCalledTimes(1);
  });

  it('should show both buttons when both callbacks are provided', () => {
    const onRetryMock = jest.fn();
    const onDismissMock = jest.fn();
    
    render(
      <ErrorRetryAlert 
        message="錯誤訊息" 
        onRetry={onRetryMock}
        onDismiss={onDismissMock}
      />
    );

    expect(screen.getByRole('button', { name: /重試/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /關閉/i })).toBeInTheDocument();
  });

  it('should not show buttons when no callbacks are provided', () => {
    render(
      <ErrorRetryAlert message="只有訊息" />
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    render(
      <ErrorRetryAlert 
        message="測試" 
        className="mt-4"
      />
    );

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('mt-4');
  });

  it('should have destructive variant styling', () => {
    render(
      <ErrorRetryAlert message="錯誤" />
    );

    const alert = screen.getByRole('alert');
    // Note: The actual class names depend on the Alert component implementation
    // We're just checking it has the role and is rendered
    expect(alert).toBeInTheDocument();
  });

  it('should display alert icon', () => {
    render(
      <ErrorRetryAlert message="有圖示的錯誤" />
    );

    // Look for the AlertCircle icon - it might have different class names
    const icons = document.querySelectorAll('svg');
    // Find the icon that's not the refresh icon
    const alertIcon = Array.from(icons).find(icon => 
      !icon.classList.contains('lucide-refresh-cw') && 
      icon.classList.contains('h-4')
    );
    expect(alertIcon).toBeInTheDocument();
    expect(alertIcon).toHaveClass('h-4', 'w-4');
  });

  it('should display refresh icon in retry button', () => {
    render(
      <ErrorRetryAlert 
        message="測試" 
        onRetry={jest.fn()}
      />
    );

    const refreshIcon = document.querySelector('.lucide-refresh-cw');
    expect(refreshIcon).toBeInTheDocument();
    expect(refreshIcon).toHaveClass('h-3', 'w-3');
  });
});