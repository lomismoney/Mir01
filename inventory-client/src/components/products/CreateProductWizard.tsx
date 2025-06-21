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
  Step4_Review 
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
      const hasAttributeValues = product.variants?.some(variant => 
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
          previewUrl: null,
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

      // 調試信息：檢查轉換後的變體數據
      console.log('編輯模式 - 原始產品數據:', product);
      console.log('編輯模式 - 轉換後的變體數據:', variantItems);
      console.log('編輯模式 - 完整轉換數據:', transformedData);
      
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
        console.log('編輯模式 - API 請求資料：', apiPayload);
        
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
          console.log('單規格創建模式 - API 請求資料：', simplePayload);
          
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
          console.log('多規格創建模式 - API 請求資料：', variantPayload);
          
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
          console.error('圖片上傳失敗:', imageError);
          
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
      console.error(`商品${isEditMode ? '更新' : '創建'}失敗:`, error);
      
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

  return (
    <div className="bg-gray-50">
      {/* 頁面標題 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {isEditMode ? '編輯商品' : '新增商品'}
            </h1>
            <p className="text-sm text-gray-600">
              {isEditMode 
                ? '透過嚮導式流程，輕鬆更新您的商品資訊' 
                : '透過嚮導式流程，輕鬆創建您的商品資訊'
              }
            </p>
          </div>
        </div>
      </div>

      {/* 主內容區域：響應式側邊欄 + 內容區 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 左側邊欄：步驟導航（桌面版）或頂部導航（移動版） */}
          <div className="lg:w-72 lg:flex-shrink-0">
            <Card className="lg:sticky lg:top-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="hidden lg:block">創建進度</span>
                  <span className="lg:hidden">步驟 {step} / {STEPS.length}</span>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(progressPercentage)}% 完成
                  </Badge>
                </CardTitle>
                <Progress value={progressPercentage} className="w-full h-2" />
              </CardHeader>
              
              <CardContent className="space-y-3 pt-0">
                {/* 步驟列表 - 移動版只顯示當前和下一步 */}
                <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
                  {STEPS.map((stepInfo, index) => {
                    const stepNumber = index + 1;
                    const isCompleted = stepNumber < step;
                    const isCurrent = stepNumber === step;
                    
                    return (
                      <div 
                        key={stepInfo.id} 
                        className={`p-2 rounded text-center text-xs ${
                          isCurrent ? 'bg-blue-100 text-blue-700 font-medium' : 
                          isCompleted ? 'bg-green-100 text-green-700' : 
                          'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {stepInfo.title}
                      </div>
                    );
                  })}
                </div>
                
                {/* 步驟列表 - 桌面版完整顯示 */}
                <div className="hidden lg:block space-y-2">
                {STEPS.map((stepInfo, index) => {
                  const stepNumber = index + 1;
                  const isCompleted = stepNumber < step;
                  const isCurrent = stepNumber === step;
                  
                  return (
                    <div 
                      key={stepInfo.id} 
                      className={`flex items-start space-x-3 p-2.5 rounded-md transition-colors ${
                        isCurrent ? 'bg-blue-50 border border-blue-200' : 
                        isCompleted ? 'bg-green-50 border border-green-200' : 
                        'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {/* 步驟圖標 */}
                      <div className="flex-shrink-0 mt-1">
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-green-500" />
                        ) : isCurrent ? (
                          <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">{stepNumber}</span>
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-sm font-medium">{stepNumber}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 步驟資訊 */}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-700' : 
                          isCompleted ? 'text-green-700' : 
                          'text-gray-500'
                        }`}>
                          {stepInfo.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stepInfo.description}
                        </div>
                        
                        {/* 當前步驟標示 */}
                        {isCurrent && (
                          <div className="flex items-center mt-2 text-xs text-blue-600">
                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mr-2 animate-pulse"></div>
                            進行中
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側主內容區 */}
          <div className="flex-1 min-w-0">
            {/* 內容卡片 */}
            <Card>
              <CardContent className="p-6">
                {/* 當前步驟內容 */}
                <div>
                  {renderCurrentStep()}
                </div>
              </CardContent>
            </Card>

            {/* 底部導航控制 */}
            <div className="mt-4 flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={step === 1 || isSubmitting}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>上一步</span>
              </Button>

              <div className="text-sm text-gray-500">
                步驟 {step} / {STEPS.length}
              </div>

              {step < STEPS.length ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!validateStep(step) || isSubmitting}
                  className="flex items-center space-x-2"
                >
                  <span>下一步</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinalSubmit}
                  disabled={!validateStep(step) || isSubmitting}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>
                    {isSubmitting 
                      ? (isEditMode ? '更新中...' : '創建中...') 
                      : (isEditMode ? '完成更新' : '完成創建')
                    }
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 