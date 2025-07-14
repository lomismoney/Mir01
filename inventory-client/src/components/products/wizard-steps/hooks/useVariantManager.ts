import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { WizardFormData } from "../../CreateProductWizard";
import { VariantItem, useVariantGenerator } from "./useVariantGenerator";

interface UseVariantManagerProps {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>,
  ) => void;
}

export function useVariantManager({ formData, updateFormData }: UseVariantManagerProps) {
  // 本地狀態：批量價格設定
  const [bulkPrice, setBulkPrice] = useState("");
  const [autoSku, setAutoSku] = useState(true);

  // 用於追蹤是否已經初始化過變體數據
  const isInitialized = useRef(false);

  // 使用變體生成器
  const { generateVariants } = useVariantGenerator({ formData });

  /**
   * 自動生成 SKU
   */
  const generateAutoSku = useCallback((variant: VariantItem, index: number): string => {
    // 生成唯一後綴：使用時間戳和隨機數確保唯一性
    const timestamp = Date.now().toString().slice(-6); // 取時間戳後6位
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase(); // 3位隨機字符
    
    if (!formData.specifications.isVariable) {
      return `${formData.basicInfo.name.substring(0, 3).toUpperCase()}-${timestamp}-${randomSuffix}`;
    }

    const productPrefix = formData.basicInfo.name.substring(0, 3).toUpperCase();
    const attributeParts = variant.options
      .map(({ value }) => value.substring(0, 2).toUpperCase())
      .join("");

    return `${productPrefix}-${attributeParts}-${timestamp}-${randomSuffix}`;
  }, [formData.basicInfo.name, formData.specifications.isVariable]);

  /**
   * 初始化或更新變體資料
   * 修復：避免在編輯模式下覆蓋已有的變體數據
   */
  useEffect(() => {
    const currentVariants = formData.variants.items;
    const newVariants = generateVariants;

    // 如果已有變體數據且包含價格信息，說明是編輯模式，不要覆蓋
    const hasExistingPriceData = currentVariants.some(
      (v) => v.price && v.price !== "",
    );

    // 如果已經初始化過且存在價格數據，跳過自動更新
    if (isInitialized.current && hasExistingPriceData) {
      return;
    }

    // 改進的合併邏輯：優先保留現有變體的所有數據
    const mergedVariants = newVariants.map((newVariant, index) => {
      // 嘗試通過 key 匹配
      let existing = currentVariants.find((v) => v.key === newVariant.key);

      // 如果通過 key 找不到，嘗試通過索引匹配（向後兼容）
      if (!existing && currentVariants[index]) {
        existing = currentVariants[index];
      }

      // 如果找到現有變體，保留其所有數據，只更新 options（如果需要）
      if (existing) {
        return {
          ...existing,
          key: newVariant.key, // 確保 key 是最新的格式
          options: newVariant.options, // 更新 options 以反映最新的屬性配置
        };
      }

      // 如果沒有找到現有變體，使用新生成的
      return newVariant;
    });

    // 如果啟用自動 SKU，生成 SKU（但不覆蓋已有的 SKU）
    if (autoSku) {
      mergedVariants.forEach((variant, index) => {
        if (!variant.sku) {
          variant.sku = generateAutoSku(variant, index);
        }
      });
    }

    // 只有在數據真的需要更新時才更新
    const needsUpdate =
      JSON.stringify(mergedVariants) !== JSON.stringify(currentVariants);

    if (needsUpdate) {
      updateFormData("variants", {
        items: mergedVariants,
      });
    }

    // 標記為已初始化
    isInitialized.current = true;
  }, [generateVariants, autoSku, formData.variants.items, generateAutoSku, updateFormData]);

  /**
   * 處理變體欄位變更
   */
  const handleVariantChange = (
    variantKey: string,
    field: "sku" | "price",
    value: string,
  ) => {
    const updatedVariants = formData.variants.items.map((variant) =>
      variant.key === variantKey ? { ...variant, [field]: value } : variant,
    );

    updateFormData("variants", {
      items: updatedVariants,
    });
  };

  /**
   * 批量設定價格
   */
  const handleBulkPriceSet = () => {
    if (!bulkPrice.trim()) {
      toast.error("請輸入價格");
      return;
    }

    const price = parseFloat(bulkPrice);
    if (isNaN(price) || price < 0) {
      toast.error("請輸入有效的價格");
      return;
    }

    const updatedVariants = formData.variants.items.map((variant) => ({
      ...variant,
      price: bulkPrice,
    }));

    updateFormData("variants", {
      items: updatedVariants,
    });

    toast.success(`已為所有變體設定價格：$${bulkPrice}`);
  };

  /**
   * 重新生成所有 SKU
   */
  const handleRegenerateSkus = () => {
    const updatedVariants = formData.variants.items.map((variant, index) => ({
      ...variant,
      sku: generateAutoSku(variant, index),
    }));

    updateFormData("variants", {
      items: updatedVariants,
    });

    toast.success("已重新生成所有 SKU");
  };

  return {
    bulkPrice,
    setBulkPrice,
    autoSku,
    setAutoSku,
    handleVariantChange,
    handleBulkPriceSet,
    handleRegenerateSkus,
    generateAutoSku,
  };
}