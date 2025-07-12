import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Separator } from "@/components/ui/separator";

/**
 * SKU 變體的臨時資料結構
 */
interface VariantData {
  key: string;
  options: { attributeId: number; value: string }[];
  sku: string;
  price: string;
}

interface VariantEditorProps {
  selectedAttrs: Set<number>;
  canGenerateVariants: boolean;
  variants: VariantData[];
  setVariants: (variants: VariantData[]) => void;
  isLoading: boolean;
  handleGenerateVariants: () => void;
}

export function VariantEditor({
  selectedAttrs,
  canGenerateVariants,
  variants,
  setVariants,
  isLoading,
  handleGenerateVariants,
}: VariantEditorProps) {
  return (
    <>
      {/* 生成規格組合按鈕 */}
      {selectedAttrs.size > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">生成 SKU 變體</h4>
                  <p className="text-xs text-muted-foreground">
                    根據選擇的規格屬性組合生成所有可能的 SKU 變體
                  </p>
                </div>
                <Button
                  type="button"
                  onClick={handleGenerateVariants}
                  disabled={!canGenerateVariants || isLoading}
                  variant="default"
                  size="sm"
                  className="min-w-[120px]"
                >
                  {variants.length > 0 ? "重新生成組合" : "生成規格組合"}
                </Button>
              </div>

              {/* 顯示已生成的變體數量 */}
              {variants.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">
                    已生成{" "}
                    <span className="font-medium text-foreground">
                      {variants.length}
                    </span>{" "}
                    個 SKU 變體， 包含{" "}
                    <span className="font-medium text-foreground">
                      {selectedAttrs.size}
                    </span>{" "}
                    種規格屬性的組合
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SKU 變體編輯表格 */}
      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>編輯規格 (SKU)</CardTitle>
            <CardDescription>
              為每一個自動生成的規格組合，設定唯一的 SKU 編號和價格。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    規格
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    SKU 編號
                  </TableHead>
                  <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    價格
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={variant.key}>
                    <TableCell>
                      {variant.options.map((opt) => opt.value).join(" / ")}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[index].sku = e.target.value;
                          setVariants(newVariants);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[index].price = e.target.value;
                          setVariants(newVariants);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}