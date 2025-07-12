import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RotateCcw, Package } from "lucide-react";

interface RefundModalStatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  type: "loading" | "no-items";
}

export function RefundModalStates({
  open,
  onOpenChange,
  orderNumber,
  type,
}: RefundModalStatesProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!w-[90vw] !max-w-[1400px] sm:!max-w-[1400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-destructive" />
            處理訂單退款
          </DialogTitle>
          {orderNumber && (
            <p className="text-sm text-muted-foreground">
              訂單編號：{orderNumber}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          {type === "loading" ? (
            <>
              <div className="inline-flex h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
              <p className="text-muted-foreground">載入訂單資料中...</p>
            </>
          ) : (
            <>
              <Package className="h-16 w-16 text-muted-foreground" />
              <p className="text-muted-foreground text-lg">
                此訂單沒有可退款的品項
              </p>
            </>
          )}
        </div>

        {type === "no-items" && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              關閉
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}