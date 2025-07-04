"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, ImageIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { CustomerSelector } from "./CustomerSelector";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { ProductSelector, type Variant } from "@/components/ui/ProductSelector";
import { OrderFormProductBadge } from "./OrderFormProductBadge";
import { useCreateCustomer } from "@/hooks";
import { Customer, ProductVariant, OrderFormData } from "@/types/api-helpers";
import { useAppFieldArray } from "@/hooks/useAppFieldArray";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// 🎯 使用 Zod 提前定義表單驗證規則
const orderFormSchema = z.object({
  customer_id: z.number().min(1, "必須選擇一個客戶"),
  shipping_address: z.string().min(1, "運送地址為必填"),
  payment_method: z.string().min(1, "必須選擇付款方式"),
  order_source: z.string().min(1, "必須選擇客戶來源"),
  shipping_status: z.string(),
  payment_status: z.string(),
  shipping_fee: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.number().optional(),
        product_variant_id: z.number().nullable(),
        is_stocked_sale: z.boolean(),
        status: z.string(),
        quantity: z.number().min(1, "數量至少為 1"),
        price: z.number().min(0, "價格不能為負"),
        product_name: z.string().min(1, "商品名稱為必填"),
        sku: z.string().min(1, "SKU 為必填"),
        custom_specifications: z.record(z.string()).optional(),
        imageUrl: z.string().optional().nullable(),
        stock: z.number().optional(), // 🎯 添加庫存字段
      })
    )
    .min(1, "訂單至少需要一個品項"),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  initialData?: Partial<OrderFormValues>;
  onSubmit: (values: OrderFormValues) => void;
  isSubmitting: boolean;
}

