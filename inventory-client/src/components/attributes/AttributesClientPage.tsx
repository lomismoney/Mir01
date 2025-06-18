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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Loader2, Plus, Search, ChevronDown, Trash2, Tags, X, Edit, MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Attribute } from '@/types/attribute';
import { toast } from 'sonner';

/**
 * 規格管理客戶端頁面組件（手風琴重構版本）
 * 
 * 重構亮點：
 * 1. 從扁平表格重構為層次化手風琴列表
 * 2. 上下文操作：在規格展開狀態下直接管理規格值
 * 3. 視覺層次清晰：完美呈現規格與規格值的父子關係
 * 4. 互動體驗優化：一目了然的管理介面
 * 
 * 架構特色：
 * - shadcn/ui Accordion 組件提供標準化體驗
 * - 即時新增規格值，無需額外對話框
 * - 直覺的刪除操作，帶有確認機制
 * - 統一的 API 操作流程
 * 
 * 安全特性：
 * - 統一的權限驗證機制 (useAdminAuth)
 * - 類型安全的 API 呼叫
 * - 完整的錯誤處理和用戶回饋
 */
const AttributesClientPage = () => {
  const { user, isLoading, isAuthorized } = useAdminAuth();
  
  // 搜索狀態管理 - 使用防抖優化
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  const { data: attributesResponse, isLoading: isAttributesLoading, error } = useAttributes();
  
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
  
  // 規格值新增狀態 - 為每個規格維護獨立的新增狀態
  const [newValueInputs, setNewValueInputs] = useState<{ [key: number]: string }>({});

  /**
   * 處理 API 資料轉換
   * 將 API 回應轉換為本地 Attribute 類型
   */
  const attributes = (attributesResponse?.data || [])
    .filter((attr): attr is Required<typeof attr> => 
      attr.id !== undefined && attr.name !== undefined
    )
    .map(attr => ({
      id: attr.id!,
      name: attr.name!,
      created_at: attr.created_at,
      updated_at: attr.updated_at,
      values: attr.values?.map(val => ({
        id: val.id!,
        value: val.value!,
        attribute_id: val.attribute_id!,
        created_at: val.created_at,
        updated_at: val.updated_at,
      })) || []
    })) as Attribute[];

  /**
   * 根據搜索條件過濾規格
   */
  const filteredAttributes = attributes.filter(attr => 
    attr.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
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
        path: { id: selectedAttribute.id, attribute: selectedAttribute.id },
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
      setIsValueDeleteDialogOpen(false);
    } catch (error) {
      toast.error('刪除規格值失敗');
    }
  };

  /**
   * 開始刪除規格值
   */
  const startDeleteValue = (valueId: number) => {
    setSelectedValueId(valueId);
    setIsValueDeleteDialogOpen(true);
  };

  /**
   * 更新規格值輸入框的值
   */
  const updateNewValueInput = (attributeId: number, value: string) => {
    setNewValueInputs(prev => ({ ...prev, [attributeId]: value }));
  };

  // 權限檢查
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            您沒有權限訪問此頁面
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和操作區 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">規格管理</h1>
          <p className="text-muted-foreground">
            管理商品規格屬性，如顏色、尺寸、材質等
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              新增規格
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>新增規格</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateAttribute} className="space-y-4">
              <div>
                <Label htmlFor="name">規格名稱</Label>
                <Input
                  id="name"
                  placeholder="例如：顏色、尺寸、材質"
                  value={attributeName}
                  onChange={(e) => setAttributeName(e.target.value)}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  type="submit" 
                  disabled={createAttributeMutation.isPending}
                >
                  {createAttributeMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  新增
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* 搜索區 */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜索規格名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* 規格列表 - 手風琴結構 */}
      <Card>
        <CardContent className="pt-6">
          {isAttributesLoading ? (
            <div className="flex justify-center items-center min-h-[200px]">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredAttributes.length === 0 ? (
            <div className="text-center py-12">
              <Tags className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">尚未建立任何規格</h3>
              <p className="text-muted-foreground mb-4">
                點擊「新增規格」按鈕開始建立您的第一個商品規格
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                新增規格
              </Button>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {filteredAttributes.map((attribute) => (
                <AccordionItem key={attribute.id} value={`attribute-${attribute.id}`}>
                  <div className="flex items-center justify-between pr-4 group">
                    <AccordionTrigger className="hover:no-underline flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-left">{attribute.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {attribute.values?.length || 0} 個值
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    
                    {/* 核心優化：DropdownMenu 取代了獨立按鈕 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        {/* 預設透明，group-hover 時顯現，互動更細膩 */}
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEditAttribute(attribute)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>編輯名稱</span>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        {/* 關鍵：將 AlertDialogTrigger 包裹在 DropdownMenuItem 周圍，以保持原有功能 */}
                        <AlertDialogTrigger asChild> 
                          <DropdownMenuItem 
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            // 加上 onSelect 來防止 DropdownMenu 自動關閉，讓 AlertDialog 能順利彈出
                            onSelect={(event) => event.preventDefault()} 
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>刪除規格</span>
                          </DropdownMenuItem>
                        </AlertDialogTrigger>

                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <AccordionContent>
                    <div className="space-y-4 pt-2">
                      {/* 新增規格值表單 */}
                      <div className="flex gap-2">
                        <Input
                          placeholder={`新增${attribute.name}...`}
                          value={newValueInputs[attribute.id] || ''}
                          onChange={(e) => updateNewValueInput(attribute.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleCreateValue(attribute.id);
                            }
                          }}
                        />
                        <Button 
                          onClick={() => handleCreateValue(attribute.id)}
                          disabled={createValueMutation.isPending || !newValueInputs[attribute.id]?.trim()}
                          size="sm"
                        >
                          {createValueMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      
                      {/* 現有規格值列表 */}
                      {attribute.values && attribute.values.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {attribute.values.map((value) => (
                            <Badge 
                              key={value.id} 
                              variant="secondary" 
                              className="flex items-center gap-1.5 pr-1.5"
                            >
                              <span>{value.value}</span>
                              <div 
                                onClick={() => startDeleteValue(value.id)} 
                                className="cursor-pointer rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors flex items-center justify-center"
                                title={`刪除 ${value.value}`}
                              >
                                <X className="h-3 w-3" />
                              </div>
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          此規格尚未有任何值，請使用上方表單新增
                        </p>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* 編輯規格對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯規格</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAttribute} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">規格名稱</Label>
              <Input
                id="edit-name"
                placeholder="例如：顏色、尺寸、材質"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={updateAttributeMutation.isPending}
              >
                {updateAttributeMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                更新
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除規格確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除規格值確認對話框 */}
      <AlertDialog open={isValueDeleteDialogOpen} onOpenChange={setIsValueDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除規格值</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除此規格值嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteValue}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteValueMutation.isPending}
            >
              {deleteValueMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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