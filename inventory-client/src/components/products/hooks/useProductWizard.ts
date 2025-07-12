import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useProductDetail, useAttributes } from "@/hooks";

/**
 * 嚮導表單資料完整結構
 */
export interface WizardFormData {
  // 步驟1：基本資訊 + 圖片選擇
  basicInfo: {
    name: string;
    description: string;
    category_id: number | null;
  };

  // 圖片數據（本地暫存）
  imageData: {
    selectedFile: File | null;
    previewUrl: string | null;
    metadata?: {
      originalSize: number;
      dimensions: { width: number; height: number };
      format: string;
    };
  };

  // 步驟2：規格定義
  specifications: {
    isVariable: boolean;
    selectedAttributes: number[];
    attributeValues: Record<number, string[]>;
  };

  // 步驟3：變體配置
  variants: {
    items: Array<{
      key: string;
      id?: number; // 編輯模式時的變體 ID
      options: { attributeId: number; value: string }[];
      sku: string;
      price: string;
    }>;
  };

  // 元數據
  metadata: {
    currentStep: number;
    completedSteps: number[];
    lastSaved: Date | null;
    validationErrors: Record<string, string[]>;
  };
}

/**
 * 商品嚮導核心狀態管理 Hook
 */
export function useProductWizard(productId?: string | number) {
  const router = useRouter();
  
  // 編輯模式判斷
  const numericProductId = productId ? Number(productId) : undefined;
  const isEditMode = !!numericProductId && !isNaN(numericProductId) && numericProductId > 0;

  // API hooks
  const { data: attributesData } = useAttributes();
  const {
    data: productDetail,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProductDetail(isEditMode ? numericProductId : undefined);

  // 核心狀態
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 表單資料狀態
  const [formData, setFormData] = useState<WizardFormData>({
    basicInfo: {
      name: "",
      description: "",
      category_id: null,
    },
    imageData: {
      selectedFile: null,
      previewUrl: null,
    },
    specifications: {
      isVariable: false,
      selectedAttributes: [],
      attributeValues: {},
    },
    variants: {
      items: [],
    },
    metadata: {
      currentStep: 1,
      completedSteps: [],
      lastSaved: null,
      validationErrors: {},
    },
  });

  // 編輯模式：預填表單資料
  useEffect(() => {
    if (isEditMode && productDetail) {
      const productData = productDetail;
      const attributes = productData.attributes || [];
      const variants = productData.variants || [];
      
      const hasAttributes = attributes.length > 0;
      const hasMultipleVariants = variants.length > 1;
      const hasAttributeValues = variants.some(
        (variant: any) => variant.attribute_values && variant.attribute_values.length > 0
      );
      const isVariable = hasAttributes || hasMultipleVariants || hasAttributeValues;

      // 建構屬性值映射
      const attributeValues: Record<number, string[]> = {};
      if (hasAttributes && attributes.length > 0 && variants.length > 0) {
        attributes.forEach((attr: any) => {
          const values = new Set<string>();
          variants.forEach((variant: any) => {
            if (variant.attribute_values) {
              variant.attribute_values.forEach((attrVal: any) => {
                if (attrVal.attribute_id === attr.id) {
                  values.add(attrVal.value);
                }
              });
            }
          });
          attributeValues[attr.id] = Array.from(values);
        });
      }

      // 建構變體配置資料
      const variantItems = variants.map((variant: any, index: number) => {
        const options = variant.attribute_values?.map((attrVal: any) => ({
          attributeId: attrVal.attribute_id,
          value: attrVal.value,
        })) || [];

        const priceValue = variant.price !== null && variant.price !== undefined
          ? variant.price.toString()
          : "";

        return {
          key: `variant-${index}`,
          id: variant.id,
          options,
          sku: variant.sku || "",
          price: priceValue,
        };
      });

      // 預填表單資料
      setFormData({
        basicInfo: {
          name: productData.name || "",
          description: productData.description || "",
          category_id: productData.category_id || null,
        },
        imageData: {
          selectedFile: null,
          previewUrl: Array.isArray(productData.image_urls) 
            ? productData.image_urls[0] || null
            : null, // 暫時設為 null，等待 API 類型完善
        },
        specifications: {
          isVariable: isVariable,
          selectedAttributes: hasAttributes
            ? attributes.map((attr: any) => attr.id)
            : [],
          attributeValues: attributeValues,
        },
        variants: {
          items: variantItems,
        },
        metadata: {
          currentStep: 1,
          completedSteps: [],
          lastSaved: null,
          validationErrors: {},
        },
      });
    }
  }, [isEditMode, productDetail]);

  // 更新表單資料
  const updateFormData = useCallback((updates: Partial<WizardFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates,
      metadata: {
        ...prev.metadata,
        lastSaved: new Date(),
      },
    }));
  }, []);

  // 步驟導航
  const goToStep = useCallback((targetStep: number) => {
    if (targetStep >= 1 && targetStep <= 4) {
      setStep(targetStep);
    }
  }, []);

  const goToPrevStep = useCallback(() => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  }, [step]);

  const goToNextStep = useCallback(() => {
    if (step < 4) {
      setStep(prev => prev + 1);
    }
  }, [step]);

  // 進度計算
  const progressPercentage = (step / 4) * 100;

  return {
    // 基本狀態
    step,
    isEditMode,
    isSubmitting,
    setIsSubmitting,
    progressPercentage,
    
    // 表單狀態
    formData,
    updateFormData,
    
    // API 狀態
    attributesData,
    productDetail,
    isLoadingProduct,
    productError,
    
    // 導航控制
    goToStep,
    goToPrevStep,
    goToNextStep,
    
    // 工具函數
    router,
  };
}