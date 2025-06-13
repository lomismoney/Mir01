"use client";

import { useState } from "react";
import { toast } from "sonner";
import { 
  Store as StoreIcon, 
  PlusSquare, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash
} from "lucide-react";
import { useStore, useStores, useCreateStore, useUpdateStore, useDeleteStore, Store } from "@/hooks/useStores";
import { useAuth } from "@/contexts/AuthContext";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

/**
 * 分店管理頁面
 */
export default function StoresPage() {
  const { user } = useAuth();
  const isAdmin = user?.is_admin || false;
  
  // API Hooks
  const { data: storesData, isLoading } = useStores();
  const createStoreMutation = useCreateStore();
  const updateStoreMutation = useUpdateStore();
  const deleteStoreMutation = useDeleteStore();
  
  // 對話框狀態
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // 表單狀態
  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreAddress, setNewStoreAddress] = useState('');
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editStoreName, setEditStoreName] = useState('');
  const [editStoreAddress, setEditStoreAddress] = useState('');
  const [storeToDelete, setStoreToDelete] = useState<Store | null>(null);
  
  /**
   * 處理新增分店按鈕點擊
   */
  const handleAddStore = () => {
    setIsCreateDialogOpen(true);
  };
  
  /**
   * 處理提交新增分店表單
   */
  const handleCreateSubmit = async () => {
    if (!newStoreName.trim()) {
      toast.error('請輸入分店名稱');
      return;
    }
    
    try {
      await createStoreMutation.mutateAsync({
        name: newStoreName.trim(),
        address: newStoreAddress.trim() || null
      });
      
      toast.success('分店新增成功');
      setIsCreateDialogOpen(false);
      resetCreateForm();
    } catch (error: any) {
      toast.error(`新增失敗: ${error.message}`);
    }
  };
  
  /**
   * 處理編輯分店按鈕點擊
   */
  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setEditStoreName(store.name);
    setEditStoreAddress(store.address || '');
    setIsEditDialogOpen(true);
  };
  
  /**
   * 處理提交編輯分店表單
   */
  const handleEditSubmit = async () => {
    if (!editingStore || !editStoreName.trim()) {
      toast.error('請輸入分店名稱');
      return;
    }
    
    try {
      await updateStoreMutation.mutateAsync({
        id: editingStore.id,
        name: editStoreName.trim(),
        address: editStoreAddress.trim() || null
      });
      
      toast.success('分店更新成功');
      setIsEditDialogOpen(false);
      resetEditForm();
    } catch (error: any) {
      toast.error(`更新失敗: ${error.message}`);
    }
  };
  
  /**
   * 處理刪除分店按鈕點擊
   */
  const handleDeleteStore = (store: Store) => {
    setStoreToDelete(store);
    setIsDeleteDialogOpen(true);
  };
  
  /**
   * 處理確認刪除分店
   */
  const handleConfirmDelete = async () => {
    if (!storeToDelete) return;
    
    try {
      await deleteStoreMutation.mutateAsync(storeToDelete.id);
      toast.success('分店刪除成功');
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      toast.error(`刪除失敗: ${error.message}`);
    }
  };
  
  /**
   * 重置新增分店表單
   */
  const resetCreateForm = () => {
    setNewStoreName('');
    setNewStoreAddress('');
  };
  
  /**
   * 重置編輯分店表單
   */
  const resetEditForm = () => {
    setEditingStore(null);
    setEditStoreName('');
    setEditStoreAddress('');
  };
  
  // 處理載入狀態和錯誤
  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <p>載入中...</p>
        </div>
      </div>
    );
  }
  
  // 確保stores是一個數組
  const stores = storesData?.data ?? [];
  
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">分店管理</h1>
          <p className="text-gray-600 mt-2">管理系統中的分店資料</p>
        </div>
        
        {isAdmin && (
          <Button onClick={handleAddStore}>
            <PlusSquare className="mr-2 h-4 w-4" />
            新增分店
          </Button>
        )}
      </div>
      
      {/* 分店列表 */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>名稱</TableHead>
                <TableHead className="max-w-[300px]">地址</TableHead>
                <TableHead>建立時間</TableHead>
                {isAdmin && <TableHead className="w-[80px] text-right">操作</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.isArray(stores) && stores.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8 text-gray-500">
                    尚無分店資料
                  </TableCell>
                </TableRow>
              ) : (
                Array.isArray(stores) && stores.map((store: Store) => (
                  <TableRow key={store.id}>
                    <TableCell>{store.id}</TableCell>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="max-w-[300px] truncate">{store.address || '-'}</TableCell>
                    <TableCell>
                      {new Date(store.created_at).toLocaleDateString('zh-TW')}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStore(store)}>
                              <Edit className="mr-2 h-4 w-4" />
                              編輯
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteStore(store)}>
                              <Trash className="mr-2 h-4 w-4" />
                              刪除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* 新增分店對話框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <StoreIcon className="w-5 h-5" />
              新增分店
            </DialogTitle>
            <DialogDescription>
              填寫以下資料以新增分店，建立完成後將可在庫存管理中使用。
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="store-name">分店名稱 *</Label>
              <Input
                id="store-name"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="輸入分店名稱"
                disabled={createStoreMutation.isPending}
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="store-address">分店地址</Label>
              <Input
                id="store-address"
                value={newStoreAddress}
                onChange={(e) => setNewStoreAddress(e.target.value)}
                placeholder="輸入分店地址（選填）"
                disabled={createStoreMutation.isPending}
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetCreateForm();
              }}
              disabled={createStoreMutation.isPending}
            >
              取消
            </Button>
            <Button 
              onClick={handleCreateSubmit}
              disabled={!newStoreName.trim() || createStoreMutation.isPending}
            >
              {createStoreMutation.isPending ? '處理中...' : '確定新增'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 編輯分店對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              編輯分店
            </DialogTitle>
            <DialogDescription>
              編輯分店資料，完成後將立即更新系統紀錄。
            </DialogDescription>
          </DialogHeader>
          
          {editingStore && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-store-name">分店名稱 *</Label>
                <Input
                  id="edit-store-name"
                  value={editStoreName}
                  onChange={(e) => setEditStoreName(e.target.value)}
                  placeholder="輸入分店名稱"
                  disabled={updateStoreMutation.isPending}
                  autoComplete="off"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-store-address">分店地址</Label>
                <Input
                  id="edit-store-address"
                  value={editStoreAddress}
                  onChange={(e) => setEditStoreAddress(e.target.value)}
                  placeholder="輸入分店地址（選填）"
                  disabled={updateStoreMutation.isPending}
                  autoComplete="off"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                resetEditForm();
              }}
              disabled={updateStoreMutation.isPending}
            >
              取消
            </Button>
            <Button 
              onClick={handleEditSubmit}
              disabled={!editStoreName.trim() || updateStoreMutation.isPending}
            >
              {updateStoreMutation.isPending ? '處理中...' : '儲存變更'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* 刪除分店確認對話框 */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除分店？</AlertDialogTitle>
            <AlertDialogDescription>
              {storeToDelete && (
                <>
                  您即將刪除「{storeToDelete.name}」分店。此操作將會移除該分店的所有相關庫存紀錄，且無法復原。請確認是否要繼續？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={deleteStoreMutation.isPending}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleteStoreMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteStoreMutation.isPending ? '處理中...' : '確認刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 