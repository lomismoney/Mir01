import { Controller, UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { RefundFormItem, RefundFormValues } from "../hooks/useRefundForm";

interface RefundItemsTableProps {
  form: UseFormReturn<RefundFormValues>;
  fields: RefundFormItem[];
  watchedItems: RefundFormValues["items"];
  onItemSelect: (index: number, checked: boolean) => void;
  onQuantityChange: (index: number, quantity: number) => void;
  onSelectAll: (checked: boolean) => void;
  isAllSelected: boolean;
}

export function RefundItemsTable({
  form,
  fields,
  watchedItems,
  onItemSelect,
  onQuantityChange,
  onSelectAll,
  isAllSelected,
}: RefundItemsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          1. 選擇退款品項與數量
        </CardTitle>
        <CardDescription>
          請勾選需要退款的品項，並設定退貨數量
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="border-b hover:bg-transparent">
                <TableHead className="w-12 h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={onSelectAll}
                  />
                </TableHead>
                <TableHead className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                  品項資訊
                </TableHead>
                <TableHead className="text-center h-12 px-4 align-middle font-medium text-muted-foreground">
                  已購數量
                </TableHead>
                <TableHead className="text-center h-12 px-4 align-middle font-medium text-muted-foreground">
                  退貨數量
                </TableHead>
                <TableHead className="text-right h-12 px-4 align-middle font-medium text-muted-foreground">
                  單價
                </TableHead>
                <TableHead className="text-right h-12 px-4 align-middle font-medium text-muted-foreground">
                  小計
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const item = watchedItems[index];
                const isSelected = item?.is_selected || false;
                const quantity = item?.quantity || 0;
                const subtotal = isSelected ? (item?.price || 0) * quantity : 0;

                return (
                  <TableRow
                    key={field.order_item_id}
                    className={isSelected ? "bg-muted/30" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          onItemSelect(index, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{field.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          SKU: {field.sku}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{field.max_quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Controller
                        name={`items.${index}.quantity`}
                        control={form.control}
                        render={({ field: quantityField }) => (
                          <Input
                            type="number"
                            min="1"
                            max={field.max_quantity}
                            value={isSelected ? quantityField.value : ""}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value) || 1;
                              quantityField.onChange(newQuantity);
                              onQuantityChange(index, newQuantity);
                            }}
                            disabled={!isSelected}
                            className="w-20 mx-auto"
                          />
                        )}
                      />
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${Math.round(field.price || 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium text-destructive">
                      ${Math.round(subtotal).toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}