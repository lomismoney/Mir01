'use client';

import { useState } from 'react';
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
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/useApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from "sonner";
import { UsersDataTable } from '@/components/users/users-data-table';
import { createUsersColumns } from '@/components/users/users-columns';
import { User, UserActions } from '@/types/user';

/**
 * 用戶管理主頁面組件
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
 * 7. 用戶操作 - 查看、編輯、刪除（待實現）
 * 8. 權限控制 - 基於角色的訪問控制
 */
export default function UsersPage() {
  const { user } = useAuth(); // 獲取當前用戶資訊以判斷權限
  
  // 搜索狀態管理
  const [searchQuery, setSearchQuery] = useState('');
  
  // 使用搜索功能的 useUsers hook（類型安全版本）
  const { data: usersResponse, isLoading, error } = useUsers(
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
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editRole, setEditRole] = useState<'admin' | 'viewer'>('viewer');

  // 刪除確認對話框狀態
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // 使用 useUpdateUser hook（重構版，不需要預先提供 userId）
  const updateUserMutation = useUpdateUser();

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
        setIsDialogOpen(false); // 關閉對話框
        // 重置表單狀態
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
  const handleEditUser = (userToEdit: User) => {
    setEditingUser(userToEdit);
    setEditUserName(userToEdit.name || '');
    setEditUsername(userToEdit.username || '');
    setEditPassword(''); // 密碼留空，表示不更改
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

    // 基本驗證
    if (!editUserName.trim() || !editUsername.trim()) {
      toast.error('請填寫所有必填欄位');
      return;
    }

    // 準備更新資料（只包含有值的欄位）
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

    // 如果有填寫密碼，則包含密碼更新
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
   * 處理刪除用戶（升級版 - 使用 AlertDialog）
   */
  const handleDeleteUser = (userToDelete: User) => {
    if (!userToDelete.id) {
      toast.error('無效的用戶 ID');
      setUserToDelete(null); // 關閉對話框
      return;
    }

    // 防止管理員刪除自己
    if (user?.id === userToDelete.id) {
      toast.error('您無法刪除自己的帳號');
      setUserToDelete(null); // 關閉對話框
      return;
    }

    // 執行刪除操作（移除了 window.confirm）
    deleteUserMutation.mutate(
      { id: userToDelete.id, user: userToDelete.id },
      {
        onSuccess: () => {
          toast.success(`用戶「${userToDelete.name}」已刪除。`);
          setUserToDelete(null); // 關閉對話框
        },
        onError: (error) => {
          toast.error(`刪除失敗：${error.message}`);
          setUserToDelete(null); // 關閉對話框
        }
      }
    );
  };

  /**
   * 重置表單狀態
   */
  const resetForm = () => {
    setNewUserName('');
    setNewUsername('');
    setNewPassword('');
    setNewRole('viewer');
  };

  /**
   * 重置編輯表單狀態
   */
  const resetEditForm = () => {
    setEditingUser(null);
    setEditUserName('');
    setEditUsername('');
    setEditPassword('');
    setEditRole('viewer');
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

  /**
   * 用戶操作處理器
   * 定義表格中各種操作的回調函數
   */
  const userActions: UserActions = {
    currentUser: user ? { is_admin: user.is_admin, id: user.id } : undefined, // 傳入當前用戶用於權限判斷
    onView: (user: User) => {
      toast.info(`查看用戶：${user.name}`);
    },
    onEdit: handleEditUser,
    onDelete: (userToDelete: User) => {
      setUserToDelete(userToDelete); // 設置待刪除用戶，觸發 AlertDialog
    },
  };

  // 創建表格欄位定義
  const columns = createUsersColumns(userActions);

  // 處理用戶資料，確保類型正確
  const users: User[] = usersResponse?.data || [];

  // 錯誤狀態處理
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <p className="font-semibold">載入用戶資料時發生錯誤</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">用戶管理</h1>
          <p className="text-gray-600 mt-2">管理系統中的所有用戶帳號</p>
        </div>
      </div>

      {/* 用戶資料表格 */}
      <div className="space-y-4">
        <UsersDataTable
          columns={columns}
          data={users}
          isLoading={isLoading}
          showAddButton={user?.is_admin}
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
                帳號 <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="username" 
                placeholder="輸入登入帳號"
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
              <Input 
                id="password" 
                type="password"
                placeholder="輸入密碼"
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                className="col-span-3" 
                disabled={createUserMutation.isPending}
              />
            </div>
            
            {/* 角色選擇 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right font-medium">
                角色 <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={newRole} 
                onValueChange={(value: 'admin' | 'viewer') => setNewRole(value)}
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
                帳號 <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="edit-username" 
                placeholder="輸入登入帳號"
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
                onValueChange={(value: 'admin' | 'viewer') => setEditRole(value)}
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
      <AlertDialog open={!!userToDelete} onOpenChange={(isOpen) => !isOpen && setUserToDelete(null)}>
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
              {deleteUserMutation.isPending ? '刪除中...' : '確定刪除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 