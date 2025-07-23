'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { MoneyHelper } from '@/lib/money-helper';
import { zhTW } from 'date-fns/locale';
import { Calendar, Package, Plus, Trash2, ShoppingCart } from 'lucide-react';
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
import type { StoreResponse } from '@/types/api-helpers';
import type { ProductVariant } from '@/types/product';

// 統一的商品項目接口
interface PurchaseItem {
  id: string; // 用於 React key
  product_variant_id: number;
  quantity: number;
  cost_price: number;
  source: 'manual' | 'backorder';
  // 統一的商品信息
  product_name: string;
  sku: string;
  product_specs?: string; // 商品規格（如顏色、尺寸）
  // 待進貨項目專用
  order_number?: string;
  order_item_id?: number;
}

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
  })),
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

export function EnhancedCreatePurchaseDialog({
  open,
  onOpenChange,
  onSuccess,
}: EnhancedCreatePurchaseDialogProps) {
  const { toast } = useToast();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('manual');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [selectedBackorderItems, setSelectedBackorderItems] = useState<number[]>([]);

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

  // 移除 allVariants 查詢 - 不再需要獲取所有變體資料

  // 獲取待進貨商品數據
  const { data: backorderData, isLoading: backorderLoading, refetch: refetchBackorders } = useQuery({
    queryKey: ['backorders', 'for-purchase'],
    queryFn: async () => {
      try {
        const response = await apiClient.GET('/api/backorders', {
          params: {
            query: {
              group_by_order: 1,
              for_purchase_only: 1, // 只返回需要進貨的項目
            },
          },
        });
        
        // console.log('待進貨 API 響應:', response);
        
        if (!response.data?.data || !Array.isArray(response.data.data)) {
          console.log('待進貨數據為空或格式不正確');
          return [];
        }
        
        // 簡化數據處理邏輯
        interface BackorderApiItem {
          id: number;
          order_id: number;
          product_variant_id: number;
          quantity: number;
          sku: string;
          product_name: string;
          store_id?: number;
          order_number?: string;
          transfer?: {
            to_store_id?: number;
            from_store_id?: number;
          };
        }
        
        const processItem = (item: BackorderApiItem, orderInfo?: { order_number?: string; order_id?: number }) => {
          console.log('處理待進貨項目:', item);
          
          // 驗證必要字段
          if (!item.product_variant_id) {
            console.warn('待進貨項目缺少 product_variant_id:', item);
            return null;
          }
          
          const storeId = item.transfer?.to_store_id || 
                         item.transfer?.from_store_id || 
                         item.store_id || 
                         1;
          
          return {
            id: item.id,
            order_id: orderInfo?.order_id || item.order_id,
            order_number: orderInfo?.order_number || item.order_number || `ORDER-${item.order_id}`,
            product_variant_id: item.product_variant_id,
            quantity: item.quantity,
            sku: item.sku,
            product_name: item.product_name,
            store_id: storeId,
          } as BackorderItem;
        };
        
        // 直接使用控制台輸出的實際數據結構
        const data = response.data.data;
        // console.log('原始數據:', data);
        
        // 從控制台看到數據是按訂單分組的格式
        let processedItems: BackorderItem[] = [];
        
        // 處理按訂單分組的數據
        if (Array.isArray(data) && data.length > 0 && data[0].items) {
          // 按訂單分組的格式
          processedItems = data.flatMap((order: any) => {
            const orderNumber = order.order_number || `ORDER-${order.order_id}`;
            return (order.items || []).map((item: any) => {
              // console.log('處理項目:', item);
              
              const backorderItem: BackorderItem = {
                id: item.id,
                order_id: order.order_id,
                order_number: orderNumber,
                product_variant_id: item.product_variant_id || 0, // 使用後端提供的值
                quantity: item.quantity || 1,
                sku: item.sku || '',
                product_name: item.product_name || '',
                store_id: item.store_id || 1,
              };
              
              return backorderItem;
            });
          });
        } else {
          // 直接陣列格式（備用）
          processedItems = data.map((item: any) => {
            const backorderItem: BackorderItem = {
              id: item.id,
              order_id: item.order_id || 0,
              order_number: item.order_number || `ORDER-${item.order_id || 0}`,
              product_variant_id: item.product_variant_id || 0,
              quantity: item.quantity || 1,
              sku: item.sku || '',
              product_name: item.product_name || '',
              store_id: item.store_id || 1,
            };
            return backorderItem;
          }).filter((item: BackorderItem) => item.sku && item.product_name);
        }
        
        // console.log('最終處理的待進貨項目數量:', processedItems.length);
        // console.log('最終處理的待進貨項目:', processedItems);
        return processedItems;
      } catch (error) {
        console.error('獲取待進貨數據失敗:', error);
        toast({
          title: '獲取待進貨數據失敗',
          description: '請稍後再試',
          variant: 'destructive',
        });
        return [];
      }
    },
    enabled: open && activeTab === 'backorder',
  });

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
      setPurchaseItems([]);
      setSelectedBackorderItems([]);
      setActiveTab('manual');
    }
  }, [open, form]);

  // 添加手動商品項目
  const addManualItem = () => {
    const newItem: PurchaseItem = {
      id: `manual-${Date.now()}`,
      product_variant_id: 0,
      quantity: 1,
      cost_price: 0,
      source: 'manual',
      product_name: '',
      sku: '',
    };
    setPurchaseItems([...purchaseItems, newItem]);
    updateFormItems([...purchaseItems, newItem]);
  };

  // 更新手動項目
  const updateManualItem = (itemId: string, updates: Partial<PurchaseItem>) => {
    const updatedItems = purchaseItems.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    setPurchaseItems(updatedItems);
    updateFormItems(updatedItems);
  };

  // 刪除項目
  const removeItem = (itemId: string) => {
    const updatedItems = purchaseItems.filter(item => item.id !== itemId);
    setPurchaseItems(updatedItems);
    updateFormItems(updatedItems);
  };

  // 處理待進貨項目選擇
  const toggleBackorderItem = (backorderItem: BackorderItem) => {
    const isSelected = selectedBackorderItems.includes(backorderItem.id);
    
    if (isSelected) {
      // 取消選擇
      setSelectedBackorderItems(prev => prev.filter(id => id !== backorderItem.id));
      const updatedItems = purchaseItems.filter(item => 
        !(item.source === 'backorder' && item.order_item_id === backorderItem.id)
      );
      setPurchaseItems(updatedItems);
      updateFormItems(updatedItems);
    } else {
      // 選擇
      setSelectedBackorderItems(prev => [...prev, backorderItem.id]);
      const newItem: PurchaseItem = {
        id: `backorder-${backorderItem.id}`,
        product_variant_id: backorderItem.product_variant_id, // 保持原始值，不使用默認值
        quantity: backorderItem.quantity,
        cost_price: 0,
        source: 'backorder',
        product_name: backorderItem.product_name,
        sku: backorderItem.sku,
        order_number: backorderItem.order_number,
        order_item_id: backorderItem.id,
      };
      const updatedItems = [...purchaseItems, newItem];
      setPurchaseItems(updatedItems);
      updateFormItems(updatedItems);
      
      // 自動設置門市ID（如果尚未設置）
      if (backorderItem.store_id && !form.getValues('store_id')) {
        form.setValue('store_id', backorderItem.store_id);
      }
    }
  };

  // 更新表單項目
  const updateFormItems = (items: PurchaseItem[]) => {
    // 只將手動添加的項目加入到表單的 items 陣列
    // 待進貨項目會通過 order_items 參數單獨處理
    const formItems = items
      .filter(item => item.source === 'manual') // 只包含手動項目
      .map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        cost_price: item.cost_price,
        source: item.source,
        order_item_id: item.order_item_id,
        order_number: item.order_number,
      }));
    replace(formItems);
  };

  // 處理商品選擇
  const handleProductSelect = (itemId: string, variantId: number, variant: ProductVariant) => {
    if (!variant) return;
    
    // 直接從 ProductSelector 傳入的 variant 獲取所有必要信息
    const updates: Partial<PurchaseItem> = {
      product_variant_id: variantId,
      product_name: variant.product?.name || '未知商品',
      sku: variant.sku || '',
      product_specs: variant.attributeValues
        ?.map((av) => `${av.attribute?.name || ''}: ${av.value}`)
        .join(' • ') || '',
      cost_price: parseFloat(variant.price || '0'),
    };
    
    updateManualItem(itemId, updates);
  };

  // 創建進貨單 mutation
  const createPurchaseMutation = useMutation({
    mutationFn: async (data: CreatePurchaseForm) => {
      // 從 purchaseItems 狀態中分離手動添加的項目和待進貨項目
      const manualItems = purchaseItems.filter(item => item.source === 'manual');
      const backorderItems = purchaseItems.filter(item => item.source === 'backorder');
      
      // 清理手動項目，只保留後端需要的欄位
      const cleanedManualItems = manualItems.map(item => ({
        product_variant_id: item.product_variant_id,
        quantity: item.quantity,
        cost_price: item.cost_price,
      }));
      
      // 準備進貨單的基本數據
      const payload = {
        store_id: data.store_id,
        purchased_at: data.purchased_at.toISOString(),
        shipping_cost: data.shipping_cost,
        notes: data.notes || '',
        items: cleanedManualItems, // 可以是空陣列
        // 如果有待進貨項目，一起提交
        ...(backorderItems.length > 0 && {
          order_items: backorderItems
            .filter(item => item.order_item_id) // 確保有 order_item_id
            .map(item => ({
              order_item_id: item.order_item_id,
              purchase_quantity: item.quantity,
              cost_price: item.cost_price, // 包含成本價格
            })),
        }),
      };

      // console.log('提交的數據:', payload);

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
    onError: (error: unknown) => {
      // 安全地處理錯誤
      let errorMessage = '進貨單建立失敗，請稍後再試';
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { message?: string } } };
        errorMessage = apiError.response?.data?.message || errorMessage;
      }
      toast({
        title: '建立失敗',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CreatePurchaseForm) => {
    // 驗證門市選擇
    if (!data.store_id) {
      toast({
        title: '請選擇門市',
        description: '必須選擇一個門市才能建立進貨單',
        variant: 'destructive',
      });
      return;
    }
    
    // 驗證至少有一個項目（手動或待進貨）
    if (purchaseItems.length === 0) {
      toast({
        title: '請添加商品',
        description: '至少需要添加一個商品項目',
        variant: 'destructive',
      });
      return;
    }
    
    createPurchaseMutation.mutate(data);
  };

  // 計算總成本
  const watchedItems = useWatch({
    control: form.control,
    name: 'items',
  });
  
  const watchedShippingCost = useWatch({
    control: form.control,
    name: 'shipping_cost',
  });
  
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
                        {storesData?.data?.map((store: StoreResponse) => (
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
                    {purchaseItems.filter(item => item.source === 'manual').length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>點擊上方按鈕添加商品項目</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {purchaseItems.filter(item => item.source === 'manual').map((item, index) => (
                          <div key={item.id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">
                                商品 {index + 1}
                                <Badge variant="secondary" className="ml-2">手動添加</Badge>
                              </h4>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="text-sm font-medium mb-2 block">商品</label>
                                <ProductSelector
                                  key={`product-selector-${item.id}-${item.product_variant_id || 0}`}
                                  value={item.product_variant_id || 0}
                                  onValueChange={(variantId, variant) => 
                                    handleProductSelect(item.id, variantId, variant)
                                  }
                                  placeholder="搜尋並選擇商品"
                                  showCurrentStock={false}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">數量</label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateManualItem(item.id, { 
                                    quantity: Number(e.target.value) 
                                  })}
                                />
                              </div>

                              <div>
                                <label className="text-sm font-medium mb-2 block">成本價格</label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.cost_price}
                                  onChange={(e) => updateManualItem(item.id, { 
                                    cost_price: Number(e.target.value) 
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
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
                        {/* 選擇狀態顯示 */}
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">
                              已選擇 {selectedBackorderItems.length} 個項目
                            </span>
                            {selectedBackorderItems.length > 0 && (
                              <span className="text-sm text-muted-foreground">
                                總數量：{selectedBackorderItems.reduce((sum, itemId) => {
                                  const item = backorderData?.find(b => b.id === itemId);
                                  return sum + (item?.quantity || 0);
                                }, 0)}
                              </span>
                            )}
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
                            {backorderData?.map((item) => {
                              const isSelected = selectedBackorderItems.includes(item.id);
                              return (
                                <TableRow 
                                  key={item.id}
                                  className={isSelected ? 'bg-accent/50' : ''}
                                >
                                  <TableCell>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleBackorderItem(item)}
                                      className="rounded"
                                    />
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {item.product_name}
                                  </TableCell>
                                  <TableCell>
                                    <code className="text-sm">{item.sku}</code>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="default">
                                      {item.order_number || `ORDER-${item.order_id}` || '無訂單編號'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {item.quantity}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {isSelected && (
                                      <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="w-20 text-right"
                                        name={`cost_price_${item.id}`}
                                        value={purchaseItems.find(p => p.order_item_id === item.id)?.cost_price || 0}
                                        onChange={(e) => {
                                          const purchaseItem = purchaseItems.find(p => p.order_item_id === item.id);
                                          if (purchaseItem) {
                                            updateManualItem(purchaseItem.id, {
                                              cost_price: Number(e.target.value)
                                            });
                                          }
                                        }}
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
            {purchaseItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>已選擇的商品</CardTitle>
                  <CardDescription>
                    共 {purchaseItems.length} 項商品
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
                      {purchaseItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">{item.product_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {item.sku && `SKU: ${item.sku}`}
                              {item.product_specs && ` • ${item.product_specs}`}
                            </div>
                          </TableCell>
                          <TableCell>
                            {item.source === 'manual' ? (
                              <Badge variant="secondary">手動添加</Badge>
                            ) : (
                              <Badge variant="default">
                                {item.order_number || `訂單-${item.order_item_id}` || '無訂單編號'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {MoneyHelper.format(item.cost_price || 0, 'NT$', true)}
                          </TableCell>
                          <TableCell className="text-right">
                            {MoneyHelper.format((item.quantity || 0) * (item.cost_price || 0), 'NT$', true)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* 總成本 */}
            <div className="flex justify-end">
              <div className="text-lg font-semibold">
                總成本：{MoneyHelper.format(totalCost, 'NT$', true)}
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
                  purchaseItems.length === 0 ||
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