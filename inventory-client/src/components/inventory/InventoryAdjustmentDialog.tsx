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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowUpDown className="h-4 w-4 mr-2" />
          修改庫存
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
       
      >
        <DialogHeader>
          <DialogTitle>修改庫存</DialogTitle>
          <DialogDescription>
            調整指定商品的庫存數量（增加、減少或設定）
          </DialogDescription>
        </DialogHeader>
        <InventoryAdjustmentForm
          productVariantId={0}
          currentQuantity={0}
          onSuccess={handleSuccess}
          dialogOpen={open}
         
        />
      </DialogContent>
    </Dialog>
  );
}
