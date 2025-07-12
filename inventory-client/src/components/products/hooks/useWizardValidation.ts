import { useCallback } from "react";
import { toast } from "sonner";
import { WizardFormData } from "./useProductWizard";

/**
 * 嚮導驗證 Hook
 */
export function useWizardValidation() {
  /**
   * 驗證步驟1：基本資訊
   */
  const validateStep1 = useCallback((formData: WizardFormData): boolean => {
    const { basicInfo } = formData;

    if (!basicInfo.name || basicInfo.name.trim() === "") {
      toast.error("請填寫商品名稱");
      return false;
    }

    if (basicInfo.name.length > 100) {
      toast.error("商品名稱不能超過100個字符");
      return false;
    }

    if (basicInfo.description && basicInfo.description.length > 500) {
      toast.error("商品描述不能超過500個字符");
      return false;
    }

    return true;
  }, []);

  /**
   * 驗證步驟2：規格定義
   */
  const validateStep2 = useCallback((formData: WizardFormData): boolean => {
    const { specifications } = formData;

    if (specifications.isVariable) {
      // 多規格商品驗證
      if (specifications.selectedAttributes.length === 0) {
        toast.error("多規格商品請至少選擇一個規格屬性");
        return false;
      }

      // 檢查每個選中的屬性是否都有值
      for (const attrId of specifications.selectedAttributes) {
        const values = specifications.attributeValues[attrId];
        if (!values || values.length === 0) {
          toast.error("每個選中的規格屬性都必須至少添加一個值");
          return false;
        }
      }
    }

    return true;
  }, []);

  /**
   * 驗證步驟3：變體配置
   */
  const validateStep3 = useCallback((formData: WizardFormData): boolean => {
    const { variants, specifications } = formData;

    if (variants.items.length === 0) {
      toast.error("請至少配置一個商品變體");
      return false;
    }

    // 檢查每個變體的數據
    for (let i = 0; i < variants.items.length; i++) {
      const variant = variants.items[i];

      if (!variant.sku || variant.sku.trim() === "") {
        toast.error(`第 ${i + 1} 個變體的 SKU 不能為空`);
        return false;
      }

      if (!variant.price || variant.price.trim() === "") {
        toast.error(`第 ${i + 1} 個變體的價格不能為空`);
        return false;
      }

      const price = parseFloat(variant.price);
      if (isNaN(price) || price <= 0) {
        toast.error(`第 ${i + 1} 個變體的價格必須為大於0的有效數字`);
        return false;
      }

      // 檢查SKU是否重複
      const duplicateSkuIndex = variants.items.findIndex(
        (otherVariant, otherIndex) =>
          otherIndex !== i && otherVariant.sku === variant.sku
      );
      if (duplicateSkuIndex !== -1) {
        toast.error(`SKU "${variant.sku}" 重複，請確保每個變體的 SKU 唯一`);
        return false;
      }
    }

    return true;
  }, []);

  /**
   * 驗證步驟4：預覽確認
   */
  const validateStep4 = useCallback((formData: WizardFormData): boolean => {
    // 重新驗證前面所有步驟
    return (
      validateStep1(formData) &&
      validateStep2(formData) &&
      validateStep3(formData)
    );
  }, [validateStep1, validateStep2, validateStep3]);

  /**
   * 根據步驟號驗證對應步驟
   */
  const validateStep = useCallback((step: number, formData: WizardFormData): boolean => {
    switch (step) {
      case 1:
        return validateStep1(formData);
      case 2:
        return validateStep2(formData);
      case 3:
        return validateStep3(formData);
      case 4:
        return validateStep4(formData);
      default:
        return false;
    }
  }, [validateStep1, validateStep2, validateStep3, validateStep4]);

  /**
   * 驗證整個表單
   */
  const validateForm = useCallback((formData: WizardFormData): boolean => {
    return validateStep4(formData);
  }, [validateStep4]);

  return {
    validateStep1,
    validateStep2,
    validateStep3,
    validateStep4,
    validateStep,
    validateForm,
  };
}