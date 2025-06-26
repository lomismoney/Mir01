"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowUpDown } from "lucide-react";
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm";

interface InventoryAdjustmentDialogProps {
  onSuccess?: () => void;
}

export function InventoryAdjustmentDialog({
  onSuccess,
}: InventoryAdjustmentDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} data-oid="tamcg38">
      <DialogTrigger asChild data-oid="71aij10">
        <Button variant="outline" size="sm" data-oid="0nz.2m7">
          <ArrowUpDown className="h-4 w-4 mr-2" data-oid="d344ief" />
          修改庫存
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-oid="mo_uea0"
      >
        <DialogHeader data-oid="wcpkqwi">
          <DialogTitle data-oid="k:665da">修改庫存</DialogTitle>
          <DialogDescription data-oid="bi9nj1u">
            調整指定商品的庫存數量（增加、減少或設定）
          </DialogDescription>
        </DialogHeader>
        <InventoryAdjustmentForm
          productVariantId={0}
          currentQuantity={0}
          onSuccess={handleSuccess}
          dialogOpen={open}
          data-oid="igzt5u9"
        />
      </DialogContent>
    </Dialog>
  );
}
