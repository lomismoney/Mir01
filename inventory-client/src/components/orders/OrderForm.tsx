'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Trash2 } from 'lucide-react';
import { CustomerSelector } from './CustomerSelector';
import { CustomerForm } from '@/components/customers/CustomerForm';

import { ProductSelector, type Variant } from '@/components/ui/ProductSelector';
import { useCreateCustomer } from '@/hooks/queries/useEntityQueries';
import { Customer, ProductVariant, OrderFormData } from '@/types/api-helpers';

// 使用 Zod 提前定義表單驗證規則
const orderFormSchema = z.object({
  customer_id: z.number().min(1, '必須選擇一個客戶'),
  shipping_address: z.string().min(1, '運送地址為必填'),
  payment_method: z.string().min(1, '必須選擇付款方式'),
  order_source: z.string().min(1, '必須選擇客戶來源'),
  shipping_status: z.string(),
  payment_status: z.string(),
  shipping_fee: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  discount_amount: z.number().min(0).optional(),
  notes: z.string().optional(),
  // ... 其他主體字段
  items: z.array(z.object({
    product_variant_id: z.number().nullable(), // 允許訂製商品
    is_stocked_sale: z.boolean(),
    status: z.string(),
    quantity: z.number().min(1, '數量至少為 1'),
    price: z.number().min(0, '價格不能為負'),
    product_name: z.string().min(1, '商品名稱為必填'),
    sku: z.string().min(1, 'SKU 為必填'),
    custom_specifications: z.record(z.string()).optional(), // 訂製規格
    // ... 其他項目字段
  })).min(1, '訂單至少需要一個品項'),
});

export type OrderFormValues = z.infer<typeof orderFormSchema>;

interface OrderFormProps {
  initialData?: Partial<OrderFormValues>;
  onSubmit: (values: OrderFormValues) => void;
  isSubmitting: boolean;
}

