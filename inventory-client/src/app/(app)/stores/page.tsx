"use client";

import React, { useState } from "react";
import { 
  Store as StoreIcon, 
  Edit, 
  Eye,
  Shield,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Settings,
  Loader2,
} from "lucide-react";
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
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import { formatDate } from "@/lib/dateHelpers";

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

  // 搜尋狀態管理
  const [searchQuery, setSearchQuery] = useState("");

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
  const allStores = storesResponse?.data || [];
  
  // 🔍 客戶端搜尋過濾功能
  const stores = React.useMemo(() => {
    if (!searchQuery.trim()) {
      return allStores;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return allStores.filter((store: Store) => {
      return (
        store.name?.toLowerCase().includes(query) ||
        store.address?.toLowerCase().includes(query) ||
        store.phone?.toLowerCase().includes(query)
      );
    });
  }, [allStores, searchQuery]);

  // 計算分店統計數據（使用真實 API 數據）
  const getStoreStats = () => {
    const totalStores = allStores.length;
    const activeStores = allStores.filter(store => store.status !== 'inactive').length;
    const totalInventory = allStores.reduce((sum, store) => sum + (store.inventory_count || 0), 0);
    const totalUsers = allStores.reduce((sum, store) => sum + (store.users_count || 0), 0);

    return {
      total: totalStores,
      active: activeStores,
      inventory: totalInventory,
      users: totalUsers,
    };
  };

  const stats = getStoreStats();

  // 計算百分比變化（模擬數據，未來可接入真實趨勢數據）
  const percentageChanges = {
    total: 5.2,
    active: 3.8,
    inventory: -2.1,
    users: 8.9,
  };

  /**
   * 處理查看分店詳情
   */
  const handleViewStore = (store: Store) => {
    modalManager.openModal('view', store);
  };

  // 分店動作定義
  const storeActions: StoreActions = {
    onView: handleViewStore,
    onEdit: handleEditStore,
    onDelete: handleDeleteStore,
  };

  // 創建表格欄位定義
  const columns = createStoresColumns(storeActions, isAdmin);

  // 檢查管理員權限 - 美化版權限不足頁面
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 dark:bg-destructive/20">
                <Shield className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                權限不足
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                您沒有權限訪問分店管理功能。請聯繫管理員以取得存取權限。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 📱 頁面標題區域 - 與用戶頁面一致的簡潔設計 */}
      <div>
        <h2 className="text-2xl font-bold">
          分店管理
        </h2>
        <p className="text-muted-foreground">
          管理系統中的所有分店資料和相關設定。
        </p>
      </div>

      {/* 🎯 統計卡片區域 - 與用戶頁面相同樣式 */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-2 gap-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              總分店數量
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.total}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                系統中所有分店
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.total}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              活躍分店
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.active}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                正在運營的分店
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.active}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              庫存總數
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.inventory.toLocaleString()}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                所有分店庫存總計
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingDown className="h-3 w-3 mr-1" />
                {percentageChanges.inventory}%
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card className="@container/card">
          <CardHeader className="space-y-1">
            <CardDescription className="text-xs">
              員工總數
            </CardDescription>
            <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-2xl">
              {isLoading ? "..." : stats.users}
            </CardTitle>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                分配到各分店的員工
              </p>
              <Badge variant="outline" className="text-xs h-5">
                <TrendingUp className="h-3 w-3 mr-1" />+
                {percentageChanges.users}%
              </Badge>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* 📊 分店資料表格區域 */}
      <div className="space-y-4">
        <StoresDataTable
          columns={columns}
          data={stores}
          isLoading={isLoading}
          showAddButton={isAdmin}
          onAddStore={handleAddStore}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* 🎨 新增分店對話框 - 美化版 */}
      <Dialog
        open={modalManager.isModalOpen('create')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <StoreIcon className="h-5 w-5" />
              </div>
              新增分店
            </DialogTitle>
            <DialogDescription className="text-base">
              填寫以下資訊以建立一個新的分店。所有標有 * 的欄位都是必填項目。
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          <div className="grid gap-6 py-4">
            {/* 基本資訊區塊 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                基本資訊
              </h4>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="store-name" className="text-sm font-medium">
                    分店名稱 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="store-name"
                    placeholder="請輸入分店名稱"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    disabled={createStoreMutation.isPending}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="store-address" className="text-sm font-medium">
                    分店地址
                  </Label>
                  <Input
                    id="store-address"
                    placeholder="請輸入分店地址（選填）"
                    value={newStoreAddress}
                    onChange={(e) => setNewStoreAddress(e.target.value)}
                    disabled={createStoreMutation.isPending}
                    className="h-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          <DialogFooter className="gap-2">
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
              className="bg-primary hover:bg-primary/90"
            >
              {createStoreMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  建立中...
                </>
              ) : (
                <>
                  <StoreIcon className="mr-2 h-4 w-4" />
                  建立分店
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🖊️ 編輯分店對話框 - 美化版 */}
      <Dialog
        open={modalManager.isModalOpen('edit')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Edit className="h-5 w-5" />
              </div>
              編輯分店
            </DialogTitle>
            <DialogDescription className="text-base">
              修改分店資訊。完成後將立即更新系統記錄。
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-4" />

          {modalManager.currentData && (
            <div className="grid gap-6 py-4">
              {/* 基本資訊區塊 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  基本資訊
                </h4>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-store-name" className="text-sm font-medium">
                      分店名稱 <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="edit-store-name"
                      placeholder="請輸入分店名稱"
                      value={editStoreName}
                      onChange={(e) => setEditStoreName(e.target.value)}
                      disabled={updateStoreMutation.isPending}
                      className="h-10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-store-address" className="text-sm font-medium">
                      分店地址
                    </Label>
                    <Input
                      id="edit-store-address"
                      placeholder="請輸入分店地址（選填）"
                      value={editStoreAddress}
                      onChange={(e) => setEditStoreAddress(e.target.value)}
                      disabled={updateStoreMutation.isPending}
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <DialogFooter className="gap-2">
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
              className="bg-accent hover:bg-accent/90"
            >
              {updateStoreMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  儲存變更
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🗑️ 刪除分店確認對話框 - 美化版 */}
      <AlertDialog
        open={modalManager.isModalOpen('delete')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              確定要刪除分店嗎？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {modalManager.currentData && (
                <>
                  您正準備刪除分店「<span className="font-semibold text-foreground">{modalManager.currentData.name}</span>」。
                  此操作將會移除該分店的所有相關庫存紀錄，且無法復原。請確認是否要繼續？
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => modalManager.closeModal()}
              disabled={deleteStoreMutation.isPending}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleConfirmDelete();
              }}
              disabled={deleteStoreMutation.isPending}
            >
              {deleteStoreMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  刪除中...
                </>
              ) : (
                "確定刪除"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 👁️ 查看分店詳情對話框 */}
      <Dialog
        open={modalManager.isModalOpen('view')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Eye className="h-5 w-5" />
              </div>
              分店詳情
            </DialogTitle>
          </DialogHeader>

          {modalManager.currentData && (
            <div className="space-y-6 mt-4">
              {/* 基本資訊 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">基本資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">分店名稱</Label>
                    <p className="text-sm font-medium">{modalManager.currentData.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">分店 ID</Label>
                    <p className="text-sm font-medium font-mono">#{modalManager.currentData.id}</p>
                  </div>
                </div>
                {modalManager.currentData.address && (
                  <div className="space-y-1 mt-4">
                    <Label className="text-xs text-muted-foreground">分店地址</Label>
                    <p className="text-sm font-medium">{modalManager.currentData.address}</p>
                  </div>
                )}
                {modalManager.currentData.phone && (
                  <div className="space-y-1 mt-4">
                    <Label className="text-xs text-muted-foreground">聯絡電話</Label>
                    <p className="text-sm font-medium">{modalManager.currentData.phone}</p>
                  </div>
                )}
              </div>

              <Separator />

              {/* 統計資訊 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">統計資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">庫存項目</Label>
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {modalManager.currentData.inventory_count?.toLocaleString() || '0'} 件
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">分配員工</Label>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {modalManager.currentData.users_count || '0'} 人
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 狀態資訊 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">狀態資訊</h3>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">營運狀態</Label>
                  <Badge variant={modalManager.currentData.status === 'active' ? 'default' : 'secondary'}>
                    {modalManager.currentData.status === 'active' ? '營運中' : 
                     modalManager.currentData.status === 'inactive' ? '暫停營運' : '未知狀態'}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* 時間資訊 */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground">時間資訊</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">建立時間</Label>
                    <p className="text-sm">{formatDate.fullDateTime(modalManager.currentData.created_at || '', '-')}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">最後更新</Label>
                    <p className="text-sm">{formatDate.fullDateTime(modalManager.currentData.updated_at || '', '-')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => modalManager.closeModal()}>
              關閉
            </Button>
            <Button onClick={() => {
              modalManager.closeModal();
              handleEditStore(modalManager.currentData as Store);
            }}>
              <Edit className="mr-2 h-4 w-4" />
              編輯分店
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
