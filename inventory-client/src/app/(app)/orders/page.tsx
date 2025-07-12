"use client";

import React, { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// 動態導入訂單組件
const OrderClientComponent = lazy(() => import("@/components/orders/OrderClientComponent").then(module => ({ default: module.OrderClientComponent })));

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          訂單管理
        </h2>
        <p className="text-muted-foreground">
          管理您的所有銷售訂單、追蹤出貨與付款狀態。
        </p>
      </div>

      {/* 渲染我們的主力部隊組件 - 使用 Suspense 包裝動態導入組件 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-64 rounded-lg border bg-card">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">載入訂單列表...</p>
            </div>
          </div>
        }
      >
        <OrderClientComponent />
      </Suspense>
    </div>
  );
}
