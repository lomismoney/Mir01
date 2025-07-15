"use client";

import React, { useEffect } from "react";
import { useFieldArray } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Trash2, PlusCircle, AlertCircle } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useCheckCustomerExistence } from "@/hooks";
import { Customer } from "@/types/api-helpers";
import { useStandardForm } from "@/hooks/useStandardForm";
import { 
  createCustomerSchema, 
  updateCustomerSchema, 
  type CreateCustomerData, 
  type UpdateCustomerData 
} from "@/lib/validations/customer";
import { StandardForm } from "@/components/forms/StandardForm";
import { 
  StandardInputField, 
  StandardTextareaField, 
  StandardSelectField,
  StandardCheckboxField
} from "@/components/forms/StandardFormField";

/**
 * 客戶表單值類型（向下相容）
 */
type CustomerFormValues = CreateCustomerData | UpdateCustomerData;

/**
 * 客戶表單元件屬性介面
 */
interface CustomerFormProps {
  /** 表單模式：創建或編輯 */
  mode?: 'create' | 'edit';
  /** 初始資料（編輯模式時使用） */
  initialData?: Partial<Customer>;
  /** 客戶 ID（編輯模式時必須） */
  customerId?: number;
  /** 表單標題 */
  title?: string;
  /** 表單描述 */
  description?: string;
  /** 取消回調 */
  onCancel?: () => void;
  /** 成功回調 */
  onSuccess?: (data: CreateCustomerData | UpdateCustomerData) => void;
  /** 是否正在提交（向下相容） */
  isSubmitting?: boolean;
  /** 提交回調（向下相容） */
  onSubmit?: (values: CustomerFormValues) => void;
}

/**
 * 客戶表單元件（統一架構版）
 * 
 * 支援新增和編輯兩種模式，使用統一的驗證和表單處理邏輯。
 * 
 * 功能特色：
 * 1. 統一的 Zod 驗證和錯誤處理
 * 2. 標準化表單組件
 * 3. 智能客戶重複檢查
 * 4. 完整的類型安全
 * 5. 動態地址管理
 */
