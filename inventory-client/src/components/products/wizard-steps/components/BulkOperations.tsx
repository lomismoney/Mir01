import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Wand2, DollarSign, Hash } from "lucide-react";

interface BulkOperationsProps {
  variantsCount: number;
  bulkPrice: string;
  setBulkPrice: (value: string) => void;
  onBulkPriceSet: () => void;
  onRegenerateSkus: () => void;
}

export function BulkOperations({
  variantsCount,
  bulkPrice,
  setBulkPrice,
  onBulkPriceSet,
  onRegenerateSkus,
}: BulkOperationsProps) {
  if (variantsCount <= 1) return null;

  return (
    <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wand2 className="h-5 w-5" />
          <span>批量操作</span>
        </CardTitle>
        <CardDescription>
          快速為所有變體進行批量設定，提升配置效率。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 批量價格設定 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              批量設定價格
            </Label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="輸入統一價格"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                min="0"
                step="0.01"
              />
              <Button
                onClick={onBulkPriceSet}
                variant="outline"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                套用
              </Button>
            </div>
          </div>

          {/* SKU 重新生成 */}
          <div className="space-y-3">
            <Label className="text-base font-medium">
              SKU 管理
            </Label>
            <Button
              onClick={onRegenerateSkus}
              variant="outline"
              className="w-full"
            >
              <Hash className="h-4 w-4 mr-1" />
              重新生成所有 SKU
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}