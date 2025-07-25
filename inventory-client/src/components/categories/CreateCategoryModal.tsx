"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  useCategories,
  useCreateCategory,
  useErrorHandler,
  type CategoryNode,
} from "@/hooks";
import { CategoryForm } from "./CategoryForm";
import { CreateCategoryData } from "@/lib/validations/category";

/**
 * 新增分類 Modal 組件屬性
 */
interface CreateCategoryModalProps {
  /** Modal 開啟狀態 */
  open: boolean;
  /** Modal 開啟狀態變更處理函數 */
  onOpenChange: (open: boolean) => void;
  /** 父分類（新增子分類時使用） */
  parentCategory?: CategoryNode | null;
  /** 成功新增後的回調函數 */
  onSuccess?: () => void;
}

/**
 * 新增分類 Modal 組件
 * 提供新增頂層分類或子分類的功能
 */
export function CreateCategoryModal({
  open,
  onOpenChange,
  parentCategory,
  onSuccess,
}: CreateCategoryModalProps) {
  const { data: categories = [] } = useCategories();
  const createCategory = useCreateCategory();
  const { handleError, handleSuccess } = useErrorHandler();

  /**
   * 處理表單提交
   */
  const handleSubmit = (data: CreateCategoryData | { id: number; name?: string; description?: string; parent_id?: number | null; sort_order?: number }) => {
    // 檢查是否是創建資料（沒有 id）
    if ('id' in data) {
      // 這是更新資料，但我們在創建模態框中不應該收到這個
      return;
    }
    
    createCategory.mutate(
      {
        name: data.name,
        description: data.description || "",
        parent_id: data.parent_id || undefined,
      },
      {
        onSuccess: () => {
          handleSuccess(parentCategory ? "子分類已成功新增" : "分類已成功新增");
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
      <DialogContent className="sm:max-w-[600px] p-0 gap-0" aria-describedby={undefined}>
        <VisuallyHidden>
          <DialogTitle>
            {parentCategory ? `新增子分類 - ${parentCategory.name}` : "新增分類"}
          </DialogTitle>
        </VisuallyHidden>
        <CategoryForm
          mode="create"
          categories={flatCategories}
          parentId={parentCategory?.id}
          title={parentCategory ? `新增子分類 - ${parentCategory.name}` : "新增分類"}
          description={parentCategory ? `在「${parentCategory.name}」下新增子分類` : "建立新的商品分類"}
          onSuccess={handleSubmit}
          onCancel={() => onOpenChange(false)}
          inDialog={true}
        />
      </DialogContent>
    </Dialog>
  );
}
