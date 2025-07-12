import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAttributes, useCreateProduct } from "@/hooks";
import { type Attribute, type ProductSubmissionData } from "@/types/products";
import { toast } from "sonner";

/**
 * 商品表單資料介面
 */
interface ProductFormData {
  name: string;
  description?: string;
  category_id?: number | null;
}

/**
 * SKU 變體的臨時資料結構
 */
interface VariantData {
  /** 由規格值 ID 組成的唯一鍵，例如 "1-3" 代表 "紅色-S" */
  key: string;
  /** 屬性選項陣列 */
  options: { attributeId: number; value: string }[];
  /** SKU 編號 */
  sku: string;
  /** 價格 */
  price: string;
}

export function useProductForm(initialData: Partial<ProductFormData> = {}) {
  const router = useRouter();

  // 獲取屬性資料
  const {
    data: attributesData,
    isLoading: attributesLoading,
    error: attributesError,
  } = useAttributes();

  // 商品創建 Mutation
  const createProductMutation = useCreateProduct();

  // 確保類型安全的屬性資料
  const attributes: Attribute[] = Array.isArray(attributesData)
    ? attributesData
    : [];

  // 表單載入狀態
  const isLoading = createProductMutation.isPending;

  // 基本表單狀態
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData.name || "",
    description: initialData.description || "",
    category_id: initialData.category_id || null,
  });

  // 規格相關狀態
  const [isVariable, setIsVariable] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Set<number>>(new Set());
  const [optionsMap, setOptionsMap] = useState<Record<number, string[]>>({});
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

  // SKU 變體狀態
  const [variants, setVariants] = useState<VariantData[]>([]);

  /**
   * 檢查是否可以生成變體
   * 至少選擇一個屬性且該屬性至少有一個值
   */
  const canGenerateVariants = useMemo(() => {
    if (selectedAttrs.size === 0) return false;

    for (const attributeId of selectedAttrs) {
      const values = optionsMap[attributeId] || [];
      if (values.length === 0) return false;
    }

    return true;
  }, [selectedAttrs, optionsMap]);

  /**
   * 處理基本表單欄位變更
   */
  const handleFieldChange = (
    field: keyof ProductFormData,
    value: string | number | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return {
    // 狀態
    formData,
    isVariable,
    selectedAttrs,
    optionsMap,
    inputValues,
    variants,
    attributes,
    canGenerateVariants,
    isLoading,
    attributesLoading,
    attributesError,

    // 設置器
    setFormData,
    setIsVariable,
    setSelectedAttrs,
    setOptionsMap,
    setInputValues,
    setVariants,

    // 處理函數
    handleFieldChange,

    // API
    createProductMutation,
    router,
  };
}