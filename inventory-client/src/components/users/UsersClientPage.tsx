'use client';

import { useState, memo } from 'react';
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
import { Loader2, Plus, UserCheck, Shield } from "lucide-react";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/queries/useEntityQueries';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { toast } from "sonner";
import { UsersDataTable } from '@/components/users/users-data-table';
import { createUsersColumns } from '@/components/users/users-columns';
import { UserItem } from '@/types/api-helpers';
import { UserActions } from '@/components/users/users-columns';
import type { AuthUser } from '@/lib/auth';

/**
 * 用戶管理客戶端元件屬性
 */
interface UsersClientPageProps {
  /** 從伺服器端傳入的已認證用戶資訊 */
  serverUser: AuthUser;
}

/**
 * 用戶管理客戶端頁面組件（已優化版本）
 * 
 * 使用 shadcn/ui DataTable 重構的專業用戶管理介面，
 * 提供完整的 CRUD 功能和現代化的使用者體驗。
 * 
 * 主要功能：
 * 1. 專業的資料表格展示 - 使用 TanStack React Table
 * 2. 搜尋和過濾功能 - 支援全域搜尋
 * 3. 排序功能 - 點擊表頭排序
 * 4. 欄位顯示控制 - 動態顯示/隱藏欄位
 * 5. 分頁功能 - 處理大量資料
 * 6. 新增用戶對話框 - 完整的表單驗證
 * 7. 用戶操作 - 查看、編輯、刪除
 * 8. 權限控制 - 基於角色的訪問控制
 * 
 * 安全與效能特性：
 * - 統一的權限驗證機制 (useAdminAuth)
 * - React.memo 防止不必要的重渲染
 * - 職責分離的架構設計
 */
