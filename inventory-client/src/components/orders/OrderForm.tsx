"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StoreCombobox } from "@/components/ui/store-combobox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { ProductSelector, type Variant } from "@/components/ui/ProductSelector";

// 導入重構後的hooks
import { useOrderForm, type OrderFormValues } from "./hooks/useOrderForm";
import { useCustomerManager } from "./hooks/useCustomerManager";
import { useProductManager } from "./hooks/useProductManager";
import { usePriceCalculator } from "./hooks/usePriceCalculator";

// 導入重構後的組件
import { OrderItemsTable } from "./components/OrderItemsTable";
import { PriceSummary } from "./components/PriceSummary";
import { OrderInfoSidebar } from "./components/OrderInfoSidebar";
import { OrderNotes } from "./components/OrderNotes";

export type { OrderFormValues };

interface OrderFormProps {
  initialData?: Partial<OrderFormValues>;
  onSubmit: (values: OrderFormValues) => void;
  isSubmitting: boolean;
}

/**
 * 訂單表單組件
 * 
 * 提供完整的訂單創建和編輯功能，包含：
 * - 客戶選擇與新增
 * - 商品項目管理（標準商品與訂製商品）
 * - 價格計算與摘要
 * - 訂單資訊設定
 * - 備註功能
 */
export function OrderForm({
  initialData,
  onSubmit,
  isSubmitting,
}: OrderFormProps) {
  // 使用重構後的hooks
  const { form, handleSubmit } = useOrderForm({ initialData, onSubmit });
  
  const {
    isCustomerDialogOpen,
    setIsCustomerDialogOpen,
    createCustomerMutation,
    handleAddNewCustomer,
    handleCustomerCreated,
  } = useCustomerManager({ form });
  
  const {
    isSelectorOpen,
    setIsSelectorOpen,
    fields,
    remove,
    selectedVariantIds,
    handleProductSelect,
    handleAddCustomItem,
  } = useProductManager({ form });
  
  const {
    subtotal,
    shippingFee,
    tax,
    discountAmount,
    grandTotal,
  } = usePriceCalculator({ form });

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* 頂層按鈕區 - 移除重複標題，只保留提交按鈕 */}
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "儲存中..." : "儲存訂單"}
            </Button>
          </div>

          {/* 分店選擇 - 放在最上方 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">門市選擇</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="store_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>選擇下單門市 <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <StoreCombobox
                        value={field.value?.toString() || ""}
                        onValueChange={(value) => {
                          field.onChange(value ? Number(value) : 0);
                        }}
                        placeholder="請先選擇門市..."
                        emptyText="未找到門市"
                      />
                    </FormControl>
                    <FormDescription>
                      請先選擇門市，系統將顯示該門市的庫存數量
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 雙欄式網格佈局 */}
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* 左側主欄 */}
              <div className="md:col-span-2 space-y-6">
                {/* 訂單品項卡片 */}
                <OrderItemsTable
                  form={form}
                  fields={fields}
                  remove={remove}
                  onAddItem={() => setIsSelectorOpen(true)}
                  storeId={form.watch("store_id")}
                />

                {/* 價格計算摘要卡片 */}
                <PriceSummary
                  form={form}
                  subtotal={subtotal}
                  shippingFee={shippingFee}
                  tax={tax}
                  discountAmount={discountAmount}
                  grandTotal={grandTotal}
                />

                {/* 訂單備註卡片 - 移動到價格摘要下方 */}
                <OrderNotes form={form} />
              </div>

              {/* 右側邊欄 */}
              <div className="md:col-span-1">
                <OrderInfoSidebar
                  form={form}
                  onAddNewCustomer={handleAddNewCustomer}
                />
              </div>
            </div>
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
              // 轉換為 API 期望的格式
              const sanitizedData = {
                name: customerData.name || '',
                phone: customerData.phone || '',
                is_company: customerData.is_company || false,
                tax_number: customerData.tax_number || undefined,
                industry_type: customerData.industry_type || '',
                payment_type: customerData.payment_type || 'cash',
                contact_address: customerData.contact_address || '',
                addresses: (customerData.addresses || []).map(addr => ({
                  id: addr.id,
                  address: addr.address_line_1 || '',
                  is_default: addr.is_default || false,
                })),
              };
              createCustomerMutation.mutate(sanitizedData, {
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
        storeId={form.watch("store_id")}
      />
    </>
  );
}