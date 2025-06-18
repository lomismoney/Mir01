"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowUpDown } from "lucide-react"
import { InventoryAdjustmentForm } from "./InventoryAdjustmentForm"

interface InventoryModificationDialogProps {
  productVariantId: number
  currentQuantity: number
  storeId?: number
  productName?: string
  sku?: string
  onSuccess?: () => void
}

export function InventoryModificationDialog({
  productVariantId,
  currentQuantity,
  storeId,
  productName,
  sku,
  onSuccess,
}: InventoryModificationDialogProps) {
  const [open, setOpen] = useState(false)

  const handleSuccess = () => {
    setOpen(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button 
        variant="ghost" 
        size="icon"
        className="h-8 w-8"
        onClick={() => setOpen(true)}
      >
        <ArrowUpDown className="h-4 w-4" />
        <span className="sr-only">修改庫存</span>
      </Button>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>修改庫存</DialogTitle>
          <DialogDescription>
            調整指定商品的庫存數量（增加、減少或設定）
          </DialogDescription>
          {productName && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg space-y-1">
              <div className="font-medium">{productName}</div>
              {sku && <div className="text-sm text-muted-foreground">SKU: {sku}</div>}
              <div className="text-sm">目前庫存: {currentQuantity} 件</div>
            </div>
          )}
        </DialogHeader>
        <InventoryAdjustmentForm
          productVariantId={productVariantId}
          storeId={storeId}
          currentQuantity={currentQuantity}
          onSuccess={handleSuccess}
          dialogOpen={open}
        />
      </DialogContent>
    </Dialog>
  )
}
