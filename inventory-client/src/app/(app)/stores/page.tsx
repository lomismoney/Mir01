"use client";

import { useState } from "react";
import { Store as StoreIcon, Edit } from "lucide-react";
import {
  useStores,
  useCreateStore,
  useUpdateStore,
  useDeleteStore,
  useModalManager,
  useErrorHandler,
} from "@/hooks";
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

  // 🎯 統一的 Modal 管理器和錯誤處理
  const modalManager = useModalManager<Store>();
  const { handleError, handleSuccess } = useErrorHandler();

  // 表單狀態
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreAddress, setNewStoreAddress] = useState("");
  const [editStoreName, setEditStoreName] = useState("");
  const [editStoreAddress, setEditStoreAddress] = useState("");

  /**
   * 處理新增分店按鈕點擊
   */
  const handleAddStore = () => {
    modalManager.openModal('create');
  };

  /**
   * 處理提交新增分店表單
   */
  const handleCreateSubmit = () => {
    if (!newStoreName.trim()) {
      handleError(new Error("請輸入分店名稱"));
      return;
    }

    createStoreMutation.mutate(
      {
        name: newStoreName.trim(),
        address: newStoreAddress.trim() || undefined,
      },
      {
        onSuccess: () => {
          handleSuccess("分店新增成功");
          modalManager.closeModal();
          resetCreateForm();
        },
        onError: (error) => handleError(error),
      }
    );
  };

  /**
   * 處理編輯分店按鈕點擊
   */
  const handleEditStore = (store: Store) => {
    setEditStoreName(store.name);
    setEditStoreAddress(store.address || "");
    modalManager.openModal('edit', store);
  };

  /**
   * 處理提交編輯分店表單
   */
  const handleEditSubmit = () => {
    const editingStore = modalManager.currentData;
    if (!editingStore || !editStoreName.trim()) {
      handleError(new Error("請輸入分店名稱"));
      return;
    }

    updateStoreMutation.mutate(
      {
        id: editingStore.id,
        body: {
          name: editStoreName.trim(),
          address: editStoreAddress.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          handleSuccess("分店更新成功");
          modalManager.closeModal();
          resetEditForm();
        },
        onError: (error) => handleError(error),
      }
    );
  };

  /**
   * 處理刪除分店按鈕點擊
   */
  const handleDeleteStore = (store: Store) => {
    modalManager.openModal('delete', store);
  };

  /**
   * 處理確認刪除分店
   */
  const handleConfirmDelete = () => {
    const storeToDelete = modalManager.currentData;
    if (!storeToDelete) return;

    deleteStoreMutation.mutate(storeToDelete.id, {
      onSuccess: () => {
        handleSuccess("分店刪除成功");
        modalManager.closeModal();
      },
      onError: (error) => handleError(error),
    });
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
          <h1
            className="text-3xl font-bold text-gray-900 dark:text-white"
           
          >
            分店管理
          </h1>
          <p
            className="text-gray-600 dark:text-gray-300 mt-2"
           
          >
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
      <Dialog
        open={modalManager.isModalOpen('create')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
       
      >
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
              <Label htmlFor="store-name">
                分店名稱 *
              </Label>
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
              <Label htmlFor="store-address">
                分店地址
              </Label>
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
                modalManager.closeModal();
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
      <Dialog
        open={modalManager.isModalOpen('edit')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
       
      >
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

          {modalManager.currentData && (
            <div className="py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-store-name">
                  分店名稱 *
                </Label>
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
                <Label htmlFor="edit-store-address">
                  分店地址
                </Label>
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
                modalManager.closeModal();
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
        open={modalManager.isModalOpen('delete')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
       
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              確認刪除分店？
            </AlertDialogTitle>
            <AlertDialogDescription>
              {modalManager.currentData && (
                <>
                  您即將刪除「{modalManager.currentData.name}
                  」分店。此操作將會移除該分店的所有相關庫存紀錄，且無法復原。請確認是否要繼續？
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
              {deleteStoreMutation.isPending ? "處理中..." : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
