"use client";

import React from "react";
import { useFieldArray } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { useInstallationItems } from "@/hooks/useInstallationItems";
import { Form } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle, Trash2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { formatDate } from "@/lib/dateHelpers";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ProductSelector } from "@/components/inventory/ProductSelector";
import { useStandardForm } from "@/hooks/useStandardForm";
import { 
  createInstallationSchema, 
  updateInstallationSchema, 
  type CreateInstallationData, 
  type UpdateInstallationData,
  type InstallationItem
} from "@/lib/validations/installation";
import { StandardForm } from "@/components/forms/StandardForm";
import { 
  StandardInputField, 
  StandardTextareaField, 
  StandardSelectField 
} from "@/components/forms/StandardFormField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * 安裝表單值類型（向下相容）
 */
export type InstallationFormValues = CreateInstallationData | UpdateInstallationData;

/**
 * 安裝表單內部值類型（包含可選的 id 屬性）
 */
type InstallationFormInternalValues = CreateInstallationData & {
  id?: number;
};

/**
 * 安裝表單元件屬性介面
 */
interface InstallationFormProps {
  /** 表單模式：創建或編輯 */
  mode?: 'create' | 'edit';
  /** 初始資料（編輯模式時使用） */
  initialData?: Partial<InstallationFormValues>;
  /** 安裝 ID（編輯模式時必須） */
  installationId?: number;
  /** 表單標題 */
  title?: string;
  /** 表單描述 */
  description?: string;
  /** 取消回調 */
  onCancel?: () => void;
  /** 成功回調 */
  onSuccess?: (data: CreateInstallationData | UpdateInstallationData) => void;
  /** 是否正在提交（向下相容） */
  isSubmitting?: boolean;
  /** 提交回調（向下相容） */
  onSubmit?: (data: InstallationFormValues) => void;
}

/**
 * 安裝表單元件（統一架構版）
 * 
 * 支援新增和編輯兩種模式，使用統一的驗證和表單處理邏輯。
 * 
 * 功能特色：
 * 1. 統一的 Zod 驗證和錯誤處理
 * 2. 標準化表單組件
 * 3. 動態安裝項目管理
 * 4. 完整的類型安全
 * 5. 智能產品選擇器
 */
