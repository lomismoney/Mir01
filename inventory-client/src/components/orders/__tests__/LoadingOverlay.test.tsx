import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingOverlay } from '../LoadingOverlay';

describe('LoadingOverlay', () => {
  it('should not render when isLoading is false', () => {
    const { container } = render(
      <LoadingOverlay isLoading={false} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when isLoading is true', () => {
    render(
      <LoadingOverlay isLoading={true} />
    );

    // Check for the overlay container by class
    const overlay = document.querySelector('.fixed.inset-0.z-50');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('should display loading spinner', () => {
    render(
      <LoadingOverlay isLoading={true} />
    );

    // Look for the spinner by its classes
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('h-8', 'w-8', 'animate-spin');
  });

  it('should display message when provided', () => {
    render(
      <LoadingOverlay 
        isLoading={true} 
        message="處理中，請稍候..."
      />
    );

    expect(screen.getByText('處理中，請稍候...')).toBeInTheDocument();
  });

  it('should display submessage when provided', () => {
    render(
      <LoadingOverlay 
        isLoading={true} 
        submessage="這可能需要幾秒鐘"
      />
    );

    expect(screen.getByText('這可能需要幾秒鐘')).toBeInTheDocument();
  });

  it('should display both message and submessage', () => {
    render(
      <LoadingOverlay 
        isLoading={true} 
        message="正在建立訂單"
        submessage="請勿關閉視窗"
      />
    );

    expect(screen.getByText('正在建立訂單')).toBeInTheDocument();
    expect(screen.getByText('請勿關閉視窗')).toBeInTheDocument();
  });

  it('should have proper styling classes', () => {
    render(
      <LoadingOverlay 
        isLoading={true} 
        message="載入中"
      />
    );

    // Check overlay backdrop
    const overlay = document.querySelector('.fixed.inset-0.z-50');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('bg-background/80', 'backdrop-blur-sm');

    // Check content card
    const card = document.querySelector('.bg-card');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('p-6', 'rounded-lg', 'shadow-lg', 'text-center');
  });

  it('should apply correct text styles', () => {
    render(
      <LoadingOverlay 
        isLoading={true} 
        message="主要訊息"
        submessage="次要訊息"
      />
    );

    const message = screen.getByText('主要訊息');
    expect(message).toHaveClass('text-lg', 'font-medium', 'mb-2');

    const submessage = screen.getByText('次要訊息');
    expect(submessage).toHaveClass('text-sm', 'text-muted-foreground');
  });
});