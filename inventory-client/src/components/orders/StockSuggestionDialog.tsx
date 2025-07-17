"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  Package,
  ArrowRight,
  ShoppingCart,
  Truck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { StockSuggestion } from "@/hooks/queries/orders/useCheckStockAvailability";
import { cn } from "@/lib/utils";

interface StockSuggestionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: StockSuggestion[];
  onConfirm: (decisions: StockDecision[]) => void;
  onForceCreate: () => void;
  isProcessing?: boolean;
}

export interface StockDecision {
  product_variant_id: number;
  action: "transfer" | "purchase" | "mixed";
  transfers?: Array<{
    from_store_id: number;
    quantity: number;
  }>;
  purchase_quantity?: number;
}

export function StockSuggestionDialog({
  open,
  onOpenChange,
  suggestions,
  onConfirm,
  onForceCreate,
  isProcessing = false,
}: StockSuggestionDialogProps) {
  const [decisions, setDecisions] = useState<Record<number, string>>({});

  // 過濾出有庫存不足的商品
  const shortageItems = suggestions.filter((s) => s.type !== "sufficient");
  
  // 監控 Dialog 狀態
  React.useEffect(() => {
    console.log('StockSuggestionDialog - open:', open);
    console.log('StockSuggestionDialog - suggestions:', suggestions);
    console.log('StockSuggestionDialog - shortageItems:', shortageItems);
  }, [open, suggestions]);

  // 初始化決策（使用系統建議）
  React.useEffect(() => {
    const initialDecisions: Record<number, string> = {};
    suggestions.forEach((item) => {
      if (item.type !== "sufficient") {
        initialDecisions[item.product_variant_id] = item.type;
      }
    });
    setDecisions(initialDecisions);
  }, [suggestions]);

  const handleConfirm = () => {
    const finalDecisions: StockDecision[] = shortageItems.map((item) => {
      const decision = decisions[item.product_variant_id] || item.type;

      if (decision === "transfer" && item.transfers) {
        return {
          product_variant_id: item.product_variant_id,
          action: "transfer",
          transfers: item.transfers.map((t) => ({
            from_store_id: t.from_store_id,
            quantity: t.suggested_quantity,
          })),
        };
      } else if (decision === "purchase") {
        return {
          product_variant_id: item.product_variant_id,
          action: "purchase",
          purchase_quantity: item.shortage,
        };
      } else if (decision === "mixed" && item.transfers) {
        return {
          product_variant_id: item.product_variant_id,
          action: "mixed",
          transfers: item.transfers.map((t) => ({
            from_store_id: t.from_store_id,
            quantity: t.suggested_quantity,
          })),
          purchase_quantity: item.purchase_quantity,
        };
      }

      // 預設為進貨
      return {
        product_variant_id: item.product_variant_id,
        action: "purchase",
        purchase_quantity: item.shortage,
      };
    });

    onConfirm(finalDecisions);
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "transfer":
        return <Truck className="h-4 w-4" />;
      case "purchase":
        return <ShoppingCart className="h-4 w-4" />;
      case "mixed":
        return <Package className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "transfer":
        return "text-blue-600";
      case "purchase":
        return "text-orange-600";
      case "mixed":
        return "text-purple-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            庫存不足提醒
          </DialogTitle>
          <DialogDescription>
            以下商品在選定門市的庫存不足，系統已分析並提供最佳處理建議
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {shortageItems.map((item, index) => (
              <Card key={item.product_variant_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {item.product_name}
                      </CardTitle>
                      <CardDescription>SKU: {item.sku}</CardDescription>
                    </div>
                    <Badge variant="destructive">
                      缺貨 {item.shortage} 件
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-2">
                    <span>需求數量: {item.requested_quantity}</span>
                    <span>現有庫存: {item.current_store_stock}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={decisions[item.product_variant_id] || item.type}
                    onValueChange={(value) =>
                      setDecisions({
                        ...decisions,
                        [item.product_variant_id]: value,
                      })
                    }
                  >
                    {/* 調貨選項 */}
                    {item.transfers && item.transfers.length > 0 && (
                      <div className="flex items-start space-x-2 mb-3">
                        <RadioGroupItem value="transfer" id={`transfer-${item.product_variant_id}`} />
                        <Label
                          htmlFor={`transfer-${item.product_variant_id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className={cn("flex items-center gap-2", getActionColor("transfer"))}>
                            {getActionIcon("transfer")}
                            <span className="font-medium">從其他門市調貨</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {item.transfers.map((transfer, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-muted-foreground ml-6"
                              >
                                <span>{transfer.from_store_name}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span className="font-medium">
                                  調貨 {transfer.suggested_quantity} 件
                                </span>
                                <span className="text-xs">
                                  (可用: {transfer.available_quantity})
                                </span>
                              </div>
                            ))}
                          </div>
                        </Label>
                      </div>
                    )}

                    {/* 進貨選項 */}
                    <div className="flex items-start space-x-2 mb-3">
                      <RadioGroupItem value="purchase" id={`purchase-${item.product_variant_id}`} />
                      <Label
                        htmlFor={`purchase-${item.product_variant_id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className={cn("flex items-center gap-2", getActionColor("purchase"))}>
                          {getActionIcon("purchase")}
                          <span className="font-medium">向供應商進貨</span>
                        </div>
                        <div className="text-sm text-muted-foreground ml-6 mt-1">
                          進貨 {item.shortage} 件，加入待進貨清單
                        </div>
                      </Label>
                    </div>

                    {/* 混合選項 */}
                    {item.type === "mixed" && item.transfers && (
                      <div className="flex items-start space-x-2">
                        <RadioGroupItem value="mixed" id={`mixed-${item.product_variant_id}`} />
                        <Label
                          htmlFor={`mixed-${item.product_variant_id}`}
                          className="flex-1 cursor-pointer"
                        >
                          <div className={cn("flex items-center gap-2", getActionColor("mixed"))}>
                            {getActionIcon("mixed")}
                            <span className="font-medium">部分調貨 + 部分進貨</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {item.transfers.map((transfer, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 text-sm text-muted-foreground ml-6"
                              >
                                <span>{transfer.from_store_name}</span>
                                <ArrowRight className="h-3 w-3" />
                                <span>調貨 {transfer.suggested_quantity} 件</span>
                              </div>
                            ))}
                            <div className="text-sm text-muted-foreground ml-6">
                              <span>向供應商進貨 {item.purchase_quantity} 件</span>
                            </div>
                          </div>
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1 text-sm text-muted-foreground">
            選擇處理方式後，系統將自動建立相應的調貨單或進貨需求
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onForceCreate}
              disabled={isProcessing}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              忽略並建立預訂單
            </Button>
            <Button onClick={handleConfirm} disabled={isProcessing}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              確認處理方案
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}