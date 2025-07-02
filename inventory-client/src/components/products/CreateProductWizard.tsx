"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Circle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

// 導入 API Hooks
import {
  useCreateProduct,
  useUpdateProduct,
  useProductDetail,
  useAttributes,
  useUploadProductImage,
} from "@/hooks/queries/useEntityQueries";

// 導入步驟組件
import {
  Step1_BasicInfo,
  Step1_BasicInfoWithImage,
  Step2_DefineSpecs,
  Step3_ConfigureVariants,
  Step4_Review,
  EditProductFormSkeleton,
} from "./wizard-steps";

// 導入 API 類型
import type { paths } from "@/types/api";

/**
 * 屬性數據類型定義（為了移除 as any 斷言）
 */
interface AttributeForTransform {
  id: number;
  name: string;
  values?: AttributeValueForTransform[];
}

interface AttributeValueForTransform {
  id: number;
  value: string;
  attribute_id: number;
}

interface AttributesDataForTransform {
  data?: AttributeForTransform[];
}

/**
 * API 響應結果類型定義（為了移除 as any 斷言）
 */
interface ProductCreationResult {
  data?: {
    id: number;
    name: string;
    [key: string]: unknown; // 保持靈活性
  };
}

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
    title: "基本資訊",
    description: "商品名稱、描述、分類",
    icon: "📋",
  },
  {
    id: 2,
    title: "規格定義",
    description: "屬性選擇與規格管理",
    icon: "⚙️",
  },
  {
    id: 3,
    title: "設定變體",
    description: "SKU 變體與價格配置",
    icon: "🏷️",
  },
  {
    id: 4,
    title: "預覽確認",
    description: "最終確認與提交",
    icon: "✅",
  },
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
  attributesData?: AttributesDataForTransform,
): paths["/api/products"]["post"]["requestBody"]["content"]["application/json"] {
  const { basicInfo, specifications, variants } = formData;

  // 如果是單規格商品，創建一個預設變體
  if (!specifications.isVariable) {
    const singleVariant = variants.items[0];

    // 驗證單規格商品的數據
    if (
      !singleVariant ||
      !singleVariant.price ||
      singleVariant.price.trim() === ""
    ) {
      throw new Error("商品價格為必填項目，請在步驟3中設定價格");
    }

    const price = parseFloat(singleVariant.price);
    if (isNaN(price) || price <= 0) {
      throw new Error("商品價格必須為大於 0 的有效數字");
    }

    if (!singleVariant.sku || singleVariant.sku.trim() === "") {
      throw new Error("商品 SKU 為必填項目，請在步驟3中設定 SKU");
    }

    return {
      name: basicInfo.name,
      description: basicInfo.description || null,
      category_id: basicInfo.category_id,
      attributes: [], // 單規格商品沒有屬性
      variants: [
        {
          ...(singleVariant?.id && { id: singleVariant.id }), // 編輯模式時包含變體 ID
          sku: singleVariant.sku.trim(),
          price: price,
          attribute_value_ids: [],
        },
      ],
    };
  }

  // 多規格商品：驗證所有變體數據
  if (variants.items.length === 0) {
    throw new Error("多規格商品必須至少有一個變體，請返回步驟3配置變體");
  }

  // 驗證每個變體的數據
  for (let i = 0; i < variants.items.length; i++) {
    const variant = variants.items[i];

    if (!variant.sku || variant.sku.trim() === "") {
      throw new Error(`第 ${i + 1} 個變體的 SKU 為必填項目，請在步驟3中設定`);
    }

    if (!variant.price || variant.price.trim() === "") {
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
    variant.options.forEach((option) => {
      const attribute = attributesData?.data?.find(
        (attr) => attr.id === option.attributeId,
      );
      if (attribute && attribute.values) {
        const attributeValue = attribute.values.find(
          (val) => val.value === option.value,
        );
        if (attributeValue) {
          attributeValueIds.push(attributeValue.id);
        }
      }
    });

    return {
      ...(variant.id && { id: variant.id }), // 編輯模式時包含變體 ID
      sku: variant.sku.trim(),
      price: parseFloat(variant.price),
      attribute_value_ids: attributeValueIds,
    };
  });

  return {
    name: basicInfo.name,
    description: basicInfo.description || null,
    category_id: basicInfo.category_id,
    attributes: specifications.selectedAttributes,
    variants: transformedVariants,
  };
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
export function CreateProductWizard({
  productId,
}: CreateProductWizardProps = {}) {
  const router = useRouter();

  // 🔧 修復：增強編輯模式判斷，確保 productId 有效
  const numericProductId = productId ? Number(productId) : undefined;
  const isEditMode = !!numericProductId && !isNaN(numericProductId) && numericProductId > 0;

  // 🛡️ 防護性檢查：記錄組件初始化信息
  console.info('[CreateProductWizard] 組件初始化', {
    productId,
    numericProductId,
    isEditMode,
    timestamp: new Date().toISOString()
  });

  // API Hooks
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const { data: attributesData } = useAttributes();

  // 編輯模式：獲取商品詳情 (只有在有效的編輯模式下才調用)
  const {
    data: productDetail,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProductDetail(isEditMode ? numericProductId : undefined);

  // 核心狀態：當前步驟
  const [step, setStep] = useState(1);

  // 提交狀態
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🛡️ 錯誤邊界處理：檢查商品詳情獲取錯誤
  if (isEditMode && productError) {
    console.error('[CreateProductWizard] 商品詳情獲取失敗', {
      productId,
      numericProductId,
      error: productError,
      timestamp: new Date().toISOString()
    });
    
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="space-y-4">
              <div className="text-red-500 text-2xl">⚠️</div>
              <h2 className="text-xl font-semibold text-red-700">無法載入商品資料</h2>
              <p className="text-gray-600">
                商品 ID: {productId} 無法載入，請檢查商品是否存在或重新整理頁面。
              </p>
              <div className="space-x-4">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                >
                  返回上一頁
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                >
                  重新整理
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 核心狀態：嚮導表單資料聚合
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

  // 提交狀態現在由本地狀態管理（原子化創建流程）

  /**
   * 編輯模式：當商品數據加載完成後，預填表單數據
   */
  useEffect(() => {
    if (isEditMode && productDetail) {
      // 🔧 修復：記錄編輯模式資料載入
      console.info('[CreateProductWizard] 編輯模式資料載入', {
        productId,
        numericProductId,
        productDetail
      });
      
      // 🎯 零容忍：現在 productDetail 直接是 ProcessedProduct | null 類型
      const productData = productDetail;

              // 判斷是否為多規格商品（有屬性或有多個變體）
        // 現在可以直接安全地訪問 attributes 和 variants，因為 useProductDetail 保證了它們的存在
        const attributes = productData.attributes || [];
        const variants = productData.variants || [];
        
        const hasAttributes = attributes.length > 0;
        const hasMultipleVariants = variants.length > 1;
        const hasAttributeValues = variants.some(
          (variant: import('@/hooks/queries/useEntityQueries').ProcessedProductVariant) =>
            variant.attribute_values && variant.attribute_values.length > 0,
        );
        const isVariable = hasAttributes || hasMultipleVariants || hasAttributeValues;

      // 建構屬性值映射（用於變體配置）
      const attributeValues: Record<number, string[]> = {};

      if (hasAttributes && attributes.length > 0 && variants.length > 0) {
        // 遍歷每個屬性，收集所有可能的屬性值
        attributes.forEach((attr: import('@/hooks/queries/useEntityQueries').ProcessedProductAttribute) => {
          const values = new Set<string>();

          // 從現有變體中提取屬性值
          variants.forEach((variant: import('@/hooks/queries/useEntityQueries').ProcessedProductVariant) => {
            if (variant.attribute_values) {
              variant.attribute_values.forEach((attrVal: import('@/hooks/queries/useEntityQueries').ProcessedProductAttributeValue) => {
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
      const variantItems = variants.map((variant: import('@/hooks/queries/useEntityQueries').ProcessedProductVariant, index: number) => {
        // 從屬性值中建構選項
        const options =
          variant.attribute_values?.map((attrVal: import('@/hooks/queries/useEntityQueries').ProcessedProductAttributeValue) => ({
            attributeId: attrVal.attribute_id,
            value: attrVal.value,
          })) || [];

        // 確保價格正確轉換：如果有價格就使用實際價格，否則為空字符串
        const priceValue =
          variant.price !== null && variant.price !== undefined
            ? variant.price.toString()
            : "";

        return {
          key: `variant-${index}`,
          id: variant.id, // 保存變體 ID 用於編輯模式
          options,
          sku: variant.sku || "",
          price: priceValue,
        };
      });

      // 轉換商品數據為嚮導表單格式
      const transformedData: WizardFormData = {
        basicInfo: {
          name: productData.name || "",
          description: productData.description || "",
          category_id: productData.category_id || null,
        },
        imageData: {
          selectedFile: null,
          // 如果商品有圖片，使用原圖 URL 作為預覽（現在可以安全訪問）
          previewUrl:
            productData.image_url || productData.thumbnail_url || null,
        },
        specifications: {
          isVariable: isVariable,
          selectedAttributes: hasAttributes
            ? attributes.map((attr: import('@/hooks/queries/useEntityQueries').ProcessedProductAttribute) => attr.id)
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
      };

      // 預填表單數據
      setFormData(transformedData);
    }
  }, [isEditMode, productDetail, numericProductId]);

  /**
   * 更新表單資料的通用函數
   * 使用 useCallback 記憶化以避免無限渲染循環
   */
  const updateFormData = useCallback(
    <K extends keyof WizardFormData>(
      section: K,
      data: Partial<WizardFormData[K]>,
    ) => {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          ...data,
        },
      }));
    },
    [],
  ); // 空依賴陣列，因為 setFormData 是穩定的

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

        return formData.variants.items.every((variant) => {
          // 檢查 SKU
          if (!variant.sku || variant.sku.trim() === "") {
            return false;
          }

          // 檢查價格
          if (!variant.price || variant.price.trim() === "") {
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
        return formData.variants.items.every((variant) => {
          const hasValidSku = variant.sku && variant.sku.trim().length > 0;
          const hasValidPrice =
            variant.price && variant.price.trim().length > 0;
          const priceIsNumber =
            !isNaN(parseFloat(variant.price || "")) &&
            parseFloat(variant.price || "") > 0;

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
      let errorMessage = "請完成當前步驟的必填資訊";

      switch (step) {
        case 1:
          errorMessage = "請輸入商品名稱";
          break;
        case 2:
          if (
            formData.specifications.isVariable &&
            formData.specifications.selectedAttributes.length === 0
          ) {
            errorMessage = "多規格商品必須選擇至少一個屬性";
          }
          break;
        case 3:
          if (formData.variants.items.length === 0) {
            errorMessage = "請先配置商品變體";
          } else {
            const missingSkuVariants = formData.variants.items.filter(
              (v) => !v.sku || !v.sku.trim(),
            );
            const missingPriceVariants = formData.variants.items.filter(
              (v) => !v.price || !v.price.trim(),
            );
            const invalidPriceVariants = formData.variants.items.filter((v) => {
              const price = parseFloat(v.price || "");
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
          errorMessage = "請確認所有資訊無誤";
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
      toast.error("請確認所有資訊無誤");
      return;
    }

    try {
      setIsSubmitting(true);

      let productResult: ProductCreationResult | unknown;
      let productName: string;

      // 步驟1：判斷創建模式並選擇合適的 API 通道 (v3.0 雙軌制 API)
      if (isEditMode && numericProductId) {
        // 🔧 修復：編輯模式使用驗證過的 numericProductId
        console.info('[CreateProductWizard] 執行商品更新', {
          productId,
          numericProductId
        });
        
        // 編輯模式：始終使用完整的多規格 API
        const apiPayload = transformWizardDataToApiPayload(
          formData,
          attributesData,
        );

        toast.loading("正在更新商品資訊...", { id: "submit-progress" });

        productResult = await updateProductMutation.mutateAsync({
          id: numericProductId,
          ...apiPayload,
        });

        productName = apiPayload.name;

        toast.success("商品資訊更新成功！", {
          id: "submit-progress",
          description: `商品「${productName}」已成功更新`,
        });
      } else {
        // 創建模式：統一使用多規格 API（支援單規格和多規格）
        const apiPayload = transformWizardDataToApiPayload(
          formData,
          attributesData,
        );

        const isSingleVariant = !formData.specifications.isVariable;

        toast.loading(
          isSingleVariant ? "正在創建單規格商品..." : "正在創建多規格商品...", 
          { id: "submit-progress" }
        );

        productResult = await createProductMutation.mutateAsync(apiPayload);
        productName = apiPayload.name;

        toast.success(
          isSingleVariant ? "單規格商品創建成功！" : "多規格商品創建成功！",
          {
            id: "submit-progress",
            description: isSingleVariant 
              ? `商品「${productName}」已成功創建為單規格商品`
              : `商品「${productName}」已成功創建，包含 ${apiPayload.variants.length} 個變體`,
          }
        );
      }

      // 步驟3：處理圖片上傳（如果有選擇圖片）
      const typedProductResult = productResult as ProductCreationResult;
      if (formData.imageData.selectedFile && typedProductResult?.data?.id) {
        try {
          toast.loading("正在上傳商品圖片...", { id: "image-progress" });

          await uploadImageMutation.mutateAsync({
            productId: typedProductResult.data.id,
            image: formData.imageData.selectedFile,
          });

          toast.success("商品圖片上傳成功！", {
            id: "image-progress",
            description: "圖片已成功關聯到商品",
          });
        } catch (imageError) {
          // 圖片上傳失敗，但商品已創建成功

          toast.warning("商品創建成功，但圖片上傳失敗", {
            id: "image-progress",
            description: "您可以稍後在編輯頁面重新上傳圖片",
            duration: 6000,
          });
        }
      }

      // 步驟4：成功完成，跳轉頁面
      toast.success("✅ 所有操作完成！", {
        description: `商品「${productName}」已成功${isEditMode ? "更新" : "創建"}${formData.imageData.selectedFile ? "並上傳圖片" : ""}`,
      });

      // 延遲跳轉，讓用戶看到成功提示
      setTimeout(() => {
        router.push("/products");
      }, 1500);
    } catch (error) {
      // 主要錯誤處理

      toast.error(`商品${isEditMode ? "更新" : "創建"}失敗`, {
        id: "submit-progress",
        description:
          error instanceof Error ? error.message : "請檢查輸入資料並重試",
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
            productId={isEditMode ? numericProductId : undefined}
            isEditMode={isEditMode}
            data-oid="m_p_oo9"
          />
        );

      case 2:
        return <Step2_DefineSpecs {...commonProps} data-oid="ol-kbjr" />;
      case 3:
        return <Step3_ConfigureVariants {...commonProps} data-oid="nzdy7m3" />;
      case 4:
        return <Step4_Review {...commonProps} data-oid="ih0fx-i" />;
      default:
        return <div data-oid="n93x8n4">未知步驟</div>;
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
      return <EditProductFormSkeleton data-oid="9.bvyuv" />;
    }

    // 載入錯誤或找不到商品
    if (productError || !productDetail) {
      return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8" data-oid="ys4me2q">
          <Card
            className="border-destructive/50 bg-destructive/5"
            data-oid="e6_u5t9"
          >
            <CardContent className="pt-6" data-oid="vdq4hl2">
              <div
                className="flex flex-col items-center text-center"
                data-oid="_14hzqi"
              >
                <div
                  className="rounded-full bg-destructive/10 p-3 mb-4"
                  data-oid="kzhhwtx"
                >
                  <svg
                    className="h-6 w-6 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    data-oid="wcgdok4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                      data-oid="5c9:cvp"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2" data-oid="kjoc9:4">
                  無法載入商品
                </h3>
                <p className="text-muted-foreground mb-4" data-oid="f9r23_w">
                  {productError instanceof Error
                    ? productError.message
                    : "找不到指定的商品，請確認商品是否存在"}
                </p>
                <Button
                  onClick={() => router.push("/products")}
                  variant="outline"
                  data-oid="7izz1-b"
                >
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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8" data-oid="7lrk8px">
      {/* --- 頁面標題 --- */}
      <div className="mb-8" data-oid="7xr8zyo">
        <h1 className="text-3xl font-bold tracking-tight" data-oid="twhc4ms">
          {isEditMode ? "編輯商品" : "新增商品"}
        </h1>
        <p className="text-muted-foreground" data-oid="lnwnj7n">
          {isEditMode
            ? "透過引導式流程，輕鬆更新您的商品"
            : "透過引導式流程，輕鬆創建您的商品"}
        </p>
      </div>

      {/* --- 統一的內容容器 --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8" data-oid="q_p6vz.">
        {/* --- 左欄：步驟指示器 --- */}
        <aside className="md:col-span-1" data-oid="aq9jh1h">
          {/* 進度概覽 */}
          <div className="mb-6" data-oid="qxp9wq:">
            <div
              className="flex items-center justify-between mb-2"
              data-oid="mn2ac2z"
            >
              <span className="text-sm font-medium" data-oid="tg:z_km">
                創建進度
              </span>
              <Badge variant="outline" className="text-xs" data-oid="6mwxh1i">
                {Math.round(progressPercentage)}% 完成
              </Badge>
            </div>
            <Progress
              value={progressPercentage}
              className="w-full h-2"
              data-oid="o7458yj"
            />
          </div>

          {/* 步驟列表 */}
          <div className="space-y-2" data-oid="k4bfpl5">
            {STEPS.map((stepInfo, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < step;
              const isCurrent = stepNumber === step;

              return (
                <div
                  key={stepInfo.id}
                  className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                    isCurrent
                      ? "bg-primary/10 border border-primary/20"
                      : isCompleted
                        ? "bg-muted/50"
                        : "bg-transparent"
                  }`}
                  data-oid="28t.0zc"
                >
                  {/* 步驟圖標 */}
                  <div className="flex-shrink-0 mt-0.5" data-oid="u_9i8j4">
                    {isCompleted ? (
                      <CheckCircle
                        className="h-5 w-5 text-primary"
                        data-oid="zafbrer"
                      />
                    ) : isCurrent ? (
                      <div
                        className="h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                        data-oid="833knvd"
                      >
                        <span
                          className="text-primary-foreground text-xs font-medium"
                          data-oid="53mbfc7"
                        >
                          {stepNumber}
                        </span>
                      </div>
                    ) : (
                      <Circle
                        className="h-5 w-5 text-muted-foreground"
                        data-oid="_sf4yf-"
                      />
                    )}
                  </div>

                  {/* 步驟資訊 */}
                  <div className="flex-1 min-w-0" data-oid="rs0-1qk">
                    <div
                      className={`text-sm font-medium ${
                        isCurrent
                          ? "text-foreground"
                          : isCompleted
                            ? "text-muted-foreground"
                            : "text-muted-foreground"
                      }`}
                      data-oid="a0uw006"
                    >
                      {stepInfo.title}
                    </div>
                    <div
                      className="text-xs text-muted-foreground mt-0.5"
                      data-oid="c8v-64l"
                    >
                      {stepInfo.description}
                    </div>

                    {/* 當前步驟標示 */}
                    {isCurrent && (
                      <div
                        className="flex items-center mt-1.5 text-xs text-primary"
                        data-oid="4mzr6sl"
                      >
                        <div
                          className="h-1.5 w-1.5 bg-primary rounded-full mr-2 animate-pulse"
                          data-oid="la_tilk"
                        ></div>
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
        <main className="md:col-span-3" data-oid="sl0o89u">
          {/* 當前步驟內容 - 讓每個步驟組件自行定義 Card 樣式 */}
          {renderCurrentStep()}

          {/* 底部導航控制 */}
          <div
            className="mt-6 flex items-center justify-between"
            data-oid="yyr0:6e"
          >
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={step === 1 || isSubmitting}
              data-oid="vx0chfa"
            >
              <ArrowLeft className="mr-2 h-4 w-4" data-oid="saxa7z:" />
              上一步
            </Button>

            <div className="text-sm text-muted-foreground" data-oid="m3_-2i6">
              步驟 {step} / {STEPS.length}
            </div>

            {step < STEPS.length ? (
              <Button
                onClick={handleNextStep}
                disabled={!validateStep(step) || isSubmitting}
                data-oid="b6e5dz1"
              >
                下一步
                <ArrowRight className="ml-2 h-4 w-4" data-oid="3io_bqe" />
              </Button>
            ) : (
              <Button
                onClick={handleFinalSubmit}
                disabled={!validateStep(step) || isSubmitting}
                variant="default"
                data-oid="4g9gte5"
              >
                {isSubmitting && (
                  <Loader2
                    className="mr-2 h-4 w-4 animate-spin"
                    data-oid="sjl7hu6"
                  />
                )}
                {isSubmitting
                  ? isEditMode
                    ? "更新中..."
                    : "創建中..."
                  : isEditMode
                    ? "完成更新"
                    : "完成創建"}
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
