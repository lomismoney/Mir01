import { renderHook, act } from '@testing-library/react';
import { useOrderSubmitProgress } from '../useOrderSubmitProgress';

describe('useOrderSubmitProgress', () => {
  it('should initialize with default steps in pending state', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    expect(result.current.steps).toHaveLength(5);
    expect(result.current.steps.every(step => step.status === 'pending')).toBe(true);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.isActive).toBe(false);
  });

  it('should start progress tracking', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
    });

    expect(result.current.isActive).toBe(true);
  });

  it('should update step status', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
      result.current.updateStep('validate', 'processing');
    });

    const validateStep = result.current.steps.find(s => s.id === 'validate');
    expect(validateStep?.status).toBe('processing');
    expect(result.current.currentStep).toBe('validate');
  });

  it('should handle step completion', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
      result.current.updateStep('validate', 'processing');
      result.current.updateStep('validate', 'completed');
    });

    const validateStep = result.current.steps.find(s => s.id === 'validate');
    expect(validateStep?.status).toBe('completed');
  });

  it('should skip a step', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
      result.current.skipStep('create-transfers');
    });

    const transferStep = result.current.steps.find(s => s.id === 'create-transfers');
    expect(transferStep?.status).toBe('completed');
  });

  it('should handle errors', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
      result.current.updateStep('check-stock', 'processing');
      result.current.updateStep('check-stock', 'error', 'Network error');
    });

    const stockStep = result.current.steps.find(s => s.id === 'check-stock');
    expect(stockStep?.status).toBe('error');
    expect(stockStep?.error).toBe('Network error');
  });

  it('should complete all steps', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
      result.current.complete();
    });

    expect(result.current.steps.every(step => step.status === 'completed')).toBe(true);
    expect(result.current.isActive).toBe(false);
  });

  it('should reset progress', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
      result.current.updateStep('validate', 'completed');
      result.current.updateStep('check-stock', 'processing');
      result.current.reset();
    });

    expect(result.current.steps.every(step => step.status === 'pending')).toBe(true);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.isActive).toBe(false);
  });

  it('should fail progress with error', () => {
    const { result } = renderHook(() => useOrderSubmitProgress());

    act(() => {
      result.current.start();
      result.current.updateStep('create-order', 'processing');
      result.current.fail('Order creation failed');
    });

    const orderStep = result.current.steps.find(s => s.id === 'create-order');
    expect(orderStep?.status).toBe('error');
    expect(orderStep?.error).toBe('Order creation failed');
    expect(result.current.isActive).toBe(false);
  });
});