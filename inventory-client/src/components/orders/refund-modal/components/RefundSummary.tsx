import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Calculator, CheckCircle } from "lucide-react";

interface RefundSummaryProps {
  orderTotal: number;
  paidAmount: number;
  totalRefundAmount: number;
  selectedItemsCount: number;
  totalRefundQuantity: number;
  refundPercentage: number;
}

export function RefundSummary({
  orderTotal,
  paidAmount,
  totalRefundAmount,
  selectedItemsCount,
  totalRefundQuantity,
  refundPercentage,
}: RefundSummaryProps) {
  return (
    <Card className="sticky top-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          退款金額計算
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 訂單基本信息 */}
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">訂單總額</span>
            <span className="font-medium">
              ${Math.round(orderTotal).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">已付金額</span>
            <span className="font-medium text-green-600">
              ${Math.round(paidAmount).toLocaleString()}
            </span>
          </div>

          <Separator />

          {/* 退款統計 */}
          <div className="flex justify-between">
            <span className="text-muted-foreground">選中品項</span>
            <span className="font-medium">{selectedItemsCount} 項</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">退貨總數量</span>
            <span className="font-medium">{totalRefundQuantity} 件</span>
          </div>

          <Separator />

          {/* 退款金額 */}
          <div className="flex justify-between items-center pt-2">
            <span className="font-semibold text-base">預計退款金額</span>
            <span className="text-2xl font-bold text-destructive">
              ${Math.round(totalRefundAmount).toLocaleString()}
            </span>
          </div>
        </div>

        {/* 退款進度視覺化 */}
        {orderTotal > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>退款比例</span>
              <span>{refundPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={refundPercentage} className="h-2" />
          </div>
        )}

        {/* 成功提示 */}
        {selectedItemsCount > 0 && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-300">
              已選擇 {selectedItemsCount} 項商品，共 {totalRefundQuantity} 件
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}