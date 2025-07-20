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
import { useQueryClient } from "@tanstack/react-query";
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
    selectedAttributeValues?: Record<number, string[]>; // 新增：選中的屬性值
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
  const queryClient = useQueryClient();
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
      // 基本驗證
      if (!formData.basicInfo.name?.trim()) {
        throw new Error("商品名稱為必填欄位");
      }
      if (!formData.basicInfo.category_id) {
        throw new Error("請選擇商品分類");
      }
      if (!formData.variants.items || formData.variants.items.length === 0) {
        throw new Error("至少需要一個商品變體");
      }

      // 構建 API 所需的資料格式
      const apiData = {
        name: formData.basicInfo.name.trim(),
        description: formData.basicInfo.description?.trim() || "",
        category_id: formData.basicInfo.category_id,
        attributes: formData.specifications.selectedAttributes || [],
        // 注意：attribute_values 不應該在商品層級，而是在變體層級
        variants: formData.variants.items.map(item => ({
          // 編輯模式時包含 id，創建模式時不包含
          ...(isEditMode && item.id ? { id: item.id } : {}),
          sku: item.sku?.trim() || "",
          price: parseFloat(item.price) || 0,
          attribute_values: (item.options || []).map(option => ({
            attribute_id: option.attributeId,
            value: option.value,
          })),
        })),
      };
      
      // 調試：記錄將要發送的資料
      console.log('ProductWizard - Submitting data:', apiData);

      let productResponse;
      
      if (isEditMode && numericProductId) {
        // 更新商品
        productResponse = await updateProduct.mutateAsync({
          id: numericProductId,
          data: apiData,
        });
      } else {
        // 創建商品
        try {
          productResponse = await createProduct.mutateAsync(apiData);
        } catch (createError) {
          // 添加更詳細的錯誤信息
          const errorMsg = createError instanceof Error ? createError.message : "創建商品時發生未知錯誤";
          throw new Error(`創建商品失敗: ${errorMsg}`);
        }
      }

      // 處理圖片上傳（只在有新選擇的檔案時才上傳）
      if (formData.imageData.selectedFile && (productResponse?.data as any)?.id) {
        try {
          await uploadImage.mutateAsync({
            productId: (productResponse.data as any).id,
            image: formData.imageData.selectedFile,
          });
          // 圖片上傳成功後，刷新商品列表以顯示新圖片
          await queryClient.invalidateQueries({ queryKey: ['products'] });
          // 強制重新獲取商品列表，確保圖片立即顯示
          await queryClient.refetchQueries({ queryKey: ['products'] });
        } catch (imageError) {
          // 圖片上傳失敗
          // 圖片上傳失敗不應該阻止商品創建成功
          // 只顯示警告訊息
          if (typeof window !== 'undefined') {
            const { toast } = await import('sonner');
            toast.warning('商品已創建，但圖片上傳失敗', {
              description: '您可以稍後在編輯頁面重新上傳圖片。'
            });
          }
        }
      }

      handleSuccess(
        isEditMode ? "商品已成功更新！" : "商品已成功創建！"
      );

      // 導航回商品列表
      router.push("/products");
    } catch (error) {
      // 提交失敗，保留原始錯誤信息
      const errorMessage = error instanceof Error ? error.message : (isEditMode ? "更新商品失敗" : "創建商品失敗");
      handleError(new Error(errorMessage));
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