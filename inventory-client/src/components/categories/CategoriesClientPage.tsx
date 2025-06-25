"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { VisibilityState, ExpandedState } from "@tanstack/react-table";
import {
  useCategories,
  useDeleteCategory,
  type CategoryNode,
} from "@/hooks/queries/useEntityQueries";
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
      <div className="flex items-center justify-center h-96" data-oid="5mzriv2">
        <Loader2
          className="h-8 w-8 animate-spin text-muted-foreground"
          data-oid="9m757:z"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-oid="dwynog:">
      {/* 頁面標題與操作 */}
      <div className="flex items-center justify-between" data-oid="3fixaba">
        <h1 className="text-3xl font-bold tracking-tight" data-oid="lu-gxpy">
          分類管理
        </h1>
        <Button onClick={() => setIsCreateModalOpen(true)} data-oid="9jclmgt">
          <PlusCircle className="mr-2 h-4 w-4" data-oid="zxc-ja4" />
          新增分類
        </Button>
      </div>

      {/* 主要內容區 */}
      <Card data-oid="w:jj_wn">
        <CardHeader data-oid="l1.a-oa">
          <div className="flex items-center gap-4" data-oid="axqs7:d">
            <CardTitle data-oid="ywrnbh1">分類列表</CardTitle>

            {/* 搜尋欄 */}
            <div className="relative w-96" data-oid="68tfhw4">
              <Search
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                data-oid="5swg19c"
              />

              <Input
                placeholder="搜尋分類名稱或描述..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-oid="flpx9u8"
              />
            </div>

            {/* 欄位顯示控制 - 真正實作 */}
            <DropdownMenu data-oid="7stvcmk">
              <DropdownMenuTrigger asChild data-oid="pp.rv0r">
                <Button variant="outline" data-oid="wld:9zn">
                  欄位{" "}
                  <ChevronDown className="ml-2 h-4 w-4" data-oid="ywiszy8" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" data-oid="ayrqkst">
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.name}
                  disabled
                  data-oid="6.4guq."
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
                  data-oid="k4piask"
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
                  data-oid="_ryl95n"
                >
                  統計
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={columnVisibility.actions}
                  disabled
                  data-oid="vhvmp-6"
                >
                  操作
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent data-oid="cv3fdqd">
          {/* 使用支援拖曳的資料表格 */}
          <DraggableCategoriesTable
            columns={columns}
            data={filteredCategories}
            isLoading={isLoading}
            columnVisibility={columnVisibility}
            onColumnVisibilityChange={setColumnVisibility}
            expanded={expanded}
            onExpandedChange={setExpanded}
            data-oid="a7-7jev"
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
        data-oid="vp-0ynq"
      />

      {/* 編輯分類 Modal */}
      {selectedCategory && !isCreateModalOpen && (
        <UpdateCategoryModal
          open={!!selectedCategory}
          onOpenChange={(open) => !open && setSelectedCategory(null)}
          category={selectedCategory}
          onSuccess={() => setSelectedCategory(null)}
          data-oid="-wl-jxu"
        />
      )}

      {/* 刪除確認對話框 */}
      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        data-oid="7zgr:2n"
      >
        <AlertDialogContent data-oid="wjciry4">
          <AlertDialogHeader data-oid="z0-1ne3">
            <AlertDialogTitle data-oid="tbqxi4y">確認刪除</AlertDialogTitle>
            <AlertDialogDescription data-oid="t9z_f9a">
              您確定要刪除分類「{categoryToDelete?.name}」嗎？
              {categoryToDelete?.children &&
                categoryToDelete.children.length > 0 && (
                  <span
                    className="block mt-2 text-destructive"
                    data-oid="af:4srt"
                  >
                    注意：此分類包含 {categoryToDelete.children.length}{" "}
                    個子分類，將一併刪除。
                  </span>
                )}
              此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter data-oid="w7f1:3s">
            <AlertDialogCancel data-oid="_iz1mi2">取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-oid="-si.jr7"
            >
              刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
