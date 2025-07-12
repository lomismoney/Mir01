/**
 * 商品建立精靈業務邏輯 Hook
 * 
 * 提取 CreateProductWizard 組件的業務邏輯：
 * 1. 表單資料狀態管理
 * 2. 步驟導航邏輯
 * 3. 編輯模式預填邏輯
 * 4. 表單驗證和提交
 * 5. 圖片上傳處理
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  useProductDetail, 
  useAttributes, 
  useCreateProduct, 
  useUpdateProduct, 
  useUploadProductImage,
  useErrorHandler
} from "@/hooks";

// 表單資料結構定義
export interface WizardFormData {
  basicInfo: {
    name: string;
    description: string;
    category_id: number | null;
  };
  imageData: {
    selectedFile: File | null;
    previewUrl: string | null;
  };
  specifications: {
    isVariable: boolean;
    selectedAttributes: number[];
    attributeValues: Record<number, string[]>;
  };
  variants: {
    items: Array<{
      key: string;
      id?: number;
      options: { attributeId: number; value: string }[];
      sku: string;
      price: string;
    }>;
  };
}

export interface UseProductWizardReturn {
  // 狀態
  step: number;
  isSubmitting: boolean;
  formData: WizardFormData;
  progressPercentage: number;
  isEditMode: boolean;
  
  // 資料
  attributesData: unknown;
  productDetail: unknown;
  isLoadingProduct: boolean;
  productError: unknown;
  
  // 操作函數
  setStep: (step: number) => void;
  setFormData: (data: WizardFormData | ((prev: WizardFormData) => WizardFormData)) => void;
  handleNext: () => void;
  handlePrevious: () => void;
  handleSubmit: () => Promise<void>;
  
  // 驗證函數
  canProceedToNext: () => boolean;
  validateStep: (stepNumber: number) => boolean;
}

const TOTAL_STEPS = 4;

export function useProductWizard(productId?: string | number): UseProductWizardReturn {
  const router = useRouter();
  const { handleError, handleSuccess } = useErrorHandler();
  
  // 編輯模式判斷
  const numericProductId = productId ? Number(productId) : undefined;
  const isEditMode = !!numericProductId && !isNaN(numericProductId) && numericProductId > 0;

  // API hooks
  const { data: attributesData } = useAttributes();
  const { 
    data: productDetail, 
    isLoading: isLoadingProduct, 
    error: productError 
  } = useProductDetail(isEditMode ? numericProductId : undefined);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const uploadImage = useUploadProductImage();

  // 基本狀態
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
  });

  // 進度計算
  const progressPercentage = (step / TOTAL_STEPS) * 100;

  // 編輯模式：預填表單資料
  useEffect(() => {
    if (isEditMode && productDetail) {
      const productData = productDetail as unknown as Record<string, unknown>;
      const attributes = (productData.attributes as Array<Record<string, unknown>>) || [];
      const variants = (productData.variants as Array<Record<string, unknown>>) || [];
      
      const hasAttributes = attributes.length > 0;
      const hasMultipleVariants = variants.length > 1;
      const isVariable = hasAttributes || hasMultipleVariants;

      // 建構屬性值映射
      const attributeValues: Record<number, string[]> = {};
      if (hasAttributes && variants.length > 0) {
        attributes.forEach((attr) => {
          const values = new Set<string>();
          variants.forEach((variant) => {
            const attrVals = variant.attribute_values as Array<Record<string, unknown>> | undefined;
            if (attrVals) {
              attrVals.forEach((attrVal) => {
                if (attrVal.attribute_id === attr.id) {
                  values.add(attrVal.value as string);
                }
              });
            }
          });
          attributeValues[attr.id as number] = Array.from(values);
        });
      }

      // 建構變體配置資料
      const variantItems = variants.map((variant, index) => {
        const attrVals = variant.attribute_values as Array<Record<string, unknown>> | undefined;
        const options = attrVals?.map((attrVal) => ({
          attributeId: attrVal.attribute_id as number,
          value: attrVal.value as string,
        })) || [];

        return {
          key: `variant-${index}`,
          id: variant.id as number,
          options,
          sku: (variant.sku as string) || "",
          price: (variant.price as number)?.toString() || "",
        };
      });

      // 預填表單資料
      setFormData({
        basicInfo: {
          name: (productData.name as string) || "",
          description: (productData.description as string) || "",
          category_id: (productData.category_id as number) || null,
        },
        imageData: {
          selectedFile: null,
          previewUrl: null,
        },
        specifications: {
          isVariable,
          selectedAttributes: attributes.map((attr) => attr.id as number),
          attributeValues,
        },
        variants: {
          items: variantItems,
        },
      });
    }
  }, [isEditMode, productDetail]);

  // 步驟驗證邏輯
  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        return !!(
          formData.basicInfo.name?.trim() &&
          formData.basicInfo.category_id
        );
      case 2:
        return true; // 規格步驟總是可以繼續
      case 3:
        if (!formData.specifications.isVariable) {
          return formData.variants.items.length > 0 &&
                 formData.variants.items.every(item => item.sku?.trim() && item.price?.trim());
        }
        return formData.variants.items.length > 0 &&
               formData.variants.items.every(item => item.sku?.trim() && item.price?.trim());
      case 4:
        return true; // 檢視步驟總是有效
      default:
        return false;
    }
  };

  const canProceedToNext = (): boolean => {
    return validateStep(step);
  };

  // 步驟導航
  const handleNext = () => {
    if (canProceedToNext() && step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  // 提交處理
  const handleSubmit = async (): Promise<void> => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 構建 API 所需的資料格式
      const apiData = {
        name: formData.basicInfo.name,
        description: formData.basicInfo.description,
        category_id: formData.basicInfo.category_id,
        attributes: formData.specifications.selectedAttributes,
        attribute_values: formData.specifications.attributeValues,
        variants: formData.variants.items.map(item => ({
          id: item.id,
          sku: item.sku,
          price: parseFloat(item.price),
          attribute_values: item.options.map(option => ({
            attribute_id: option.attributeId,
            value: option.value,
          })),
        })),
      };

      let productResponse;
      
      if (isEditMode && numericProductId) {
        // 更新商品
        productResponse = await updateProduct.mutateAsync({
          id: numericProductId,
          data: apiData,
        });
      } else {
        // 創建商品
        productResponse = await createProduct.mutateAsync(apiData);
      }

      // 處理圖片上傳
      if (formData.imageData.selectedFile && (productResponse?.data as any)?.id) {
        await uploadImage.mutateAsync({
          productId: (productResponse.data as any).id,
          image: formData.imageData.selectedFile,
        });
      }

      handleSuccess(
        isEditMode ? "商品已成功更新！" : "商品已成功創建！"
      );

      // 導航回商品列表
      router.push("/products");
    } catch (error) {
      console.error("提交失敗:", error);
      handleError(new Error(
        isEditMode ? "更新商品失敗" : "創建商品失敗"
      ));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    // 狀態
    step,
    isSubmitting,
    formData,
    progressPercentage,
    isEditMode,
    
    // 資料
    attributesData,
    productDetail,
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
  };
}