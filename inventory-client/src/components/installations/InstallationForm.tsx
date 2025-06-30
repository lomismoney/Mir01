"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { useUsers } from "@/hooks/queries/useEntityQueries";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { useAppFieldArray } from "@/hooks/useAppFieldArray";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  CreateInstallationRequest,
  CreateInstallationItemRequest
} from '@/types/installation';
import { toast } from "sonner";
import { ProductSelector } from "@/components/inventory/ProductSelector";

// 使用 Zod 定義表單驗證規則
const installationFormSchema = z.object({
  // 客戶資訊
  customer_name: z.string().min(1, "客戶姓名為必填"),
  customer_phone: z.string().optional(),
  installation_address: z.string().min(1, "安裝地址為必填"),
  
  // 安裝資訊
  installer_user_id: z.number().optional(),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
  
  // 安裝項目
  items: z
    .array(
      z.object({
        product_variant_id: z.number().min(0, "請選擇商品規格"),
        product_name: z.string().optional(), // 自動填入，但保留以便顯示
        sku: z.string().optional(), // 自動填入，但保留以便顯示
        quantity: z.number().min(1, "數量至少為 1"),
        specifications: z.string().optional(),
        notes: z.string().optional(),
      }),
    )
    .min(1, "安裝單至少需要一個項目")
    .refine(
      (items) => items.some((item) => item.product_variant_id > 0),
      {
        message: "至少需要選擇一個商品規格",
      }
    ),
});

export type InstallationFormValues = z.infer<typeof installationFormSchema>;

