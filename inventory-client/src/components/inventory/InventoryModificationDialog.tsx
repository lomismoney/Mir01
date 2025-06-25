"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowUpDown } from "lucide-react";
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm";

interface InventoryModificationDialogProps {
  productVariantId: number;
  currentQuantity: number;
  storeId?: number;
  productName?: string;
  sku?: string;
  onSuccess?: () => void;
}

export function InventoryModificationDialog({
  productVariantId,
  currentQuantity,
  storeId,
  productName,
  sku,
  onSuccess,
}: InventoryModificationDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} data-oid="p9m9c7r">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        data-oid="ewc_430"
      >
        <ArrowUpDown className="h-4 w-4" data-oid="ly_rtjg" />
        <span className="sr-only" data-oid="tvk5e.k">
          修改庫存
        </span>
      </Button>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-oid="p2s0548"
      >
        <DialogHeader data-oid="xp7fsk6">
          <DialogTitle data-oid=":6hcl9e">修改庫存</DialogTitle>
          <DialogDescription data-oid="vf-egoq">
            調整指定商品的庫存數量（增加、減少或設定）
          </DialogDescription>
          {productName && (
            <div
              className="mt-4 p-3 bg-muted/50 rounded-lg space-y-1"
              data-oid="i5m:0xq"
            >
              <div className="font-medium" data-oid="-.19-op">
                {productName}
              </div>
              {sku && (
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="140gvo5"
                >
                  SKU: {sku}
                </div>
              )}
              <div className="text-sm" data-oid="etbq2be">
                目前庫存: {currentQuantity} 件
              </div>
            </div>
          )}
        </DialogHeader>
        <InventoryAdjustmentForm
          productVariantId={productVariantId}
          storeId={storeId}
          currentQuantity={currentQuantity}
          onSuccess={handleSuccess}
          dialogOpen={open}
          data-oid="ojpo:hy"
        />
      </DialogContent>
    </Dialog>
  );
}
