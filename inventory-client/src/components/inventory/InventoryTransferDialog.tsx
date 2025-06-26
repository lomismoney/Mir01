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
import { ArrowRightLeft } from "lucide-react";
import { InventoryTransferForm } from "./InventoryTransferForm";

interface InventoryTransferDialogProps {
  onSuccess?: () => void;
}

export function InventoryTransferDialog({
  onSuccess,
}: InventoryTransferDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen} data-oid="bcziill">
      <DialogTrigger asChild data-oid="wxp4_06">
        <Button data-oid="hfo2-ys">
          <ArrowRightLeft className="h-4 w-4 mr-2" data-oid="wsityg0" />
          新增轉移
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-oid="-gc6ww-"
      >
        <DialogHeader data-oid="7w2wm7c">
          <DialogTitle data-oid="::7og7m">新增庫存轉移</DialogTitle>
          <DialogDescription data-oid="jc74q13">
            在不同門市之間轉移庫存
          </DialogDescription>
        </DialogHeader>
        <InventoryTransferForm onSuccess={handleSuccess} data-oid="ygn92z6" />
      </DialogContent>
    </Dialog>
  );
}
