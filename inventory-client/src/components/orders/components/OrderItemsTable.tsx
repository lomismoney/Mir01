import { UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FormField,
  FormItem,
  FormControl,
} from "@/components/ui/form";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PlusCircle, Trash2, ImageIcon } from "lucide-react";
import Image from "next/image";
import { OrderFormProductBadge } from "../OrderFormProductBadge";
import { OrderFormValues } from "../hooks/useOrderForm";

interface OrderItemsTableProps {
  form: UseFormReturn<OrderFormValues>;
  fields: any[];
  remove: (index: number) => void;
  onAddItem: () => void;
}

export function OrderItemsTable({
  form,
  fields,
  remove,
  onAddItem,
}: OrderItemsTableProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>訂單品項</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            onAddItem();
          }}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          新增項目
        </Button>
      </CardHeader>
      <CardContent>
        {fields.length > 0 ? (
          <div className="text-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5">
                    商品資訊
                  </TableHead>
                  <TableHead className="w-[100px]">
                    單價
                  </TableHead>
                  <TableHead className="w-[80px]">
                    數量
                  </TableHead>
                  <TableHead className="w-[120px] text-right">
                    小計
                  </TableHead>
                  <TableHead className="w-[60px]">
                    操作
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, index) => {
                  const quantity =
                    form.watch(`items.${index}.quantity`) || 0;
                  const price =
                    form.watch(`items.${index}.price`) ?? 0;
                  const subtotal = quantity * price;

                  return (
                    <TableRow key={field.key}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 flex-shrink-0 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                            {field.imageUrl ? (
                              <Image
                                src={field.imageUrl}
                                alt={
                                  form.watch(
                                    `items.${index}.product_name`
                                  ) || "Product Image"
                                }
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 dark:text-gray-50 truncate">
                              {form.watch(
                                `items.${index}.product_name`
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              SKU: {form.watch(`items.${index}.sku`)}
                            </div>
                            {/* 🎯 智能徽章系統：顯示商品狀態 */}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {/* 🎯 徽章區域：確保不被壓縮 */}
                              <div className="flex items-center gap-2 flex-shrink-0">
                              <OrderFormProductBadge 
                                item={{
                                  product_variant_id: field.product_variant_id,
                                  is_stocked_sale: field.is_stocked_sale,
                                  custom_specifications: field.custom_specifications || null,
                                  quantity: Number(form.watch(`items.${index}.quantity`) || 0),
                                  stock: field.stock || 0
                                }}
                                className="text-xs"
                              />
                              {/* 🎯 庫存信息顯示 */}
                              {field.is_stocked_sale && field.stock !== undefined && (
                                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                                  庫存: {field.stock}
                                </span>
                              )}
                              </div>
                              
                              {/* 🎯 訂製商品規格顯示：限制寬度並添加 Tooltip */}
                              {field.product_variant_id === null && field.custom_specifications && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[150px] cursor-help">
                                  {Object.entries(field.custom_specifications)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join("; ")}
                                </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="max-w-[300px]">
                                      <div className="space-y-1">
                                        <p className="font-medium">訂製規格：</p>
                                        {Object.entries(field.custom_specifications).map(([key, value]) => (
                                          <p key={key} className="text-sm">
                                            <span className="font-medium">{key}:</span> {String(value)}
                                          </p>
                                        ))}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="w-full"
                                  placeholder="0.00"
                                  value={
                                    field.value?.toString() || ""
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      field.onChange(0);
                                    } else {
                                      const parsedValue =
                                        parseFloat(value);
                                      if (!isNaN(parsedValue)) {
                                        field.onChange(parsedValue);
                                      }
                                    }
                                  }}
                                  onBlur={field.onBlur}
                                  name={field.name}
                                  ref={field.ref}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  className="w-full"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-right w-[120px]">
                        ${Math.round(subtotal).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 border-2 border-dashed rounded-lg text-center">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-muted-foreground">
                📦 尚未添加任何項目
              </h3>
              <p className="text-muted-foreground">
                點擊「新增項目」按鈕來選擇商品
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}