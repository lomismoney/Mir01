import { useMemo } from "react";
import { WizardFormData } from "../../CreateProductWizard";

interface UseVariantStatsProps {
  formData: WizardFormData;
}

export function useVariantStats({ formData }: UseVariantStatsProps) {
  const variants = formData.variants.items;

  /**
   * 檢查是否可以進入下一步
   */
  const canProceed = useMemo(() => {
    return variants.every(
      (variant) =>
        variant.sku.trim() &&
        variant.price.trim() &&
        !isNaN(parseFloat(variant.price)),
    );
  }, [variants]);

  /**
   * SKU 配置進度
   */
  const skuProgress = useMemo(() => {
    const completedCount = variants.filter((v) => v.sku.trim()).length;
    const percentage = variants.length > 0 
      ? Math.round((completedCount / variants.length) * 100)
      : 0;
    
    return {
      percentage,
      completedCount,
      totalCount: variants.length,
      isComplete: completedCount === variants.length,
    };
  }, [variants]);

  /**
   * 價格配置進度
   */
  const priceProgress = useMemo(() => {
    const completedCount = variants.filter(
      (v) => v.price.trim() && !isNaN(parseFloat(v.price)),
    ).length;
    const percentage = variants.length > 0
      ? Math.round((completedCount / variants.length) * 100)
      : 0;
    
    return {
      percentage,
      completedCount,
      totalCount: variants.length,
      isComplete: completedCount === variants.length,
    };
  }, [variants]);

  /**
   * 總價值計算
   */
  const totalValue = useMemo(() => {
    return variants.reduce((sum, v) => {
      const price = parseFloat(v.price);
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  }, [variants]);

  return {
    canProceed,
    skuProgress,
    priceProgress,
    totalValue,
    variantsCount: variants.length,
  };
}