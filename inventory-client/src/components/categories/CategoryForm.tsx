"use client";

import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandSeparator,
  CommandEmpty,
} from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { Category } from "@/types/category";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useStandardForm } from "@/hooks/useStandardForm";
import { createCategorySchema, updateCategorySchema, type CreateCategoryData, type UpdateCategoryData } from "@/lib/validations/category";
import { StandardForm, StandardFormDialog } from "@/components/forms/StandardForm";
import { StandardInputField, StandardTextareaField, StandardSelectField } from "@/components/forms/StandardFormField";
import { Form } from "@/components/ui/form";

/**
 * 分類表單元件屬性介面
 */
interface CategoryFormProps {
  /** 表單模式：創建或編輯 */
  mode?: 'create' | 'edit';
  /** 初始資料（編輯模式時使用） */
  initialData?: Category | null;
  /** 分類 ID（編輯模式時必須） */
  categoryId?: number;
  /** 所有分類列表（用於父分類選擇） */
  categories: Category[];
  /** 預設的父分類 ID（新增子分類時使用） */
  parentId?: number | null;
  /** 表單標題 */
  title?: string;
  /** 表單描述 */
  description?: string;
  /** 取消回調 */
  onCancel?: () => void;
  /** 成功回調 */
  onSuccess?: (data: CreateCategoryData | UpdateCategoryData) => void;
  /** 是否在 Dialog 中使用 */
  inDialog?: boolean;
}

/**
 * 舊版表單值類型（向下相容）
 */
export type FormValues = {
  name: string;
  description: string;
  parent_id: string | null;
};

/**
 * 分類選項介面（包含層級資訊）
 */
interface CategoryOption {
  id: number;
  name: string;
  depth: number;
  displayName: string;
  children: Category[]; // 子分類列表，用於判斷是否為父分類
}

// =====================================================
// === 優化後的輔助函數（位於元件外部）===
// =====================================================

/**
 * 遞迴檢查指定分類是否為目標分類的後代
 * 使用查詢表優化性能，避免重複的 filter 操作
 *
 * @param parentId - 父分類 ID
 * @param targetId - 目標分類 ID
 * @param childrenMap - 子分類查詢表
 * @returns 如果是後代關係則返回 true
 */
function isDescendant(
  parentId: number,
  targetId: number,
  childrenMap: Map<number, Category[]>,
): boolean {
  const children = childrenMap.get(parentId) || [];

  for (const child of children) {
    if (child.id === targetId) return true; // 直接子分類
    if (isDescendant(child.id, targetId, childrenMap)) return true; // 間接子分類（孫分類等）
  }

  return false;
}

/**
 * 智能循環檢查函數（優化版）
 * 判斷選擇指定分類作為父分類是否會造成循環關係
 *
 * @param optionId - 想要設定為父分類的選項 ID
 * @param currentCategoryId - 當前正在編輯的分類 ID (新增模式時為 null)
 * @param childrenMap - 子分類查詢表
 * @returns 如果應該禁用此選項則返回 true
 */
function shouldDisableOption(
  optionId: number,
  currentCategoryId: number | null,
  childrenMap: Map<number, Category[]>,
): boolean {
  // 新增模式：不禁用任何選項
  if (!currentCategoryId) return false;

  // 編輯模式：禁用自己（避免自我循環）
  if (optionId === currentCategoryId) return true;

  // 禁用所有後代分類（避免循環關係）
  return isDescendant(currentCategoryId, optionId, childrenMap);
}

/**
 * 建立具有層級結構的分類選項列表
 *
 * 此函數會遞迴處理分類結構，為每個分類添加深度和顯示名稱資訊，
 * 用於在 Combobox 中顯示具有視覺層級的分類選項。
 *
 * @param categories - 原始分類列表
 * @returns 包含層級資訊的扁平化分類選項列表
 */
