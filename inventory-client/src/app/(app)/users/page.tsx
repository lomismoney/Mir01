"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardAction,
  CardFooter 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Plus, 
  UserCheck, 
  Shield, 
  Users, 
  Crown, 
  Store, 
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
  Settings,
  UserPlus,
  CheckCircle
} from "lucide-react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useModalManager,
  useErrorHandler,
} from "@/hooks";
import { useSession } from "next-auth/react";
import { UsersDataTable } from "@/components/users/users-data-table";
import { createUsersColumns } from "@/components/users/users-columns";
import { UserItem } from "@/types/api-helpers";
import { UserActions } from "@/components/users/users-columns";
import { UserStoresDialog } from "@/components/users/user-stores-dialog";
import { RoleSelector } from "@/components/users/role-selector";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 用戶管理頁面（美化版）
 *
 * 重新設計的用戶管理頁面，具有以下特色：
 * 1. 現代化的頁面佈局和視覺設計
 * 2. 統計卡片展示用戶數據概覽
 * 3. 優化的表格設計和互動體驗
 * 4. 美觀的對話框和表單設計
 * 5. 響應式設計和微互動效果
 *
 * 安全特性：
 * - 雙重認證檢查：用戶登入 + 管理員權限
 * - 伺服器端身份驗證，未認證用戶無法取得頁面內容
 * - 使用 Next.js redirect() 進行伺服器端重定向
 * - 完全杜絕「偷看」問題，提供企業級安全性
 *
 * 架構設計：
 * - 伺服器元件處理認證和權限檢查
 * - 客戶端元件處理複雜的互動邏輯
 * - 保持 SEO 友好的伺服器端渲染
 */
