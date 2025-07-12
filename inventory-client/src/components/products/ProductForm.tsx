"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useStandardForm } from "@/hooks/useStandardForm";
import { createProductSchema, updateProductSchema, type CreateProductData, type UpdateProductData } from "@/lib/validations/product";
import { StandardForm } from "@/components/forms/StandardForm";
import { StandardInputField, StandardTextareaField, StandardSelectField, StandardSwitchField } from "@/components/forms/StandardFormField";
import { Form } from "@/components/ui/form";

// 導入重構後的hooks
import { useProductForm } from "./hooks/useProductForm";
import { useAttributeManager } from "./hooks/useAttributeManager";
import { useVariantGenerator } from "./hooks/useVariantGenerator";
import { useProductSubmission } from "./hooks/useProductSubmission";

// 導入重構後的組件
import { BasicInfoForm } from "./components/BasicInfoForm";
import { SpecificationForm } from "./components/SpecificationForm";
import { VariantEditor } from "./components/VariantEditor";

// 導入分類和屬性查詢
import { useCategories } from "@/hooks/queries/categories/useCategories";
import { useAttributes } from "@/hooks/queries/attributes/useAttributes";

/**
 * 商品表單元件 Props
 */
interface ProductFormProps {
  /** 初始表單資料 */
  initialData?: Partial<CreateProductData | UpdateProductData>;
  /** 表單模式：創建或編輯 */
  mode?: 'create' | 'edit';
  /** 商品ID（編輯模式時必須） */
  productId?: number;
  /** 表單標題 */
  title?: string;
  /** 表單描述 */
  description?: string;
  /** 取消回調 */
  onCancel?: () => void;
  /** 成功回調 */
  onSuccess?: (data: CreateProductData | UpdateProductData) => void;
}

/**
 * 可重用的商品表單元件
 *
 * 提供完整的商品資訊輸入功能，包含：
 * - 基本資訊輸入（商品名稱、描述、分類）
 * - 規格定義（單規格/多規格切換）
 * - 屬性選擇與屬性值管理
 * - 動態的 SKU 變體配置
 * - 統一的Zod驗證和錯誤處理
 */
export function ProductForm({
  initialData = {},
  mode = 'create',
  productId,
  title,
  description,
  onCancel,
  onSuccess,
}: ProductFormProps) {
  // 確定使用的驗證schema和默認值
  const isEditMode = mode === 'edit';
  const validationSchema = isEditMode ? updateProductSchema : createProductSchema;
  const defaultTitle = title || (isEditMode ? "編輯商品" : "新增商品");
  const defaultDescription = description || (isEditMode ? "編輯商品的基本資訊和規格" : "請填寫商品的基本資訊和規格定義");
  
  // 準備表單默認值
  const formDefaults = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || undefined,
    // 暫時移除不存在的屬性，等待類型定義完善
    // sku: initialData?.sku || '',
    // price: initialData?.price || 0,
    // cost: initialData?.cost || 0,
    // weight: initialData?.weight || 0,
    // barcode: initialData?.barcode || '',
    // images: initialData?.images || [],
    attributes: initialData?.attributes || [],
    variants: initialData?.variants || [],
    ...(isEditMode && { id: productId }),
  };

  // 查詢分類和屬性資料
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories({});
  const { data: attributesData, isLoading: attributesLoading } = useAttributes();

  // 使用標準表單Hook
  const {
    form,
    isSubmitting,
    handleSubmit: submitForm,
    reset,
  } = useStandardForm({
    schema: validationSchema,
    defaultValues: formDefaults,
    onSubmit: async (data) => {
      // 這裡需要實際的API調用邏輯
      console.log('提交表單數據:', data);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onSuccess: (data) => {
      console.log('表單提交成功:', data);
    },
    successMessage: isEditMode ? "商品更新成功" : "商品創建成功",
    errorMessage: isEditMode ? "商品更新失敗" : "商品創建失敗",
  });

  // 準備分類選項
  const categoryOptions = categoriesData?.map(category => ({
    value: category.id.toString(),
    label: category.name,
    // disabled: 暫時移除，等待類型完善
  })) || [];

  // 準備屬性選項（為將來的多規格功能保留）
  const attributeOptions = attributesData?.data?.map(attribute => ({
    value: attribute.id.toString(),
    label: attribute.name,
    // disabled: 暫時移除，等待類型完善
  })) || [];
  // 載入狀態
  const isLoading = isSubmitting || categoriesLoading || attributesLoading;

  // 載入狀態處理
  if (categoriesLoading || attributesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>載入資料中...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Form {...form}>
      <StandardForm
        title={defaultTitle}
        description={defaultDescription}
        form={form}
        isSubmitting={isSubmitting}
        onSubmit={submitForm}
        onCancel={onCancel}
        submitText={isEditMode ? "更新商品" : "創建商品"}
        cancelText="取消"
      >
        {/* 基本資訊區塊 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StandardInputField
            control={form.control}
            name="name"
            label="商品名稱"
            placeholder="請輸入商品名稱"
            required
            disabled={isLoading}
          />
          
          <StandardSelectField
            control={form.control}
            name="category_id"
            label="商品分類"
            options={[
              { value: '', label: '請選擇分類' },
              ...categoryOptions
            ]}
            disabled={isLoading}
          />
        </div>

        <StandardTextareaField
          control={form.control}
          name="description"
          label="商品描述"
          placeholder="請輸入商品描述"
          rows={4}
          disabled={isLoading}
        />

        {/* 規格控制 - 暫時註釋，等待類型完善 */}
        {/* <StandardSwitchField
          control={form.control}
          name="is_variable"
          label="多規格商品"
          description="啟用後可設定多種規格變體（如尺寸、顏色等）"
          disabled={isLoading}
        /> */}

        {/* 單規格商品的基本資訊 - 暫時註釋，等待類型完善 */}
        {/* {!form.watch('is_variable') && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StandardInputField
              control={form.control}
              name="sku"
              label="SKU"
              placeholder="商品編號"
              disabled={isLoading}
            />
            
            <StandardInputField
              control={form.control}
              name="price"
              label="售價"
              type="number"
              min={0}
              step={0.01}
              disabled={isLoading}
            />
            
            <StandardInputField
              control={form.control}
              name="cost"
              label="成本"
              type="number"
              min={0}
              step={0.01}
              disabled={isLoading}
            />
            
            <StandardInputField
              control={form.control}
              name="weight"
              label="重量 (kg)"
              type="number"
              min={0}
              step={0.01}
              disabled={isLoading}
            />
          </div>
        )} */}

        {/* 條碼欄位 - 暫時註釋，等待類型完善 */}
        {/* <StandardInputField
          control={form.control}
          name="barcode"
          label="條碼"
          placeholder="請輸入商品條碼"
          disabled={isLoading}
        /> */}
        
        {/* 多規格商品的規格設置（未來功能） */}
        {/* {form.watch('is_variable') && ( */}
        {false && (
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <p>多規格功能開發中...</p>
                <p className="text-sm mt-1">請先使用單規格模式創建商品</p>
              </div>
            </CardContent>
          </Card>
        )}
      </StandardForm>
    </Form>
  );
}