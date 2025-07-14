import { useMemo, useCallback } from "react";
import { WizardFormData } from "../../CreateProductWizard";

/**
 * 變體項目介面
 */
export interface VariantItem {
  key: string;
  options: { attributeId: number; value: string }[];
  sku: string;
  price: string;
}

interface UseVariantGeneratorProps {
  formData: WizardFormData;
}

export function useVariantGenerator({ formData }: UseVariantGeneratorProps) {
  /**
   * 生成笛卡爾積組合
   */
  const generateCartesianProduct = useCallback(<T,>(arrays: T[][]): T[][] => {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map((item) => [item]);

    const [first, ...rest] = arrays;
    const restProduct = generateCartesianProduct(rest);

    return first.flatMap((item) =>
      restProduct.map((combination) => [item, ...combination]),
    );
  }, []);

  /**
   * 生成變體組合
   */
  const generateVariants = useMemo(() => {
    if (!formData.specifications.isVariable) {
      // 單規格商品
      return [
        {
          key: "single",
          options: [],
          sku: "",
          price: "",
        },
      ] as VariantItem[];
    }

    const selectedAttributeIds = formData.specifications.selectedAttributes;
    if (selectedAttributeIds.length === 0) return [];

    // 準備屬性值陣列 - 使用選中的屬性值而非所有屬性值
    const attributeValueArrays = selectedAttributeIds.map((attributeId) => {
      // 優先使用 selectedAttributeValues，如果沒有則使用所有屬性值
      const values = formData.specifications.selectedAttributeValues?.[attributeId] || 
                     formData.specifications.attributeValues[attributeId] || [];
      return values.map((value) => ({ attributeId, value }));
    });

    // 生成組合
    const combinations = generateCartesianProduct(attributeValueArrays);

    return combinations.map((combination, index) => {
      // 修復：使用與 CreateProductWizard 一致的 key 格式
      const key = `variant-${index}`;
      return {
        key,
        options: combination,
        sku: "",
        price: "",
      } as VariantItem;
    });
  }, [formData.specifications, generateCartesianProduct]);

  return {
    generateVariants,
  };
}