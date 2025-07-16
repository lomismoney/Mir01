"use client";

import { lazy, Suspense } from "react";
import { LoadingFallback } from "@/components/ui/skeleton";

// 動態導入進貨管理組件
const PurchaseManagement = lazy(() => import("@/components/purchases/PurchaseManagement").then(module => ({ default: module.PurchaseManagement })));

/**
 * 商品入庫管理頁面
 *
 * 功能概述：
 * - 專注處理商品入庫操作
 * - 查看入庫歷史記錄
 * - 追蹤入庫進度和狀態
 * - 顯示操作者信息
 */
export default function IncomingPage() {
  return (
    <Suspense fallback={<LoadingFallback type="page" text="載入進貨管理..." />}>
      <PurchaseManagement statusFilter={["pending", "confirmed", "in_transit", "received", "partially_received"]} />
    </Suspense>
  );
}
