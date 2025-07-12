import { Suspense } from "react";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { CreateProductWizard } from "@/components/products/CreateProductWizard";

/**
 * 新增商品頁面（嚮導式流程版本）
 *
 * 安全特性：
 * - 由 Auth.js 中間件統一保護，無需頁面級認證檢查
 * - 在 Edge Runtime 中執行認證，效能更佳
 * - 自動重導向機制，用戶體驗更流暢
 *
 * 功能概述：
 * - 提供多步驟嚮導式商品創建流程
 * - 步驟1：基本資訊（名稱、描述、分類）
 * - 步驟2：規格定義（屬性選擇與管理）
 * - 步驟3：變體配置（SKU 生成與價格設定）
 * - 步驟4：預覽確認（最終檢查與提交）
 * - 整合真實 API 調用，支援完整的 SPU/SKU 架構
 */
export default function NewProductPage() {
  // Auth.js 中間件已確保只有已登入用戶才能到達此頁面
  return (
    <div>
      {/* 商品創建嚮導 */}
      <Suspense
        fallback={<DataTableSkeleton />}
       
      >
        <CreateProductWizard />
      </Suspense>
    </div>
  );
}