export function OrderForm({
  initialData,
  onSubmit,
  isSubmitting,
}: OrderFormProps) {
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const createCustomerMutation = useCreateCustomer();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialData || {
      shipping_status: "pending",
      payment_status: "pending",
      shipping_fee: 0,
      tax: 0,
      discount_amount: 0,
      items: [],
    },
  });

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // 當 initialData 變更時，重置表單
  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  // 初始化 useFieldArray 來管理 items 字段
  const { fields, append, remove, update, replace } = useAppFieldArray({
    control: form.control,
    name: "items",
  });

  // 🎯 計算已選中的標準品項 ID（用於同步 ProductSelector 的狀態）
  const selectedVariantIds = useMemo(
    () =>
      fields
        .map((field) => field.product_variant_id)
        .filter((id): id is number => id !== null && id !== undefined),
    [fields]
  );

  // 處理從 ProductSelector 回傳的選擇結果
  const handleProductSelect = (selectedVariants: Variant[]) => {
    const currentItems = fields;

    selectedVariants.forEach((variant) => {
      const existingIndex = currentItems.findIndex(
        (item) => item.product_variant_id === Number(variant.id)
      );

      if (existingIndex !== -1) {
        update(existingIndex, {
          ...currentItems[existingIndex],
          price: Number(variant.price) || 0,
        });
      } else {
        append({
          product_variant_id: Number(variant.id),
          is_stocked_sale: true,
          status: "pending",
          quantity: 1,
          price: Number(variant.price) || 0,
          product_name: variant.productName
            ? `${variant.productName} - ${variant.specifications}`
            : variant.specifications || `商品 ${variant.sku}`,
          sku: variant.sku || `SKU-${variant.id}`,
          custom_specifications: undefined,
          imageUrl: variant.imageUrl || null,
          stock: variant.stock || 0, // 🎯 添加庫存信息
        });
      }
    });

    setIsSelectorOpen(false);
  };

  // 處理新增訂製商品
  const handleAddCustomItem = (item: any) => {
    append({
      product_variant_id: item.product_variant_id,
      is_stocked_sale: false,
      status: "pending",
      quantity: item.quantity,
      price: item.price,
      product_name: item.custom_product_name,
      sku: item.sku,
      custom_specifications: item.custom_specifications,
      imageUrl: item.imageUrl || null,
      stock: 0, // 🎯 訂製商品沒有庫存概念
    });

    setIsSelectorOpen(false);
  };

  function handleSubmit(values: OrderFormValues) {
    const orderData: OrderFormValues = {
      ...values,
      items: values.items.map((item) => ({
        ...item,
        custom_specifications: item.custom_specifications
          ? item.custom_specifications
          : undefined,
      })),
    };

    onSubmit(orderData);
  }

  const handleAddNewCustomer = () => {
    setIsCustomerDialogOpen(true);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    if (newCustomer.id) {
      form.setValue("customer_id", newCustomer.id);
      form.setValue("shipping_address", newCustomer.contact_address || "");
    }
    setIsCustomerDialogOpen(false);
  };

  // 實時價格計算
  const items = form.watch("items");
  const shippingFee = form.watch("shipping_fee") || 0;
  const tax = form.watch("tax") || 0;
  const discountAmount = form.watch("discount_amount") || 0;

  const subtotal =
    items?.reduce((acc, item) => {
      const itemTotal = (item.price ?? 0) * (item.quantity || 0);
      return acc + itemTotal;
    }, 0) || 0;

  const grandTotal = Math.max(0, subtotal + shippingFee + tax - discountAmount);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* 頂層按鈕區 */}
          <div className="flex items-center gap-4">
            <h1 className="flex-1 text-2xl font-semibold">
              {initialData ? "編輯訂單" : "新增訂單"}
            </h1>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "儲存中..." : "儲存訂單"}
            </Button>
          </div>

          {/* 雙欄式網格佈局 */}
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* 左側主欄 */}
              <div className="md:col-span-2 space-y-6">
                {/* 訂單品項卡片 */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>訂單品項</CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        setIsSelectorOpen(true);
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
                                <TableRow
                                  key={field.key}

                                >
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
                                                        <span className="font-medium">{key}:</span> {value}
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

                {/* 價格計算摘要卡片 */}
                <Card>
                  <CardHeader>
                    <CardTitle>價格摘要</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="shipping_fee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>運費</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="tax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>稅金</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="discount_amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>折扣金額</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value) || 0)
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* 價格計算明細 */}
                    <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>小計：</span>
                        <span className="font-medium text-right w-[120px]">
                          ${Math.round(subtotal).toLocaleString()}
                        </span>
                      </div>
                      {shippingFee > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>運費：</span>
                          <span className="font-medium text-right w-[120px]">
                            ${Math.round(shippingFee).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {tax > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>稅金：</span>
                          <span className="font-medium text-right w-[120px]">
                            ${Math.round(tax).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>折扣：</span>
                          <span className="font-medium text-right w-[120px]">
                            -${Math.round(discountAmount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>總計：</span>
                        <span className="text-primary text-right w-[120px]">
                          ${Math.round(grandTotal).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 右側邊欄 */}
              <div className="md:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>訂單資訊</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-6">
                      {/* 客戶資訊區塊 */}
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          客戶資訊
                        </div>
                        <FormField
                          control={form.control}
                          name="customer_id"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>選擇客戶</FormLabel>
                              <CustomerSelector
                                selectedCustomerId={field.value}
                                onSelectCustomer={(customer) => {
                                  if (customer) {
                                    form.setValue("customer_id", customer.id!);
                                    form.setValue(
                                      "shipping_address",
                                      customer.contact_address || ""
                                    );
                                  }
                                }}
                                onAddNewCustomer={handleAddNewCustomer}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="shipping_address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>運送地址</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="請輸入運送地址..."
                                  className="resize-none min-h-[80px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="border-t"></div>

                      {/* 付款與來源資訊區塊 */}
                      <div className="space-y-4">
                        <div className="text-sm font-medium text-muted-foreground">
                          付款與來源
                        </div>
                        <FormField
                          control={form.control}
                          name="payment_method"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>付款方式</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="選擇付款方式" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="現金">現金</SelectItem>
                                  <SelectItem value="轉帳">轉帳</SelectItem>
                                  <SelectItem value="刷卡">刷卡</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="order_source"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>客戶來源</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="選擇客戶來源" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="現場客戶">
                                    現場客戶
                                  </SelectItem>
                                  <SelectItem value="網站客戶">
                                    網站客戶
                                  </SelectItem>
                                  <SelectItem value="LINE客戶">
                                    LINE客戶
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 訂單備註卡片 */}
            <Card>
              <CardHeader>
                <CardTitle>訂單備註</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="輸入此訂單的內部備註..."
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>

      {/* 新增客戶對話框 */}
      <Dialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增客戶</DialogTitle>
          </DialogHeader>
          <CustomerForm
            isSubmitting={createCustomerMutation.isPending}
            onSubmit={(customerData) => {
              createCustomerMutation.mutate(customerData, {
                onSuccess: (data) => {
                  handleCustomerCreated(data?.data || {});
                },
              });
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 商品選擇對話框 */}
      <ProductSelector
        open={isSelectorOpen}
        onOpenChange={setIsSelectorOpen}
        onSelect={handleProductSelect}
        onCustomItemAdd={handleAddCustomItem}
        multiple={true}
        selectedIds={selectedVariantIds}
      />
    </>
  );
}
