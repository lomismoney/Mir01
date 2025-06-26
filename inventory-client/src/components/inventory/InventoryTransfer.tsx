"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTransferList } from "./InventoryTransferList";
import { InventoryTransferDialog } from "./InventoryTransferDialog";

export default function InventoryTransfer() {
  const handleTransferSuccess = () => {
    // 成功回調將在 Dialog 內部處理，這裡可以添加額外的邏輯
  };
  return (
    <Card data-oid="2i7yfn_">
      <CardHeader
        className="flex flex-row items-center justify-between"
        data-oid="fy60p-b"
      >
        <CardTitle data-oid="a:zrryk">庫存轉移管理</CardTitle>
        <InventoryTransferDialog
          onSuccess={handleTransferSuccess}
          data-oid="601h.j2"
        />
      </CardHeader>
      <CardContent data-oid="162q25.">
        <InventoryTransferList data-oid="u-19h0a" />
      </CardContent>
    </Card>
  );
}
