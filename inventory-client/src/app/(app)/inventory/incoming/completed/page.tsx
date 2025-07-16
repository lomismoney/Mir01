"use client";

import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/ui/skeleton";

// 動態導入進貨管理組件
const PurchaseManagement = lazy(() => import("@/components/purchases/PurchaseManagement").then(module => ({ default: module.PurchaseManagement })));

/**
 * 已完成進貨單管理頁面
 *
 * 功能概述：
 * - 查看所有已完成和已取消的進貨單
 * - 追蹤歷史進貨記錄
 * - 查看進貨詳情和備註
 */
export default function CompletedPurchasesPage() {
  return (
    <Suspense fallback={<LoadingFallback type="page" text="載入已完成進貨單..." />}>
      <PurchaseManagement statusFilter={["completed", "cancelled"]} />
    </Suspense>
  );
}