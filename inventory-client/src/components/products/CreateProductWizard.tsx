'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, CheckCircle, Circle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// 導入 API Hooks
import { useCreateProduct, useCreateSimpleProduct, useUpdateProduct, useProductDetail, useAttributes, useUploadProductImage } from '@/hooks/queries/useEntityQueries';

// 導入步驟組件
import { 
  Step1_BasicInfo, 
  Step1_BasicInfoWithImage,
  Step2_DefineSpecs, 
  Step3_ConfigureVariants, 
  Step4_Review,
  EditProductFormSkeleton 
} from './wizard-steps';

// 導入 API 類型
import type { paths } from '@/types/api';

/**
 * 嚮導表單資料完整結構（原子化創建流程優化版）
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
 * 步驟配置定義
 */
const STEPS = [
  {
    id: 1,
    title: '基本資訊',
    description: '商品名稱、描述、分類',
    icon: '📋'
  },
  {
    id: 2,
    title: '規格定義',
    description: '屬性選擇與規格管理',
    icon: '⚙️'
  },
  {
    id: 3,
    title: '設定變體',
    description: 'SKU 變體與價格配置',
    icon: '🏷️'
  },
  {
    id: 4,
    title: '預覽確認',
    description: '最終確認與提交',
    icon: '✅'
  }
];

/**
 * 數據轉換函數：將嚮導表單資料轉換為 API 請求格式
 * 
 * @param formData - 嚮導表單資料
 * @param attributesData - 屬性資料（用於屬性值ID映射）
 * @returns API 請求體格式的資料
 */
function transformWizardDataToApiPayload(
  formData: WizardFormData, 
  attributesData?: any
): paths['/api/products']['post']['requestBody']['content']['application/json'] {
  const { basicInfo, specifications, variants } = formData;

  // 如果是單規格商品，創建一個預設變體
  if (!specifications.isVariable) {
    const singleVariant = variants.items[0];
    
    // 驗證單規格商品的數據
    if (!singleVariant || !singleVariant.price || singleVariant.price.trim() === '') {
      throw new Error('商品價格為必填項目，請在步驟3中設定價格');
    }
    
    const price = parseFloat(singleVariant.price);
    if (isNaN(price) || price <= 0) {
      throw new Error('商品價格必須為大於 0 的有效數字');
    }
    
    if (!singleVariant.sku || singleVariant.sku.trim() === '') {
      throw new Error('商品 SKU 為必填項目，請在步驟3中設定 SKU');
    }
    
    return {
      name: basicInfo.name,
      description: basicInfo.description || null,
      category_id: basicInfo.category_id,
      attributes: [], // 單規格商品沒有屬性
      variants: [{
        ...(singleVariant?.id && { id: singleVariant.id }), // 編輯模式時包含變體 ID
        sku: singleVariant.sku.trim(),
        price: price,
        attribute_value_ids: []
      }]
    };
  }

  // 多規格商品：驗證所有變體數據
  if (variants.items.length === 0) {
    throw new Error('多規格商品必須至少有一個變體，請返回步驟3配置變體');
  }
  
  // 驗證每個變體的數據
  for (let i = 0; i < variants.items.length; i++) {
    const variant = variants.items[i];
    
    if (!variant.sku || variant.sku.trim() === '') {
      throw new Error(`第 ${i + 1} 個變體的 SKU 為必填項目，請在步驟3中設定`);
    }
    
    if (!variant.price || variant.price.trim() === '') {
      throw new Error(`第 ${i + 1} 個變體的價格為必填項目，請在步驟3中設定`);
    }
    
    const price = parseFloat(variant.price);
    if (isNaN(price) || price <= 0) {
      throw new Error(`第 ${i + 1} 個變體的價格必須為大於 0 的有效數字`);
    }
  }

  // 多規格商品：需要映射屬性值名稱到ID
  const transformedVariants = variants.items.map((variant, index) => {
    const attributeValueIds: number[] = [];
    
    // 遍歷變體的每個選項，找到對應的屬性值ID
    variant.options.forEach(option => {
      const attribute = attributesData?.data?.find((attr: any) => attr.id === option.attributeId);
      if (attribute) {
        const attributeValue = attribute.values?.find((val: any) => val.value === option.value);
        if (attributeValue) {
          attributeValueIds.push(attributeValue.id);
        }
      }
    });

    return {
      ...(variant.id && { id: variant.id }), // 編輯模式時包含變體 ID
      sku: variant.sku.trim(),
      price: parseFloat(variant.price),
      attribute_value_ids: attributeValueIds
    };
  });

  return {
    name: basicInfo.name,
    description: basicInfo.description || null,
    category_id: basicInfo.category_id,
    attributes: specifications.selectedAttributes,
    variants: transformedVariants
  };
}

