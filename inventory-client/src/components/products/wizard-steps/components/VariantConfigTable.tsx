import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle, Package } from "lucide-react";
import { WizardFormData } from "../../CreateProductWizard";
import { Attribute } from "@/types/products";

interface VariantConfigTableProps {
  formData: WizardFormData;
  variants: any[];
  attributes: Attribute[];
  onVariantChange: (variantKey: string, field: "sku" | "price", value: string) => void;
}

export function VariantConfigTable({
  formData,
  variants,
  attributes,
  onVariantChange,
}: VariantConfigTableProps) {
  /**
   * 獲取屬性名稱
   */
  const getAttributeName = (attributeId: number): string => {
    const attribute = attributes.find((attr) => attr.id === attributeId);
    return attribute?.name || `屬性${attributeId}`;
  };

  return (
    <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>變體詳情配置</span>
          </div>
          <Badge variant="outline">
            {variants.length} 個變體
          </Badge>
        </CardTitle>
        <CardDescription>
          為每個變體設定 SKU 編號和價格。SKU 應具唯一性，價格必須為正數。
        </CardDescription>
      </CardHeader>
      <CardContent>
        {variants.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-muted-foreground">
              尚未生成任何變體，請返回上一步配置規格。
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  {/* 變體組合 - 只在多規格商品時顯示 */}
                  {formData.specifications.isVariable && (
                    <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      變體組合
                    </TableHead>
                  )}
                  {/* SKU */}
                  <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    SKU 編號
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    價格 (NT$)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={variant.key}>
                    {formData.specifications.isVariable && (
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map(({ attributeId, value }: any) => (
                            <Badge
                              key={`${attributeId}-${value}`}
                              variant="secondary"
                            >
                              {getAttributeName(attributeId)}: {value}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Input
                        placeholder="輸入 SKU 編號"
                        value={variant.sku}
                        onChange={(e) =>
                          onVariantChange(
                            variant.key,
                            "sku",
                            e.target.value,
                          )
                        }
                        className="max-w-[200px]"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span className="text-muted-foreground">
                          $
                        </span>
                        <Input
                          type="number"
                          placeholder="0.00"
                          value={variant.price}
                          onChange={(e) =>
                            onVariantChange(
                              variant.key,
                              "price",
                              e.target.value,
                            )
                          }
                          min="0"
                          step="0.01"
                          className={`max-w-[120px] ${
                            variant.price &&
                            (isNaN(parseFloat(variant.price)) ||
                              parseFloat(variant.price) <= 0)
                              ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                              : ""
                          }`}
                        />

                        {variant.price &&
                          (isNaN(parseFloat(variant.price)) ||
                            parseFloat(variant.price) <= 0) && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}