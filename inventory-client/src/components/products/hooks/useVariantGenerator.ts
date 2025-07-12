import { toast } from "sonner";

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

interface UseVariantGeneratorProps {
  selectedAttrs: Set<number>;
  optionsMap: Record<number, string[]>;
  variants: VariantData[];
  setVariants: (variants: VariantData[]) => void;
}

export function useVariantGenerator({
  selectedAttrs,
  optionsMap,
  variants,
  setVariants,
}: UseVariantGeneratorProps) {
  /**
   * 笛卡爾積輔助函數
   *
   * 計算多個陣列的笛卡爾積，返回所有可能的組合
   * @param arrays 二維陣列，每個子陣列代表一個維度的可選值
   * @returns 所有可能組合的陣列
   */
  function cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>(
      (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
      [[]],
    );
  }

  /**
   * 生成規格組合
   *
   * 根據選中的屬性和其值，生成所有可能的 SKU 變體組合。
   * 使用笛卡爾積算法來計算所有可能的屬性值組合。
   */
  const handleGenerateVariants = () => {
    if (selectedAttrs.size === 0) {
      toast.error("請至少選擇一個規格屬性。");
      return;
    }

    // 準備用於計算笛卡爾積的二維陣列
    const optionsToCombine: { attributeId: number; value: string }[][] = [];
    for (const attrId of selectedAttrs) {
      const values = optionsMap[attrId];
      if (!values || values.length === 0) {
        toast.error("請為每一個已選的規格屬性，至少添加一個值。");
        return;
      }
      optionsToCombine.push(
        values.map((v) => ({ attributeId: attrId, value: v })),
      );
    }

    // 如果只有一個規格，不需要做笛卡爾積
    if (optionsToCombine.length === 0) {
      setVariants([]);
      return;
    }

    const combinations = cartesianProduct(optionsToCombine);

    // 將組合結果轉換為我們需要的 SKU 狀態格式
    const newVariants: VariantData[] = combinations.map((combo) => {
      // combo 是一個陣列，例如 [{ attrId: 1, value: '紅色' }, { attrId: 2, value: 'S' }]
      const key = combo
        .map((opt) => `${opt.attributeId}-${opt.value}`)
        .join("|");
      const defaultSku = combo.map((opt) => opt.value.toUpperCase()).join("-");

      return {
        key: key,
        options: combo,
        sku: defaultSku,
        price: "0.00",
      };
    });

    setVariants(newVariants);
    toast.success(`已成功生成 ${newVariants.length} 個規格組合！`);
  };

  return {
    handleGenerateVariants,
  };
}