"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm"

interface InventoryAdjustmentDialogProps {
  onSuccess?: () => void
}

export function InventoryAdjustmentDialog({
  onSuccess,
}: InventoryAdjustmentDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          新增入庫
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增入庫</DialogTitle>
          <DialogDescription>
            新增產品庫存或調整現有庫存數量
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
  )
}
