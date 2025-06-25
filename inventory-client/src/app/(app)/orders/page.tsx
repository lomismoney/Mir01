import React from "react";
import { OrderClientComponent } from "@/components/orders/OrderClientComponent"; // <-- 新增導入

export default function OrdersPage() {
  return (
    <div className="space-y-6" data-oid="v.bey71">
      <div data-oid="v5fjyjq">
        <h2 className="text-2xl font-bold" data-oid="6l32p4b">
          訂單管理
        </h2>
        <p className="text-muted-foreground" data-oid="nddy11e">
          管理您的所有銷售訂單、追蹤出貨與付款狀態。
        </p>
      </div>

      {/* 渲染我們的主力部隊組件 */}
      <OrderClientComponent data-oid="0vt3xwe" />
    </div>
  );
}
