import { useState, useCallback } from 'react';

export interface OrderSubmitStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const initialSteps: OrderSubmitStep[] = [
  { id: 'validate', label: '驗證訂單資料', status: 'pending' },
  { id: 'check-stock', label: '檢查庫存狀態', status: 'pending' },
  { id: 'create-order', label: '建立訂單', status: 'pending' },
  { id: 'create-transfers', label: '建立調貨單', status: 'pending' },
  { id: 'finalize', label: '完成處理', status: 'pending' },
];

/**
 * 訂單提交進度管理 Hook
 * 提供細緻的進度追蹤和錯誤處理
 */
export function useOrderSubmitProgress() {
  const [steps, setSteps] = useState<OrderSubmitStep[]>(initialSteps);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);

  const reset = useCallback(() => {
    setSteps(initialSteps.map(step => ({ ...step })));
    setCurrentStep(null);
    setIsActive(false);
  }, []);

  const start = useCallback(() => {
    reset();
    setIsActive(true);
  }, [reset]);

  const updateStep = useCallback((stepId: string, status: OrderSubmitStep['status'], error?: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId
          ? { ...step, status, error }
          : step
      )
    );
    
    if (status === 'processing') {
      setCurrentStep(stepId);
    }
  }, []);

  const skipStep = useCallback((stepId: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) =>
        step.id === stepId
          ? { ...step, status: 'completed' }
          : step
      )
    );
  }, []);

  const complete = useCallback(() => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => ({
        ...step,
        status: step.status === 'pending' ? 'completed' : step.status
      }))
    );
    setCurrentStep(null);
    setIsActive(false);
  }, []);

  const fail = useCallback((error: string) => {
    setSteps((prevSteps) => {
      // 找到當前正在處理的步驟
      const processingStep = prevSteps.find(step => step.status === 'processing');
      if (processingStep) {
        return prevSteps.map((step) =>
          step.id === processingStep.id
            ? { ...step, status: 'error' as const, error }
            : step
        );
      }
      return prevSteps;
    });
    setCurrentStep(null);
    setIsActive(false);
  }, []);

  return {
    steps,
    currentStep,
    isActive,
    start,
    updateStep,
    skipStep,
    complete,
    fail,
    reset
  };
}