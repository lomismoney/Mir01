import React from 'react';
import { render, screen } from '@testing-library/react';
import { OrderSubmitProgressDialog } from '../OrderSubmitProgressDialog';
import { OrderSubmitStep } from '@/hooks/useOrderSubmitProgress';

describe('OrderSubmitProgressDialog', () => {
  const mockSteps: OrderSubmitStep[] = [
    { id: 'validate', label: '驗證訂單資料', status: 'completed' },
    { id: 'check-stock', label: '檢查庫存狀態', status: 'processing' },
    { id: 'create-order', label: '建立訂單', status: 'pending' },
    { id: 'create-transfers', label: '建立調貨單', status: 'pending' },
    { id: 'finalize', label: '完成處理', status: 'pending' },
  ];

  it('should not render when closed', () => {
    const { container } = render(
      <OrderSubmitProgressDialog
        open={false}
        steps={mockSteps}
        currentStep="validate"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render dialog when open', () => {
    render(
      <OrderSubmitProgressDialog
        open={true}
        steps={mockSteps}
        currentStep="check-stock"
      />
    );

    expect(screen.getByText('正在處理訂單...')).toBeInTheDocument();
  });

  it('should display all steps', () => {
    render(
      <OrderSubmitProgressDialog
        open={true}
        steps={mockSteps}
        currentStep="check-stock"
      />
    );

    mockSteps.forEach(step => {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    });
  });

  it('should show progress bar', () => {
    render(
      <OrderSubmitProgressDialog
        open={true}
        steps={mockSteps}
        currentStep="check-stock"
      />
    );

    // Progress bar should exist
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    
    // Progress indicator should have correct transform
    const progressIndicator = progressBar.querySelector('[data-slot="progress-indicator"]');
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-80%)' }); // 20% progress = -80% transform
  });

  it('should display current step message', () => {
    render(
      <OrderSubmitProgressDialog
        open={true}
        steps={mockSteps}
        currentStep="check-stock"
      />
    );

    expect(screen.getByText('檢查庫存狀態...')).toBeInTheDocument();
  });

  it('should show error step with error message', () => {
    const stepsWithError: OrderSubmitStep[] = [
      ...mockSteps.slice(0, 2),
      { id: 'create-order', label: '建立訂單', status: 'error', error: '網路連線失敗' },
      ...mockSteps.slice(3),
    ];

    render(
      <OrderSubmitProgressDialog
        open={true}
        steps={stepsWithError}
        currentStep={null}
      />
    );

    expect(screen.getByText('網路連線失敗')).toBeInTheDocument();
  });

  it('should calculate correct progress percentage', () => {
    const allCompletedSteps: OrderSubmitStep[] = mockSteps.map(step => ({
      ...step,
      status: 'completed'
    }));

    render(
      <OrderSubmitProgressDialog
        open={true}
        steps={allCompletedSteps}
        currentStep={null}
      />
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    
    // All completed = 100% progress = 0% transform
    const progressIndicator = progressBar.querySelector('[data-slot="progress-indicator"]');
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-0%)' });
  });

  it('should apply correct styles to pending steps', () => {
    render(
      <OrderSubmitProgressDialog
        open={true}
        steps={mockSteps}
        currentStep="check-stock"
      />
    );

    const pendingStep = screen.getByText('建立訂單').closest('div');
    expect(pendingStep?.parentElement).toHaveClass('opacity-50');
  });
});