"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InventoryTransferList } from "./InventoryTransferList";
import { InventoryTransferDialog } from "./InventoryTransferDialog";

export default function InventoryTransfer() {
  const handleTransferSuccess = () => {
    // 成功回調將在 Dialog 內部處理，這裡可以添加額外的邏輯
  };
  return (
    <Card>
      <CardHeader
        className="flex flex-row items-center justify-between"
       
      >
        <CardTitle>庫存轉移管理</CardTitle>
        <InventoryTransferDialog
          onSuccess={handleTransferSuccess}
         
        />
      </CardHeader>
      <CardContent>
        <InventoryTransferList />
      </CardContent>
    </Card>
  );
}
