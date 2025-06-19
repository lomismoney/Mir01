'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '@/hooks/queries/useEntityQueries';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Search, Trash2, X, Edit, MoreVertical, Folder, FolderOpen, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Category } from '@/types/category';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import React from 'react';

/**
 * 將分組的分類資料轉換為平坦的陣列
 */
function flattenCategories(groupedCategories: Record<string, any[]> | undefined): Category[] {
  if (!groupedCategories) return [];
  
  const categories: Category[] = [];
  Object.values(groupedCategories).forEach(categoryGroup => {
    categoryGroup.forEach(cat => {
      // 確保每個分類都有必要的屬性
      if (cat && typeof cat.id === 'number') {
        categories.push({
          id: cat.id,
          name: cat.name || '',
          description: cat.description || null,
          parent_id: cat.parent_id || null,
          created_at: cat.created_at || '',
          updated_at: cat.updated_at || '',
          products_count: cat.products_count || 0,
          total_products_count: cat.total_products_count || 0,
        } as Category);
      }
    });
  });
  return categories;
}

/**
 * 計算分類的層級深度
 */
function getCategoryDepth(category: Category, allCategories: Category[]): number {
  let depth = 0;
  let currentCategory = category;
  
  while (currentCategory.parent_id) {
    depth++;
    const parent = allCategories.find(c => c.id === currentCategory.parent_id);
    if (!parent) break;
    currentCategory = parent;
  }
  
  return depth;
}

/**
 * 取得分類的完整路徑
 */
function getCategoryPath(category: Category, allCategories: Category[]): string {
  const path: string[] = [category.name];
  let currentCategory = category;
  
  while (currentCategory.parent_id) {
    const parent = allCategories.find(c => c.id === currentCategory.parent_id);
    if (!parent) break;
    path.unshift(parent.name);
    currentCategory = parent;
  }
  
  return path.join(' / ');
}

/**
 * 檢查是否有子分類
 */
function hasChildren(categoryId: number, groupedCategories: Record<string, any[]> | undefined): boolean {
  if (!groupedCategories) return false;
  const children = groupedCategories[categoryId.toString()];
  return children && children.length > 0;
}

/**
 * 分類管理客戶端頁面組件（緊湊卡片版本）
 * 
 * 設計理念：
 * 1. 使用卡片網格佈局，最大化空間利用
 * 2. 層級關係可視化（縮排和路徑顯示）
 * 3. 緊湊的視覺設計，減少留白
 * 4. 直觀的操作介面
 */