interface InstallationFormProps {
  initialData?: Partial<InstallationFormValues>;
  onSubmit: (data: InstallationFormValues) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

export function InstallationForm({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel
}: InstallationFormProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // 載入所有用戶，然後在前端篩選有 installer 角色的用戶
  const { data: allUsersData, isLoading: isLoadingUsers } = useUsers();
  
  // 篩選有 installer 角色的用戶
  const usersData = allUsersData?.filter((user: any) => 
    user.roles && user.roles.includes('installer')
  ) || [];

  const form = useForm<InstallationFormValues>({
    resolver: zodResolver(installationFormSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      installation_address: "",
      installer_user_id: undefined,
      scheduled_date: "",
      notes: "",
      items: [
        // 為新增模式預設新增一個空項目
        {
          product_variant_id: 0,
          product_name: "",
          sku: "",
          quantity: 1,
          specifications: "",
          notes: "",
        }
      ],
    },
  });

  // 初始化 useFieldArray 來管理 items 字段
  const { fields, append, remove, update, replace } = useAppFieldArray({
    control: form.control,
    name: "items",
  });

  // 監聽 initialData 變化，當資料載入完成時更新表單
  useEffect(() => {
    if (initialData && !isLoadingUsers) {
      // 確保用戶數據已載入完成後再重置表單
      form.reset(initialData);
      
      // 特別處理 items 陣列 - 使用 replace 方法確保 useFieldArray 正確更新
      if (initialData.items && Array.isArray(initialData.items)) {
        replace(initialData.items);
      }
    }
  }, [initialData, form, replace, isLoadingUsers]);

  // 處理新增安裝項目
  const handleAddItem = () => {
    append({
      product_variant_id: 0,
      product_name: "",
      sku: "",
      quantity: 1,
      specifications: "",
      notes: "",
    });
  };

  // 處理表單提交
  const handleSubmit = (data: InstallationFormValues) => {
    console.log("表單提交資料:", data);
    onSubmit(data);
  };

  // 處理表單錯誤
  const handleFormError = (errors: any) => {
    console.log("表單驗證錯誤:", errors);
    toast.error("表單驗證失敗", {
      description: "請檢查必填欄位是否已正確填寫"
    });
  };

  // 處理日期選擇
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("scheduled_date", format(date, "yyyy-MM-dd"));
      setDatePickerOpen(false);
    }
  };

  const scheduledDateValue = form.watch("scheduled_date");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit, handleFormError)} className="space-y-6">
        {/* 頂層標題區 */}
        <div className="flex items-center gap-4">
          <h1 className="flex-1 text-2xl font-semibold">
            {initialData ? "編輯安裝單" : "新增安裝單"}
          </h1>
        </div>

        {/* 雙欄式網格佈局 */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* 左側主欄 */}
          <div className="md:col-span-2 space-y-6">
            {/* 安裝項目卡片 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>安裝項目</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddItem}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  新增項目
                </Button>
              </CardHeader>
              <CardContent>
                {fields.length > 0 ? (
                  <div className="space-y-4">
                    {fields.map((field, index) => (
                      <div 
                        key={field.key} 
                        className="relative border border-border/40 rounded-lg p-4 bg-card/50 hover:bg-card/80 transition-colors duration-200"
                      >
                        {/* 項目標題與刪除按鈕 */}
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-medium text-muted-foreground">
                            安裝項目 #{index + 1}
                          </h4>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => remove(index)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 商品選擇器 - 佔整行 */}
                        <div className="mb-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.product_variant_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  商品規格 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <ProductSelector
                                    key={`product-${index}-${field.value || '0'}`}
                                    value={field.value}
                                    onValueChange={(variantId, variant) => {
                                      field.onChange(variantId);
                                      // 自動填入商品名稱和 SKU
                                      if (variant) {
                                        form.setValue(
                                          `items.${index}.product_name`,
                                          variant.product?.name || "",
                                        );
                                        form.setValue(
                                          `items.${index}.sku`,
                                          variant.sku || "",
                                        );
                                      }
                                    }}
                                    placeholder="搜尋並選擇商品規格"
                                    disabled={isSubmitting}
                                    showCurrentStock={true}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 數量與安裝規格 - 並排 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  數量 <span className="text-destructive">*</span>
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    className="w-full"
                                    placeholder="請輸入數量"
                                    {...field}
                                    onChange={(e) =>
                                      field.onChange(
                                        parseInt(e.target.value) || 1,
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name={`items.${index}.specifications`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium">
                                  安裝規格
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="安裝規格說明"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 備註 - 佔整行，使用 Textarea */}
                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium">
                                項目備註
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="輸入此項目的詳細備註資訊，如特殊安裝要求、注意事項等..."
                                  className="resize-none min-h-[80px] w-full"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed rounded-lg text-center">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-muted-foreground">
                        🔧 尚未添加任何安裝項目
                      </h3>
                      <p className="text-muted-foreground">
                        點擊「新增項目」按鈕來新增安裝項目
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右側邊欄 */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>安裝資訊</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 客戶資訊區塊 */}
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    客戶資訊
                  </div>
                  
                  {/* 客戶姓名 */}
                  <FormField
                    control={form.control}
                    name="customer_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>客戶姓名 *</FormLabel>
                        <FormControl>
                          <Input placeholder="請輸入客戶姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 客戶電話 */}
                  <FormField
                    control={form.control}
                    name="customer_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>客戶電話</FormLabel>
                        <FormControl>
                          <Input placeholder="請輸入客戶電話" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 安裝地址 */}
                  <FormField
                    control={form.control}
                    name="installation_address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>安裝地址 *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="請輸入詳細的安裝地址"
                            className="resize-none min-h-[80px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 分隔線 */}
                <div className="border-t"></div>

                {/* 安裝排程區塊 */}
                <div className="space-y-4">
                  <div className="text-sm font-medium text-muted-foreground">
                    安裝排程
                  </div>

                  {/* 預計安裝日期 */}
                  <FormField
                    control={form.control}
                    name="scheduled_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>預計安裝日期</FormLabel>
                        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !scheduledDateValue && "text-muted-foreground"
                                )}
                              >
                                {scheduledDateValue ? (
                                  format(new Date(scheduledDateValue), "yyyy年MM月dd日")
                                ) : (
                                  <span>選擇安裝日期</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={scheduledDateValue ? new Date(scheduledDateValue) : undefined}
                              onSelect={handleDateSelect}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* 安裝師傅選擇 */}
                  <FormField
                    control={form.control}
                    name="installer_user_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>安裝師傅</FormLabel>
                        <Select
                          onValueChange={(value) => 
                            field.onChange(value === "0" ? undefined : parseInt(value, 10))
                          }
                          value={field.value?.toString() || "0"}
                          disabled={isLoadingUsers}
                          key={`installer-${field.value || '0'}`}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={
                                isLoadingUsers ? "載入中..." : "選擇安裝師傅"
                              } />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">暫不分配</SelectItem>
                            {usersData?.map((user: any) => (
                              <SelectItem 
                                key={user.id} 
                                value={user.id.toString()}
                              >
                                {user.name || user.username} 
                                {user.email && (
                                  <span className="text-muted-foreground text-xs ml-2">
                                    ({user.email})
                                  </span>
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 備註卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>安裝備註</CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="輸入此安裝單的備註資訊..."
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

        {/* 操作按鈕 */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              取消
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (initialData ? '更新中...' : '創建中...') 
              : (initialData ? '更新安裝單' : '創建安裝單')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 