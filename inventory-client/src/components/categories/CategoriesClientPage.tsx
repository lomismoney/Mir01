"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VisibilityState, ExpandedState } from "@tanstack/react-table";
import {
  useCategories,
  useDeleteCategory,
  type CategoryNode,
} from "@/hooks";
import { DraggableCategoriesTable } from "./DraggableCategoriesTable";
import { createCategoryColumns } from "./categories-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { PlusCircle, Search, Loader2, ChevronDown } from "lucide-react";
import { CreateCategoryModal } from "./CreateCategoryModal";
import { UpdateCategoryModal } from "./UpdateCategoryModal";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

/**
 * 分類管理客戶端組件
 * 使用 DraggableCategoriesTable 展示層級結構的分類資料
 * 支援新增、編輯、刪除和拖曳排序操作
 */
export function CategoriesClientPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryNode | null>(
    null,
  );
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryNode | null>(
    null,
  );
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    name: true,
    description: true,
    statistics: true,
    actions: true,
  });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // 資料查詢
  const { data: categories = [], isLoading } = useCategories();
  const deleteCategory = useDeleteCategory();

  // 搜尋過濾（遞迴搜尋所有層級）
  const filterCategories = (
    items: CategoryNode[],
    query: string,
  ): CategoryNode[] => {
    if (!query) return items;

    return items.reduce<CategoryNode[]>((acc, item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(query.toLowerCase()) ||
        (item.description?.toLowerCase().includes(query.toLowerCase()) ??
          false);

      const filteredChildren = item.children
        ? filterCategories(item.children, query)
        : [];

      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren,
        });
      }

      return acc;
    }, []);
  };

  const filteredCategories = filterCategories(categories, searchQuery);

  // 遞迴查找分類函數
  const findCategoryById = (
    categories: CategoryNode[],
    id: number,
  ): CategoryNode | null => {
    for (const category of categories) {
      if (category.id === id) {
        return category;
      }
      if (category.children && category.children.length > 0) {
        const found = findCategoryById(category.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // 操作處理函數
  const handleAddSubCategory = (parentId: number) => {
    const parentCategory = findCategoryById(categories, parentId);
    setSelectedCategory(parentCategory);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (category: CategoryNode) => {
    setSelectedCategory(category);
  };

  const handleDelete = (category: CategoryNode) => {
    setCategoryToDelete(category);
  };

  const confirmDelete = () => {
    if (!categoryToDelete) return;

    deleteCategory.mutate(categoryToDelete.id, {
      onSuccess: () => {
        toast.success("分類已成功刪除");
        setCategoryToDelete(null);
      },
      onError: (error) => {
        toast.error(`刪除失敗: ${error.message}`);
      },
    });
  };

  // 表格配置
  const columns = createCategoryColumns({
    onAddSubCategory: handleAddSubCategory,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="gulh-la">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          data-oid="9_s:2ek"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-oid="tb_.s33">
      {/* 頁面標題與操作 */}
      <div className="flex items-center justify-between" data-oid="ctt3cqa">
        <h1 className="text-3xl font-bold tracking-tight" data-oid="gfpa66n">
          分類管理
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)} data-oid="7ca:me3">
          <PlusCircle className="mr-2 h-4 w-4" data-oid="ku5cf2g" />
          新增分類
        </Button>
      </div>

      {/* 主要內容區 */}
      <Card data-oid="osh-yhb">
        <CardHeader data-oid="yt6h.s4">
          <div className="flex items-center gap-4" data-oid="m:q4ft1">
            <CardTitle data-oid="oo5m7n7">分類列表</CardTitle>

            {/* 搜尋欄 */}
            <div className="relative w-96" data-oid="6va3nwd">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                data-oid="e-hianp"
              />

              <Input
                placeholder="搜尋分類名稱或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-oid="w0kd8s-"
              />
            </div>

            {/* 欄位顯示控制 - 真正實作 */}
            <DropdownMenu data-oid="hsod.jj">
              <DropdownMenuTrigger asChild data-oid="_46fm24">
                <Button variant="outline" data-oid="t4llcdl">
                  欄位{" "}
                  <ChevronDown className="ml-2 h-4 w-4" data-oid="7625821" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-oid="-ffhw8k">
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.name}
                  disabled
                  data-oid="1aogg0b"
                >
                  分類名稱
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.description}
                  onCheckedChange={(checked) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      description: checked,
                    }))
                  }
                  data-oid="4p0vf_c"
                >
                  描述
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.statistics}
                  onCheckedChange={(checked) =>
                    setColumnVisibility((prev) => ({
                      ...prev,
                      statistics: checked,
                    }))
                  }
                  data-oid="f550_3_"
                >
                  統計
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.actions}
                  disabled
                  data-oid="5eb5nlf"
                >
                  操作
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent data-oid="mwqe-ua">
          {/* 使用支援拖曳的資料表格 */}
          <DraggableCategoriesTable
            columns={columns}
            data={filteredCategories}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            expanded={expanded}
            onExpandedChange={setExpanded}
            data-oid="amg0c92"
          />
        </CardContent>
      </Card>

      {/* 新增分類 Modal */}
      <CreateCategoryModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        parentCategory={selectedCategory}
        onSuccess={() => {
          setIsCreateModalOpen(false);
          setSelectedCategory(null);
        }}
        data-oid="oweuu.k"
      />

      {/* 編輯分類 Modal */}
      {selectedCategory && !isCreateModalOpen && (
        <UpdateCategoryModal
          open={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
          category={selectedCategory}
          onSuccess={() => setSelectedCategory(null)}
          data-oid="tg3rsee"
        />
      )}

      {/* 刪除確認對話框 */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        data-oid="bidnmvf"
      >
        <AlertDialogContent data-oid="8m:vbo3">
          <AlertDialogHeader data-oid="vuwuz80">
            <AlertDialogTitle data-oid="euxs_3q">確認刪除</AlertDialogTitle>
            <AlertDialogDescription data-oid="4x8r0q0">
              您確定要刪除分類「{categoryToDelete?.name}」嗎？
              {categoryToDelete?.children &&
                categoryToDelete.children.length > 0 && (
                  <span
                    className="block mt-2 text-destructive"
                    data-oid="s_peunw"
                  >
                    注意：此分類包含 {categoryToDelete.children.length}{" "}
                    個子分類，將一併刪除。
                  </span>
                )}
              此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="xhguon7">
            <AlertDialogCancel data-oid="pjui:e5">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-oid="t6thwjj"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