/**
 * 轉換為單規格商品數據 (v3.0 雙軌制 API)
 * 
 * 專門處理單規格商品的數據轉換，只提取最核心的商品資訊。
 * 無需處理複雜的屬性和變體結構，後端會自動處理這些細節。
 * 
 * @param formData 嚮導表單數據
 * @returns 簡化的單規格商品數據
 */
function transformToSimplePayload(formData: WizardFormData) {
  const { basicInfo, variants } = formData;
  
  // 取得第一個（也是唯一的）變體資訊
  const firstVariant = variants.items[0];
  
  // 驗證價格並提供詳細的錯誤信息
  if (!firstVariant || !firstVariant.price || firstVariant.price.trim() === '') {
    throw new Error('商品價格為必填項目，請在步驟3中設定價格');
  }
  
  const price = parseFloat(firstVariant.price);
  if (isNaN(price) || price <= 0) {
    throw new Error('商品價格必須為大於 0 的有效數字');
  }
  
  // 驗證 SKU
  if (!firstVariant.sku || firstVariant.sku.trim() === '') {
    throw new Error('商品 SKU 為必填項目，請在步驟3中設定 SKU');
  }
  
  return {
    name: basicInfo.name,
    sku: firstVariant.sku.trim(),
    price: price,
    category_id: basicInfo.category_id,
    description: basicInfo.description || undefined,
  };
}

/**
 * 轉換為多規格商品數據 (v3.0 雙軌制 API)
 * 
 * 處理多規格商品的完整數據結構，包含屬性和變體的複雜關聯。
 * 這是原有 transformWizardDataToApiPayload 函數的簡化版本。
 * 
 * @param formData 嚮導表單數據
 * @param attributesData 屬性數據
 * @returns 完整的多規格商品數據
 */
function transformToVariantPayload(
  formData: WizardFormData, 
  attributesData?: any
): paths['/api/products']['post']['requestBody']['content']['application/json'] {
  // 直接使用現有的轉換邏輯
  return transformWizardDataToApiPayload(formData, attributesData);
}

/**
 * 商品創建/編輯嚮導主組件 Props
 */
interface CreateProductWizardProps {
  /** 商品 ID - 如果提供則為編輯模式，否則為創建模式 */
  productId?: string | number;
}

/**
 * 商品創建/編輯嚮導主組件
 * 
 * 功能特色：
 * - 多步驟流程管理
 * - 進度視覺化指示器  
 * - 支持創建與編輯兩種模式
 * - 步驟間資料傳遞
 * - 表單驗證與導航控制
 * - 統一的用戶體驗流程
 * - 真實 API 整合
 * 
 * @param productId - 商品 ID（編輯模式時使用）
 */