export function InstallationForm({
  mode = 'create',
  initialData,
  installationId,
  title,
  description,
  onCancel,
  onSuccess,
  // 向下相容的屬性
  isSubmitting: legacyIsSubmitting,
  onSubmit: legacyOnSubmit,
}: InstallationFormProps) {
  // 確定使用的驗證schema和默認值
  const isEditMode = mode === 'edit';
  const validationSchema = isEditMode ? updateInstallationSchema : createInstallationSchema;
  const defaultTitle = title || (isEditMode ? "編輯安裝單" : "新增安裝單");
  const defaultDescription = description || (isEditMode ? "編輯安裝單的詳細資訊" : "請填寫安裝單的詳細資訊");
  
  // 準備表單默認值
  const formDefaults: InstallationFormInternalValues = {
    customer_name: initialData?.customer_name || '',
    customer_phone: initialData?.customer_phone || '',
    installation_address: initialData?.installation_address || '',
    installer_user_id: initialData?.installer_user_id || null,
    scheduled_date: initialData?.scheduled_date || '',
    notes: initialData?.notes || '',
    items: initialData?.items || [
      {
        product_variant_id: undefined,
        product_name: '',
        sku: '',
        quantity: 1,
        specifications: '',
        notes: '',
      }
    ],
    ...(isEditMode && { id: installationId || (initialData as UpdateInstallationData)?.id }),
  };

  // 使用標準表單Hook（優先使用新架構，降級到舊版 API）
  const {
    form,
    isSubmitting,
    handleSubmit: submitForm,
  } = useStandardForm({
    schema: validationSchema,
    defaultValues: formDefaults,
    onSubmit: async (data) => {
      // 優先使用新的 onSuccess，降級到舊的 onSubmit
      if (onSuccess) {
        onSuccess(data);
      } else if (legacyOnSubmit) {
        legacyOnSubmit(data);
      } else {
        console.log('提交安裝單数據:', data);
      }
    },
    onSuccess: (data) => {
      console.log('安裝單表單提交成功:', data);
    },
    successMessage: isEditMode ? "安裝單更新成功" : "安裝單創建成功",
    errorMessage: isEditMode ? "安裝單更新失敗" : "安裝單創建失敗",
  });
  
  // 向下相容：如果傳入了舊的 isSubmitting，優先使用它
  const finalIsSubmitting = legacyIsSubmitting ?? isSubmitting;

  // 使用自定義 hook 獲取安裝項目管理邏輯
  const {
    datePickerOpen,
    setDatePickerOpen,
    scheduledDateValue,
    usersData,
    isLoadingUsers,
    fields,
    remove,
    handleAddItem,
    handleDateSelect,
    handleFormError,
    handleProductSelect,
    handleClearProduct,
  } = useInstallationItems(form);
  
  // 載入狀態
  const isLoading = finalIsSubmitting;

  // 處理表單提交
  const handleFormSubmit = legacyOnSubmit ? form.handleSubmit(legacyOnSubmit, handleFormError) : submitForm;

  // 準備安裝師傅選項
  const installerOptions = [
    { value: '0', label: '暫不分配' },
    ...(usersData?.map((user: any) => ({
      value: user.id.toString(),
      label: `${user.name || user.username}${user.email ? ` (${user.email})` : ''}`,
    })) || [])
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* 頂層標題區 */}
        <div className="flex items-center gap-4">
          <h1 className="flex-1 text-2xl font-semibold">
            {defaultTitle}
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
                  disabled={isLoading}
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
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* 商品選擇器 - 佔整行 */}
                        <div className="mb-4">
                          {/* 🎯 簡化：只要有商品名稱，就顯示商品信息 */}
                          {form.watch(`items.${index}.product_name`) && form.watch(`items.${index}.product_name`)?.trim() !== '' ? (
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                商品規格 <span className="text-destructive">*</span>
                              </label>
                              {/* 當前選中的商品顯示 */}
                              <div className="p-3 bg-muted/50 rounded-lg border">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm">
                                      {form.watch(`items.${index}.product_name`) || '商品名稱'}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      SKU: {form.watch(`items.${index}.sku`) || '未知SKU'}
                                      {form.watch(`items.${index}.product_variant_id`) && (form.watch(`items.${index}.product_variant_id`) ?? 0) > 0 && (
                                        <span className="text-green-600"> • ID: {form.watch(`items.${index}.product_variant_id`)}</span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleClearProduct(index)}
                                    disabled={isLoading}
                                  >
                                    更換商品
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* 沒有選擇時顯示ProductSelector */
                            <div className="space-y-2">
                              <label className="text-sm font-medium">
                                商品規格 <span className="text-destructive">*</span>
                              </label>
                              <ProductSelector
                                key={`product-selector-${index}`}
                                value={0}
                                onValueChange={(variantId, variant) => {
                                  form.setValue(`items.${index}.product_variant_id`, variantId);
                                  handleProductSelect(index, variantId, variant);
                                }}
                                placeholder="搜尋並選擇商品規格"
                                disabled={isLoading}
                                showCurrentStock={true}
                              />
                            </div>
                          )}
                        </div>

                        {/* 數量與安裝規格 - 並排 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <StandardInputField
                            control={form.control}
                            name={`items.${index}.quantity` as any}
                            label="數量"
                            type="number"
                            min={1}
                            placeholder="請輸入數量"
                            required
                            disabled={isLoading}
                          />
                          
                          <StandardInputField
                            control={form.control}
                            name={`items.${index}.specifications` as any}
                            label="安裝規格"
                            placeholder="安裝規格說明"
                            disabled={isLoading}
                          />
                        </div>

                        {/* 備註 - 佔整行，使用 Textarea */}
                        <StandardTextareaField
                          control={form.control}
                          name={`items.${index}.notes` as any}
                          label="項目備註"
                          placeholder="輸入此項目的詳細備註資訊，如特殊安裝要求、注意事項等..."
                          rows={3}
                          disabled={isLoading}
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
                  <StandardInputField
                    control={form.control}
                    name="customer_name"
                    label="客戶姓名"
                    placeholder="請輸入客戶姓名"
                    required
                    disabled={isLoading}
                  />

                  {/* 客戶電話 */}
                  <StandardInputField
                    control={form.control}
                    name="customer_phone"
                    label="客戶電話"
                    placeholder="請輸入客戶電話"
                    disabled={isLoading}
                  />

                  {/* 安裝地址 */}
                  <StandardTextareaField
                    control={form.control}
                    name="installation_address"
                    label="安裝地址"
                    placeholder="請輸入詳細的安裝地址"
                    rows={3}
                    required
                    disabled={isLoading}
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
                  <div className="space-y-2">
                    <label className="text-sm font-medium">預計安裝日期</label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !scheduledDateValue && "text-muted-foreground"
                          )}
                          disabled={isLoading}
                        >
                          {scheduledDateValue ? (
                            formatDate.chineseDate(scheduledDateValue).replace(' 年 ', '年').replace(' 月 ', '月').replace(' 日', '日')
                          ) : (
                            <span>選擇安裝日期</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
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
                  </div>

                  {/* 安裝師傅選擇 */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">安裝師傅</label>
                    <Select 
                      value={form.watch('installer_user_id')?.toString() || '0'} 
                      onValueChange={(value: string) => {
                        const numericValue = value === '0' ? null : parseInt(value, 10);
                        form.setValue('installer_user_id', numericValue);
                      }}
                      disabled={isLoading || isLoadingUsers}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingUsers ? "載入中..." : "選擇安裝師傅"} />
                      </SelectTrigger>
                      <SelectContent>
                        {installerOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
            <StandardTextareaField
              control={form.control}
              name="notes"
              label=""
              placeholder="輸入此安裝單的備註資訊..."
              rows={4}
              disabled={isLoading}
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
              disabled={isLoading}
            >
              取消
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={isLoading}
          >
            {isLoading 
              ? (isEditMode ? '更新中...' : '創建中...') 
              : (isEditMode ? '更新安裝單' : '創建安裝單')
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}