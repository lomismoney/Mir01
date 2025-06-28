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
import { CategoryNode } from "@/hooks/queries/useEntityQueries";
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
  categories: CategoryNode[]; // 用於父分類選擇
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
  children: CategoryNode[]; // 子分類列表，用於判斷是否為父分類
}

// =====================================================
// === 優化後的輔助函數（位於元件外部）===
// =====================================================

/**
 * 【完美架構重構】扁平化分類樹為陣列
 * 將樹狀結構的 CategoryNode 轉換為扁平陣列，用於父分類選擇
 * 
 * @param categories - 樹狀結構的分類陣列
 * @returns 扁平化的分類陣列
 */
function flattenCategoryTree(categories: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  
  function traverse(nodes: CategoryNode[]) {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  }
  
  traverse(categories);
  return result;
}

/**
 * 【完美架構重構】檢查分類是否為另一個分類的後代
 * 用於防止循環引用
 * 
 * @param categories - 樹狀結構的分類陣列
 * @param parentId - 父分類 ID
 * @param targetId - 目標分類 ID
 * @returns 如果是後代關係則返回 true
 */
function isDescendantInTree(
  categories: CategoryNode[],
  parentId: number,
  targetId: number,
): boolean {
  // 找到父分類節點
  function findNode(nodes: CategoryNode[], id: number): CategoryNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }
  
  // 檢查是否為後代
  function checkDescendant(node: CategoryNode, targetId: number): boolean {
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        if (child.id === targetId) return true;
        if (checkDescendant(child, targetId)) return true;
  }
    }
  return false;
}

  const parentNode = findNode(categories, parentId);
  return parentNode ? checkDescendant(parentNode, targetId) : false;
}

/**
 * 【完美架構重構】建立具有層級結構的分類選項列表
 * 從樹狀結構建立扁平的選項列表，包含層級和顯示名稱資訊
 *
 * @param categories - 樹狀結構的分類陣列
 * @returns 包含層級資訊的扁平化分類選項列表
 */
function buildCategoryOptions(categories: CategoryNode[]): CategoryOption[] {
  const options: CategoryOption[] = [];

  function addCategoryOption(
    category: CategoryNode,
    depth: number = 0,
    parentPath: string = "",
  ) {
    const displayName = parentPath
      ? `${parentPath} > ${category.name}`
      : category.name;

    options.push({
      id: category.id,
      name: category.name,
      depth,
      displayName,
      children: category.children || [],
    });

    // 遞迴處理子分類
    if (category.children && category.children.length > 0) {
      category.children.forEach((child) => {
      addCategoryOption(child, depth + 1, displayName);
    });
  }
  }

  // 處理所有頂層分類
  categories.forEach((category) => {
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

  // 🚀 【完美架構重構】智能循環檢查函數
  const shouldDisableOption = useMemo(() => {
    return (optionId: number): boolean => {
      // 新增模式：不禁用任何選項
      if (!initialData?.id) return false;

      // 編輯模式：禁用自己（避免自我循環）
      if (optionId === initialData.id) return true;

      // 禁用所有後代分類（避免循環關係）
      return isDescendantInTree(categories, initialData.id, optionId);
    };
  }, [categories, initialData?.id]);

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

  // 【完美架構重構】建立分類選項（不過濾，讓 shouldDisableOption 處理）
  const categoryOptions = useMemo(() => {
    return buildCategoryOptions(categories);
  }, [categories]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 py-4"
      data-oid="f9-zm.l"
    >
      {/* 分類名稱欄位 */}
      <div className="grid grid-cols-4 items-center gap-4" data-oid="lo3-otn">
        <Label htmlFor="name" className="text-right" data-oid="yp_:8r2">
          名稱
        </Label>
        <div className="col-span-3" data-oid="j-em78x">
          <Input
            id="name"
            placeholder="請輸入分類名稱"
            {...register("name", { required: "分類名稱為必填項目" })}
            data-oid="-8umkky"
          />

          {errors.name && (
            <p className="text-sm text-destructive mt-1" data-oid="54_4eyi">
              {errors.name.message}
            </p>
          )}
        </div>
      </div>

      {/* 分類描述欄位 */}
      <div className="grid grid-cols-4 items-center gap-4" data-oid="_vlhpse">
        <Label htmlFor="description" className="text-right" data-oid="z:ra6-6">
          描述
        </Label>
        <Input
          id="description"
          placeholder="請輸入分類描述（可選）"
          {...register("description")}
          className="col-span-3"
          data-oid="_u9e3p."
        />
      </div>

      {/* 父分類選擇欄位 */}
      <div className="grid grid-cols-4 items-center gap-4" data-oid="k:4x5-r">
        <Label htmlFor="parent_id" className="text-right" data-oid="rn46gm5">
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
              <Popover open={open} onOpenChange={setOpen} data-oid="j01ott_">
                <PopoverTrigger
                  asChild
                  className="col-span-3"
                  data-oid="_v1lxl0"
                >
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={!!parentId}
                    className={cn(
                      "w-full justify-between",
                      !field.value && "text-muted-foreground",
                    )}
                    data-oid="r4y8k0_"
                  >
                    {field.value === "null" || field.value === null
                      ? "設為頂層分類"
                      : selectedOption?.displayName || "選擇父分類"}
                    <ChevronsUpDown
                      className="ml-2 h-4 w-4 shrink-0 opacity-50"
                      data-oid=":83hiy8"
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-full p-0"
                  align="start"
                  data-oid="7r4s1zn"
                >
                  <Command data-oid="380mkc3">
                    <CommandInput
                      placeholder="搜尋分類..."
                      data-oid=".4jnp5m"
                    />

                    <CommandList data-oid="3:xxhve">
                      <CommandEmpty data-oid="64x_r2i">
                        找不到相關分類
                      </CommandEmpty>

                      {/* 設為頂層分類選項 */}
                      <CommandItem
                        value="頂層分類"
                        onSelect={() => {
                          field.onChange(null); // 🔧 修復：直接使用 null 而不是 'null' 字符串
                          setOpen(false);
                        }}
                        data-oid="s6:a0-:"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === "null" || field.value === null
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                          data-oid="j9tm_2w"
                        />
                        設為頂層分類
                      </CommandItem>

                      <CommandSeparator data-oid="cgq-p43" />

                      {/* 分類選項 */}
                      {categoryOptions.map((option) => {
                        // 🚀 【完美架構重構】使用新的循環檢查函數
                        const isDisabled = shouldDisableOption(option.id);

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
                            data-oid="u64erot"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                field.value === String(option.id)
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                              data-oid="p-quw9g"
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
                              data-oid=".bxjhwn"
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
          data-oid="h-884uq"
        />
      </div>

      {/* 提交按鈕 */}
      <div className="flex justify-end" data-oid="gr1w-o9">
        <Button type="submit" disabled={isLoading} data-oid="t_j44:t">
          {isLoading ? "儲存中..." : "儲存變更"}
        </Button>
      </div>
    </form>
  );
}
