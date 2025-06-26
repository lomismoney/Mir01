"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTransferList } from "./InventoryTransferList";
import { InventoryTransferDialog } from "./InventoryTransferDialog";

export default function InventoryTransfer() {
  const handleTransferSuccess = () => {
    // 成功回調將在 Dialog 內部處理，這裡可以添加額外的邏輯
  };
  return (
    <Card data-oid="6m2zs09">
      <CardHeader
        className="flex flex-row items-center justify-between"
        data-oid="h-4-hcf"
      >
        <CardTitle data-oid="k4ultqy">庫存轉移管理</CardTitle>
        <InventoryTransferDialog
          onSuccess={handleTransferSuccess}
          data-oid="b5yd:tx"
        />
      </CardHeader>
      <CardContent data-oid="..k_p_w">
        <InventoryTransferList data-oid="786ln3a" />
      </CardContent>
    </Card>
  );
}
