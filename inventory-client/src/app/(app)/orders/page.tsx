import React from "react";
import { OrdersPageClient } from "@/components/orders/OrdersPageClient";

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

      <OrdersPageClient />
    </div>
  );
}
