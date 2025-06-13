'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/useApi';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  flexRender,
  SortingState,
  VisibilityState,
  ExpandedState,
} from '@tanstack/react-table';
import { ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getCategoryColumns } from '@/components/categories/categories-columns';
import { CategoryForm, FormValues } from '@/components/categories/CategoryForm';
import { Category } from '@/types/category';
import { transformCategoriesGroupedResponse } from '@/types/api-helpers';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

/**
 * 分類管理客戶端元件屬性
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CategoriesClientPageProps {}

/**
 * 將分組的分類資料轉換為樹狀結構
 */
function buildTreeData(groupedCategories: Record<string, Category[]>): Category[] {
  function buildSubTree(parentId: string | null): Category[] {
    const key = parentId || '';
    const categories = groupedCategories[key] || [];
    
    return categories.map(category => ({
      ...category,
      children: buildSubTree(category.id.toString())
    }));
  }
  
  return buildSubTree(null);
}

/**
 * 將分組的分類資料轉換為平坦的陣列
 */
function flattenCategories(groupedCategories: Record<string, Category[]>): Category[] {
  const categories: Category[] = [];
  Object.values(groupedCategories).forEach(categoryGroup => {
    categories.push(...categoryGroup);
  });
  return categories;
}

/**
 * 分類管理客戶端頁面組件
 * 
 * 提供完整的分類管理功能，包括：
 * 1. 樹狀結構展示所有分類
 * 2. 支援新增、編輯、刪除分類
 * 3. 層級關係管理（父子分類）
 * 4. 權限控制（僅管理員可存取）
 * 
 * 安全特性：
 * - 接收來自伺服器端驗證的用戶資訊
 * - 保持客戶端的互動功能
 * - 基於角色的存取控制
 */
export function CategoriesClientPage({ }: CategoriesClientPageProps) {
  // === 資料獲取 ===
  const { data: groupedCategories, isLoading, error } = useCategories();
  
  // === 效能優化：使用 useMemo 快取運算結果 ===
  const transformedCategories = useMemo(() => {
    return transformCategoriesGroupedResponse(groupedCategories);
  }, [groupedCategories]);
  
  const allCategories = useMemo(() => {
    return flattenCategories(transformedCategories);
  }, [transformedCategories]);
  
  const treeData = useMemo(() => {
    return buildTreeData(transformedCategories);
  }, [transformedCategories]);
  
  // === Mutations ===
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // === 狀態管理 ===
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentIdForNewCategory, setParentIdForNewCategory] = useState<number | null>(null);
  
  // === 表格狀態管理 ===
  const [sorting, setSorting] = useState<SortingState>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const savedSorting = localStorage.getItem('categories-table-sorting');
      const parsed = savedSorting ? JSON.parse(savedSorting) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse sorting state from localStorage", error);
      return [];
    }
  });
  
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const savedColumnVisibility = localStorage.getItem('categories-table-column-visibility');
      const parsed = savedColumnVisibility ? JSON.parse(savedColumnVisibility) : {};
      return (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : {};
    } catch (error) {
      console.error("Failed to parse column visibility state from localStorage", error);
      return {};
    }
  });
  
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // === localStorage 同步 ===
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('categories-table-sorting', JSON.stringify(sorting));
    }
  }, [sorting]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('categories-table-column-visibility', JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  // === 事件處理函數 ===
  const handleCreate = async (data: FormValues) => {
    try {
      const createData = {
        name: data.name,
        description: data.description || null,
        parent_id: data.parent_id === 'null' ? null : Number(data.parent_id),
      };

      await createMutation.mutateAsync(createData);
      setIsCreateDialogOpen(false);
      setParentIdForNewCategory(null);
      toast.success('分類建立成功！');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '建立分類失敗');
    }
  };

  const handleUpdate = async (data: FormValues) => {
    if (!editingCategory) return;

    try {
      const updateData = {
        name: data.name,
        description: data.description || null,
        parent_id: data.parent_id === 'null' ? null : Number(data.parent_id),
      };

      await updateMutation.mutateAsync({
        path: { id: editingCategory.id },
        body: updateData
      });
      
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      toast.success('分類更新成功！');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新分類失敗');
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync({ id: categoryToDelete.id });
      
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
      toast.success('分類刪除成功！');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '刪除分類失敗');
    }
  };

  const handleAddTopLevel = useCallback(() => {
    setParentIdForNewCategory(null);
    setIsCreateDialogOpen(true);
  }, []);

  const handleAddSubCategory = useCallback((parentId: number) => {
    setParentIdForNewCategory(parentId);
    setIsCreateDialogOpen(true);
  }, []);

  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  }, []);

  const handleDeleteClick = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  }, []);

  // === 表格設定 ===
  const columns = useMemo(() => getCategoryColumns({
    onAddSubCategory: handleAddSubCategory,
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
  }), [handleAddSubCategory, handleEdit, handleDeleteClick]);

  const table = useReactTable({
    data: treeData,
    columns,
    state: {
      sorting,
      columnVisibility,
      expanded,
    },
    getSubRows: (row) => row.children,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  // 載入狀態
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">載入分類資料中...</p>
        </div>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-red-600">
          <h3 className="text-lg font-semibold">載入失敗</h3>
          <p>無法載入分類資料，請重試</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">分類管理</h1>
          <p className="text-muted-foreground">
            組織和管理商品分類結構
          </p>
        </div>
        <Button onClick={handleAddTopLevel} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          新增頂層分類
        </Button>
      </div>

      {/* 工具列 */}
      <div className="flex items-center py-4">
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                顯示欄位 <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 資料表格 */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  沒有找到任何分類。
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分頁控制 */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            上一頁
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            下一頁
          </Button>
        </div>
      </div>

      {/* 新增分類對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {parentIdForNewCategory ? '新增子分類' : '新增頂層分類'}
            </DialogTitle>
          </DialogHeader>
                      <CategoryForm
              categories={allCategories}
              parentId={parentIdForNewCategory}
              onSubmit={handleCreate}
              isLoading={createMutation.isPending}
            />
        </DialogContent>
      </Dialog>

      {/* 編輯分類對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯分類</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <CategoryForm
              categories={allCategories}
              initialData={editingCategory}
              onSubmit={handleUpdate}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除分類嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您即將刪除分類「{categoryToDelete?.name}」。
              此操作無法復原，請謹慎考慮。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 