export function CustomerForm({
  mode = 'create',
  initialData,
  customerId,
  title,
  description,
  onCancel,
  onSuccess,
  // 向下相容的屬性
  isSubmitting: legacyIsSubmitting,
  onSubmit: legacyOnSubmit,
}: CustomerFormProps) {
  // 確定使用的驗證schema和默認值
  const isEditMode = mode === 'edit';
  const validationSchema = isEditMode ? updateCustomerSchema : createCustomerSchema;
  const defaultTitle = title || (isEditMode ? "編輯客戶" : "新增客戶");
  const defaultDescription = description || (isEditMode ? "編輯客戶的基本資訊" : "請填寫客戶的基本資訊");
  
  // 準備表單默認值
  const formDefaults = {
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    is_company: initialData?.is_company ?? false,
    tax_number: initialData?.tax_id || '', // 向下相容：tax_id -> tax_number
    industry_type: initialData?.industry_type || undefined, // 改為 undefined 而非空字串
    payment_type: (initialData?.payment_type as any) || 'cash',
    contact_address: initialData?.contact_address || '',
    addresses: initialData?.addresses || [],
    ...(isEditMode && { id: customerId || initialData?.id }),
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
        console.log('提交客戶数據:', data);
      }
    },
    onSuccess: (data) => {
      console.log('客戶表單提交成功:', data);
    },
    successMessage: isEditMode ? "客戶更新成功" : "客戶創建成功",
    errorMessage: isEditMode ? "客戶更新失敗" : "客戶創建失敗",
  });
  
  // 向下相容：如果傳入了舊的 isSubmitting，優先使用它
  const finalIsSubmitting = legacyIsSubmitting ?? isSubmitting;

  const isCompany = form.watch("is_company");
  
  // 當 is_company 變更時，重置 tax_number 欄位
  React.useEffect(() => {
    if (!isCompany) {
      form.setValue("tax_number", "");
      form.clearErrors("tax_number");
    }
  }, [isCompany, form]);

  // 監聽姓名和電話欄位的變化
  const [name, phone] = form.watch(["name", "phone"]);
  const debouncedName = useDebounce(name, 500); // 對姓名進行防抖

  // 使用客戶名稱檢查 Hook
  const { data: existenceData, refetch } =
    useCheckCustomerExistence(debouncedName || '');

  // 使用 useEffect 觸發檢查
  useEffect(() => {
    // 只有在「姓名有值」且「電話為空」時，才觸發檢查
    if (debouncedName && !phone) {
      refetch();
    }
  }, [debouncedName, phone, refetch]);

  // 動態地址管理
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "addresses",
  });
  
  // 載入狀態
  const isLoading = finalIsSubmitting;

  return (
    <Form {...form}>
      <StandardForm
        title={defaultTitle}
        description={defaultDescription}
        form={form}
        isSubmitting={finalIsSubmitting}
        onSubmit={legacyOnSubmit ? form.handleSubmit(legacyOnSubmit) : submitForm}
        onCancel={onCancel}
        submitText={isEditMode ? "更新客戶" : "創建客戶"}
        cancelText="取消"
      >
        {/* 基本資訊區塊 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* 客戶名稱/公司抬頭 */}
          <div>
            <StandardInputField
              control={form.control}
              name="name"
              label={isCompany ? "公司抬頭" : "客戶姓名"}
              placeholder={isCompany ? "請輸入公司全名" : "請輸入客戶姓名"}
              required
              disabled={isLoading}
            />

            {existenceData?.exists && (
              <Alert variant="destructive" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  警告：系統中已存在同名客戶。建議填寫電話號碼以作區分，或確認是否為同一人。
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* 聯絡電話 */}
          <StandardInputField
            control={form.control}
            name="phone"
            label="聯絡電話"
            placeholder="請輸入聯絡電話"
            disabled={isLoading}
          />
          
          {/* 公司戶複選框 */}
          <div className="md:col-span-2">
            <StandardCheckboxField
              control={form.control}
              name="is_company"
              label="此為公司戶"
              disabled={isLoading}
              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
            />
          </div>

          {/* 公司名稱 - 條件渲染 */}
          {isCompany && (
            <StandardInputField
              control={form.control}
              name="company"
              label="公司名稱"
              placeholder="請輸入公司全名"
              required
              disabled={isLoading}
            />
          )}
          
          {/* 統一編號 - 條件渲染 */}
          {isCompany && (
            <StandardInputField
              control={form.control}
              name="tax_number"
              label="統一編號"
              placeholder="請輸入公司統一編號"
              required={isCompany}
              disabled={isLoading}
            />
          )}

          {/* 客戶行業別 */}
          <StandardSelectField
            control={form.control}
            name="industry_type"
            label="客戶行業別"
            placeholder="請選擇行業別"
            options={[
              { value: '一般客戶', label: '一般客戶' },
              { value: '設計師', label: '設計師' },
              { value: '建設公司', label: '建設公司' },
              { value: '統包工程商', label: '統包工程商' },
            ]}
            disabled={isLoading}
          />

          {/* 付款類別 */}
          <StandardSelectField
            control={form.control}
            name="payment_type"
            label="付款類別"
            options={[
              { value: 'cash', label: '現金付款' },
              { value: 'credit', label: '信用卡' },
              { value: 'transfer', label: '銀行轉帳' },
              { value: 'check', label: '支票' },
            ]}
            required
            disabled={isLoading}
          />

          {/* 主要聯絡地址 */}
          <div className="md:col-span-2">
            <StandardInputField
              control={form.control}
              name="contact_address"
              label="主要聯絡地址"
              placeholder="請輸入主要聯絡地址"
              disabled={isLoading}
            />
          </div>
          
          {/* 備註 */}
          <div className="md:col-span-2">
            <StandardTextareaField
              control={form.control}
              name="note"
              label="備註"
              placeholder="請輸入備註資訊（可選）"
              rows={3}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* 動態地址管理區塊 */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">
              運送地址管理
            </h3>
            <p className="text-sm text-muted-foreground">
              可以為此客戶添加多個運送地址。
            </p>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-1 md:grid-cols-6 gap-4 rounded-md border p-4"
              >
                <div className="md:col-span-1">
                  <StandardSelectField
                    control={form.control}
                    name={`addresses.${index}.type` as any}
                    label="地址類型"
                    options={[
                      { value: 'billing', label: '帳單地址' },
                      { value: 'shipping', label: '送貨地址' },
                    ]}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <StandardInputField
                    control={form.control}
                    name={`addresses.${index}.contact_name` as any}
                    label="聯絡人"
                    placeholder="聯絡人姓名"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <StandardInputField
                    control={form.control}
                    name={`addresses.${index}.address_line_1` as any}
                    label="地址"
                    placeholder={`地址 ${index + 1}`}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="md:col-span-1 flex items-end">
                  <StandardCheckboxField
                    control={form.control}
                    name={`addresses.${index}.is_default` as any}
                    label="設為預設"
                    disabled={isLoading}
                  />
                </div>
                
                <div className="md:col-span-1 flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    data-testid={`delete-address-${index}`}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ 
                type: 'shipping',
                contact_name: '',
                address_line_1: '',
                city: '',
                state: '',
                country: '台灣',
                is_default: fields.length === 0 
              } as any)
            }
            disabled={isLoading}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            新增地址
          </Button>
        </div>
      </StandardForm>
    </Form>
  );
}