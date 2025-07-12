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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ArrowRightLeft className="h-4 w-4 mr-2" />
          新增轉移
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
       
      >
        <DialogHeader>
          <DialogTitle>新增庫存轉移</DialogTitle>
          <DialogDescription>
            在不同門市之間轉移庫存
          </DialogDescription>
        </DialogHeader>
        <InventoryTransferForm onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
