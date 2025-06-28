"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useScrambleCategories,
  useCreateCategory,
  type CategoryNode,
} from "@/hooks/useScrambleCategories";
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
  const { data: categories = [] } = useScrambleCategories();
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

  // 【完美架構重構】直接使用樹狀結構，不需要扁平化
  // CategoryForm 現在接受 CategoryNode[] 樹狀結構

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
          categories={categories}
          parentId={parentCategory?.id}
          data-oid="j5kruzw"
        />
      </DialogContent>
    </Dialog>
  );
}
