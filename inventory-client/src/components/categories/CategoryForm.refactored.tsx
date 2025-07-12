"use client";

import { Button } from "@/components/ui/button";
import { Category } from "@/types/category";
import { useForm } from "react-hook-form";
import { useMemo } from "react";
import { NameField, DescriptionField } from "./CategoryFormFields";
import { ParentCategoryField } from "./ParentCategoryField";

interface CategoryFormProps {
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
  initialData?: Category | null;
  categories: Category[];
  parentId?: number | null;
}

export type FormValues = {
  name: string;
  description: string;
  parent_id: string | null;
};

interface CategoryOption {
  id: number;
  name: string;
  depth: number;
  displayName: string;
  children: Category[];
}

/**
 * 建立具有層級結構的分類選項列表
 */
function buildCategoryOptions(categories: Category[]): CategoryOption[] {
  const categoryMap = new Map<number, Category>();
  categories.forEach((cat) => categoryMap.set(cat.id, cat));

  const options: CategoryOption[] = [];

  function addCategoryOption(
    category: Category,
    depth: number = 0,
    parentPath: string = ""
  ) {
    const displayName = parentPath
      ? `${parentPath} > ${category.name}`
      : category.name;

    const children = categories.filter((cat) => cat.parent_id === category.id);

    options.push({
      id: category.id,
      name: category.name,
      depth,
      displayName,
      children,
    });

    children.forEach((child) => {
      addCategoryOption(child, depth + 1, displayName);
    });
  }

  const topLevelCategories = categories.filter(
    (cat) => !cat.parent_id || cat.parent_id === 0
  );
  topLevelCategories.forEach((category) => {
    addCategoryOption(category);
  });

  return options;
}

/**
 * 可重用的分類表單元件（重構版）
 * 
 * 這是一個更簡潔、更容易測試的版本
 */
export function CategoryForm({
  onSubmit,
  isLoading,
  initialData,
  categories,
  parentId,
}: CategoryFormProps) {
  // 創建子分類的快速查詢表
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
      parent_id: initialData
        ? initialData.parent_id === null
          ? null
          : String(initialData.parent_id)
        : parentId
          ? String(parentId)
          : null,
    },
  });

  // 建立分類選項並排除當前編輯的分類
  const categoryOptions = useMemo(() => {
    return buildCategoryOptions(
      categories.filter((cat) => cat.id !== initialData?.id)
    );
  }, [categories, initialData?.id]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-4 py-4"
     
    >
      <NameField register={register} errors={errors} />
      <DescriptionField register={register} />
      <ParentCategoryField
        control={control}
        categoryOptions={categoryOptions}
        parentId={parentId}
        initialDataId={initialData?.id}
        childrenMap={childrenMap}
      />

      {/* 提交按鈕 */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "儲存中..." : "儲存變更"}
        </Button>
      </div>
    </form>
  );
}