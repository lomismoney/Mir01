import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Loader2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrderSubmitStep } from '@/hooks/useOrderSubmitProgress';

interface OrderSubmitProgressDialogProps {
  open: boolean;
  steps: OrderSubmitStep[];
  currentStep: string | null;
}

/**
 * 訂單提交進度對話框
 * 顯示訂單提交的詳細進度
 */
export function OrderSubmitProgressDialog({
  open,
  steps,
  currentStep
}: OrderSubmitProgressDialogProps) {
  // 計算進度百分比
  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  const getStepIcon = (step: OrderSubmitStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>正在處理訂單...</DialogTitle>
          <DialogDescription>
            正在處理您的訂單，請稍候
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* 進度條 */}
          <Progress value={progress} className="h-2" />
          
          {/* 步驟列表 */}
          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center space-x-3 transition-opacity",
                  step.status === 'pending' && currentStep !== step.id && "opacity-50"
                )}
              >
                {getStepIcon(step)}
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    step.status === 'error' && "text-red-600"
                  )}>
                    {step.label}
                  </p>
                  {step.error && (
                    <p className="text-xs text-red-500 mt-1">{step.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* 當前步驟提示 */}
          {currentStep && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                {steps.find(s => s.id === currentStep)?.label}...
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}