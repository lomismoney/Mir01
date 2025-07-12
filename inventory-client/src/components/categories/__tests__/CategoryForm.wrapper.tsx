import React from 'react';
import { CategoryForm as OriginalCategoryForm, FormValues } from '../CategoryForm';
import { Category } from '@/types/category';

interface WrapperProps {
  onSubmit: (data: FormValues) => void;
  isLoading?: boolean;
  initialData?: Category | null;
  categories?: Category[];
  parentId?: number | null;
}

/**
 * 測試用的包裝元件
 * 確保表單提交時傳遞的是表單資料而不是事件物件
 */
export function CategoryFormWrapper({
  onSubmit,
  isLoading = false,
  initialData = null,
  categories = [],
  parentId = null,
}: WrapperProps) {
  const handleFormSubmit = (data: FormValues) => {
    // 確保只傳遞表單資料
    onSubmit({
      name: data.name,
      description: data.description,
      parent_id: data.parent_id,
    });
  };

  return (
    <OriginalCategoryForm
      onSubmit={handleFormSubmit}
      isLoading={isLoading}
      initialData={initialData}
      categories={categories}
      parentId={parentId}
    />
  );
}