const CategoriesClientPage = () => {
  const { user, isLoading, isAuthorized } = useAdminAuth();
  
  // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // 導覽狀態管理
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: number | null; name: string }[]>([{ id: null, name: '所有分類' }]);
  
  // 資料獲取 - 處理新的 API 回應格式
  const { data: categoriesResponse, isLoading: isCategoriesLoading, error } = useCategories();
  
  // 將 API 回應轉換為分組格式
  const groupedCategories = useMemo(() => {
    if (!categoriesResponse?.data) return {};
    
    // 按 parent_id 分組
    const grouped: Record<string, Category[]> = {};
    categoriesResponse.data.forEach((category: any) => {
      const parentKey = category.parent_id ? category.parent_id.toString() : '';
      if (!grouped[parentKey]) {
        grouped[parentKey] = [];
      }
      grouped[parentKey].push(category);
    });
    
    return grouped;
  }, [categoriesResponse]);
  
  // 資料轉換 - 將分組資料轉為平坦陣列
  const allCategories = useMemo(() => {
    return flattenCategories(groupedCategories);
  }, [groupedCategories]);
  
  // API Mutation Hooks
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // 對話框狀態管理
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentIdForNewCategory, setParentIdForNewCategory] = useState<number | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null as number | null,
  });

  /**
   * 根據當前導覽和搜索條件過濾分類
   */
  const displayedCategories = useMemo(() => {
    // 如果有搜索詞，則在所有分類中搜索，忽略層級
    if (debouncedSearchQuery) {
      const searchLower = debouncedSearchQuery.toLowerCase();
      return allCategories.filter(category => {
        const nameMatch = category.name.toLowerCase().includes(searchLower);
        const descMatch = category.description?.toLowerCase().includes(searchLower) || false;
        const pathMatch = getCategoryPath(category, allCategories).toLowerCase().includes(searchLower);
        return nameMatch || descMatch || pathMatch;
      }).sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // 否則，顯示當前層級的分類
    const parentIdKey = currentParentId?.toString() || '';
    const categoriesToShow = (groupedCategories as Record<string, Category[]>)?.[parentIdKey] || [];
    
    return [...categoriesToShow].sort((a, b) => a.name.localeCompare(b.name));
  }, [allCategories, debouncedSearchQuery, currentParentId, groupedCategories]);

  /**
   * 重置表單
   */
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      parent_id: currentParentId, // 預設父分類為當前層級
    });
  };

  /**
   * 處理新增分類
   */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await createMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description || null,
        parent_id: formData.parent_id,
      });
      
      toast.success('分類新增成功！');
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '新增分類失敗');
    }
  };

  /**
   * 處理編輯分類
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !formData.name.trim()) return;

    try {
      await updateMutation.mutateAsync({
        id: editingCategory.id,
        data: {
          name: formData.name.trim(),
          description: formData.description || null,
          parent_id: formData.parent_id,
        }
      });
      
      toast.success('分類更新成功！');
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新分類失敗');
    }
  };

  /**
   * 處理刪除分類
   */
  const handleDelete = async () => {
    if (!categoryToDelete) return;

    try {
      await deleteMutation.mutateAsync(categoryToDelete.id);
      toast.success('分類刪除成功！');
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '刪除分類失敗');
    }
  };

  /**
   * 導覽到指定分類層級
   */
  const navigateToCategory = (category: { id: number | null; name: string }) => {
    const newBreadcrumb = [];
    for (const crumb of breadcrumb) {
      newBreadcrumb.push(crumb);
      if (crumb.id === category.id) break;
    }
    setBreadcrumb(newBreadcrumb);
    setCurrentParentId(category.id);
    setSearchQuery(''); // 清除搜索
  };

  /**
   * 點擊分類卡片，進入子分類
   */
  const handleCategoryClick = (category: Category) => {
    const hasChildCategories = hasChildren(category.id, groupedCategories);
    if (hasChildCategories) {
      setCurrentParentId(category.id);
      setBreadcrumb([...breadcrumb, { id: category.id, name: category.name }]);
    } else {
      // 如果沒有子分類，可以顯示一個提示
      toast.info(`分類「${category.name}」沒有子分類。`);
    }
  };

  /**
   * 開始新增分類（在當前層級）
   */
  const handleAddCategory = useCallback(() => {
    setFormData({ name: '', description: '', parent_id: currentParentId });
    setIsCreateDialogOpen(true);
  }, [currentParentId]);

  /**
   * 開始新增子分類
   */
  const handleAddSubCategory = useCallback((parentId: number) => {
    setParentIdForNewCategory(parentId);
    setFormData(prev => ({ ...prev, parent_id: parentId }));
    setIsCreateDialogOpen(true);
  }, []);

  /**
   * 開始編輯分類
   */
  const handleEdit = useCallback((category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || null,
    });
    setIsEditDialogOpen(true);
  }, []);

  /**
   * 開始刪除分類
   */
  const handleDeleteClick = useCallback((category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  }, []);

  // 權限檢查
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-6">
        <div className="text-center">
            <X className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-lg font-medium text-destructive">權限不足</p>
            <p className="text-muted-foreground mt-2">您沒有權限訪問此頁面</p>
        </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 頁面標題和操作區 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">分類管理</h1>
          <p className="text-sm text-muted-foreground">組織和管理商品分類結構</p>
        </div>
        
        <Button size="sm" onClick={handleAddCategory}>
          <Plus className="mr-1.5 h-4 w-4" />
          新增分類
        </Button>
      </div>
      
      {/* 麵包屑導覽和搜索區 */}
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={crumb.id ?? `crumb-${index}`}>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    asChild
                    className={cn(index === breadcrumb.length - 1 ? 'text-foreground' : 'cursor-pointer')}
                  >
                    <button onClick={() => navigateToCategory(crumb)} disabled={index === breadcrumb.length - 1}>
                      {crumb.name}
                    </button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {index < breadcrumb.length - 1 && <BreadcrumbSeparator />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="relative flex-grow ml-auto max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="在所有分類中搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* 分類列表 - 緊湊卡片網格 */}
      {isCategoriesLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : displayedCategories.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              {searchQuery ? (
                <>
                  <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">找不到符合的分類</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    請嘗試使用不同的搜索關鍵字
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    清除搜索
                  </Button>
                </>
              ) : (
                <>
                  <Folder className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">此層級下沒有分類</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    您可以在此層級下新增一個分類
                  </p>
                  <Button size="sm" onClick={handleAddCategory}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    新增分類
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displayedCategories.map((category) => {
            const hasChildCategories = hasChildren(category.id, groupedCategories);
            const childCount = (groupedCategories as Record<string, any>)?.[category.id.toString()]?.length || 0;
            
            return (
              <Card 
                key={category.id} 
                className="relative group transition-all hover:shadow-md cursor-pointer"
                onClick={() => handleCategoryClick(category)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-2 mb-1">
                        {hasChildCategories ? (
                          <FolderOpen className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        ) : (
                          <Folder className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                        )}
                        <CardTitle className="text-base font-medium truncate" title={category.name}>
                          {category.name}
                        </CardTitle>
                      </div>
                      
                      {category.description && (
                         <p className="text-sm text-muted-foreground truncate" title={category.description}>
                          {category.description}
                         </p>
                      )}
                      
                      <div className="flex gap-2 mt-2">
                        {hasChildCategories && (
                          <Badge variant="secondary" className="text-xs h-5 px-1.5">
                            {childCount} 子分類
                          </Badge>
                        )}
                        {/* 商品數量顯示 */}
                        <Badge 
                          variant={(category.total_products_count ?? 0) > 0 ? "default" : "outline"} 
                          className="text-xs h-5 px-1.5"
                        >
                          {category.total_products_count || 0} 商品
                        </Badge>
                      </div>
                    </div>
                    
                    <AlertDialog open={isDeleteDialogOpen && categoryToDelete?.id === category.id} onOpenChange={(open) => {
                      if (!open) {
                        setIsDeleteDialogOpen(false);
                        setCategoryToDelete(null);
                      }
                    }}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => e.stopPropagation()} // 防止觸發卡片點擊
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem onClick={() => handleAddSubCategory(category.id)}>
                            <Plus className="mr-2 h-3.5 w-3.5" />
                            新增子分類
                          </DropdownMenuItem>
                          
                          <DropdownMenuSeparator />
                          
                          <DropdownMenuItem onClick={() => handleEdit(category)}>
                            <Edit className="mr-2 h-3.5 w-3.5" />
                            編輯分類
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDeleteClick(category)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            刪除分類
                          </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>確認刪除分類</AlertDialogTitle>
                          <AlertDialogDescription>
                            您確定要刪除分類「{categoryToDelete?.name}」嗎？
                            {hasChildCategories && (
                              <span className="block mt-2 font-medium text-destructive">
                                警告：此分類包含 {childCount} 個子分類，刪除後將一併移除。
                              </span>
                            )}
                            此操作無法復原。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleteMutation.isPending}
                          >
                            {deleteMutation.isPending && (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            確認刪除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
      </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}

      {/* 新增/編輯分類對話框 */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingCategory(null);
          resetForm();
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? '編輯分類' : (formData.parent_id ? '新增子分類' : '新增分類')}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={editingCategory ? handleUpdate : handleCreate} className="space-y-4 py-2">
            <div>
              <Label htmlFor="name">分類名稱</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">分類描述</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="（可選）"
              />
            </div>
            <div>
              <Label htmlFor="parent_id">父分類</Label>
              <Select
                value={formData.parent_id?.toString() || 'null'}
                onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'null' ? null : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇父分類" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">無（設為頂層分類）</SelectItem>
                  {allCategories
                    .filter(cat => cat.id !== editingCategory?.id) // 防止將分類設為自身的子分類
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {getCategoryPath(cat, allCategories)}
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="button" variant="ghost" onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}>取消</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : editingCategory ? '儲存變更' : '確認新增'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(CategoriesClientPage); 