/**
 * 安裝項目管理業務邏輯 Hook
 * 
 * 提取 InstallationForm 組件中安裝項目相關的業務邏輯：
 * 1. 安裝項目的增加和刪除
 * 2. 商品選擇和自動填入邏輯
 * 3. 表單項目驗證和錯誤處理
 * 4. 日期選擇管理
 * 5. 用戶篩選邏輯
 */

import { useState } from "react";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";
import { useUsers, useErrorHandler } from "@/hooks";
import { useAppFieldArray } from "@/hooks/useAppFieldArray";
import { InstallationFormValues } from "@/components/installations/InstallationForm";

// 安裝項目類型定義
type InstallationItem = {
  quantity: number;
  product_name?: string;
  sku?: string;
  notes?: string;
  order_item_id?: number | null;
  specifications?: string;
  product_variant_id?: number | null;
};

export interface UseInstallationItemsReturn {
  // 日期相關狀態
  datePickerOpen: boolean;
  setDatePickerOpen: (open: boolean) => void;
  scheduledDateValue: string | undefined;
  
  // 用戶數據
  usersData: Array<{
    id: number;
    name: string;
    username: string;
    email?: string;
  }>;
  isLoadingUsers: boolean;
  
  // 安裝項目管理
  fields: Array<{ key: string; [key: string]: unknown }>;
  append: (item?: Partial<InstallationItem>) => void;
  remove: (index: number) => void;
  
  // 操作函數
  handleAddItem: () => void;
  handleDateSelect: (date: Date | undefined) => void;
  handleFormError: (errors: unknown) => void;
  handleProductSelect: (
    index: number,
    variantId: number,
    variant?: { product?: { name?: string }; sku?: string }
  ) => void;
  handleClearProduct: (index: number) => void;
}

export function useInstallationItems(
  form: UseFormReturn<InstallationFormValues>
): UseInstallationItemsReturn {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // 載入所有用戶，然後在前端篩選有 installer 角色的用戶
  const { data: allUsersData, isLoading: isLoadingUsers } = useUsers();
  
  // 篩選有 installer 角色的用戶
  const usersData = allUsersData?.data?.filter((user: unknown) => {
    const userRecord = user as Record<string, unknown>;
    return userRecord.roles && Array.isArray(userRecord.roles) && userRecord.roles.includes('installer');
  }).map((user: unknown) => {
    const userRecord = user as Record<string, unknown>;
    return {
      id: userRecord.id as number,
      name: userRecord.name as string,
      username: userRecord.username as string,
      email: userRecord.email as string | undefined,
    };
  }) || [];

  // 初始化 useFieldArray 來管理 items 字段
  const { fields, append: appendOriginal, remove } = useAppFieldArray({
    control: form.control,
    name: "items",
  });

  // 包裝 append 函數以符合我們的類型
  const append = (item?: Partial<InstallationItem>) => {
    const defaultItem = {
      product_variant_id: 0,
      product_name: "",
      sku: "",
      quantity: 1,
      specifications: "",
      notes: "",
    };
    appendOriginal({ ...defaultItem, ...item });
  };

  // 處理新增安裝項目
  const handleAddItem = () => {
    append();
  };

  // 错誤處理
  const { handleError } = useErrorHandler();
  
  // 處理表單錯誤
  const handleFormError = (errors: unknown) => {
    handleError(new Error("表單驗證失敗：請檢查必填欄位是否已正確填寫"));
  };

  // 處理日期選擇
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue("scheduled_date", format(date, "yyyy-MM-dd"));
      setDatePickerOpen(false);
    }
  };

  // 處理商品選擇
  const handleProductSelect = (
    index: number,
    variantId: number,
    variant?: { product?: { name?: string }; sku?: string }
  ) => {
    form.setValue(`items.${index}.product_variant_id`, variantId);
    
    // 自動填入商品名稱和 SKU
    if (variant) {
      form.setValue(
        `items.${index}.product_name`,
        variant.product?.name || ""
      );
      form.setValue(
        `items.${index}.sku`,
        variant.sku || ""
      );
    }
  };

  // 處理清除商品選擇
  const handleClearProduct = (index: number) => {
    form.setValue(`items.${index}.product_variant_id`, 0);
    form.setValue(`items.${index}.product_name`, "");
    form.setValue(`items.${index}.sku`, "");
  };

  const scheduledDateValue = form.watch("scheduled_date");

  return {
    // 日期相關狀態
    datePickerOpen,
    setDatePickerOpen,
    scheduledDateValue,
    
    // 用戶數據
    usersData,
    isLoadingUsers,
    
    // 安裝項目管理
    fields,
    append,
    remove,
    
    // 操作函數
    handleAddItem,
    handleDateSelect,
    handleFormError,
    handleProductSelect,
    handleClearProduct,
  };
}