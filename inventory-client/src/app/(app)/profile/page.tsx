"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useProfile, useUpdateProfile, useChangePassword } from "@/hooks";
import { useDynamicBreadcrumb } from "@/components/breadcrumb-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Settings, 
  Shield, 
  Calendar,
  Clock,
  Lock,
  Edit,
  Save,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateHelpers";

// 表單驗證 Schema
const profileFormSchema = z.object({
  name: z.string().min(1, "姓名為必填項目").max(255, "姓名不得超過255個字元"),
});

const passwordFormSchema = z.object({
  current_password: z.string().min(1, "當前密碼為必填項目"),
  password: z.string().min(8, "新密碼至少需要8個字元"),
  password_confirmation: z.string().min(1, "確認密碼為必填項目"),
}).refine((data) => data.password === data.password_confirmation, {
  message: "確認密碼與新密碼不相符",
  path: ["password_confirmation"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

/**
 * 個人資料頁面
 * 
 * 功能特色：
 * 1. 100% 使用 Shadcn/UI 組件
 * 2. 遵循官方色彩規範
 * 3. 現代化設計風格
 * 4. 響應式佈局
 * 5. 完整的表單驗證
 * 6. 優化的用戶體驗
 */
export default function ProfilePage() {
  const { data: session } = useSession();
  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const { setItems } = useDynamicBreadcrumb();

  // 設置麵包屑
  useEffect(() => {
    setItems([
      {
        label: "個人資料",
        icon: User,
      },
    ]);
  }, [setItems]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 個人資料表單
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: profile?.name || "",
    },
  });

  // 密碼變更表單
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
  });

  // 當 profile 資料載入時更新表單預設值
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        name: profile.name || "",
      });
    }
  }, [profile, profileForm]);

  // 處理個人資料更新
  const handleProfileUpdate = async (values: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(values);
      setIsEditingProfile(false);
    } catch (error) {
      // 錯誤已在 hook 中處理
    }
  };

  // 處理密碼變更
  const handlePasswordChange = async (values: PasswordFormValues) => {
    try {
      await changePassword.mutateAsync(values);
      setIsChangePasswordOpen(false);
      passwordForm.reset();
      toast.success("密碼已成功變更", {
        description: "您的密碼已更新，請使用新密碼登入",
      });
    } catch (error) {
      // 錯誤已在 hook 中處理
    }
  };

  if (error) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-6 px-4 lg:px-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              載入個人資料時發生錯誤，請重新整理頁面或聯繫系統管理員。
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 lg:px-6">
        {/* 頁面標題區域 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">個人資料</h1>
              <p className="text-muted-foreground">
                管理您的個人資訊和帳戶設定
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本資料卡片 */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  基本資料
                </CardTitle>
                <CardDescription>
                  您的個人基本資訊
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingProfile(!isEditingProfile)}
                disabled={isLoading}
              >
                <Edit className="h-4 w-4 mr-2" />
                {isEditingProfile ? "取消編輯" : "編輯"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : isEditingProfile ? (
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>姓名</FormLabel>
                          <FormControl>
                            <Input placeholder="請輸入您的姓名" {...field} />
                          </FormControl>
                          <FormDescription>
                            這是您在系統中顯示的名稱
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-2">
                      <Button 
                        type="submit" 
                        disabled={updateProfile.isPending}
                        className="flex-1"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updateProfile.isPending ? "更新中..." : "儲存變更"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsEditingProfile(false);
                          profileForm.reset();
                        }}
                        className="flex-1"
                      >
                        取消
                      </Button>
                    </div>
                  </form>
                </Form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">姓名</label>
                    <p className="text-lg font-medium">{profile?.name || "未設定"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">用戶名</label>
                    <p className="text-lg font-medium">{session?.user?.username || "未設定"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">電子郵件</label>
                    <p className="text-lg font-medium">{profile?.email || session?.user?.email || "未設定"}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 帳戶資訊卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                帳戶資訊
              </CardTitle>
              <CardDescription>
                您的帳戶狀態和權限資訊
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">角色權限</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={session?.user?.isAdmin ? "default" : "secondary"}
                        className="flex items-center gap-1"
                      >
                        {session?.user?.isAdmin ? (
                          <Shield className="h-3 w-3" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                        {session?.user?.roleDisplay || session?.user?.role || "一般用戶"}
                      </Badge>
                      {session?.user?.isAdmin && (
                        <Badge variant="outline" className="text-xs">
                          管理員
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">註冊時間</label>
                                         <div className="flex items-center gap-2 mt-1">
                       <Calendar className="h-4 w-4 text-muted-foreground" />
                       <span>{profile?.created_at ? formatDate.fullDateTime(profile.created_at, "未知") : "未知"}</span>
                     </div>
                   </div>
                   
                   <div>
                     <label className="text-sm font-medium text-muted-foreground">最後更新</label>
                     <div className="flex items-center gap-2 mt-1">
                       <Clock className="h-4 w-4 text-muted-foreground" />
                       <span>{profile?.updated_at ? formatDate.fullDateTime(profile.updated_at, "未知") : "未知"}</span>
                     </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 密碼安全卡片 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                密碼安全
              </CardTitle>
              <CardDescription>
                管理您的登入密碼和帳戶安全設定
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">登入密碼</p>
                  <p className="text-sm text-muted-foreground">
                    為了保護您的帳戶安全，建議定期更改密碼
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsChangePasswordOpen(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  變更密碼
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 變更密碼對話框 */}
        <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                變更密碼
              </DialogTitle>
              <DialogDescription>
                為了保護您的帳戶安全，請輸入當前密碼以及您想要設定的新密碼
              </DialogDescription>
            </DialogHeader>
            
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>當前密碼</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showCurrentPassword ? "text" : "password"}
                            placeholder="請輸入當前密碼"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>新密碼</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showNewPassword ? "text" : "password"}
                            placeholder="請輸入新密碼（至少8個字元）"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={passwordForm.control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>確認新密碼</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="請再次輸入新密碼"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsChangePasswordOpen(false);
                      passwordForm.reset();
                    }}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={changePassword.isPending}
                    className="flex-1"
                  >
                    {changePassword.isPending ? "變更中..." : "確認變更"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 