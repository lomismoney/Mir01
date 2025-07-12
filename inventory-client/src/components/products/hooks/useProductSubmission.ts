import { useRouter } from "next/navigation";
import { UseMutationResult } from "@tanstack/react-query";
import { type Attribute, type ProductSubmissionData } from "@/types/products";
import { toast } from "sonner";

/**
 * SKU 變體的臨時資料結構
 */
interface VariantData {
  key: string;
  options: { attributeId: number; value: string }[];
  sku: string;
  price: string;
}

/**
 * 商品表單資料介面
 */
interface ProductFormData {
  name: string;
  description?: string;
  category_id?: number | null;
}

interface UseProductSubmissionProps {
  createProductMutation: UseMutationResult<any, Error, ProductSubmissionData, unknown>;
  attributes: Attribute[];
}

export function useProductSubmission({
  createProductMutation,
  attributes,
}: UseProductSubmissionProps) {
  const router = useRouter();

  /**
   * 處理表單提交
   */
  const handleSubmit = async (
    formData: ProductFormData,
    isVariable: boolean,
    selectedAttrs: Set<number>,
    optionsMap: Record<number, string[]>,
    variants: VariantData[],
    e?: React.FormEvent
  ) => {
    if (e) e.preventDefault();

    // 防止重複提交
    if (createProductMutation.isPending) return;

    // === 1. 基礎數據驗證 ===
    if (!formData.name.trim()) {
      toast.error("請填寫商品名稱。");
      return;
    }

    if (isVariable && selectedAttrs.size === 0) {
      toast.error("多規格商品模式下，請至少選擇一個規格屬性。");
      return;
    }

    if (isVariable && variants.length === 0) {
      toast.error("多規格商品模式下，請至少生成一個規格組合 (SKU)。");
      return;
    }

    // 檢查已選屬性是否都有值
    if (isVariable) {
      for (const attrId of selectedAttrs) {
        const values = optionsMap[attrId] || [];
        if (values.length === 0) {
          const attribute = attributes.find(
            (attr: Attribute) => attr.id === attrId,
          );
          toast.error(`請為「${attribute?.name || "屬性"}」添加至少一個值`);
          return;
        }
      }
    }

    // === 2. 準備 API 請求的數據格式 ===
    try {
      // 準備正確的後端 API 格式
      const correctSubmissionData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        attributes: Array.from(selectedAttrs), // 整數陣列
        variants: isVariable
          ? variants.map((variant) => {
              // 將前端的 options 轉換為後端需要的格式
              const attributeValueIds = variant.options.map((opt) => {
                // 在 attributes 數據中尋找對應的 attribute_value_id
                const attribute = attributes.find(
                  (attr) => attr.id === opt.attributeId,
                );
                const attributeValue = attribute?.values?.find(
                  (val) => val.value === opt.value,
                );

                if (!attributeValue) {
                  throw new Error(
                    `找不到屬性值：${opt.value}（屬性：${attribute?.name || opt.attributeId}）`,
                  );
                }

                return attributeValue.id;
              });

              return {
                sku: variant.sku || "DEFAULT-SKU",
                price: parseFloat(variant.price) || 0,
                attribute_value_ids: attributeValueIds,
              };
            })
          : [],
      };

      // 使用正確的類型定義
      const submissionData: ProductSubmissionData = correctSubmissionData;

      // === 3. 調用實際的 API 端點 ===
      await createProductMutation.mutateAsync(submissionData);

      // 顯示成功訊息
      toast.success("商品創建成功！");

      // === 4. 成功後導航回商品列表 ===
      router.push("/products");
    } catch (error) {
      toast.error(`商品創建失敗：${(error as Error).message}`);
    }
  };

  return {
    handleSubmit,
  };
}