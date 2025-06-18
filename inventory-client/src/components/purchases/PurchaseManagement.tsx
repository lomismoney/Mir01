"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreatePurchaseDialog } from "@/components/purchases/CreatePurchaseDialog";

export function PurchaseManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">進貨管理</h2>
          <p className="text-muted-foreground">
            管理商品進貨，支援多項商品同時入庫並自動計算成本攤銷
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新增進貨單
        </Button>
      </div>

      {/* 進貨單列表 */}
      <Card>
        <CardHeader>
          <CardTitle>進貨記錄</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            暫時無進貨記錄。點擊上方「新增進貨單」開始管理進貨。
          </div>
        </CardContent>
      </Card>

      {/* 創建進貨單對話框 */}
      <CreatePurchaseDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
