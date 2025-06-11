'use client';

import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { useAttributes, useCreateAttribute, useUpdateAttribute, useDeleteAttribute, useCreateAttributeValue, useDeleteAttributeValue } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, MoreHorizontal, Edit, Trash2, X } from 'lucide-react';
import { Attribute } from '@/types/attribute';
import { useState } from 'react';
import { toast } from 'sonner';

/**
 * 規格庫管理頁面
 * 
 * 提供商品屬性和屬性值的完整 CRUD 功能
 * 僅管理員可以存取此頁面
 */
function AttributesPage() {
  const { user } = useAuth();
  const { data: attributesResponse, isLoading, error } = useAttributes();
  
  // 第二分隊：新增屬性功能的狀態管理
  const createAttributeMutation = useCreateAttribute();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAttributeName, setNewAttributeName] = useState('');

  // 第二分隊：編輯和刪除功能的狀態管理
  const updateAttributeMutation = useUpdateAttribute();
  const deleteAttributeMutation = useDeleteAttribute();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<Attribute | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<Attribute | null>(null);

  // 第二分隊：屬性值管理的狀態管理
  const createValueMutation = useCreateAttributeValue();
  const deleteValueMutation = useDeleteAttributeValue();

  const [isValuesDialogOpen, setIsValuesDialogOpen] = useState(false);
  const [managingAttribute, setManagingAttribute] = useState<Attribute | null>(null);
  const [newValue, setNewValue] = useState('');

  if (isLoading) return <div>讀取中...</div>;
  if (error) return <div>發生錯誤: {error.message}</div>;

  // 我們需要一個扁平化的屬性列表用於顯示
  const attributes: Attribute[] = Array.isArray(attributesResponse?.data) 
    ? attributesResponse.data 
    : Array.isArray(attributesResponse) 
    ? attributesResponse 
    : [];

  /**
   * 第二分隊：處理新增屬性的函式
   * 
   * 功能說明：
   * 1. 驗證屬性名稱不為空
   * 2. 調用 createAttributeMutation 發送請求
   * 3. 成功後顯示 toast 通知並關閉 Dialog
   * 4. 失敗時顯示錯誤訊息
   * 5. 重置表單狀態
   */
  const handleCreateAttribute = () => {
    if (!newAttributeName.trim()) {
      toast.error('請輸入屬性名稱');
      return;
    }

    createAttributeMutation.mutate({ name: newAttributeName.trim() }, {
      onSuccess: () => {
        toast.success(`屬性「${newAttributeName}」已成功建立！`);
        setIsCreateDialogOpen(false);
        setNewAttributeName('');
      },
      onError: (error) => {
        toast.error(`建立失敗：${error.message}`);
      }
    });
  };

  /**
   * 第二分隊：編輯和刪除事件處理函式
   */
  
  // 點擊「編輯」時觸發
  const handleEditClick = (attribute: Attribute) => {
    setEditingAttribute(attribute);
    setIsEditDialogOpen(true);
  };

  // 點擊「刪除」時觸發
  const handleDeleteClick = (attribute: Attribute) => {
    setAttributeToDelete(attribute);
    setIsDeleteDialogOpen(true);
  };

  // 處理編輯表單提交
  const handleUpdateAttribute = (updatedName: string) => {
    if (!editingAttribute) return;

    if (!updatedName.trim()) {
      toast.error('請輸入屬性名稱');
      return;
    }

    updateAttributeMutation.mutate({ 
      path: { id: editingAttribute.id, attribute: editingAttribute.id }, 
      body: { name: updatedName.trim() } 
    }, {
      onSuccess: () => {
        toast.success(`屬性「${updatedName}」已更新。`);
        setIsEditDialogOpen(false);
        setEditingAttribute(null);
      },
      onError: (error) => {
        toast.error(`更新失敗：${error.message}`);
      }
    });
  };

  // 處理刪除確認
  const handleDeleteAttribute = () => {
    if (!attributeToDelete) return;

    deleteAttributeMutation.mutate({ id: attributeToDelete.id, attribute: attributeToDelete.id }, {
      onSuccess: () => {
        toast.success(`屬性「${attributeToDelete.name}」已刪除。`);
        setIsDeleteDialogOpen(false);
        setAttributeToDelete(null);
      },
      onError: (error) => {
        toast.error(`刪除失敗：${error.message}`);
      }
    });
  };

  /**
   * 第二分隊：屬性值管理事件處理函式
   */
  
  // 處理新增屬性值
  const handleCreateValue = () => {
    if (!managingAttribute || !newValue.trim()) {
      toast.error('請輸入屬性值');
      return;
    }

    createValueMutation.mutate({
      attributeId: managingAttribute.id,
      body: { value: newValue.trim() }
    }, {
      onSuccess: () => {
        toast.success(`選項「${newValue}」已新增。`);
        setNewValue(''); // 清空輸入框
      },
      onError: (error) => {
        toast.error(`新增失敗：${error.message}`);
      }
    });
  };

  // 處理刪除屬性值
  const handleDeleteValue = (valueId: number) => {
    deleteValueMutation.mutate(valueId, {
      onSuccess: () => {
        toast.success('選項已刪除。');
      },
      onError: (error) => {
        toast.error(`刪除失敗：${error.message}`);
      }
    });
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">規格庫管理</h1>
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
                <DialogTitle>新增規格屬性</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Label htmlFor="name">屬性名稱</Label>
                <Input 
                  id="name" 
                  value={newAttributeName} 
                  onChange={(e) => setNewAttributeName(e.target.value)}
                  placeholder="例如：顏色、尺寸、材質"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateAttribute();
                    }
                  }}
                />
              </div>
              <DialogFooter>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewAttributeName('');
                  }}
                >
                  取消
                </Button>
                <Button 
                  onClick={handleCreateAttribute}
                  disabled={createAttributeMutation.isPending || !newAttributeName.trim()}
                >
                  {createAttributeMutation.isPending ? '儲存中...' : '儲存'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      
      <p className="text-muted-foreground mb-4">
        管理您商品的所有可選規格，例如「顏色」、「尺寸」或「材質」。
      </p>

      {/* 第二分隊：屬性列表將渲染在這裡 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {attributes.map((attribute: Attribute) => (
          <Card key={attribute.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{attribute.name}</CardTitle>
              {/* 第一分隊：操作選單 */}
              {user?.is_admin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>操作</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => handleEditClick(attribute)}>
                      <Edit className="mr-2 h-4 w-4" />
                      編輯名稱
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => handleDeleteClick(attribute)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      刪除屬性
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {/* 這裡將遍歷顯示該屬性的所有值 (AttributeValue) */}
                {attribute.values?.map((value) => (
                  <Badge key={value.id} variant="secondary">{value.value}</Badge>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              {/* 第二分隊：屬性值管理按鈕 */}
              {user?.is_admin && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    setManagingAttribute(attribute);
                    setIsValuesDialogOpen(true);
                  }}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  管理「{attribute.name}」的選項
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* 空狀態顯示 */}
      {attributes.length === 0 && (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <div className="mb-4">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <PlusCircle className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">尚未建立任何規格屬性</h3>
              <p className="text-muted-foreground mb-4">
                開始建立您的第一個商品規格屬性，例如「顏色」、「尺寸」等。
              </p>
              {user?.is_admin && (
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      建立第一個屬性
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>新增規格屬性</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Label htmlFor="name-empty">屬性名稱</Label>
                      <Input 
                        id="name-empty" 
                        value={newAttributeName} 
                        onChange={(e) => setNewAttributeName(e.target.value)}
                        placeholder="例如：顏色、尺寸、材質"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleCreateAttribute();
                          }
                        }}
                      />
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsCreateDialogOpen(false);
                          setNewAttributeName('');
                        }}
                      >
                        取消
                      </Button>
                      <Button 
                        onClick={handleCreateAttribute}
                        disabled={createAttributeMutation.isPending || !newAttributeName.trim()}
                      >
                        {createAttributeMutation.isPending ? '儲存中...' : '儲存'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 第二分隊：編輯屬性 Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>編輯屬性名稱</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Label htmlFor="edit-name">屬性名稱</Label>
            <Input 
              id="edit-name" 
              defaultValue={editingAttribute?.name}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateAttribute((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setEditingAttribute(null);
              }}
            >
              取消
            </Button>
            <Button 
              onClick={() => {
                const input = document.getElementById('edit-name') as HTMLInputElement;
                handleUpdateAttribute(input?.value || '');
              }}
              disabled={updateAttributeMutation.isPending}
            >
              {updateAttributeMutation.isPending ? '儲存中...' : '儲存變更'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 第二分隊：刪除屬性 AlertDialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除屬性嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              你正準備刪除屬性「{attributeToDelete?.name}」。此操作將同時刪除其下的所有屬性值，且無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleDeleteAttribute}
              disabled={deleteAttributeMutation.isPending}
            >
              {deleteAttributeMutation.isPending ? '刪除中...' : '確定刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 第二分隊：屬性值管理 Dialog */}
      <Dialog open={isValuesDialogOpen} onOpenChange={setIsValuesDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>管理「{managingAttribute?.name}」的選項</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {/* 顯示已有的值 */}
            <div className="space-y-2">
              <Label>已有選項</Label>
              <div className="flex flex-wrap gap-2">
                {managingAttribute?.values?.length === 0 && (
                  <p className="text-sm text-muted-foreground">尚未建立任何選項</p>
                )}
                {managingAttribute?.values?.map((value) => (
                  <div key={value.id} className="flex items-center gap-1 p-1 px-2 border rounded-md">
                    <span className="text-sm">{value.value}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={() => handleDeleteValue(value.id)}
                      disabled={deleteValueMutation.isPending}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 新增值的表單 */}
            <div className="space-y-2">
              <Label htmlFor="new-value">新增選項</Label>
              <div className="flex gap-2">
                <Input 
                  id="new-value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder="例如：紅色、XL、棉質"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
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
          <DialogFooter>
            <Button 
              variant="outline"
              onClick={() => {
                setIsValuesDialogOpen(false);
                setManagingAttribute(null);
                setNewValue('');
              }}
            >
              完成
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default withAuth(AttributesPage); 