export default function UsersPage() {
  const { data: session } = useSession();
  const user = session?.user; // 獲取當前用戶資訊以判斷權限

  // 搜索狀態管理
  const [searchQuery, setSearchQuery] = useState("");

  // 使用搜索功能的 useUsers hook（類型安全版本）
  const {
    data: usersResponse,
    isLoading,
    error,
  } = useUsers(searchQuery ? { "filter[search]": searchQuery } : undefined);

  const usersData = usersResponse?.data || [];
  const meta = usersResponse?.meta;

  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  // 🎯 統一的 Modal 管理器和錯誤處理
  const modalManager = useModalManager<UserItem>();
  const { handleError, handleSuccess } = useErrorHandler();

  // 新用戶表單狀態
  const [newUserName, setNewUserName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRoles, setNewRoles] = useState<string[]>([]); // 多角色支持

  // 編輯用戶狀態
  const [editUserName, setEditUserName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]); // 多角色支持

  // 使用 useUpdateUser hook（重構版，不需要預先提供 userId）
  const updateUserMutation = useUpdateUser();

  // 用戶分店管理狀態（整合到 modalManager）
  const queryClient = useQueryClient();

  // 處理分店管理按鈕點擊
  const handleManageUserStores = (user: UserItem) => {
    modalManager.openModal('stores', user);
  };

  // 計算用戶統計數據
  const getUserStats = () => {
    const totalUsers = usersData.length;
    const roleStats = usersData.reduce((acc, user) => {
      const roles = (user as any).roles || [];
      roles.forEach((role: string) => {
        acc[role] = (acc[role] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    return {
      total: totalUsers,
      admins: roleStats.admin || 0,
      staff: roleStats.staff || 0,
      viewers: roleStats.viewer || 0,
      installers: roleStats.installer || 0,
    };
  };

  const stats = getUserStats();

  /**
   * 處理創建新用戶的函式
   *
   * 功能說明：
   * 1. 驗證表單輸入
   * 2. 調用 useCreateUser mutation
   * 3. 處理成功和錯誤回饋
   * 4. 重置表單狀態
   */
  const handleCreateUser = () => {
    // 基本驗證
    if (!newUserName.trim() || !newUsername.trim() || !newPassword.trim() || !newUserEmail.trim()) {
      handleError(new Error("請填寫所有必填欄位"));
      return;
    }

    // 密碼長度驗證
    if (newPassword.length < 8) {
      handleError(new Error("密碼至少需要 8 個字元"));
      return;
    }

    // 角色驗證
    if (newRoles.length === 0) {
      handleError(new Error("請至少選擇一個角色"));
      return;
    }

    createUserMutation.mutate(
      {
        name: newUserName,
        username: newUsername,
        password: newPassword,
        password_confirmation: newPassword,  // ✅ 新增確認密碼字段
        roles: newRoles as ("admin" | "staff" | "viewer" | "installer")[],
        role: newRoles[0] || "viewer", // API 要求的單一 role 字段
      },
      {
        onSuccess: () => {
          handleSuccess("用戶建立成功！");
          modalManager.closeModal();
          resetForm();
        },
        onError: (error) => handleError(error),
      },
    );
  };

  /**
   * 處理新增用戶按鈕點擊
   */
  const handleAddUser = () => {
    modalManager.openModal('create');
  };

  /**
   * 處理編輯用戶
   */
  const handleEditUser = (userToEdit: UserItem) => {
    setEditUserName(userToEdit.name || "");
    setEditUsername(userToEdit.username || "");
    setEditUserEmail(userToEdit.email || "");
    setEditPassword(""); // 密碼留空，表示不更改
    setEditRoles((userToEdit.roles || []) as ("admin" | "staff" | "viewer" | "installer")[]);
    modalManager.openModal('edit', userToEdit);
  };

  /**
   * 處理更新用戶的函式
   */
  const handleUpdateUser = () => {
    const editingUser = modalManager.currentData;
    if (!editingUser?.id) {
      handleError(new Error("無效的用戶 ID"));
      return;
    }

    // 基本驗證
    if (!editUserName.trim() || !editUsername.trim()) {
      handleError(new Error("請填寫所有必填欄位"));
      return;
    }

    // 角色驗證
    if (editRoles.length === 0) {
      handleError(new Error("請至少選擇一個角色"));
      return;
    }

    // 構建更新資料 - 條件性包含密碼欄位
    const updatePayload: any = {
      name: editUserName,
      username: editUsername,
      email: editUserEmail,
      roles: editRoles as ("admin" | "staff" | "viewer" | "installer")[],
    };

    // 只有當用戶輸入新密碼時，才包含密碼欄位
    if (editPassword.trim()) {
      updatePayload.password = editPassword;
      updatePayload.password_confirmation = editPassword;  // ✅ 新增確認密碼字段
    }

    updateUserMutation.mutate(
      {
        id: editingUser.id,
        body: updatePayload,
      },
      {
        onSuccess: () => {
          handleSuccess("用戶更新成功！");
          modalManager.closeModal();
          resetEditForm();
        },
        onError: (error) => handleError(error),
      },
    );
  };

  /**
   * 處理刪除用戶按鈕點擊
   */
  const handleDeleteUser = (userToDelete: UserItem) => {
    modalManager.openModal('delete', userToDelete);
  };

  /**
   * 確認刪除用戶
   */
  const handleConfirmDelete = () => {
    const userToDelete = modalManager.currentData;
    if (!userToDelete?.id) {
      handleError(new Error("無效的用戶 ID"));
      return;
    }

    deleteUserMutation.mutate(
      userToDelete.id,
      {
        onSuccess: () => {
          handleSuccess("用戶刪除成功！");
          modalManager.closeModal();
        },
        onError: (error) => handleError(error),
      },
    );
  };

  /**
   * 重置表單狀態
   */
  const resetForm = () => {
    setNewUserName("");
    setNewUsername("");
    setNewUserEmail("");
    setNewPassword("");
    setNewRoles([]);
  };

  /**
   * 重置編輯表單狀態
   */
  const resetEditForm = () => {
    setEditUserName("");
    setEditUsername("");
    setEditUserEmail("");
    setEditPassword("");
    setEditRoles([]);
  };

  /**
   * 處理對話框關閉事件
   */
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      modalManager.closeModal();
      resetForm(); // 關閉時重置表單
    }
  };

  /**
   * 處理編輯對話框關閉事件
   */
  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      modalManager.closeModal();
      resetEditForm(); // 關閉時重置編輯表單
    }
  };

  // 用戶動作定義（符合新的 UserActions 介面）
  const userActions: UserActions = {
    onView: (user: UserItem) => {
      handleSuccess(`查看用戶：${user.name}`);
    },
    onEdit: handleEditUser,
    onDelete: handleDeleteUser,
    onManageStores: handleManageUserStores,
  };

  // 創建表格欄位定義
  const columns = createUsersColumns(userActions);

  // 檢查管理員權限 - 使用 useAuth hook 來檢查權限
  if (!user?.isAdmin) {
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
                您沒有權限訪問用戶管理功能。請聯繫管理員以取得存取權限。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 只有已登入且為管理員的用戶才會執行到這裡
  return (
    <div className="space-y-6">
      {/* 📱 頁面標題區域 - 與客戶頁面一致的簡潔設計 */}
      <div>
        <h2 className="text-2xl font-bold">
          用戶管理
        </h2>
        <p className="text-muted-foreground">
          管理系統中的所有用戶帳號和權限設定。
        </p>
      </div>

      {/* 🎯 統計卡片區域 - 數據概覽（與儀表板統一風格） */}
      <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4">
        <Card className="@container/card">
          <CardHeader>
            <CardDescription>總用戶數量</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? "..." : stats.total}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp />
                系統用戶
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              平台用戶管理 <Users className="size-4" />
            </div>
            <div className="text-muted-foreground">
              {isLoading ? "載入中..." : `系統內共有 ${stats.total} 位註冊用戶`}
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>管理員用戶</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? "..." : stats.admins}
            </CardTitle>
            <CardAction>
              <Badge variant="destructive">
                <Crown />
                最高權限
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              完整系統控制 <Shield className="size-4" />
            </div>
            <div className="text-muted-foreground">
              具有系統完整管理權限
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>員工用戶</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? "..." : stats.staff}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <TrendingUp />
                日常操作
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              業務操作人員 <Store className="size-4" />
            </div>
            <div className="text-muted-foreground">
              負責日常庫存管理作業
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card">
          <CardHeader>
            <CardDescription>檢視者</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {isLoading ? "..." : stats.viewers}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <CheckCircle />
                只讀權限
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              資料檢視 <Eye className="size-4" />
            </div>
            <div className="text-muted-foreground">
              僅具備資料查看權限
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 📊 用戶資料表格區域 */}
      <UsersDataTable
        columns={columns}
        data={usersData}
        isLoading={isLoading}
        showAddButton={true} // 與客戶頁面一致，在表格工具欄顯示新增按鈕
        onAddUser={handleAddUser}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* 🎨 新增用戶對話框 - 美化版 */}
      <Dialog
        open={modalManager.isModalOpen('create')}
        onOpenChange={handleDialogClose}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <UserCheck className="h-5 w-5" />
              </div>
              建立新用戶
            </DialogTitle>
            <DialogDescription className="text-base">
              填寫以下資訊以建立一個新的使用者帳號。所有標有 * 的欄位都是必填項目。
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    姓名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="請輸入用戶姓名"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    disabled={createUserMutation.isPending}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    用戶名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="username"
                    placeholder="請輸入用戶名"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    disabled={createUserMutation.isPending}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  電子郵件 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="請輸入電子郵件地址"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  disabled={createUserMutation.isPending}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  密碼 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="請輸入密碼（至少8個字元）"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={createUserMutation.isPending}
                  className="h-10"
                />
              </div>
            </div>

            <Separator />

            {/* 權限設定區塊 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                權限設定
              </h4>
              
              <RoleSelector
                selectedRoles={newRoles}
                onRolesChange={setNewRoles}
                disabled={createUserMutation.isPending}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => modalManager.closeModal()}
              disabled={createUserMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  建立中...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  建立用戶
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🖊️ 編輯用戶對話框 - 美化版 */}
      <Dialog
        open={modalManager.isModalOpen('edit')}
        onOpenChange={handleEditDialogClose}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Edit className="h-5 w-5" />
              </div>
              編輯用戶
            </DialogTitle>
            <DialogDescription className="text-base">
              修改用戶資訊。密碼欄位留空表示不更改密碼。
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-sm font-medium">
                    姓名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="請輸入用戶姓名"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    disabled={updateUserMutation.isPending}
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-username" className="text-sm font-medium">
                    用戶名 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit-username"
                    placeholder="請輸入用戶名"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    disabled={updateUserMutation.isPending}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email" className="text-sm font-medium">
                  電子郵件 <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="請輸入電子郵件地址"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  disabled={updateUserMutation.isPending}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password" className="text-sm font-medium">
                  密碼 <span className="text-muted-foreground">(留空表示不更改)</span>
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="請輸入新密碼（至少8個字元）"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  disabled={updateUserMutation.isPending}
                  className="h-10"
                />
              </div>
            </div>

            <Separator />

            {/* 權限設定區塊 */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-foreground flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                權限設定
              </h4>
              
              <RoleSelector
                selectedRoles={editRoles}
                onRolesChange={setEditRoles}
                disabled={updateUserMutation.isPending}
              />
            </div>
          </div>

          <Separator className="my-4" />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => modalManager.closeModal()}
              disabled={updateUserMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
              className="bg-accent hover:bg-accent/90"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  更新用戶
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🗑️ 刪除確認對話框 - 美化版 */}
      <AlertDialog
        open={modalManager.isModalOpen('delete')}
        onOpenChange={(isOpen) => !isOpen && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              確定要刪除用戶嗎？
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              您正準備刪除用戶「<span className="font-semibold text-foreground">{modalManager.currentData?.name}</span>」。
              此操作無法復原，該用戶的所有資料都將永久刪除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel
              onClick={() => modalManager.closeModal()}
              disabled={deleteUserMutation.isPending}
            >
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleConfirmDelete}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? (
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

      {/* 🏪 用戶分店管理對話框 */}
      {modalManager.currentData && modalManager.isModalOpen('stores') && (
        <UserStoresDialog
          userId={modalManager.currentData.id as number}
          userName={modalManager.currentData.name as string}
          open={modalManager.isModalOpen('stores')}
          onOpenChange={(open) => !open && modalManager.closeModal()}
        />
      )}
    </div>
  );
}
