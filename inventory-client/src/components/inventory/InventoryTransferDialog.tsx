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
    <Dialog open={open} onOpenChange={setOpen} data-oid="u_758vm">
      <DialogTrigger asChild data-oid=":aagy_h">
        <Button data-oid="nf6:d91">
          <ArrowRightLeft className="h-4 w-4 mr-2" data-oid="t0tsw_c" />
          新增轉移
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        data-oid="h0dks_4"
      >
        <DialogHeader data-oid="1st6:1z">
          <DialogTitle data-oid="woms2-0">新增庫存轉移</DialogTitle>
          <DialogDescription data-oid="pt59-cc">
            在不同門市之間轉移庫存
          </DialogDescription>
        </DialogHeader>
        <InventoryTransferForm onSuccess={handleSuccess} data-oid="_hzf_yd" />
      </DialogContent>
    </Dialog>
  );
}