export function OrderForm({ initialData, onSubmit, isSubmitting }: OrderFormProps) {
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const createCustomerMutation = useCreateCustomer();

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: initialData || {
      shipping_status: 'pending',
      payment_status: 'pending',
      shipping_fee: 0,
      tax: 0,
      discount_amount: 0,
      items: [], // 預設為空的項目列表
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
  const { fields, append, remove, update, replace } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // 處理從 ProductSelector 回傳的選擇結果
  const handleProductSelect = (selectedVariants: Variant[]) => {
    // 將 ProductSelector 回傳的 Variant[] 陣列
    // 轉換成 useFieldArray 需要的格式
    const formItems = selectedVariants.map(variant => ({
      product_variant_id: Number(variant.id),
      is_stocked_sale: true,
      status: 'pending',
      quantity: 1, // 新增的品項數量預設為 1
      // 🎯 確保價格是數字類型，符合 Zod 驗證要求
      price: Number(variant.price) || 0,
      product_name: variant.specifications, // 使用規格描述作為商品名稱
      sku: variant.sku,
      custom_specifications: undefined,
    }));

    // 使用 useFieldArray 的 replace 方法，一次性替換整個品項列表
    // 這比多次 append/remove 更高效
    replace(formItems);
  };

  function handleSubmit(values: OrderFormValues) {
    // 轉換表單數據為 API 期望的格式
    const orderData: OrderFormValues = {
      ...values,
      items: values.items.map(item => ({
        ...item,
        custom_specifications: item.custom_specifications ? 
          item.custom_specifications : undefined
      }))
    };

    // 直接調用從 props 傳入的 onSubmit 函數
    onSubmit(orderData);
  }

  const handleAddNewCustomer = () => {
    setIsCustomerDialogOpen(true);
  };

  const handleCustomerCreated = (newCustomer: Customer) => {
    // 自動選中新創建的客戶
    if (newCustomer.id) {
      form.setValue('customer_id', newCustomer.id);
      form.setValue('shipping_address', newCustomer.contact_address || '');
    }
    setIsCustomerDialogOpen(false);
  };



  // 實時價格計算
  const items = form.watch('items');
  const shippingFee = form.watch('shipping_fee') || 0;
  const tax = form.watch('tax') || 0;
  const discountAmount = form.watch('discount_amount') || 0;

  // 計算小計
  const subtotal = items?.reduce((acc, item) => {
    // 🎯 使用 ?? 正確處理 price 的 undefined 狀態
    const itemTotal = (item.price ?? 0) * (item.quantity || 0);
    return acc + itemTotal;
  }, 0) || 0;

  // 計算總計
  const grandTotal = Math.max(0, subtotal + shippingFee + tax - discountAmount);

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          
          {/* 客戶選擇區塊 */}
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
                      // 同時更新 customer_id 和 shipping_address
                      form.setValue('customer_id', customer.id!);
                      form.setValue('shipping_address', customer.contact_address || '');
                    }
                  }}
                  onAddNewCustomer={handleAddNewCustomer}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* 訂單項目區塊 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">訂單項目</h3>
              <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setIsSelectorOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                新增項目
              </Button>
            </div>

            {fields.length > 0 ? (
              <>
                {/* 項目列表的表頭 */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                  <div className="col-span-4">商品名稱</div>
                  <div className="col-span-2">SKU</div>
                  <div className="col-span-2 text-right">單價</div>
                  <div className="col-span-2 text-center">數量</div>
                  <div className="col-span-2 text-right">小計</div>
                </div>

                {/* 遍歷渲染已添加的項目 */}
                {fields.map((field, index) => {
                  const quantity = form.watch(`items.${index}.quantity`) || 0;
                  // 🎯 正確處理價格的 undefined 狀態
                  const price = form.watch(`items.${index}.price`) ?? 0;
                  const subtotal = quantity * price;

                  return (
                    <div key={field.id} className="grid grid-cols-12 gap-2 items-center p-3 border rounded-md">
                      {/* 商品名稱 */}
                      <div className="col-span-4">
                        <div className="font-medium">{form.watch(`items.${index}.product_name`)}</div>
                      </div>

                      {/* SKU */}
                      <div className="col-span-2">
                        <span className="font-mono text-sm">{form.watch(`items.${index}.sku`)}</span>
                      </div>

                      {/* 單價 */}
                      <div className="col-span-2">
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
                                  className="text-right"
                                  // 🎯 確保顯示值是字符串，避免表單控制問題
                                  value={field.value?.toString() || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // 如果使用者清空了輸入框，我們傳遞一個 `undefined` 給 react-hook-form
                                    // 讓 Zod 在驗證時處理這個空值（將其轉換為錯誤或要求填寫）
                                    // 而不是在輸入時就強制變為 0
                                    if (value === '') {
                                      field.onChange(undefined); 
                                    } else {
                                      const parsedValue = parseFloat(value);
                                      // 只有在轉換為數字有效時才更新
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
                      </div>

                      {/* 數量 */}
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  className="text-center"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* 小計 */}
                      <div className="col-span-1 text-right font-medium">
                        ${subtotal.toFixed(2)}
                      </div>

                      {/* 刪除按鈕 */}
                      <div className="col-span-1 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </>
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
          </div>

          {/* 其他信息區塊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">其他信息</h3>
            
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>付款方式</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇客戶來源" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="現場客戶">現場客戶</SelectItem>
                        <SelectItem value="網站客戶">網站客戶</SelectItem>
                        <SelectItem value="LINE客戶">LINE客戶</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>訂單備註</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="輸入此訂單的內部備註..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 價格計算摘要區塊 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">價格摘要</h3>
            
            <div className="bg-muted/50 rounded-lg p-6 space-y-4">
              {/* 運費、稅金、折扣輸入欄位 */}
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 價格計算明細 */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>小計：</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                
                {shippingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>運費：</span>
                    <span className="font-medium">${shippingFee.toFixed(2)}</span>
                  </div>
                )}
                
                {tax > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>稅金：</span>
                    <span className="font-medium">${tax.toFixed(2)}</span>
                  </div>
                )}
                
                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>折扣：</span>
                    <span className="font-medium">-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>總計：</span>
                  <span className="text-primary">${grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '處理中...' : '提交訂單'}
            </Button>
          </div>
        </form>
      </Form>

      {/* 新增客戶對話框 */}
      <Dialog open={isCustomerDialogOpen} onOpenChange={setIsCustomerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>新增客戶</DialogTitle>
          </DialogHeader>
          <CustomerForm
            isSubmitting={createCustomerMutation.isPending}
            onSubmit={(customerData) => {
              // 轉換地址格式以符合 API 期望
              const apiData = {
                ...customerData,
                addresses: customerData.addresses?.map(addr => addr.address) || []
              };
              
              createCustomerMutation.mutate(apiData, {
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
        multiple={true}
        // 將表單中已有的品項 ID 傳入，以便在選擇器中保持勾選狀態
        selectedIds={fields.map(field => field.product_variant_id).filter(id => id !== null) as number[]}
      />
    </>
  );
} 