"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Store as StoreIcon, PlusSquare, Edit, Trash } from "lucide-react";
import {
  useStores,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
} from "@/hooks/queries/useEntityQueries";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  createStoresColumns,
  StoreActions,
} from "@/components/stores/stores-columns";
import { StoresDataTable } from "@/components/stores/stores-data-table";

// Store 類型定義
type Store = {
  id: number;
  name: string;
  address: string | null;
  phone?: string | null;
  status?: string;
  created_at: string;
  updated_at: string;
  inventory_count?: number;
  users_count?: number;
};

/**
 * 分店管理頁面
 *
 * 使用與用戶管理相同的 DataTable 架構，提供統一的使用體驗
 */
export default function StoresPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const isAdmin = user?.isAdmin || false;

  // API Hooks
  const { data: storesResponse, isLoading } = useStores();
  const createStoreMutation = useCreateStore();
  const updateStoreMutation = useUpdateStore();
  const deleteStoreMutation = useDeleteStore();

  // 對話框狀態
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // 表單狀態
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreAddress, setEditStoreAddress] = useState("");
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
      toast.error("請輸入分店名稱");
      return;
    }

    try {
      await createStoreMutation.mutateAsync({
        name: newStoreName.trim(),
        address: newStoreAddress.trim() || undefined,
      });

      toast.success("分店新增成功");
      setIsCreateDialogOpen(false);
      resetCreateForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "新增失敗";
      toast.error(`新增失敗: ${errorMessage}`);
    }
  };

  /**
   * 處理編輯分店按鈕點擊
   */
  const handleEditStore = (store: Store) => {
    setEditingStore(store);
    setEditStoreName(store.name);
    setEditStoreAddress(store.address || "");
    setIsEditDialogOpen(true);
  };

  /**
   * 處理提交編輯分店表單
   */
  const handleEditSubmit = async () => {
    if (!editingStore || !editStoreName.trim()) {
      toast.error("請輸入分店名稱");
      return;
    }

    try {
      await updateStoreMutation.mutateAsync({
        id: editingStore.id,
        data: {
          name: editStoreName.trim(),
          address: editStoreAddress.trim() || undefined,
        },
      });

      toast.success("分店更新成功");
      setIsEditDialogOpen(false);
      resetEditForm();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "更新失敗";
      toast.error(`更新失敗: ${errorMessage}`);
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
      toast.success("分店刪除成功");
      setIsDeleteDialogOpen(false);
      setStoreToDelete(null);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "刪除失敗";
      toast.error(`刪除失敗: ${errorMessage}`);
    }
  };

  /**
   * 重置新增分店表單
   */
  const resetCreateForm = () => {
    setNewStoreName("");
    setNewStoreAddress("");
  };

  /**
   * 重置編輯分店表單
   */
  const resetEditForm = () => {
    setEditingStore(null);
    setEditStoreName("");
    setEditStoreAddress("");
  };

  // 從響應中提取 stores 數據
  const stores = storesResponse?.data || [];

  // 分店動作定義
  const storeActions: StoreActions = {
    onEdit: handleEditStore,
    onDelete: handleDeleteStore,
  };

  // 創建表格欄位定義
  const columns = createStoresColumns(storeActions, isAdmin);

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            分店管理
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            管理系統中的分店資料
          </p>
        </div>
      </div>

      {/* 分店資料表格 */}
      <div className="space-y-4">
        <StoresDataTable
          columns={columns}
          data={stores}
          isLoading={isLoading}
          showAddButton={isAdmin}
          onAddStore={handleAddStore}
        />
      </div>

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

          <DialogFooter>
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
              {createStoreMutation.isPending ? "處理中..." : "確定新增"}
            </Button>
          </DialogFooter>
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

          <DialogFooter>
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
              {updateStoreMutation.isPending ? "處理中..." : "儲存變更"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除分店確認對話框 */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除分店？</AlertDialogTitle>
            <AlertDialogDescription>
              {storeToDelete && (
                <>
                  您即將刪除「{storeToDelete.name}
                  」分店。此操作將會移除該分店的所有相關庫存紀錄，且無法復原。請確認是否要繼續？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteStoreMutation.isPending}>
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
              {deleteStoreMutation.isPending ? "處理中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
