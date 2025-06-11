'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandItem, CommandSeparator, CommandEmpty } from "@/components/ui/command";
import { ChevronsUpDown, Check } from "lucide-react";
import { Category } from "@/types/category";
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
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
 * 表單資料結構
 * 
 * 定義分類表單的資料格式，對應後端 API 的請求結構
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

/**
 * 建立帶有層級資訊的扁平化分類選項列表
 * 
 * 將分層的分類結構轉換為扁平化列表，並為每個分類添加層級資訊和顯示名稱。
 * 用於在 Combobox 中顯示具有視覺層級的分類選項。
 * 
 * @param categories - 原始分類列表
 * @returns 包含層級資訊的扁平化分類選項列表
 */
function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  const categoryMap = new Map<number, Category>();
  categories.forEach(cat => categoryMap.set(cat.id, cat));
  
  const options: CategoryOption[] = [];
  
  function addCategoryOption(category: Category, depth: number = 0, parentPath: string = '') {
    const displayName = parentPath ? `${parentPath} > ${category.name}` : category.name;
    
    // 找到所有子分類
    const children = categories.filter(cat => cat.parent_id === category.id);
    
    options.push({
      id: category.id,
      name: category.name,
      depth,
      displayName,
      children // 添加子分類資訊
    });
    
    // 遞迴處理子分類
    children.forEach(child => {
      addCategoryOption(child, depth + 1, displayName);
    });
  }
  
  // 處理頂層分類（parent_id 為 null 或 0）
  const topLevelCategories = categories.filter(cat => !cat.parent_id || cat.parent_id === 0);
  topLevelCategories.forEach(category => {
    addCategoryOption(category);
  });
  
  return options;
}

/**
 * 可重用的分類表單元件
 * 
 * 支援新增和編輯兩種模式，提供完整的表單驗證和用戶體驗。
 * 
 * 功能特色：
 * 1. 雙模式支援：新增分類和編輯現有分類
 * 2. 智能父分類選擇：防止自我循環、支援預設父分類
 * 3. 完整表單驗證：必填欄位驗證、錯誤訊息顯示
 * 4. 無障礙設計：正確的 Label 關聯、鍵盤導航支援
 * 5. 載入狀態管理：提交時的 UI 回饋
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
export function CategoryForm({ onSubmit, isLoading, initialData, categories, parentId }: CategoryFormProps) {
  const [open, setOpen] = useState(false);
  
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      parent_id: initialData ? String(initialData.parent_id) : (parentId ? String(parentId) : null),
    }
  });

  // 建立分類選項並排除當前編輯的分類（避免自我循環）
  const categoryOptions = buildCategoryOptions(
    categories.filter(cat => cat.id !== initialData?.id)
  );
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
      {/* 分類名稱欄位 */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="name" className="text-right">名稱</Label>
        <div className="col-span-3">
          <Input 
            id="name" 
            placeholder="請輸入分類名稱"
            {...register("name", { required: "分類名稱為必填項目" })} 
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>
      </div>

      {/* 分類描述欄位 */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="description" className="text-right">描述</Label>
        <Input 
          id="description" 
          placeholder="請輸入分類描述（可選）"
          {...register("description")} 
          className="col-span-3" 
        />
      </div>

      {/* 父分類選擇欄位 */}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="parent_id" className="text-right">父分類</Label>
        <Controller
          name="parent_id"
          control={control}
          render={({ field }) => {
            const selectedOption = categoryOptions.find(opt => opt.id === Number(field.value));
            
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
                      !field.value && "text-muted-foreground"
                    )}
                  >
                    {field.value === 'null' || field.value === null
                      ? "設為頂層分類"
                      : selectedOption?.displayName || "選擇父分類"
                    }
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
                          field.onChange('null');
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            (field.value === 'null' || field.value === null) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        設為頂層分類
                      </CommandItem>
                      
                      <CommandSeparator />
                      
                      {/* 分類選項 */}
                      {categoryOptions.map((option) => (
                        <CommandItem
                          key={option.id}
                          value={option.displayName}
                          disabled={option.children && option.children.length > 0}
                          onSelect={() => {
                            field.onChange(String(option.id));
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === String(option.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span
                            className={cn(
                              "truncate",
                              option.depth === 0 && "font-medium",
                              option.depth === 1 && "pl-4",
                              option.depth === 2 && "pl-8",
                              option.depth === 3 && "pl-12",
                              option.depth >= 4 && "pl-16"
                            )}
                          >
                            {option.name}
                          </span>
                        </CommandItem>
                      ))}
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
          {isLoading ? '儲存中...' : '儲存變更'}
        </Button>
      </div>
    </form>
  );
} 