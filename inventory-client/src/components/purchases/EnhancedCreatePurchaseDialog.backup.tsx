'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Calendar, Package, Plus, Trash2, ShoppingCart, ArrowRight } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/apiClient';
import { ProductSelector } from '@/components/inventory/ProductSelector';
import { useStores } from '@/hooks';
import { useProductVariants } from '@/hooks/queries/products/useProducts';
import { BatchSelectableItem, useBatchSelection } from '@/hooks/useBatchSelection';

// Schema 定義
const createPurchaseSchema = z.object({
  purchased_at: z.date({
    required_error: '請選擇進貨日期',
  }),
  shipping_cost: z.number().min(0, '運費不能為負數'),
  notes: z.string().optional(),
  store_id: z.number().min(1, '請選擇門市'),
  items: z.array(z.object({
    product_variant_id: z.number(),
    quantity: z.number().min(1),
    cost_price: z.number().min(0, '成本價不能為負數'),
    source: z.enum(['manual', 'backorder']).optional(),
    order_item_id: z.number().optional(),
    order_number: z.string().optional(),
  })).min(1, '至少需要一個商品項目'),
});

type CreatePurchaseForm = z.infer<typeof createPurchaseSchema>;

interface EnhancedCreatePurchaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface BackorderItem {
  id: number;
  order_id: number;
  order_number: string;
  product_variant_id: number;
  quantity: number;
  sku: string;
  product_name: string;
  store_id: number;
}

interface BackorderOrder {
  order_id: number;
  order_number: string;
  customer_name: string;
  total_items: number;
  total_quantity: number;
  created_at: string;
  days_pending: number;
  summary_status: string;
  summary_status_text: string;
  items: BackorderItem[];
}

