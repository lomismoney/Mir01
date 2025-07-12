"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useCategories,
  useUpdateCategory,
  useErrorHandler,
  type CategoryNode,
} from "@/hooks";
import { CategoryForm } from "./CategoryForm";
import { UpdateCategoryData } from "@/lib/validations/category";

/**
 * 編輯分類 Modal 組件屬性
 */
interface UpdateCategoryModalProps {
  /** Modal 開啟狀態 */
  open: boolean;
  /** Modal 開啟狀態變更處理函數 */
  onOpenChange: (open: boolean) => void;
  /** 要編輯的分類 */
  category: CategoryNode;
  /** 成功更新後的回調函數 */
  onSuccess?: () => void;
}

/**
 * 編輯分類 Modal 組件
 * 提供編輯現有分類的功能
 */
export function UpdateCategoryModal({
  open,
  onOpenChange,
  category,
  onSuccess,
}: UpdateCategoryModalProps) {
  const { data: categories = [] } = useCategories();
  const updateCategory = useUpdateCategory();
  const { handleError, handleSuccess } = useErrorHandler();

  /**
   * 處理表單提交
   */
  const handleSubmit = (data: UpdateCategoryData | { name: string; sort_order: number; description?: string; parent_id?: number | null }) => {
    // 確保 data 有正確的類型
    const updateData = 'id' in data ? data : { ...data, id: category.id };
    updateCategory.mutate(
      {
        id: category.id,
        data: {
          name: data.name || category.name,
          description: data.description || "",
          parent_id: data.parent_id !== undefined ? data.parent_id : category.parent_id,
        },
      },
      {
        onSuccess: () => {
          handleSuccess("分類已成功更新");
          onSuccess?.();
          onOpenChange(false);
        },
        onError: (error) => handleError(error),
      },
    );
  };

  // 將樹狀結構扁平化為列表，供 CategoryForm 使用
  const flatCategories = categories.reduce<CategoryNode[]>((acc, category) => {
    const flatten = (cat: CategoryNode): CategoryNode[] => {
      const result = [cat];
      if (cat.children) {
        cat.children.forEach((child) => {
          result.push(...flatten(child));
        });
      }
      return result;
    };
    return [...acc, ...flatten(category)];
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>編輯分類</DialogTitle>
          <DialogDescription>
            修改「{category.name}」的資訊
          </DialogDescription>
        </DialogHeader>

        <CategoryForm
          mode="edit"
          categoryId={category.id}
          initialData={category}
          categories={flatCategories}
          onSuccess={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
