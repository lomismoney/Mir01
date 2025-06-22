'use client';

import { useState, useMemo, useCallback } from 'react';
import React from 'react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type CategoryNode } from '@/hooks/queries/useEntityQueries';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Search, Trash2, X, Edit, MoreVertical, Folder, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

/**
 * 遞迴尋找節點
 */
function findNode(nodes: CategoryNode[], id: number): CategoryNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children || [], id);
    if (found) return found;
  }
  return null;
}

/**
 * 將樹狀結構平坦化
 */
function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  const traverse = (nodes: CategoryNode[]) => {
    nodes.forEach(node => {
      result.push(node);
      if (node.children && node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return result;
}

/**
 * 取得分類的完整路徑
 */
function getCategoryPath(node: CategoryNode, allNodes: CategoryNode[]): string {
  const path: string[] = [node.name];
  let current = node;
  
  while (current.parent_id) {
    const parent = allNodes.find(n => n.id === current.parent_id);
    if (!parent) break;
    path.unshift(parent.name);
    current = parent;
  }
  
  return path.join(' / ');
}

/**
 * 分類管理客戶端頁面組件（優化架構版本）
 */
export default function CategoriesClientPage() {
  const { user, isLoading: isAuthLoading, isAuthorized } = useAdminAuth();
  
  // 視圖狀態
  const [currentParentId, setCurrentParentId] = useState<number | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: number | null; name: string }[]>([
    { id: null, name: '所有分類' }
  ]);
  
  // 搜索狀態
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // 對話框狀態
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryNode | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryNode | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    parent_id: null as number | null,
  });

  // 🎯 數據獲取：從 Hook 獲取已經構建好的完整分類樹
  const { data: categoriesTree = [], isLoading: isCategoriesLoading } = useCategories();
  
  // API Mutation Hooks
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  // 🎯 衍生計算：平坦化的所有分類（用於搜索和表單選擇）
  const allCategories = useMemo(() => flattenTree(categoriesTree), [categoriesTree]);

  // 🎯 衍生計算：根據當前狀態，計算出需要顯示的分類列表
  const displayedCategories = useMemo(() => {
    // 如果有搜索詞，在所有分類中搜索
    if (debouncedSearchQuery) {
      const searchLower = debouncedSearchQuery.toLowerCase();
      return allCategories.filter(category => {
        const nameMatch = category.name.toLowerCase().includes(searchLower);
        const descMatch = category.description?.toLowerCase().includes(searchLower) || false;
        const pathMatch = getCategoryPath(category, allCategories).toLowerCase().includes(searchLower);
        return nameMatch || descMatch || pathMatch;
      });
    }
    
    // 沒有搜索詞時，根據當前層級顯示
    if (currentParentId === null) {
      return categoriesTree; // 頂層分類
    }
    
    const parentNode = findNode(categoriesTree, currentParentId);
    return parentNode?.children || [];
  }, [categoriesTree, currentParentId, debouncedSearchQuery, allCategories]);

  // 🎯 事件處理：重置表單
  const resetForm = useCallback(() => {
    setFormData({
      name: '',
      description: '',
      parent_id: currentParentId,
    });
  }, [currentParentId]);

  // 🎯 事件處理：點擊分類卡片
  const handleCategoryClick = useCallback((category: CategoryNode) => {
    if (category.children && category.children.length > 0) {
      setCurrentParentId(category.id);
      setBreadcrumb(prev => [...prev, { id: category.id, name: category.name }]);
    } else {
      toast.info(`分類「${category.name}」沒有子分類。`);
    }
  }, []);

  // 🎯 事件處理：麵包屑導航
  const navigateToCategory = useCallback((crumb: { id: number | null; name: string }, index: number) => {
    setCurrentParentId(crumb.id);
    setBreadcrumb(prev => prev.slice(0, index + 1));
    setSearchQuery(''); // 清除搜索
  }, []);

  // 🎯 事件處理：新增分類
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

  // 🎯 事件處理：編輯分類
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

  // 🎯 事件處理：刪除分類
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

  // 權限檢查
  if (isAuthLoading) {
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
        
        <Button 
          size="sm" 
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          新增分類
        </Button>
      </div>
      
      {/* 麵包屑導覽和搜索區 */}
      <div className="flex items-center gap-4">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumb.map((crumb, index) => (
              <React.Fragment key={crumb.id ?? `root-${index}`}>
                <BreadcrumbItem>
                  <BreadcrumbLink 
                    asChild
                    className={cn(index === breadcrumb.length - 1 ? 'text-foreground' : 'cursor-pointer')}
                  >
                    <button 
                      onClick={() => navigateToCategory(crumb, index)} 
                      disabled={index === breadcrumb.length - 1}
                    >
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

      {/* 🎯 分類列表 - 極其簡潔的渲染邏輯 */}
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
                  <Button 
                    size="sm" 
                    onClick={() => {
                      resetForm();
                      setIsCreateDialogOpen(true);
                    }}
                  >
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
            const hasChildren = category.children && category.children.length > 0;
            const childCount = category.children?.length || 0;
            
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
                        {hasChildren ? (
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
                        {hasChildren && (
                          <Badge variant="secondary" className="text-xs h-5 px-1.5">
                            {childCount} 子分類
                          </Badge>
                        )}
                        <Badge 
                          variant={(category.total_products_count ?? 0) > 0 ? "default" : "outline"} 
                          className="text-xs h-5 px-1.5"
                        >
                          {category.total_products_count || 0} 商品
                        </Badge>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => {
                          setFormData({ name: '', description: '', parent_id: category.id });
                          setIsCreateDialogOpen(true);
                        }}>
                          <Plus className="mr-2 h-3.5 w-3.5" />
                          新增子分類
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem onClick={() => {
                          setEditingCategory(category);
                          setFormData({
                            name: category.name,
                            description: category.description || '',
                            parent_id: category.parent_id || null,
                          });
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="mr-2 h-3.5 w-3.5" />
                          編輯分類
                        </DropdownMenuItem>
                        
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setCategoryToDelete(category);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          刪除分類
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
              {editingCategory ? '編輯分類' : '新增分類'}
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
                    .filter(cat => cat.id !== editingCategory?.id)
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

      {/* 刪除分類對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除分類</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除分類「{categoryToDelete?.name}」嗎？
              {categoryToDelete?.children && categoryToDelete.children.length > 0 && (
                <span className="block mt-2 font-medium text-destructive">
                  警告：此分類包含 {categoryToDelete.children.length} 個子分類，刪除後將一併移除。
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
  );
} 