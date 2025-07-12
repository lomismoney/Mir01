"use client";

import { Package } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { WizardFormData } from "../CreateProductWizard";
import { useAttributes } from "@/hooks";
import { Attribute } from "@/types/products";

// 導入重構後的hooks
import { useVariantManager } from "./hooks/useVariantManager";
import { useVariantStats } from "./hooks/useVariantStats";

// 導入重構後的組件
import { BulkOperations } from "./components/BulkOperations";
import { VariantConfigTable } from "./components/VariantConfigTable";
import { VariantStatsCards } from "./components/VariantStatsCards";

/**
 * 步驟3組件Props
 */
interface Step3Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>,
  ) => void;
}

/**
 * 步驟3：變體配置組件
 *
 * 功能包含：
 * - 自動生成變體組合
 * - SKU 編號配置
 * - 價格設定
 * - 批量操作工具
 */
export function Step3_ConfigureVariants({
  formData,
  updateFormData,
}: Step3Props) {
  // 獲取屬性資料
  const { data: attributesData } = useAttributes();
  const attributes: Attribute[] = Array.isArray(attributesData)
    ? attributesData
    : [];

  // 使用重構後的hooks
  const {
    bulkPrice,
    setBulkPrice,
    handleVariantChange,
    handleBulkPriceSet,
    handleRegenerateSkus,
  } = useVariantManager({ formData, updateFormData });

  const {
    canProceed,
    skuProgress,
    priceProgress,
    totalValue,
    variantsCount,
  } = useVariantStats({ formData });

  const variants = formData.variants.items;

  return (
    <div className="space-y-6">
      {/* 步驟說明 */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center space-x-2">
          <Package className="h-6 w-6 text-primary" />
          <span>設定變體</span>
        </h2>
        <p className="text-muted-foreground">
          為您的商品變體設定 SKU 編號和價格資訊。
        </p>
      </div>

      {/* 批量操作工具 */}
      <BulkOperations
        variantsCount={variantsCount}
        bulkPrice={bulkPrice}
        setBulkPrice={setBulkPrice}
        onBulkPriceSet={handleBulkPriceSet}
        onRegenerateSkus={handleRegenerateSkus}
      />

      {/* 變體配置表格 */}
      <VariantConfigTable
        formData={formData}
        variants={variants}
        attributes={attributes}
        onVariantChange={handleVariantChange}
      />

      {/* 配置摘要 */}
      <VariantStatsCards
        variantsCount={variantsCount}
        skuProgress={skuProgress}
        priceProgress={priceProgress}
        totalValue={totalValue}
      />

      {/* 進度提示 */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>進度提示：</strong>
          {canProceed
            ? "所有變體的 SKU 和價格都已配置完成，可以進入下一步進行最終確認。"
            : "請確保所有變體都有設定 SKU 編號和有效的價格才能進入下一步。"}
        </AlertDescription>
      </Alert>
    </div>
  );
}