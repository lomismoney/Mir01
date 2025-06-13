'use client';

import { useState } from 'react';
import { useAttributes, useCreateAttribute, useUpdateAttribute, useDeleteAttribute, useCreateAttributeValue, useUpdateAttributeValue, useDeleteAttributeValue } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoreHorizontal, PlusCircle, Edit, Trash2, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

// 定義屬性和屬性值的類型介面
interface AttributeValue {
  id: number;
  value: string;
}

interface Attribute {
  id: number;
  name: string;
  values?: AttributeValue[];
}

/**
 * AttributesClientPage - 屬性管理客戶端頁面元件
 * 
 * 功能描述：
 * - 展示所有商品屬性的卡片式列表
 * - 支援管理員進行屬性的完整 CRUD 操作
 * - 響應式設計，適配不同螢幕尺寸
 * - 整合權限控制，只有管理員可執行管理操作
 */
export function AttributesClientPage() {
  const { user } = useAuth();
  const { data: attributesResponse, isLoading, error } = useAttributes();
  
  // API Mutation Hooks - 屬性管理
  const createAttributeMutation = useCreateAttribute();
  const updateAttributeMutation = useUpdateAttribute();
  const deleteAttributeMutation = useDeleteAttribute();
  
  // API Mutation Hooks - 屬性值管理
  const createValueMutation = useCreateAttributeValue();
  const updateValueMutation = useUpdateAttributeValue();
  const deleteValueMutation = useDeleteAttributeValue();
  
  // 狀態管理：對話框控制
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isValuesDialogOpen, setIsValuesDialogOpen] = useState(false);
  
  // 狀態管理：表單資料
  const [attributeName, setAttributeName] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  
  // 狀態管理：屬性值管理
  const [managingAttribute, setManagingAttribute] = useState<Attribute | null>(null);
  const [newValue, setNewValue] = useState('');
  
  // 從 API 響應中提取屬性陣列
  const attributes = attributesResponse?.data || [];

  // 處理函數：新增屬性
  const handleCreateAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attributeName.trim()) return;

    try {
      await createAttributeMutation.mutateAsync({ name: attributeName.trim() });
      toast.success('屬性新增成功');
      setAttributeName('');
      setIsCreateDialogOpen(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '新增屬性失敗';
      toast.error(errorMessage);
      console.error('新增屬性錯誤:', error);
    }
  };

  // 處理函數：編輯屬性
  const handleEditAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttribute || !attributeName.trim()) return;

    try {
      await updateAttributeMutation.mutateAsync({
        path: { id: selectedAttribute.id, attribute: selectedAttribute.id },
        body: { name: attributeName.trim() }
      });
      toast.success('屬性更新成功');
      setAttributeName('');
      setSelectedAttribute(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error('更新屬性失敗');
    }
  };

  // 處理函數：刪除屬性
  const handleDeleteAttribute = async () => {
    if (!selectedAttribute) return;

    try {
      await deleteAttributeMutation.mutateAsync({ id: selectedAttribute.id, attribute: selectedAttribute.id });
      toast.success('屬性刪除成功');
      setSelectedAttribute(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error('刪除屬性失敗');
    }
  };

  // 處理函數：開啟編輯對話框
  const openEditDialog = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setAttributeName(attribute.name);
    setIsEditDialogOpen(true);
  };

  // 處理函數：開啟刪除對話框
  const openDeleteDialog = (attribute: Attribute) => {
    setSelectedAttribute(attribute);
    setIsDeleteDialogOpen(true);
  };

  // 處理函數：屬性值管理
  const handleCreateValue = () => {
    if (!managingAttribute || !newValue.trim()) return;
    createValueMutation.mutate({
      attributeId: managingAttribute.id,
      body: { value: newValue.trim() }
    }, {
      onSuccess: () => {
        toast.success(`選項「${newValue}」已新增。`);
        setNewValue(''); // 清空輸入框
      },
      onError: (error) => toast.error(`新增失敗：${error.message}`)
    });
  };

  // 處理函數：刪除屬性值
  const handleDeleteValue = (valueId: number) => {
    deleteValueMutation.mutate(valueId, {
      onSuccess: () => toast.success('選項已刪除。'),
      onError: (error) => toast.error(`刪除失敗：${error.message}`)
    });
  };

  // 處理函數：開啟屬性值管理對話框
  const openValuesDialog = (attribute: Attribute) => {
    setManagingAttribute(attribute);
    setIsValuesDialogOpen(true);
  };

  // 載入狀態：顯示骨架畫面
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
      </div>
    );
  }

  // 錯誤狀態：顯示錯誤訊息
  if (error) return <p className="text-destructive">發生錯誤: {error.message}</p>;

  return (
    <div>
      {/* 操作工具列：新增屬性按鈕 */}
      <div className="flex justify-end mb-4">
        {user?.is_admin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                新增屬性
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增屬性</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAttribute} className="space-y-4">
                <div>
                  <Label htmlFor="attributeName">屬性名稱</Label>
                  <Input
                    id="attributeName"
                    value={attributeName}
                    onChange={(e) => setAttributeName(e.target.value)}
                    placeholder="例如：顏色、尺寸、材質"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button type="submit" disabled={createAttributeMutation.isPending}>
                    {createAttributeMutation.isPending ? '新增中...' : '新增'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      {/* 屬性列表或空狀態 */}
      {attributes.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p>尚未建立任何規格屬性。</p>
          <p className="text-sm text-muted-foreground">點擊「新增屬性」來開始。</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {attributes.map((attribute: Attribute) => (
            <Card key={attribute.id}>
              {/* 卡片標題區：屬性名稱 + 更多操作按鈕 */}
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{attribute.name}</CardTitle>
                {user?.is_admin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(attribute)}>
                        <Edit className="mr-2 h-4 w-4" />
                        編輯
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => openDeleteDialog(attribute)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        刪除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              
              {/* 卡片內容區：屬性值標籤 */}
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {attribute.values?.map((value: AttributeValue) => (
                    <Badge key={value.id} variant="secondary">{value.value}</Badge>
                  ))}
                  {attribute.values?.length === 0 && <p className="text-xs text-muted-foreground">暫無選項</p>}
                </div>
              </CardContent>
              
              {/* 卡片底部：管理選項按鈕 */}
              <CardFooter>
                {user?.is_admin && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => openValuesDialog(attribute)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    管理「{attribute.name}」的選項
                  </Button>
                )}
              </CardFooter>
            </Card>
                     ))}
          </div>
      )}

      {/* 編輯屬性對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯屬性</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditAttribute} className="space-y-4">
            <div>
              <Label htmlFor="editAttributeName">屬性名稱</Label>
              <Input
                id="editAttributeName"
                value={attributeName}
                onChange={(e) => setAttributeName(e.target.value)}
                placeholder="例如：顏色、尺寸、材質"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                取消
              </Button>
              <Button type="submit" disabled={updateAttributeMutation.isPending}>
                {updateAttributeMutation.isPending ? '更新中...' : '更新'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除屬性「{selectedAttribute?.name}」嗎？
              <br />
              此操作將同時刪除該屬性下的所有選項值，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAttribute}
              disabled={deleteAttributeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAttributeMutation.isPending ? '刪除中...' : '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 屬性值管理對話框 */}
      <Dialog open={isValuesDialogOpen} onOpenChange={setIsValuesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>管理「{managingAttribute?.name}」的選項</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6">
            {/* 顯示已有的值 */}
            <div className="space-y-3">
              <Label className="text-base font-medium">已有選項</Label>
              {managingAttribute?.values && managingAttribute.values.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {managingAttribute.values.map((value: AttributeValue) => (
                    <div key={value.id} className="flex items-center gap-1 p-2 px-3 border rounded-md bg-secondary/50">
                      <span className="text-sm">{value.value}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 ml-1 hover:bg-destructive/20" 
                        onClick={() => handleDeleteValue(value.id)}
                        disabled={deleteValueMutation.isPending}
                      >
                        <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">此屬性尚未有任何選項</p>
              )}
            </div>

            {/* 新增值的表單 */}
            <div className="space-y-3">
              <Label htmlFor="new-value" className="text-base font-medium">新增選項</Label>
              <div className="flex gap-2">
                <Input 
                  id="new-value" 
                  value={newValue} 
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="例如：紅色、XL、棉質"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateValue();
                    }
                  }}
                />
                <Button 
                  onClick={handleCreateValue} 
                  disabled={createValueMutation.isPending || !newValue.trim()}
                >
                  {createValueMutation.isPending ? '新增中...' : '新增'}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsValuesDialogOpen(false)}>
              完成
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 