export function EnhancedCreatePurchaseDialog({
  open,
  onOpenChange,
  onSuccess,
}: EnhancedCreatePurchaseDialogProps) {
  const { toast } = useToast();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');

  const { data: storesData } = useStores();

  const form = useForm<CreatePurchaseForm>({
    resolver: zodResolver(createPurchaseSchema),
    defaultValues: {
      purchased_at: new Date(),
      shipping_cost: 0,
      notes: '',
      store_id: 0,
      items: [],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // 獲取所有變體數據（用於顯示手動項目的商品名稱）
  const { data: allVariantsResponse, isLoading: isLoadingAllVariants } = useProductVariants({
    per_page: 500, // 獲取更多變體
  });
  
  const allVariantsData = allVariantsResponse?.data || [];

  // 獲取待進貨商品數據
  const { data: backorderData, isLoading: backorderLoading } = useQuery({
    queryKey: ['backorders', 'for-purchase'],
    queryFn: async () => {
      const response = await apiClient.GET('/api/backorders', {
        params: {
          query: {
            group_by_order: 1,  // 使用數字而非布林值，因為 URL 參數會被轉換為字串
          },
        },
      });
      
      // API 回應格式是 { data: [...] }，需要提取 data 陣列
      if (!response.data || !response.data.data) {
        return [];
      }
      
      return response.data.data as BackorderOrder[];
    },
    enabled: open && activeTab === 'backorder',
  });

  // 轉換待進貨數據為批量選擇格式
  const backorderItems = useMemo(() => {
    if (!backorderData || !Array.isArray(backorderData)) return [];
    
    return backorderData.flatMap(order => 
      order.items?.map(item => ({
        id: item.id,
        order_id: item.order_id,
        order_number: item.order_number,
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        sku: item.sku,
        product_name: item.product_name,
        store_id: item.store_id,
      })) || []
    ) as BatchSelectableItem[];
  }, [backorderData]);

  // 批量選擇邏輯
  const {
    selectedItems,
    selectedCount,
    isAllSelected,
    isPartialSelected,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    deselectAll,
    clearSelection,
    isItemSelected,
    getTotalSelectedQuantity,
  } = useBatchSelection(backorderItems);

  // 追蹤手動添加的項目
  const [manualItems, setManualItems] = useState<any[]>([]);
  
  // 當選擇的項目改變時，更新表單
  useEffect(() => {
    if (activeTab === 'backorder' && selectedItems.length > 0) {
      const backorderFormItems = selectedItems.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        cost_price: 0,
        source: 'backorder', // 標記來源
        order_item_id: item.id, // 保存訂單項目ID
        order_number: item.order_number, // 保存訂單編號
      }));
      
      // 合併手動項目和待進貨項目
      const allItems = [...manualItems, ...backorderFormItems];
      replace(allItems);
      
      // 設置第一個項目的門市為表單門市
      if (selectedItems[0]?.store_id && !form.getValues('store_id')) {
        form.setValue('store_id', selectedItems[0].store_id);
      }
    }
  }, [selectedItems, replace, form, activeTab, manualItems]);

  // 重置表單當對話框關閉時
  useEffect(() => {
    if (!open) {
      form.reset({
        purchased_at: new Date(),
        shipping_cost: 0,
        notes: '',
        store_id: 0,
        items: [],
      });
      clearSelection();
      setActiveTab('manual');
    }
  }, [open, form, clearSelection]);

  // 添加手動項目
  const addManualItem = () => {
    const newItem = {
      product_variant_id: 0,
      quantity: 1,
      cost_price: 0,
      source: 'manual', // 標記為手動添加
    };
    append(newItem);
    const updatedManualItems = [...manualItems, newItem];
    setManualItems(updatedManualItems);
  };

  // 創建進貨單 mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: CreatePurchaseForm) => {
      const payload = {
        store_id: data.store_id,
        purchased_at: data.purchased_at.toISOString(),
        shipping_cost: data.shipping_cost,
        notes: data.notes,
        items: data.items,
        // 如果是從訂單模式，包含訂單項目映射
        ...(activeTab === 'backorder' && selectedItems.length > 0 && {
          order_items: selectedItems.map(item => ({
            order_item_id: item.id,
            purchase_quantity: item.quantity,
          })),
        }),
      };

      const response = await apiClient.POST('/api/purchases', {
        body: payload,
      });

      return response.data;
    },
    onSuccess: () => {
      toast({
        title: '建立成功',
        description: '進貨單已成功建立',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: '建立失敗',
        description: '進貨單建立失敗，請稍後再試',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreatePurchaseForm) => {
    createPurchaseMutation.mutate(data);
  };

  // 使用 useWatch 來確保正確追蹤表單變化
  const watchedItems = useWatch({
    control: form.control,
    name: 'items',
  });
  
  const watchedShippingCost = useWatch({
    control: form.control,
    name: 'shipping_cost',
  });
  
  // 計算總成本
  const totalCost = useMemo(() => {
    const items = watchedItems || [];
    const shippingCost = watchedShippingCost || 0;
    
    const itemsTotal = items.reduce((total, item) => {
      const cost = parseFloat(String(item?.cost_price || 0));
      const quantity = parseInt(String(item?.quantity || 0), 10);
      return total + (cost * quantity);
    }, 0);

    return itemsTotal + shippingCost;
  }, [watchedItems, watchedShippingCost]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            建立進貨單
          </DialogTitle>
          <DialogDescription>
            建立新的進貨單，可以手動添加商品或從待進貨訂單選擇
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* 基本資訊 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="store_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>門市</FormLabel>
                    <Select
                      value={field.value?.toString() || ""}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="選擇門市" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {storesData?.data?.map((store: any) => (
                          <SelectItem key={store.id} value={store.id?.toString()}>
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="purchased_at"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>進貨日期</FormLabel>
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: zhTW })
                            ) : (
                              <span>請選擇日期</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            field.onChange(date);
                            setCalendarOpen(false);
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shipping_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>運費成本</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>備註</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="輸入進貨備註..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 商品選擇方式 */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  手動添加商品
                </TabsTrigger>
                <TabsTrigger value="backorder" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  從待進貨訂單選擇
                </TabsTrigger>
              </TabsList>

              {/* 手動添加模式 */}
              <TabsContent value="manual" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>商品項目</CardTitle>
                        <CardDescription>手動選擇商品和數量</CardDescription>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addManualItem}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        新增商品
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {fields.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>點擊上方按鈕添加商品項目</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {fields.map((field, index) => {
                          const item = form.getValues(`items.${index}`);
                          // 只顯示手動項目在手動標籤下
                          if (activeTab === 'manual' && item?.source === 'backorder') return null;
                          
                          return (
                          <div key={field.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">
                                商品 {index + 1}
                                {item?.source === 'manual' && (
                                  <Badge variant="secondary" className="ml-2">手動添加</Badge>
                                )}
                                {item?.source === 'backorder' && (
                                  <Badge variant="default" className="ml-2">{item.order_number}</Badge>
                                )}
                              </h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  remove(index);
                                  // 如果是手動項目，從 manualItems 中移除
                                  if (item?.source === 'manual') {
                                    setManualItems(manualItems.filter((_, i) => i !== index));
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`items.${index}.product_variant_id`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>商品</FormLabel>
                                    <FormControl>
                                      <ProductSelector
                                        value={field.value}
                                        onValueChange={(variantId, variant) => {
                                          field.onChange(variantId);
                                          if (variant?.price) {
                                            form.setValue(
                                              `items.${index}.cost_price`,
                                              variant.price,
                                            );
                                          }
                                        }}
                                        placeholder="搜尋並選擇商品"
                                        showCurrentStock={false}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>數量</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="1"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`items.${index}.cost_price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>成本價格</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* 待進貨訂單選擇模式 */}
              <TabsContent value="backorder" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>待進貨商品</CardTitle>
                    <CardDescription>
                      從待進貨的訂單中選擇項目來建立進貨單
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {backorderLoading ? (
                      <div className="text-center py-8">載入中...</div>
                    ) : !backorderData?.length ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>目前沒有待進貨的商品</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* 批量操作 */}
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              已選擇 {selectedCount} 個項目
                            </span>
                            {selectedCount > 0 && (
                              <span className="text-sm text-muted-foreground">
                                總數量：{getTotalSelectedQuantity()}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => selectAll(backorderItems)}
                            >
                              全選
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={deselectAll}
                            >
                              清除
                            </Button>
                          </div>
                        </div>

                        {/* 待進貨項目列表 */}
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-12">選擇</TableHead>
                              <TableHead>商品名稱</TableHead>
                              <TableHead>SKU</TableHead>
                              <TableHead>訂單編號</TableHead>
                              <TableHead className="text-right">數量</TableHead>
                              <TableHead className="text-right">成本價格</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {backorderItems.map((item, index) => {
                              const isSelected = isItemSelected(item.id);
                              return (
                                <TableRow 
                                  key={item.id}
                                  className={isSelected ? 'bg-accent/50' : ''}
                                >
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleItem(item)}
                                      className="rounded"
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {item.product_name}
                                  </TableCell>
                                  <TableCell>
                                    <code className="text-sm">{item.sku}</code>
                                  </TableCell>
                                  <TableCell>{item.order_number}</TableCell>
                                  <TableCell className="text-right">
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {isSelected && (
                                      <FormField
                                        control={form.control}
                                        name={`items.${selectedItems.findIndex(selected => selected.id === item.id)}.cost_price`}
                                        render={({ field }) => (
                                          <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-20 text-right"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                          />
                                        )}
                                      />
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* 已選擇項目彙總 */}
            {fields.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>已選擇的商品</CardTitle>
                  <CardDescription>
                    共 {fields.length} 項商品
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>商品</TableHead>
                        <TableHead>來源</TableHead>
                        <TableHead className="text-right">數量</TableHead>
                        <TableHead className="text-right">成本價</TableHead>
                        <TableHead className="text-right">小計</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const item = form.watch(`items.${index}`);
                        if (!item) return null;
                        
                        // 根據來源獲取商品資訊
                        let productName = '未知商品';
                        let productSpecs = '';
                        let sku = '';
                        
                        if (item.source === 'backorder') {
                          // 從待進貨項目中查找商品名稱
                          const backorderItem = backorderItems.find(bi => bi.id === item.order_item_id);
                          productName = backorderItem?.product_name || '未知商品';
                          sku = backorderItem?.sku || '';
                        } else {
                          // 手動項目，從 allVariantsData 中查找
                          const variant = allVariantsData?.find((v: any) => v.id === item.product_variant_id);
                          if (variant) {
                            productName = variant.product?.name || '未知商品';
                            sku = variant.sku || '';
                            // 組合屬性值顯示
                            productSpecs = variant.attribute_values
                              ?.map((av: any) => `${av.attribute?.name || ''}: ${av.value || ''}`)
                              .join(' • ') || '';
                          }
                        }
                        
                        return (
                          <TableRow key={field.id}>
                            <TableCell>
                              <div className="font-medium">{productName}</div>
                              <div className="text-sm text-muted-foreground">
                                {sku && `SKU: ${sku}`}
                                {productSpecs && ` • ${productSpecs}`}
                              </div>
                            </TableCell>
                            <TableCell>
                              {item.source === 'manual' ? (
                                <Badge variant="secondary">手動添加</Badge>
                              ) : (
                                <Badge variant="default">
                                  {(() => {
                                    // 首先嘗試使用 item.order_number
                                    if (item.order_number && item.order_number.trim() !== '') {
                                      return item.order_number;
                                    }
                                    // 如果沒有，從 backorderItems 中查找
                                    const backorderItem = backorderItems.find(bi => bi.id === item.order_item_id);
                                    return backorderItem?.order_number || '無訂單編號';
                                  })()}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              ${item.cost_price || 0}
                            </TableCell>
                            <TableCell className="text-right">
                              ${((item.quantity || 0) * (item.cost_price || 0)).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* 總成本 */}
            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                總成本：${totalCost.toFixed(2)}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={
                  (activeTab === 'manual' && fields.length === 0) ||
                  (activeTab === 'backorder' && selectedItems.length === 0) ||
                  createPurchaseMutation.isPending
                }
              >
                {createPurchaseMutation.isPending ? '建立中...' : '建立進貨單'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}