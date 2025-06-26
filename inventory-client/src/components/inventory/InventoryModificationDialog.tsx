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
    <Dialog open={open} onOpenChange={setOpen} data-oid="im9:s8x">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
        data-oid="lihn44e"
      >
        <ArrowUpDown className="h-4 w-4" data-oid="-i0746t" />
        <span className="sr-only" data-oid="kb26d.7">
          修改庫存
        </span>
      </Button>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-oid="t96axg8"
      >
        <DialogHeader data-oid="cv9wdfv">
          <DialogTitle data-oid="ioqvn_z">修改庫存</DialogTitle>
          <DialogDescription data-oid="mbxjfk5">
            調整指定商品的庫存數量（增加、減少或設定）
          </DialogDescription>
          {productName && (
            <div
              className="mt-4 p-3 bg-muted/50 rounded-lg space-y-1"
              data-oid="gqbsb4j"
            >
              <div className="font-medium" data-oid="2s_434p">
                {productName}
              </div>
              {sku && (
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="ujsw:8n"
                >
                  SKU: {sku}
                </div>
              )}
              <div className="text-sm" data-oid="_71_8gd">
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
          data-oid="t490m-9"
        />
      </DialogContent>
    </Dialog>
  );
}
