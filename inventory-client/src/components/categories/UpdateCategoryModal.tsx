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
  useUpdateCategory,
  type CategoryNode,
} from "@/hooks/useScrambleCategories";
import { CategoryForm, type FormValues } from "./CategoryForm";
import { toast } from "sonner";

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
  const { data: categories = [] } = useScrambleCategories();
  const updateCategory = useUpdateCategory();

  /**
   * 處理表單提交
   */
  const handleSubmit = (data: FormValues) => {
    updateCategory.mutate(
      {
        id: category.id,
        data: {
          name: data.name,
          description: data.description || "",
          parent_id: data.parent_id ? Number(data.parent_id) : null,
        },
      },
      {
        onSuccess: () => {
          toast.success("分類已成功更新");
          onSuccess?.();
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(`更新失敗: ${error.message}`);
        },
      },
    );
  };

  // 【完美架構重構】直接使用樹狀結構，不需要扁平化
  // CategoryForm 現在接受 CategoryNode[] 樹狀結構

  return (
    <Dialog open={open} onOpenChange={onOpenChange} data-oid="ji6-5v_">
      <DialogContent className="sm:max-w-[425px]" data-oid="mg:u715">
        <DialogHeader data-oid="q3-qh1o">
          <DialogTitle data-oid="u1ev6f9">編輯分類</DialogTitle>
          <DialogDescription data-oid="oo7sqj7">
            修改「{category.name}」的資訊
          </DialogDescription>
        </DialogHeader>

        <CategoryForm
          onSubmit={handleSubmit}
          isLoading={updateCategory.isPending}
          initialData={category}
          categories={categories}
          data-oid=":vx:twg"
        />
      </DialogContent>
    </Dialog>
  );
}
