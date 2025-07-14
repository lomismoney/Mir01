"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useProductWizard, WizardFormData } from "@/hooks/useProductWizard";

// 導入步驟組件
import {
  Step1_BasicInfoWithImage,
  Step2_DefineSpecs,
  Step3_ConfigureVariants,
  Step4_Review,
  EditProductFormSkeleton,
} from "./wizard-steps";

// 導入組件
import { WizardSidebar } from "./components/WizardSidebar";
import { WizardNavigation } from "./components/WizardNavigation";

// 重新導出 WizardFormData 以保持向後兼容
export type { WizardFormData };

interface CreateProductWizardProps {
  productId?: string | number;
}

export function CreateProductWizard({ productId }: CreateProductWizardProps = {}) {
  // 使用自定義 hook 獲取所有業務邏輯
  const {
    // 狀態
    step,
    isSubmitting,
    formData,
    progressPercentage,
    isEditMode,
    
    // 資料
    attributesData,
    isLoadingProduct,
    productError,
    
    // 操作函數
    setStep,
    setFormData,
    handleNext,
    handlePrevious,
    handleSubmit,
    
    // 驗證函數
    canProceedToNext,
    validateStep,
  } = useProductWizard(productId);

  // 錯誤處理
  if (productError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">載入失敗</h1>
            <p className="text-muted-foreground mb-4">
              無法載入商品資料，請稍後再試。
            </p>
            <Button onClick={() => window.location.reload()}>
              重新載入
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 載入中狀態
  if (isEditMode && isLoadingProduct) {
    return <EditProductFormSkeleton />;
  }

  // 創建適當的 updateFormData 函數
  const updateFormData = <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data
      }
    }));
  };

  // 渲染當前步驟的組件
  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      setFormData,
      updateFormData,
      attributesData,
      isEditMode,
    };

    switch (step) {
      case 1:
        return <Step1_BasicInfoWithImage {...stepProps} />;
      case 2:
        return <Step2_DefineSpecs {...stepProps} />;
      case 3:
        return <Step3_ConfigureVariants {...stepProps} />;
      case 4:
        return <Step4_Review {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20">
      <div className="container mx-auto max-w-7xl px-4 py-6">
        {/* 頁面標題 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? '編輯商品' : '創建新商品'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isEditMode
              ? '修改商品資訊、規格與變體配置'
              : '逐步引導您完成商品的創建流程，包含基本資訊、規格定義與變體配置'
            }
          </p>
        </div>

        {/* 主要內容區域 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 左側導航 */}
          <div className="lg:col-span-1">
            <WizardSidebar 
              currentStep={step} 
              progressPercentage={progressPercentage}
              isEditMode={isEditMode}
            />
          </div>

          {/* 右側內容 */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                {/* 步驟內容 */}
                {renderCurrentStep()}

                {/* 導航按鈕 */}
                <WizardNavigation
                  currentStep={step}
                  totalSteps={4}
                  canGoNext={canProceedToNext()}
                  isSubmitting={isSubmitting}
                  isEditMode={isEditMode}
                  onPrevious={handlePrevious}
                  onNext={handleNext}
                  onSubmit={handleSubmit}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}