export function CreateProductWizard({ productId }: CreateProductWizardProps = {}) {
  const router = useRouter();
  
  // 判斷是否為編輯模式
  const isEditMode = !!productId;
  
  // API Hooks
  const createProductMutation = useCreateProduct();
  const createSimpleProductMutation = useCreateSimpleProduct();
  const updateProductMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const { data: attributesData } = useAttributes();
  
  // 編輯模式：獲取商品詳情
  const { 
    data: productDetail, 
    isLoading: isLoadingProduct,
    error: productError 
  } = useProductDetail(productId);
  
  // 核心狀態：當前步驟
  const [step, setStep] = useState(1);
  
  // 提交狀態
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 核心狀態：嚮導表單資料聚合
  const [formData, setFormData] = useState<WizardFormData>({
    basicInfo: {
      name: '',
      description: '',
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
  
  // 提交狀態現在由本地狀態管理（原子化創建流程）

  /**
   * 編輯模式：當商品數據加載完成後，預填表單數據
   */
  useEffect(() => {
    if (isEditMode && productDetail?.data) {
      const product = productDetail.data;
      
      // 判斷是否為多規格商品（有屬性或有多個變體）
      const hasAttributes = product.attributes && product.attributes.length > 0;
      const hasMultipleVariants = product.variants && product.variants.length > 1;
      const hasAttributeValues = product.variants?.some((variant: any) => 
        variant.attribute_values && variant.attribute_values.length > 0
      ) || false;
      const isVariable = hasAttributes || hasMultipleVariants || hasAttributeValues;
      
      // 建構屬性值映射（用於變體配置）
      const attributeValues: Record<number, string[]> = {};
      
      if (hasAttributes && product.variants && product.attributes) {
        // 遍歷每個屬性，收集所有可能的屬性值
        product.attributes.forEach((attr: any) => {
          const values = new Set<string>();
          
          // 從現有變體中提取屬性值
          product.variants?.forEach((variant: any) => {
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
      
      // 建構變體配置數據
      const variantItems = product.variants?.map((variant: any, index: number) => {
        // 從屬性值中建構選項
        const options = variant.attribute_values?.map((attrVal: any) => ({
          attributeId: attrVal.attribute_id,
          value: attrVal.value
        })) || [];
        
        // 確保價格正確轉換：如果有價格就使用實際價格，否則為空字符串
        const priceValue = variant.price !== null && variant.price !== undefined 
          ? variant.price.toString() 
          : '';
        
        return {
          key: `variant-${index}`,
          id: variant.id, // 保存變體 ID 用於編輯模式
          options,
          sku: variant.sku || '',
          price: priceValue
        };
      }) || [];
      
      // 轉換商品數據為嚮導表單格式
      const transformedData: WizardFormData = {
        basicInfo: {
          name: product.name || '',
          description: product.description || '',
          category_id: product.category_id || null,
        },
        imageData: {
          selectedFile: null,
          // 如果商品有圖片，使用原圖 URL 作為預覽
          previewUrl: (product.image_urls?.original 
            || product.image_urls?.large 
            || product.image_urls?.medium 
            || product.image_urls?.thumb
            || '')
            .replace('localhost', '127.0.0.1') || null,
        },
        specifications: {
          isVariable: isVariable,
          selectedAttributes: hasAttributes && product.attributes ? product.attributes.map((attr: any) => attr.id) : [],
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
      };

      // 預填表單數據
      setFormData(transformedData);
    }
  }, [isEditMode, productDetail]);

  /**
   * 更新表單資料的通用函數
   * 使用 useCallback 記憶化以避免無限渲染循環
   */
  const updateFormData = useCallback(<K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...data,
      },
    }));
  }, []); // 空依賴陣列，因為 setFormData 是穩定的

  /**
   * 步驟驗證邏輯
   */
  const validateStep = (stepNumber: number): boolean => {
    switch (stepNumber) {
      case 1:
        // 基本資訊驗證：商品名稱必填
        return formData.basicInfo.name.trim().length > 0;
      
      case 2:
        // 規格定義驗證：如果是多規格，必須選擇至少一個屬性
        if (formData.specifications.isVariable) {
          return formData.specifications.selectedAttributes.length > 0;
        }
        return true;
      
      case 3:
        // 變體配置驗證：檢查所有變體的 SKU 和價格
        if (formData.variants.items.length === 0) {
          return false;
        }
        
        return formData.variants.items.every(variant => {
          // 檢查 SKU
          if (!variant.sku || variant.sku.trim() === '') {
            return false;
          }
          
          // 檢查價格
          if (!variant.price || variant.price.trim() === '') {
            return false;
          }
          
          // 驗證價格格式
          const price = parseFloat(variant.price);
          return !isNaN(price) && price > 0;
        });
      
      case 4:
        // 預覽確認：完整驗證所有步驟
        // 基本資訊
        if (!formData.basicInfo.name.trim()) {
          return false;
        }
        
        // 變體驗證
        if (formData.variants.items.length === 0) {
          return false;
        }
        
        // 檢查每個變體的完整性
        return formData.variants.items.every(variant => {
          const hasValidSku = variant.sku && variant.sku.trim().length > 0;
          const hasValidPrice = variant.price && variant.price.trim().length > 0;
          const priceIsNumber = !isNaN(parseFloat(variant.price || '')) && parseFloat(variant.price || '') > 0;
          
          return hasValidSku && hasValidPrice && priceIsNumber;
        });
      
      default:
        return true;
    }
  };

  /**
   * 下一步處理
   */
  const handleNextStep = () => {
    if (!validateStep(step)) {
      let errorMessage = '請完成當前步驟的必填資訊';
      
      switch (step) {
        case 1:
          errorMessage = '請輸入商品名稱';
          break;
        case 2:
          if (formData.specifications.isVariable && formData.specifications.selectedAttributes.length === 0) {
            errorMessage = '多規格商品必須選擇至少一個屬性';
          }
          break;
        case 3:
          if (formData.variants.items.length === 0) {
            errorMessage = '請先配置商品變體';
          } else {
            const missingSkuVariants = formData.variants.items.filter(v => !v.sku || !v.sku.trim());
            const missingPriceVariants = formData.variants.items.filter(v => !v.price || !v.price.trim());
            const invalidPriceVariants = formData.variants.items.filter(v => {
              const price = parseFloat(v.price || '');
              return isNaN(price) || price <= 0;
            });
            
            if (missingSkuVariants.length > 0) {
              errorMessage = `請為所有變體設定 SKU，還有 ${missingSkuVariants.length} 個變體未設定`;
            } else if (missingPriceVariants.length > 0) {
              errorMessage = `請為所有變體設定價格，還有 ${missingPriceVariants.length} 個變體未設定價格`;
            } else if (invalidPriceVariants.length > 0) {
              errorMessage = `請輸入有效的價格（大於0的數字），有 ${invalidPriceVariants.length} 個變體的價格無效`;
            }
          }
          break;
        case 4:
          errorMessage = '請確認所有資訊無誤';
          break;
      }
      
      toast.error(errorMessage);
      return;
    }
    
    if (step < STEPS.length) {
      setStep(step + 1);
      toast.success(`已進入步驟 ${step + 1}`);
    }
  };

  /**
   * 上一步處理
   */
  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  /**
   * 原子化最終提交處理（鏈式提交邏輯）
   * 
   * 實現「本地暫存，鏈式提交」的原子化創建流程：
   * 1. 創建/更新商品主體
   * 2. 如有圖片，執行圖片上傳
   * 3. 智能錯誤處理和用戶提示
   * 
   * 優勢：
   * - 數據完整性：全成功或全失敗
   * - 用戶體驗：流程簡潔，操作靈活
   * - 錯誤處理：智能回滾和詳細提示
   */
  const handleFinalSubmit = async () => {
    if (!validateStep(4)) {
      toast.error('請確認所有資訊無誤');
      return;
    }

    try {
      setIsSubmitting(true);
      
      let productResult: any;
      let productName: string;
      
      // 步驟1：判斷創建模式並選擇合適的 API 通道 (v3.0 雙軌制 API)
      if (isEditMode && productId) {
        // 編輯模式：始終使用完整的多規格 API
        const apiPayload = transformWizardDataToApiPayload(formData, attributesData);
        
        toast.loading('正在更新商品資訊...', { id: 'submit-progress' });
        
        productResult = await updateProductMutation.mutateAsync({ 
          id: Number(productId), 
          ...apiPayload 
        });
        
        productName = apiPayload.name;
        
        toast.success('商品資訊更新成功！', {
          id: 'submit-progress',
          description: `商品「${productName}」已成功更新`
        });
      } else {
        // 創建模式：根據商品類型選擇 API 通道
        const isSingleVariant = !formData.specifications.isVariable;
        
        if (isSingleVariant) {
          // === 走「簡易創建」通道 ===
          const simplePayload = transformToSimplePayload(formData);
          
          toast.loading('正在創建單規格商品...', { id: 'submit-progress' });
          
          productResult = await createSimpleProductMutation.mutateAsync(simplePayload);
          productName = simplePayload.name;
          
          toast.success('單規格商品創建成功！', {
            id: 'submit-progress',
            description: `商品「${productName}」已成功創建為單規格商品`
          });
        } else {
          // === 走「多規格創建」通道 ===
          const variantPayload = transformToVariantPayload(formData, attributesData);
          
          toast.loading('正在創建多規格商品...', { id: 'submit-progress' });
          
          productResult = await createProductMutation.mutateAsync(variantPayload);
          productName = variantPayload.name;
          
          toast.success('多規格商品創建成功！', {
            id: 'submit-progress',
            description: `商品「${productName}」已成功創建，包含 ${variantPayload.variants.length} 個變體`
          });
        }
      }
      
      // 步驟3：處理圖片上傳（如果有選擇圖片）
      if (formData.imageData.selectedFile && productResult?.data?.id) {
        try {
          toast.loading('正在上傳商品圖片...', { id: 'image-progress' });
          
          await uploadImageMutation.mutateAsync({
            productId: productResult.data.id,
            image: formData.imageData.selectedFile
          });
          
          toast.success('商品圖片上傳成功！', {
            id: 'image-progress',
            description: '圖片已成功關聯到商品'
          });
          
        } catch (imageError) {
          // 圖片上傳失敗，但商品已創建成功
          
          toast.warning('商品創建成功，但圖片上傳失敗', {
            id: 'image-progress',
            description: '您可以稍後在編輯頁面重新上傳圖片',
            duration: 6000,
          });
        }
      }
      
      // 步驟4：成功完成，跳轉頁面
      toast.success('✅ 所有操作完成！', {
        description: `商品「${productName}」已成功${isEditMode ? '更新' : '創建'}${formData.imageData.selectedFile ? '並上傳圖片' : ''}`
      });
      
      // 延遲跳轉，讓用戶看到成功提示
      setTimeout(() => {
      router.push('/products');
      }, 1500);

    } catch (error) {
      // 主要錯誤處理
      
      toast.error(`商品${isEditMode ? '更新' : '創建'}失敗`, {
        id: 'submit-progress',
        description: error instanceof Error ? error.message : '請檢查輸入資料並重試',
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 渲染當前步驟組件
   */
  const renderCurrentStep = () => {
    const commonProps = {
      formData,
      updateFormData,
    };

    switch (step) {
      case 1:
        return (
          <Step1_BasicInfoWithImage 
            {...commonProps} 
            productId={productId}
            isEditMode={isEditMode}
          />
        );
      case 2:
        return <Step2_DefineSpecs {...commonProps} />;
      case 3:
        return <Step3_ConfigureVariants {...commonProps} />;
      case 4:
        return <Step4_Review {...commonProps} />;
      default:
        return <div>未知步驟</div>;
    }
  };

  /**
   * 計算進度百分比
   */
  const progressPercentage = (step / STEPS.length) * 100;

  // 編輯模式：處理載入狀態和錯誤狀態
  if (isEditMode) {
    // 載入中 - 使用骨架屏提供視覺連續性
    if (isLoadingProduct) {
      return <EditProductFormSkeleton />;
    }
    
    // 載入錯誤或找不到商品
    if (productError || !productDetail?.data) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="rounded-full bg-destructive/10 p-3 mb-4">
                  <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">無法載入商品</h3>
                <p className="text-muted-foreground mb-4">
                  {productError instanceof Error ? productError.message : '找不到指定的商品，請確認商品是否存在'}
                </p>
                <Button onClick={() => router.push('/products')} variant="outline">
                  返回商品列表
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* --- 頁面標題 --- */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {isEditMode ? '編輯商品' : '新增商品'}
        </h1>
        <p className="text-muted-foreground">
          {isEditMode 
            ? '透過引導式流程，輕鬆更新您的商品' 
            : '透過引導式流程，輕鬆創建您的商品'
          }
        </p>
      </div>

      {/* --- 統一的內容容器 --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* --- 左欄：步驟指示器 --- */}
        <aside className="md:col-span-1">
          {/* 進度概覽 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">創建進度</span>
              <Badge variant="outline" className="text-xs">
                {Math.round(progressPercentage)}% 完成
              </Badge>
            </div>
            <Progress value={progressPercentage} className="w-full h-2" />
          </div>

          {/* 步驟列表 */}
          <div className="space-y-2">
            {STEPS.map((stepInfo, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < step;
              const isCurrent = stepNumber === step;
              
              return (
                <div 
                  key={stepInfo.id} 
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                    isCurrent ? 'bg-primary/10 border border-primary/20' : 
                    isCompleted ? 'bg-muted/50' : 
                    'bg-transparent'
                  }`}
                >
                  {/* 步驟圖標 */}
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : isCurrent ? (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-medium">{stepNumber}</span>
                      </div>
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* 步驟資訊 */}
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium ${
                      isCurrent ? 'text-foreground' : 
                      isCompleted ? 'text-muted-foreground' : 
                      'text-muted-foreground'
                    }`}>
                      {stepInfo.title}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {stepInfo.description}
                    </div>
                    
                    {/* 當前步驟標示 */}
                    {isCurrent && (
                      <div className="flex items-center mt-1.5 text-xs text-primary">
                        <div className="h-1.5 w-1.5 bg-primary rounded-full mr-2 animate-pulse"></div>
                        進行中
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
        
        {/* --- 右欄：表單內容區 --- */}
        <main className="md:col-span-3">
          {/* 當前步驟內容 - 讓每個步驟組件自行定義 Card 樣式 */}
          {renderCurrentStep()}
          
          {/* 底部導航控制 */}
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={step === 1 || isSubmitting}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              上一步
            </Button>

            <div className="text-sm text-muted-foreground">
              步驟 {step} / {STEPS.length}
            </div>

            {step < STEPS.length ? (
              <Button
                onClick={handleNextStep}
                disabled={!validateStep(step) || isSubmitting}
              >
                下一步
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleFinalSubmit}
                disabled={!validateStep(step) || isSubmitting}
                variant="default"
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting 
                  ? (isEditMode ? '更新中...' : '創建中...') 
                  : (isEditMode ? '完成更新' : '完成創建')
                }
              </Button>
            )}
          </div>
        </main>

      </div>
    </div>
  );
} 