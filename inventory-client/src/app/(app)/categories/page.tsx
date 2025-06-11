'use client';

import { useState, useEffect, useMemo } from 'react';
import withAuth from '@/components/auth/withAuth';
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
import { ChevronDown, Plus, Search } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

/**
 * 將分組的分類資料轉換為樹狀結構
 * 
 * 遞迴建立帶有 children 屬性的樹狀資料結構，
 * 符合 react-table 的 subRows 展示需求
 * 
 * @param groupedCategories - 按 parent_id 分組的分類資料
 * @returns 樹狀結構的分類陣列（僅包含頂層分類，子分類在 children 中）
 */
function buildTreeData(groupedCategories: Record<string, Category[]>): Category[] {
  /**
   * 遞迴函式：為指定分類建立子樹
   * 
   * @param parentId - 父分類 ID（null 或 undefined 表示頂層）
   * @returns 該層級的分類陣列，包含完整的子樹結構
   */
  function buildSubTree(parentId: string | null): Category[] {
    const key = parentId || ''; // 頂層分類的 key 是空字串
    const categories = groupedCategories[key] || [];
    
    return categories.map(category => ({
      ...category,
      children: buildSubTree(category.id.toString()) // 遞迴建立子分類
    }));
  }
  
  // 返回頂層分類（包含完整的子樹）
  return buildSubTree(null);
}

/**
 * 將分組的分類資料轉換為平坦的陣列
 * 
 * @param groupedCategories - 按 parent_id 分組的分類資料
 * @returns 平坦的分類陣列
 */
function flattenCategories(groupedCategories: Record<string, Category[]>): Category[] {
  const categories: Category[] = [];
  Object.values(groupedCategories).forEach(categoryGroup => {
    categories.push(...categoryGroup);
  });
  return categories;
}

/**
 * 分類管理頁面
 * 
 * 提供完整的分類管理功能，包括：
 * 1. 樹狀結構展示所有分類
 * 2. 支援新增、編輯、刪除分類
 * 3. 層級關係管理（父子分類）
 * 4. 權限控制（僅管理員可存取）
 * 
 * 設計特色：
 * - 使用後端優化的分組資料結構，高效建構樹狀視圖
 * - 響應式設計，支援桌面和行動裝置
 * - 即時更新，操作後立即反映變化
 * - 完整的 CRUD 操作支援
 */
function CategoriesPage() {
  // === 資料獲取 ===
  const { data: groupedCategories, isLoading, error } = useCategories();
  // const topLevelCategories = (groupedCategories?.[''] || []) as Category[];
  
  // === 效能優化：使用 useMemo 快取運算結果 ===
  const allCategories = useMemo(() => {
    if (!groupedCategories) return [];
    return flattenCategories(groupedCategories as Record<string, Category[]>);
  }, [groupedCategories]);
  
  const treeData = useMemo(() => {
    if (!groupedCategories) return [];
    return buildTreeData(groupedCategories as Record<string, Category[]>);
  }, [groupedCategories]);
  
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
      // 可選的額外校驗：確保解析出的值是一個陣列
      const parsed = savedSorting ? JSON.parse(savedSorting) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to parse sorting state from localStorage", error);
      return []; // 解析失敗時返回安全的預設值
    }
  });
  
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const savedColumnVisibility = localStorage.getItem('categories-table-column-visibility');
      // 可選的額外校驗：確保解析出的值是一個物件
      const parsed = savedColumnVisibility ? JSON.parse(savedColumnVisibility) : {};
      return (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : {};
    } catch (error) {
      console.error("Failed to parse column visibility state from localStorage", error);
      return {}; // 解析失敗時返回安全的預設值
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

  /**
   * 處理新增分類提交
   */
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

  /**
   * 處理編輯分類提交
   */
  const handleUpdate = async (data: FormValues) => {
    if (!editingCategory) return;

    try {
      const updateData = {
        path: { id: editingCategory.id },
        body: {
          name: data.name,
          description: data.description || null,
          parent_id: data.parent_id === 'null' ? null : Number(data.parent_id),
        },
      };

      await updateMutation.mutateAsync(updateData);
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      toast.success('分類更新成功！');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新分類失敗');
    }
  };

  /**
   * 處理刪除分類確認
   */
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

  /**
   * 打開新增頂層分類對話框
   */
  const handleAddTopLevel = () => {
    setParentIdForNewCategory(null);
    setIsCreateDialogOpen(true);
  };

  /**
   * 打開新增子分類對話框
   */
  const handleAddSubCategory = (parentId: number) => {
    setParentIdForNewCategory(parentId);
    setIsCreateDialogOpen(true);
  };

  /**
   * 打開編輯分類對話框
   */
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsEditDialogOpen(true);
  };

  /**
   * 打開刪除確認對話框
   */
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  // === 建立表格欄位定義 ===
  const columns = getCategoryColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
    onAddSubCategory: handleAddSubCategory,
  });

  // === 初始化表格實例 ===
  const table = useReactTable({
    data: treeData,
    columns,
    getSubRows: (row) => row.children,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnVisibility,
      expanded,
    },
  });

  // === 載入和錯誤狀態處理 ===
  if (isLoading) return <div className="p-8">讀取中...</div>;
  if (error) return <div className="p-8">發生錯誤: {error.message}</div>;
  if (!groupedCategories) return <div className="p-8">沒有分類資料。</div>;

  return (
    <div className="p-4 md:p-8">
      {/* === 頁面標題和操作區 === */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">分類管理</h1>
        <Button onClick={handleAddTopLevel} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          新增頂層分類
        </Button>
      </div>
      
      {/* === 分類資料表格 === */}
      <div className="w-full space-y-4">
        {/* 表格工具列 */}
        <div className="flex items-center justify-between py-4">
          {/* 左側 - 搜尋框 */}
          <div className="relative max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋分類..."
              className="pl-8"
            />
          </div>
          
          {/* 右側 - 欄位可見性控制 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                欄位 <ChevronDown className="ml-2 h-4 w-4" />
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
                      {column.id === "name" && "分類名稱"}
                      {column.id === "description" && "商品數量"}
                      {column.id === "actions" && "操作"}
                      {!["name", "description", "actions"].includes(column.id) && column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
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
                    <div className="text-center py-8 text-muted-foreground">
                      <p>暫無分類，請新增第一個分類。</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* === 新增/編輯分類對話框 === */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {parentIdForNewCategory ? '新增子分類' : '新增頂層分類'}
            </DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
            categories={allCategories}
            parentId={parentIdForNewCategory}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>編輯分類</DialogTitle>
          </DialogHeader>
          <CategoryForm
            onSubmit={handleUpdate}
            isLoading={updateMutation.isPending}
            initialData={editingCategory}
            categories={allCategories.filter(cat => cat.id !== editingCategory?.id)}
          />
        </DialogContent>
      </Dialog>

      {/* === 刪除確認對話框 === */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除分類</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除分類「{categoryToDelete?.name}」嗎？
              <br />
              <span className="text-destructive font-medium">
                此操作將同時刪除所有子分類，且無法復原。
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '刪除中...' : '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// 使用 withAuth HOC 進行權限保護，確保只有已登入用戶可以存取
export default withAuth(CategoriesPage); 