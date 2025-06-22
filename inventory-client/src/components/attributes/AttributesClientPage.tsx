'use client';

import { useState, memo, useEffect } from 'react';
import { useAttributes, useCreateAttribute, useUpdateAttribute, useDeleteAttribute, useCreateAttributeValue, useUpdateAttributeValue, useDeleteAttributeValue } from '@/hooks/queries/useEntityQueries';
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
import { Loader2, Plus, Search, Trash2, X, Edit, MoreVertical, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Attribute } from '@/types/attribute';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * 規格管理客戶端頁面組件（緊湊卡片版本）
 * 
 * 設計理念：
 * 1. 使用卡片網格佈局，最大化空間利用
 * 2. 規格值直接展示，無需展開操作
 * 3. 行內編輯，減少彈窗操作
 * 4. 緊湊的視覺設計，減少留白
 */
const AttributesClientPage = () => {
  const { user, isLoading, isAuthorized } = useAdminAuth();
  
  // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const { data: hookResponse, isLoading: isAttributesLoading, error } = useAttributes();
  
  // API Mutation Hooks
  const createAttributeMutation = useCreateAttribute();
  const updateAttributeMutation = useUpdateAttribute();
  const deleteAttributeMutation = useDeleteAttribute();
  const createValueMutation = useCreateAttributeValue();
  const updateValueMutation = useUpdateAttributeValue();
  const deleteValueMutation = useDeleteAttributeValue();
  
  // 對話框狀態管理
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValueDeleteDialogOpen, setIsValueDeleteDialogOpen] = useState(false);
  
  // 表單資料狀態
  const [attributeName, setAttributeName] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [selectedValueId, setSelectedValueId] = useState<number | null>(null);
  const [selectedValueName, setSelectedValueName] = useState<string>('');
  
  // 規格值新增狀態 - 為每個規格維護獨立的新增狀態
  const [newValueInputs, setNewValueInputs] = useState<{ [key: number]: string }>({});
  const [showValueInput, setShowValueInput] = useState<{ [key: number]: boolean }>({});

  /**
   * 🎯 標準化數據獲取 - 直接從 Hook 返回的結構中解構
   * Hook 已經在 select 函數中處理好了數據結構
   */
  const attributes = (hookResponse?.data ?? []) as Attribute[];
  const meta = hookResponse?.meta;

  /**
   * 根據搜索條件過濾規格
   */
  const filteredAttributes = attributes.filter(attr => 
    attr.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
    attr.values?.some(val => val.value.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
  );

  /**
   * 處理新增規格
   */
  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeName.trim()) return;

    try {
      await createAttributeMutation.mutateAsync({ name: attributeName.trim() });
      toast.success('規格新增成功！');
      setAttributeName('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '新增規格失敗';
      toast.error(errorMessage);
    }
  };

  /**
   * 處理編輯規格
   */
  const handleEditAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttribute || !attributeName.trim()) return;

    try {
      await updateAttributeMutation.mutateAsync({
        id: selectedAttribute.id,
        body: { name: attributeName.trim() }
      });
      toast.success('規格更新成功！');
      setAttributeName('');
      setSelectedAttribute(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('更新規格失敗');
    }
  };

  /**
   * 處理刪除規格
   */
  const handleDeleteAttribute = async () => {
    if (!selectedAttribute) return;

    try {
      await deleteAttributeMutation.mutateAsync({ 
        id: selectedAttribute.id, 
        attribute: selectedAttribute.id 
      });
      toast.success('規格刪除成功！');
      setSelectedAttribute(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error('刪除規格失敗');
    }
  };

  /**
   * 開始編輯規格
   */
  const startEditAttribute = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setAttributeName(attribute.name);
    setIsEditDialogOpen(true);
  };

  /**
   * 開始刪除規格
   */
  const startDeleteAttribute = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setIsDeleteDialogOpen(true);
  };

  /**
   * 處理新增規格值
   */
  const handleCreateValue = async (attributeId: number) => {
    const newValue = newValueInputs[attributeId];
    if (!newValue?.trim()) return;

    try {
      await createValueMutation.mutateAsync({
        attributeId: attributeId,
        body: { value: newValue.trim() }
      });
      toast.success('規格值新增成功！');
      // 清空該規格的輸入框
      setNewValueInputs(prev => ({ ...prev, [attributeId]: '' }));
      setShowValueInput(prev => ({ ...prev, [attributeId]: false }));
    } catch (error) {
      toast.error('新增規格值失敗');
    }
  };

  /**
   * 處理刪除規格值
   */
  const handleDeleteValue = async () => {
    if (!selectedValueId) return;

    try {
      await deleteValueMutation.mutateAsync(selectedValueId);
      toast.success('規格值刪除成功！');
      setSelectedValueId(null);
      setSelectedValueName('');
      setIsValueDeleteDialogOpen(false);
    } catch (error) {
      toast.error('刪除規格值失敗');
    }
  };

  /**
   * 開始刪除規格值
   */
  const startDeleteValue = (valueId: number, valueName: string) => {
    setSelectedValueId(valueId);
    setSelectedValueName(valueName);
    setIsValueDeleteDialogOpen(true);
  };

  /**
   * 更新規格值輸入框的值
   */
  const updateNewValueInput = (attributeId: number, value: string) => {
    setNewValueInputs(prev => ({ ...prev, [attributeId]: value }));
  };

  /**
   * 切換新增值輸入框顯示狀態
   */
  const toggleValueInput = (attributeId: number) => {
    setShowValueInput(prev => ({ ...prev, [attributeId]: !prev[attributeId] }));
    if (!showValueInput[attributeId]) {
      // 如果要顯示輸入框，清空之前的輸入
      setNewValueInputs(prev => ({ ...prev, [attributeId]: '' }));
    }
  };

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
      {/* 頁面標題和操作區 - 更緊湊 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">規格管理</h1>
          <p className="text-sm text-muted-foreground">管理商品規格屬性</p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 h-4 w-4" />
              新增規格
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>新增規格</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">規格名稱</Label>
                <Input
                  id="name"
                  placeholder="例如：顏色、尺寸、材質"
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setAttributeName('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  type="submit" 
                  size="sm"
                  disabled={createAttributeMutation.isPending || !attributeName.trim()}
                >
                  {createAttributeMutation.isPending && (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  )}
                  新增
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索區 - 更緊湊 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
          placeholder="搜索規格名稱或規格值..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9"
            />
          </div>

      {/* 規格列表 - 緊湊卡片網格 */}
          {isAttributesLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredAttributes.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              {searchQuery ? (
                <>
                  <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">找不到符合的規格</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    請嘗試使用不同的搜索關鍵字
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setSearchQuery('')}>
                    清除搜索
                  </Button>
                </>
              ) : (
                <>
                  <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">尚未建立任何規格</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    規格用於定義商品的不同變體
              </p>
                  <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-1.5 h-4 w-4" />
                    新增第一個規格
              </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
          ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredAttributes.map((attribute) => (
            <Card key={attribute.id} className="relative group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base font-medium">
                      {attribute.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {attribute.values?.length || 0} 個規格值
                    </p>
                      </div>
                  
                  <AlertDialog open={isDeleteDialogOpen && selectedAttribute?.id === attribute.id} onOpenChange={(open) => {
                    if (!open) {
                      setIsDeleteDialogOpen(false);
                      setSelectedAttribute(null);
                    }
                  }}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 -mt-1 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreVertical className="h-3.5 w-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditAttribute(attribute)}>
                          <Edit className="mr-2 h-3.5 w-3.5" />
                          編輯名稱
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                          <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => startDeleteAttribute(attribute)}
                          >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          刪除規格
                          </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>確認刪除規格</AlertDialogTitle>
                        <AlertDialogDescription>
                          您確定要刪除規格「{selectedAttribute?.name}」嗎？
                          此操作將同時刪除該規格下的所有規格值，且無法復原。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDeleteAttribute}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={deleteAttributeMutation.isPending}
                        >
                          {deleteAttributeMutation.isPending && (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          )}
                          確認刪除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* 規格值列表 */}
                <div className="space-y-2">
                  {attribute.values && attribute.values.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {attribute.values.map((value) => (
                        <Badge 
                          key={value.id} 
                          variant="secondary" 
                          className="text-xs h-6 px-2 pr-1"
                        >
                          <span>{value.value}</span>
                          <button
                            onClick={() => startDeleteValue(value.id, value.value)} 
                            className="ml-1 p-0.5 hover:bg-muted-foreground/20 rounded-full transition-colors"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </Badge>
                      ))}
                  </div>
                  )}
                  
                  {/* 新增值按鈕或輸入框 */}
                  {showValueInput[attribute.id] ? (
                    <div className="flex gap-1.5">
                        <Input
                        placeholder="輸入新值"
                          value={newValueInputs[attribute.id] || ''}
                          onChange={(e) => updateNewValueInput(attribute.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateValue(attribute.id);
                            }
                          if (e.key === 'Escape') {
                            toggleValueInput(attribute.id);
                          }
                          }}
                        className="h-7 text-sm"
                        autoFocus
                        />
                        <Button 
                          onClick={() => handleCreateValue(attribute.id)}
                          disabled={createValueMutation.isPending || !newValueInputs[attribute.id]?.trim()}
                          size="sm"
                        className="h-7 px-2"
                        >
                          {createValueMutation.isPending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                          <Plus className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      <Button
                        onClick={() => toggleValueInput(attribute.id)}
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                              >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                        </div>
                      ) : (
                    <Button
                      onClick={() => toggleValueInput(attribute.id)}
                      variant="ghost"
                      size="sm"
                      className="w-full h-7 text-xs justify-start px-2 hover:bg-muted"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      新增值
                    </Button>
                      )}
                    </div>
        </CardContent>
      </Card>
          ))}
        </div>
      )}

      {/* 編輯規格對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>編輯規格</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAttribute} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">規格名稱</Label>
              <Input
                id="edit-name"
                placeholder="例如：顏色、尺寸、材質"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setAttributeName('');
                  setSelectedAttribute(null);
                }}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                size="sm"
                disabled={updateAttributeMutation.isPending || !attributeName.trim()}
              >
                {updateAttributeMutation.isPending && (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                )}
                更新
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除規格值確認對話框 */}
      <AlertDialog open={isValueDeleteDialogOpen} onOpenChange={setIsValueDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除規格值</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除規格值「{selectedValueName}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setSelectedValueId(null);
              setSelectedValueName('');
            }}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteValue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteValueMutation.isPending}
            >
              {deleteValueMutation.isPending && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default memo(AttributesClientPage); 