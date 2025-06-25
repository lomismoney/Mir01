"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * 分類表單元件屬性介面
 *
 * @param onSubmit - 表單提交處理函數
 * @param isLoading - 表單提交載入狀態
 * @param initialData - 初始資料（編輯模式時使用）
 * @param categories - 所有分類列表（用於父分類選擇）
 * @param parentId - 預設的父分類 ID（新增子分類時使用）
 */
interface CategoryFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
  initialData?: Category | null;
  categories: Category[]; // 用於父分類選擇
  parentId?: number | null; // 用於新增子分類
}

/**
 * 表單欄位值類型定義
 */
export type FormValues = {
  /** 分類名稱（必填） */
  name: string;
  /** 分類描述（可選） */
  description: string;
  /** 父分類 ID，null 表示頂層分類 */
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
 * 可重用的分類表單元件（性能優化版）
 *
 * 支援新增和編輯兩種模式，提供完整的表單驗證和用戶體驗。
 *
 * 功能特色：
 * 1. 雙模式支援：新增分類和編輯現有分類
 * 2. 智能父分類選擇：防止自我循環、支援預設父分類
 * 3. 完整表單驗證：必填欄位驗證、錯誤訊息顯示
 * 4. 無障礙設計：正確的 Label 關聯、鍵盤導航支援
 * 5. 載入狀態管理：提交時的 UI 回饋
 * 6. 性能優化：使用查詢表和 useMemo 減少重複計算
 *
 * 使用範例：
 * ```tsx
 * // 新增分類
 * <CategoryForm
 *   onSubmit={handleCreate}
 *   isLoading={createMutation.isPending}
 *   categories={allCategories}
 * />
 *
 * // 編輯分類
 * <CategoryForm
 *   onSubmit={handleUpdate}
 *   isLoading={updateMutation.isPending}
 *   initialData={selectedCategory}
 *   categories={allCategories}
 * />
 *
 * // 新增子分類
 * <CategoryForm
 *   onSubmit={handleCreate}
 *   isLoading={createMutation.isPending}
 *   categories={allCategories}
 *   parentId={parentCategory.id}
 * />
 * ```
 *
 * @param onSubmit - 表單提交時的回調函數
 * @param isLoading - 是否正在處理提交請求
 * @param initialData - 編輯模式時的初始資料
 * @param categories - 用於父分類下拉選單的分類列表
 * @param parentId - 新增子分類時的預設父分類 ID
 * @returns 渲染的分類表單
 */
export function CategoryForm({
  onSubmit,
  isLoading,
  initialData,
  categories,
  parentId,
}: CategoryFormProps) {
  const [open, setOpen] = useState(false);

  // 🚀 性能優化：創建子分類的快速查詢表
  const childrenMap = useMemo(() => {
    const map = new Map<number, Category[]>();
    categories.forEach((cat) => {
      if (cat.parent_id) {
        const children = map.get(cat.parent_id) || [];
        children.push(cat);
        map.set(cat.parent_id, children);
      }
    });
    return map;
  }, [categories]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      // 🔧 修復：正確處理 null 值，避免將 null 轉換為 "null" 字符串
      parent_id: initialData
        ? initialData.parent_id === null
          ? null
          : String(initialData.parent_id)
        : parentId
          ? String(parentId)
          : null,
    },
  });

  // 建立分類選項並排除當前編輯的分類（避免自我循環）
  const categoryOptions = useMemo(() => {
    return buildCategoryOptions(
      categories.filter((cat) => cat.id !== initialData?.id),
    );
  }, [categories, initialData?.id]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      {/* 分類名稱欄位 */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">
          名稱
        </Label>
        <div className="col-span-3">
          <Input
            id="name"
            placeholder="請輸入分類名稱"
            {...register("name", { required: "分類名稱為必填項目" })}
          />

          {errors.name && (
            <p className="text-sm text-destructive mt-1">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>

      {/* 分類描述欄位 */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">
          描述
        </Label>
        <Input
          id="description"
          placeholder="請輸入分類描述（可選）"
          {...register("description")}
          className="col-span-3"
        />
      </div>

      {/* 父分類選擇欄位 */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="parent_id" className="text-right">
          父分類
        </Label>
        <Controller
          name="parent_id"
          control={control}
          render={({ field }) => {
            // 🔧 修復：正確處理 selectedOption 查找邏輯
            const selectedOption =
              field.value && field.value !== "null"
                ? categoryOptions.find((opt) => opt.id === Number(field.value))
                : null;

            return (
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild className="col-span-3">
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={!!parentId}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                  >
                    {field.value === "null" || field.value === null
                      ? "設為頂層分類"
                      : selectedOption?.displayName || "選擇父分類"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜尋分類..." />

                    <CommandList>
                      <CommandEmpty>找不到相關分類</CommandEmpty>

                      {/* 設為頂層分類選項 */}
                      <CommandItem
                        value="頂層分類"
                        onSelect={() => {
                          field.onChange(null); // 🔧 修復：直接使用 null 而不是 'null' 字符串
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === "null" || field.value === null
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        設為頂層分類
                      </CommandItem>

                      <CommandSeparator />

                      {/* 分類選項 */}
                      {categoryOptions.map((option) => {
                        // 🚀 使用優化後的查詢函數
                        const isDisabled = shouldDisableOption(
                          option.id,
                          initialData?.id ?? null,
                          childrenMap,
                        );

                        // 決定禁用原因的顯示文字
                        const getDisabledReason = () => {
                          if (!initialData?.id) return ""; // 新增模式不會有禁用選項
                          if (option.id === initialData.id) return " (自己)";
                          return " (會造成循環關係)";
                        };

                        return (
                          <CommandItem
                            key={option.id}
                            value={option.displayName}
                            disabled={isDisabled}
                            onSelect={() => {
                              field.onChange(String(option.id));
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === String(option.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />

                            <span
                              className={cn(
                                "truncate",
                                option.depth === 0 && "font-medium",
                                option.depth === 1 && "pl-4",
                                option.depth === 2 && "pl-8",
                                option.depth === 3 && "pl-12",
                                option.depth >= 4 && "pl-16",
                                isDisabled &&
                                  "opacity-50 text-muted-foreground",
                              )}
                            >
                              {option.name}
                              {isDisabled && getDisabledReason()}
                            </span>
                          </CommandItem>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            );
          }}
        />
      </div>

      {/* 提交按鈕 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "儲存中..." : "儲存變更"}
        </Button>
      </div>
    </form>
  );
}
