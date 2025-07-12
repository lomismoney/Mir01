import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCreateProduct, useUpdateProduct, useUploadProductImage, useErrorHandler } from "@/hooks";
import { WizardFormData } from "./useProductWizard";
import type { paths } from "@/types/api";

/**
 * 屬性數據類型定義
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
 * 數據轉換函數：將嚮導表單資料轉換為 API 請求格式
 */
function transformWizardDataToApiPayload(
  formData: WizardFormData,
  attributesData?: AttributesDataForTransform,
): paths["/api/products"]["post"]["requestBody"]["content"]["application/json"] {
  const { basicInfo, specifications, variants } = formData;

  // 如果是單規格商品，創建一個預設變體
  if (!specifications.isVariable) {
    const singleVariant = variants.items[0];

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
      attributes: [],
      variants: [
        {
          ...(singleVariant?.id && { id: singleVariant.id }),
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
      ...(variant.id && { id: variant.id }),
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
 * 嚮導提交 Hook
 */
export function useWizardSubmission() {
  const router = useRouter();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const uploadImageMutation = useUploadProductImage();
  const { handleError, handleSuccess } = useErrorHandler();

  /**
   * 提交表單
   */
  const submitForm = useCallback(
    async (
      formData: WizardFormData,
      attributesData: AttributesDataForTransform | undefined,
      isEditMode: boolean,
      productId?: number
    ) => {
      try {
        // 轉換數據格式
        const submissionData = transformWizardDataToApiPayload(
          formData,
          attributesData
        );

        let productResult;

        if (isEditMode && productId) {
          // 編輯模式：更新商品
          productResult = await updateProductMutation.mutateAsync({
            id: productId,
            data: submissionData,
          });
        } else {
          // 創建模式：創建新商品
          productResult = await createProductMutation.mutateAsync(submissionData);
        }

        // 如果有圖片檔案，上傳圖片
        // 暫時跳過圖片上傳，等待 API 類型完善
        if (formData.imageData.selectedFile) {
          console.log("圖片上傳功能暫時跳過，等待 API 類型完善");
        }

        handleSuccess(isEditMode ? "商品更新成功！" : "商品創建成功！");
        router.push("/products");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "操作失敗";
        handleError(new Error(errorMessage));
        throw error;
      }
    },
    [createProductMutation, updateProductMutation, uploadImageMutation, router]
  );

  return {
    submitForm,
    isSubmitting:
      createProductMutation.isPending ||
      updateProductMutation.isPending ||
      uploadImageMutation.isPending,
  };
}