function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  const categoryMap = new Map<number, Category>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  const options: CategoryOption[] = [];

  function addCategoryOption(
    category: Category,
    depth: number = 0,
    parentPath: string = "",
  ) {
    const displayName = parentPath
      ? `${parentPath} > ${category.name}`
      : category.name;

    // 找到所有子分類
    const children = categories.filter((cat) => cat.parent_id === category.id);

    options.push({
      id: category.id,
      name: category.name,
      depth,
      displayName,
      children, // 添加子分類資訊
    });

    // 遞迴處理子分類
    children.forEach((child) => {
      addCategoryOption(child, depth + 1, displayName);
    });
  }

  // 處理頂層分類（parent_id 為 null 或 0）
  const topLevelCategories = categories.filter(
    (cat) => !cat.parent_id || cat.parent_id === 0,
  );
  topLevelCategories.forEach((category) => {
    addCategoryOption(category);
  });

  return options;
}

/**
 * 可重用的分類表單元件（Zod 驗證版）
 *
 * 支援新增和編輯兩種模式，提供完整的表單驗證和用戶體驗。
 *
 * 功能特色：
 * 1. 統一的 Zod 驗證和錯誤處理
 * 2. 標準化表單組件
 * 3. 智能父分類選擇：防止自我循環
 * 4. 完整的類型安全
 * 5. 自動表單狀態管理
 */
export function CategoryForm({
  mode = 'create',
  initialData,
  categoryId,
  categories,
  parentId,
  title,
  description,
  onCancel,
  onSuccess,
  inDialog = false,
}: CategoryFormProps) {
  // 確定使用的驗證schema和默認值
  const isEditMode = mode === 'edit';
  const validationSchema = isEditMode ? updateCategorySchema : createCategorySchema;
  const defaultTitle = title || (isEditMode ? "編輯分類" : "新增分類");
  const defaultDescription = description || (isEditMode ? "編輯分類的基本資訊" : "請填寫分類的基本資訊");
  
  // 準備表單默認值
  const formDefaults = {
    name: initialData?.name || '',
    description: initialData?.description || '',
    parent_id: initialData?.parent_id || (parentId || undefined),
    sort_order: initialData?.sort_order || 0,
    ...(isEditMode && { id: categoryId || initialData?.id }),
  };

  // 使用標準表單Hook
  const {
    form,
    isSubmitting,
    handleSubmit: submitForm,
  } = useStandardForm({
    schema: validationSchema,
    defaultValues: formDefaults,
    onSubmit: async (data) => {
      // 這裡需要實際的API調用邏輯
      console.log('提交表單数據:', data);
      if (onSuccess) {
        onSuccess(data);
      }
    },
    onSuccess: (data) => {
      console.log('表單提交成功:', data);
    },
    successMessage: isEditMode ? "分類更新成功" : "分類創建成功",
    errorMessage: isEditMode ? "分類更新失敗" : "分類創建失敗",
  });

  // 準備父分類選項
  const parentCategoryOptions = categories
    .filter(cat => {
      // 編輯模式時排除自己，防止循環
      if (isEditMode && categoryId && cat.id === categoryId) {
        return false;
      }
      // 可以添加更多循環檢查邏輯
      return true;
    })
    .map(cat => ({
      value: cat.id,
      label: cat.name,
      disabled: false,
    }));
  // 載入狀態
  const isLoading = isSubmitting;

  // 選擇適當的表單組件
  const FormComponent = inDialog ? StandardFormDialog : StandardForm;

  return (
    <Form {...form}>
      <FormComponent
        title={defaultTitle}
        description={defaultDescription}
        form={form}
        isSubmitting={isSubmitting}
        onSubmit={submitForm}
        onCancel={onCancel}
        submitText={isEditMode ? "更新分類" : "創建分類"}
        cancelText="取消"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StandardInputField
            control={form.control}
            name="name"
            label="分類名稱"
            placeholder="請輸入分類名稱"
            required
            disabled={isLoading}
          />
          
          <StandardSelectField
            control={form.control}
            name="parent_id"
            label="父分類"
            placeholder="選擇父分類（留空為頂層分類）"
            options={parentCategoryOptions}
            disabled={isLoading || !!parentId}
          />
        </div>

        <StandardTextareaField
          control={form.control}
          name="description"
          label="分類描述"
          placeholder="請輸入分類描述（可選）"
          rows={3}
          disabled={isLoading}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StandardInputField
            control={form.control}
            name="sort_order"
            label="排序權重"
            type="number"
            min={0}
            disabled={isLoading}
            description="數字越小排序越前"
          />
        </div>
      </FormComponent>
    </Form>
  );
}