const UsersClientPage = ({ serverUser }: UsersClientPageProps) => {
  const { user, isLoading, isAuthorized } = useAdminAuth();
  
  // 搜索狀態管理
  const [searchQuery, setSearchQuery] = useState('');
  
  // 使用搜索功能的 useUsers hook（第三階段契約修正 - 確認使用正確的 filter 格式）
  const { data: usersResponse, isLoading: isUsersLoading, error } = useUsers(
    searchQuery ? { "filter[search]": searchQuery } : undefined
  );
  const createUserMutation = useCreateUser();
  const deleteUserMutation = useDeleteUser();
  
  // 對話框狀態管理
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  // 新用戶表單狀態
  const [newUserName, setNewUserName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'admin' | 'viewer'>('viewer'); // 預設角色

  // 編輯用戶狀態
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'viewer'>('viewer');

  // 刪除確認對話框狀態
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);

  // 使用 useUpdateUser hook（重構版，不需要預先提供 userId）
  const updateUserMutation = useUpdateUser();

  /**
   * 處理創建新用戶的函式
   */
  const handleCreateUser = () => {
    // 基本驗證
    if (!newUserName.trim() || !newUsername.trim() || !newPassword.trim()) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    createUserMutation.mutate({
      name: newUserName,
      username: newUsername,
      password: newPassword,
      role: newRole,
    }, {
      onSuccess: () => {
        toast.success('用戶建立成功！');
        setIsDialogOpen(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(`建立失敗：${error.message}`);
      }
    });
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
    setEditUserName(userToEdit.name || '');
    setEditUsername(userToEdit.username || '');
    setEditPassword('');
    setEditRole(userToEdit.role as 'admin' | 'viewer' || 'viewer');
    setIsEditDialogOpen(true);
  };

  /**
   * 處理更新用戶的函式
   */
  const handleUpdateUser = () => {
    if (!editingUser?.id) {
      toast.error('無效的用戶 ID');
      return;
    }

    if (!editUserName.trim() || !editUsername.trim()) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    const updateData: {
      name: string;
      username: string;
      role: 'admin' | 'viewer';
      password?: string;
    } = {
      name: editUserName,
      username: editUsername,
      role: editRole,
    };

    if (editPassword.trim()) {
      updateData.password = editPassword;
    }

    updateUserMutation.mutate({
      path: { id: editingUser.id, user: editingUser.id },
      body: updateData
    }, {
      onSuccess: () => {
        toast.success('用戶更新成功！');
        setIsEditDialogOpen(false);
        resetEditForm();
      },
      onError: (error) => {
        toast.error(`更新失敗：${error.message}`);
      }
    });
  };

  /**
   * 處理刪除用戶
   */
  const handleDeleteUser = (userToDelete: UserItem) => {
    if (!userToDelete.id) {
      toast.error('無效的用戶 ID');
      return;
    }

    deleteUserMutation.mutate({
      id: userToDelete.id, 
      user: userToDelete.id
    }, {
      onSuccess: () => {
        toast.success('用戶刪除成功！');
        setUserToDelete(null);
      },
      onError: (error) => {
        toast.error(`刪除失敗：${error.message}`);
      }
    });
  };

  /**
   * 重置新用戶表單
   */
  const resetForm = () => {
    setNewUserName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('viewer');
  };

  /**
   * 重置編輯表單
   */
  const resetEditForm = () => {
    setEditingUser(null);
    setEditUserName('');
    setEditUsername('');
    setEditPassword('');
    setEditRole('viewer');
  };

  /**
   * 處理對話框關閉
   */
  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setIsDialogOpen(false);
      resetForm();
    } else {
      setIsDialogOpen(true);
    }
  };

  /**
   * 處理編輯對話框關閉
   */
  const handleEditDialogClose = (open: boolean) => {
    if (!open) {
      setIsEditDialogOpen(false);
      resetEditForm();
    } else {
      setIsEditDialogOpen(true);
    }
  };

  // 使用統一的權限守衛
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">正在驗證權限...</span>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // useAdminAuth 會處理重新導向
  }

  // 載入用戶資料狀態
  if (isUsersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">載入用戶資料中...</span>
      </div>
    );
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-2 text-red-600">
              <h3 className="text-lg font-semibold">載入失敗</h3>
              <p>無法載入用戶資料，請重試</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 準備表格資料
  const users = usersResponse?.data || [];
  const userActions: UserActions = {
    onView: (user) => {
      console.log('查看用戶:', user);
    },
    onEdit: handleEditUser,
    onDelete: (user) => setUserToDelete(user),
  };

  const columns = createUsersColumns(userActions);

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">用戶管理</h1>
          <p className="text-muted-foreground">
            管理系統用戶和權限設定
          </p>
        </div>
        <Button onClick={handleAddUser} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          新增用戶
        </Button>
      </div>

      {/* 搜尋列 */}
      <div className="flex items-center space-x-2">
        <Input
          placeholder="搜尋用戶名稱或帳號..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* 資料表格 */}
      <UsersDataTable
        data={users}
        columns={columns}
      />

      {/* 新增用戶對話框 */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              新增用戶
            </DialogTitle>
            <DialogDescription>
              請填寫新用戶的基本資訊和角色設定
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">姓名 *</Label>
              <Input
                id="name"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder="請輸入用戶姓名"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="username">帳號 *</Label>
              <Input
                id="username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="請輸入登入帳號"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">密碼 *</Label>
              <Input
                id="password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="請輸入密碼"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">角色 *</Label>
              <Select value={newRole} onValueChange={(value: 'admin' | 'viewer') => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理員</SelectItem>
                  <SelectItem value="viewer">檢視者</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              建立用戶
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 編輯用戶對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              編輯用戶
            </DialogTitle>
            <DialogDescription>
              修改用戶的基本資訊和角色設定
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">姓名 *</Label>
              <Input
                id="edit-name"
                value={editUserName}
                onChange={(e) => setEditUserName(e.target.value)}
                placeholder="請輸入用戶姓名"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-username">帳號 *</Label>
              <Input
                id="edit-username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="請輸入登入帳號"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-password">密碼</Label>
              <Input
                id="edit-password"
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                placeholder="留空表示不更改密碼"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-role">角色 *</Label>
              <Select value={editRole} onValueChange={(value: 'admin' | 'viewer') => setEditRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">管理員</SelectItem>
                  <SelectItem value="viewer">檢視者</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button
              onClick={handleUpdateUser}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              更新用戶
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確定要刪除用戶嗎？</AlertDialogTitle>
            <AlertDialogDescription>
              您即將刪除用戶「{userToDelete?.name} ({userToDelete?.username})」。
              此操作無法復原，請謹慎考慮。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDeleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              確定刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

/**
 * 使用 React.memo 優化的用戶管理頁面元件
 * 
 * 效能優化：
 * - 防止父元件重渲染時的不必要重繪
 * - 僅當 props 發生變化時才重新渲染
 * - 配合 useAdminAuth 統一權限管理
 */
export default memo(UsersClientPage); 