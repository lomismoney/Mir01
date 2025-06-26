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
  useCreateCategory,
  type CategoryNode,
} from "@/hooks/queries/useEntityQueries";
import { CategoryForm, type FormValues } from "./CategoryForm";
import { toast } from "sonner";

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

  /**
   * 處理表單提交
   */
  const handleSubmit = (data: FormValues) => {
    createCategory.mutate(
      {
        name: data.name,
        description: data.description || "",
        parent_id: data.parent_id ? Number(data.parent_id) : null,
      },
      {
        onSuccess: () => {
          toast.success(parentCategory ? "子分類已成功新增" : "分類已成功新增");
          onSuccess?.();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(`新增失敗: ${error.message}`);
        },
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
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="yor.uzp">
      <DialogContent className="sm:max-w-[425px]" data-oid="1_1abgt">
        <DialogHeader data-oid="_azl8st">
          <DialogTitle data-oid="66a3m0i">
            {parentCategory
              ? `新增子分類 - ${parentCategory.name}`
              : "新增分類"}
          </DialogTitle>
          <DialogDescription data-oid="9617060">
            {parentCategory
              ? `在「${parentCategory.name}」下新增子分類`
              : "建立新的商品分類"}
          </DialogDescription>
        </DialogHeader>

        <CategoryForm
          onSubmit={handleSubmit}
          isLoading={createCategory.isPending}
          categories={flatCategories}
          parentId={parentCategory?.id}
          data-oid="j5kruzw"
        />
      </DialogContent>
    </Dialog>
  );
}
