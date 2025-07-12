import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  canGoNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isEditMode: boolean;
}

export function WizardNavigation({
  currentStep,
  totalSteps,
  isSubmitting,
  canGoNext,
  onPrevious,
  onNext,
  onSubmit,
  isEditMode,
}: WizardNavigationProps) {
  return (
    <div className="mt-6 flex items-center justify-between">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1 || isSubmitting}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        上一步
      </Button>

      <div className="text-sm text-muted-foreground">
        步驟 {currentStep} / {totalSteps}
      </div>

      {currentStep < totalSteps ? (
        <Button
          onClick={onNext}
          disabled={!canGoNext || isSubmitting}
        >
          下一步
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={!canGoNext || isSubmitting}
          variant="default"
        >
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isSubmitting
            ? isEditMode
              ? "更新中..."
              : "創建中..."
            : isEditMode
              ? "更新商品"
              : "創建商品"}
        </Button>
      )}
    </div>
  );
}