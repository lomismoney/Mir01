"use client";

import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

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
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 rounded-lg border bg-card">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">載入進貨管理...</p>
          </div>
        </div>
      }
    >
      <PurchaseManagement />
    </Suspense>
  );
}
