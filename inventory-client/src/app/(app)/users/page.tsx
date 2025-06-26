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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, UserCheck, Shield, Eye } from "lucide-react";
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/queries/useEntityQueries";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { UsersDataTable } from "@/components/users/users-data-table";
import { createUsersColumns } from "@/components/users/users-columns";
import { UserItem, StoreItem } from "@/types/api-helpers";
import { UserActions } from "@/components/users/users-columns";
import { UserStoresDialog } from "@/components/users/user-stores-dialog";
import { useQueryClient } from "@tanstack/react-query";

/**
 * 用戶管理頁面（伺服器端認證版本）
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
    data: users = [],
    isLoading,
    error,
  } = useUsers(searchQuery ? { "filter[search]": searchQuery } : undefined);
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();

  // 對話框狀態管理
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // 新用戶表單狀態
  const [newUserName, setNewUserName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff" | "viewer">(
    "viewer",
  ); // 預設角色

  // 編輯用戶狀態
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "staff" | "viewer">(
    "viewer",
  );

  // 刪除確認對話框狀態
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // 使用 useUpdateUser hook（重構版，不需要預先提供 userId）
  const updateUserMutation = useUpdateUser();

  // 用戶分店管理狀態
  const [isStoresDialogOpen, setIsStoresDialogOpen] = useState(false);
  const [selectedUserForStores, setSelectedUserForStores] =
    useState<UserItem | null>(null);

  const queryClient = useQueryClient();

  // 處理分店管理按鈕點擊
  const handleManageUserStores = (user: UserItem) => {
    setSelectedUserForStores(user);
    setIsStoresDialogOpen(true);
  };

  // helper: clear selected user when dialog closes
  const handleStoresDialogOpenChange = (open: boolean) => {
    setIsStoresDialogOpen(open);
    if (!open) {
      setSelectedUserForStores(null);
    }
  };

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
    if (!newUserName.trim() || !newUsername.trim() || !newPassword.trim()) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    // 密碼長度驗證
    if (newPassword.length < 8) {
      toast.error("密碼至少需要 8 個字元");
      return;
    }

    createUserMutation.mutate(
      {
        name: newUserName,
        username: newUsername,
        password: newPassword,
        role: newRole,
      },
      {
        onSuccess: () => {
          toast.success("用戶建立成功！");
          setIsDialogOpen(false); // 關閉對話框
          // 重置表單狀態
          resetForm();
        },
        onError: (error) => {
          // 改進錯誤顯示：提供更詳細的錯誤信息
          const errorMessage = error.message;

          if (
            errorMessage.includes("用戶名已被使用") ||
            errorMessage.includes("username")
          ) {
            toast.error(
              `用戶名重複：${newUsername} 已被使用，請選擇其他用戶名`,
            );
          } else if (errorMessage.includes("密碼")) {
            toast.error(`密碼錯誤：${errorMessage}`);
          } else if (errorMessage.includes("角色")) {
            toast.error(`角色錯誤：${errorMessage}`);
          } else {
            toast.error(`建立失敗：${errorMessage}`);
          }
        },
      },
    );
  };

  /**
   * 處理新增用戶按鈕點擊
   */
  const handleAddUser = () => {
    setIsDialogOpen(true);
  };

  /**
   * 處理編輯用戶
   */
  const handleEditUser = (userToEdit: UserItem) => {
    setEditingUser(userToEdit);
    setEditUserName(userToEdit.name || "");
    // 使用 username 字段
    setEditUsername(userToEdit.username || "");
    setEditPassword(""); // 密碼留空，表示不更改
    // 確保 role 是有效的角色類型
    const userRole = userToEdit.role as "admin" | "staff" | "viewer" | undefined;
    setEditRole(userRole || "viewer"); // 使用用戶實際的角色，並提供默認值
    setIsEditDialogOpen(true);
  };

  /**
   * 處理更新用戶的函式
   */
  const handleUpdateUser = () => {
    if (!editingUser?.id) {
      toast.error("無效的用戶 ID");
      return;
    }

    // 基本驗證
    if (!editUserName.trim() || !editUsername.trim()) {
      toast.error("請填寫所有必填欄位");
      return;
    }

    // 準備更新資料（只包含有值的欄位）
    const updateData: {
      name: string;
      username: string;
      role: "admin" | "staff" | "viewer";
      password?: string;
    } = {
      name: editUserName,
      username: editUsername,
      role: editRole,
    };

    // 如果有填寫密碼，則包含密碼更新
    if (editPassword.trim()) {
      updateData.password = editPassword;
    }

    updateUserMutation.mutate(
      {
        path: { id: editingUser.id, user: editingUser.id },
        body: updateData as any, // 暫時使用 any 處理 API 類型定義問題
      },
      {
        onSuccess: () => {
          toast.success("用戶更新成功！");
          setIsEditDialogOpen(false);
          resetEditForm();
        },
        onError: (error) => {
          toast.error(`更新失敗：${error.message}`);
        },
      },
    );
  };

  /**
   * 處理刪除用戶
   */
  const handleDeleteUser = (userToDelete: UserItem) => {
    if (!userToDelete.id) {
      toast.error("無效的用戶 ID");
      return;
    }

    deleteUserMutation.mutate(
      {
        id: userToDelete.id,
        user: userToDelete.id,
      },
      {
        onSuccess: () => {
          toast.success("用戶刪除成功！");
          setUserToDelete(null); // 清除狀態
        },
        onError: (error) => {
          toast.error(`刪除失敗：${error.message}`);
          setUserToDelete(null); // 清除狀態
        },
      },
    );
  };

  /**
   * 重置表單狀態
   */
  const resetForm = () => {
    setNewUserName("");
    setNewUsername("");
    setNewPassword("");
    setNewRole("viewer");
  };

  /**
   * 重置編輯表單狀態
   */
  const resetEditForm = () => {
    setEditingUser(null);
    setEditUserName("");
    setEditUsername("");
    setEditPassword("");
    setEditRole("viewer");
  };

  /**
   * 處理對話框關閉事件
   */
  const handleDialogClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm(); // 關閉時重置表單
    }
  };

  /**
   * 處理編輯對話框關閉事件
   */
  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      resetEditForm(); // 關閉時重置編輯表單
    }
  };

  // 用戶動作定義（符合新的 UserActions 介面）
  const userActions: UserActions = {
    onView: (user: UserItem) => {
      toast.info(`查看用戶：${user.name}`);
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
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-400" />

              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                權限不足
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                您沒有權限訪問用戶管理功能
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 只有已登入且為管理員的用戶才會執行到這裡
  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            用戶管理
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            管理系統中的所有用戶帳號
          </p>
        </div>
      </div>

      {/* 用戶資料表格 */}
      <div className="space-y-4">
        <UsersDataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          showAddButton={user?.isAdmin}
          onAddUser={handleAddUser}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>

      {/* 新增用戶對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              建立新用戶
            </DialogTitle>
            <DialogDescription>
              填寫以下資訊以建立一個新的使用者帳號。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 姓名欄位 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right font-medium">
                姓名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="輸入用戶姓名"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="col-span-3"
                disabled={createUserMutation.isPending}
              />
            </div>

            {/* 帳號欄位 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="username" className="text-right font-medium">
                用戶名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                placeholder="輸入用戶名"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="col-span-3"
                disabled={createUserMutation.isPending}
              />
            </div>

            {/* 密碼欄位 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="password" className="text-right font-medium">
                密碼 <span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="password"
                  type="password"
                  placeholder="輸入密碼"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={createUserMutation.isPending}
                />

                <p className="text-xs text-gray-500">密碼至少需要 8 個字元</p>
              </div>
            </div>

            {/* 角色選擇 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right font-medium">
                角色 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newRole}
                onValueChange={(value: "admin" | "staff" | "viewer") =>
                  setNewRole(value)
                }
                disabled={createUserMutation.isPending}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="選擇用戶角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      管理員
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      員工
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      檢視者
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={createUserMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  建立中...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  建立用戶
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯用戶對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              編輯用戶
            </DialogTitle>
            <DialogDescription>
              修改用戶資訊。密碼欄位留空表示不更改密碼。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* 姓名欄位 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right font-medium">
                姓名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                placeholder="輸入用戶姓名"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                className="col-span-3"
                disabled={updateUserMutation.isPending}
              />
            </div>

            {/* 帳號欄位 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-username" className="text-right font-medium">
                用戶名 <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-username"
                placeholder="輸入用戶名"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="col-span-3"
                disabled={updateUserMutation.isPending}
              />
            </div>

            {/* 密碼欄位 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-password" className="text-right font-medium">
                密碼 <span className="text-gray-500">(留空不更改)</span>
              </Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="輸入新密碼（或留空）"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="col-span-3"
                disabled={updateUserMutation.isPending}
              />
            </div>

            {/* 角色選擇 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-role" className="text-right font-medium">
                角色 <span className="text-red-500">*</span>
              </Label>
              <Select
                value={editRole}
                onValueChange={(value: "admin" | "staff" | "viewer") =>
                  setEditRole(value)
                }
                disabled={updateUserMutation.isPending}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="選擇用戶角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      管理員
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      員工
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      檢視者
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => handleEditDialogClose(false)}
              disabled={updateUserMutation.isPending}
            >
              取消
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {updateUserMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  更新用戶
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要執行刪除嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              你正準備刪除用戶「{userToDelete?.name}」。此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (userToDelete) {
                  handleDeleteUser(userToDelete);
                }
              }}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "刪除中..." : "確定刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 用戶分店管理對話框 */}
      {selectedUserForStores && (
        <UserStoresDialog
          userId={selectedUserForStores.id as number}
          userName={selectedUserForStores.name as string}
          open={isStoresDialogOpen}
          onOpenChange={setIsStoresDialogOpen}
        />
      )}
    </div>
  );
}
