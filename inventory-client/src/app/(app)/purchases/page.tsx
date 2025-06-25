"use client";

import { PurchaseManagement } from "@/components/purchases/PurchaseManagement";

/**
 * 進貨管理頁面
 *
 * 功能概述：
 * - 創建多項商品進貨單
 * - 管理運費和成本攤銷
 * - 自動計算平均成本和利潤
 */
export default function PurchasesPage() {
  return (
    <div className="container mx-auto p-4 md:p-8" data-oid="8a4acje">
      <PurchaseManagement data-oid="zfdm28r" />
    </div>
  );
}
