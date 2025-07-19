"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  User, 
  Shield, 
  Database, 
  Palette, 
  Bell, 
  Globe, 
  HardDrive,
  Key,
  Clock,
  Download,
  Smartphone,
  Lock,
  LogOut,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity
} from "lucide-react";
import { EditProfileDialog } from "@/components/settings/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/settings/ChangePasswordDialog";

/**
 * 系統設定頁面（美化版）
 * 
 * 重新設計的系統設定頁面，具有以下特色：
 * 1. 採用 Dashboard 風格的卡片設計
 * 2. 100% 使用 shadcn/UI 組件
 * 3. 遵循官方顏色規範
 * 4. 現代化的視覺設計和互動體驗
 * 5. 響應式設計和微互動效果
 */
export default function SettingsPage() {
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-6 px-4 lg:px-6">
        {/* 📱 頁面標題區域 - Dashboard 風格 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
              <Settings className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">系統設定</h1>
              <p className="text-muted-foreground">
                管理系統配置和個人偏好設定
              </p>
            </div>
          </div>
        </div>

        {/* 快速操作區域 - Dashboard 統計卡片風格 */}
        <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]" onClick={() => setEditProfileOpen(true)}>
            <CardHeader>
              <CardDescription>個人設定</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                編輯資料
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <User className="size-3" />
                  個人
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                更新個人資訊 <User className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                修改姓名、電話和偏好設定
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]" onClick={() => setChangePasswordOpen(true)}>
            <CardHeader>
              <CardDescription>安全設定</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                變更密碼
              </CardTitle>
              <CardAction>
                <Badge variant="destructive">
                  <Shield className="size-3" />
                  安全
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                密碼安全管理 <Shield className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                定期更新以確保帳戶安全
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>系統維護</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                備份資料
              </CardTitle>
              <CardAction>
                <Badge variant="secondary">
                  <Database className="size-3" />
                  自動
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                資料庫備份管理 <Database className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                保護重要系統資料
              </div>
            </CardFooter>
          </Card>

          <Card className="@container/card cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <CardHeader>
              <CardDescription>通知管理</CardDescription>
              <CardTitle className="text-xl font-semibold @[250px]/card:text-2xl">
                推送設定
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <Bell className="size-3" />
                  即時
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                通知偏好管理 <Bell className="size-4 text-primary" />
              </div>
              <div className="text-muted-foreground">
                自訂推送通知設定
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* 用戶設定 - 美化版 */}
          <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                用戶設定
              </CardTitle>
              <CardDescription>
                管理個人帳戶和偏好設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 個人資料 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">個人資料</h4>
                  <p className="text-sm text-muted-foreground">
                    更新姓名、聯絡方式和基本資訊
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)}>
                  編輯
                </Button>
              </div>

              {/* 密碼安全 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">密碼安全</h4>
                  <p className="text-sm text-muted-foreground">
                    變更登入密碼並啟用雙重驗證
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setChangePasswordOpen(true)}>
                  變更
                </Button>
              </div>

              {/* 登入活動 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Activity className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">登入活動</h4>
                  <p className="text-sm text-muted-foreground">
                    查看最近的登入記錄和裝置
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  查看
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 安全設定 - 美化版 */}
          <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                安全設定
              </CardTitle>
              <CardDescription>
                管理系統安全和權限設定
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 雙重驗證 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Smartphone className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">雙重驗證</h4>
                      <p className="text-sm text-muted-foreground">增強帳戶安全性</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        已啟用
                      </Badge>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>
              </div>

              {/* API 金鑰 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">API 金鑰</h4>
                  <p className="text-sm text-muted-foreground">
                    管理 API 存取權限和金鑰
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  管理
                </Button>
              </div>

              {/* 登出所有裝置 */}
              <div className="flex items-center gap-4 p-4 bg-destructive/5 border border-destructive/20 rounded-lg hover:border-destructive/30 transition-all duration-200 hover:bg-destructive/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <LogOut className="h-6 w-6 text-destructive" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">登出所有裝置</h4>
                  <p className="text-sm text-muted-foreground">
                    強制登出所有已登入的裝置
                  </p>
                </div>
                <Button variant="destructive" size="sm">
                  登出
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 系統設定 - 美化版 */}
          <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                系統設定
              </CardTitle>
              <CardDescription>
                系統級配置和維護選項
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 資料庫備份 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">資料庫備份</h4>
                  <p className="text-sm text-muted-foreground">
                    最後備份：2025-01-19 14:30
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  立即備份
                </Button>
              </div>

              {/* 系統維護 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">維護模式</h4>
                      <p className="text-sm text-muted-foreground">暫停用戶訪問進行維護</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        停用
                      </Badge>
                      <Switch checked={false} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 清理日誌 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg hover:border-primary/20 transition-all duration-200 hover:bg-primary/10">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <HardDrive className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">日誌管理</h4>
                  <p className="text-sm text-muted-foreground">
                    清理舊日誌檔案，釋放儲存空間
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  清理
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 介面設定 - 美化版 */}
          <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                介面設定
              </CardTitle>
              <CardDescription>
                自訂系統外觀和使用體驗
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 主題設定 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Palette className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">主題設定</h4>
                      <p className="text-sm text-muted-foreground">淺色或深色模式</p>
                    </div>
                    <Badge variant="outline">自動</Badge>
                  </div>
                </div>
              </div>

              {/* 語言設定 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">語言設定</h4>
                      <p className="text-sm text-muted-foreground">繁體中文 (台灣)</p>
                    </div>
                    <Badge variant="outline">zh-TW</Badge>
                  </div>
                </div>
              </div>

              {/* 時區設定 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">時區設定</h4>
                      <p className="text-sm text-muted-foreground">台北標準時間</p>
                    </div>
                    <Badge variant="outline">UTC+8</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 通知設定 - 美化版 */}
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              通知設定
            </CardTitle>
            <CardDescription>
              管理系統通知和提醒設定，自訂您的推送偏好
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* 庫存預警 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Database className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">庫存預警</h4>
                      <p className="text-sm text-muted-foreground">低庫存提醒</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        啟用
                      </Badge>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 訂單通知 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">訂單通知</h4>
                      <p className="text-sm text-muted-foreground">新訂單提醒</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        啟用
                      </Badge>
                      <Switch checked={true} />
                    </div>
                  </div>
                </div>
              </div>

              {/* 系統維護 */}
              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <AlertTriangle className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">維護通知</h4>
                      <p className="text-sm text-muted-foreground">系統維護提醒</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        <XCircle className="h-3 w-3 mr-1" />
                        停用
                      </Badge>
                      <Switch checked={false} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 系統資訊 - 美化版 */}
        <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              系統資訊
            </CardTitle>
            <CardDescription>
              系統版本和狀態資訊，監控系統健康度
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* 系統版本 */}
              <div className="flex items-center gap-4 p-6 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <HardDrive className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground">系統版本</h4>
                  <p className="text-2xl font-bold">v2.1.0</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      最新版本
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 資料庫狀態 */}
              <div className="flex items-center gap-4 p-6 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <Database className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground">資料庫狀態</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-medium">正常運行</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">連線正常，響應時間 &lt; 10ms</p>
                </div>
              </div>

              {/* 系統負載 */}
              <div className="flex items-center gap-4 p-6 bg-primary/5 border border-border rounded-lg">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-muted-foreground">系統負載</h4>
                  <p className="text-2xl font-bold text-green-600">12%</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      CPU 使用率
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-dashed border-border/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">系統狀態良好</p>
                  <p className="text-xs text-muted-foreground">
                    所有核心服務運行正常，最後檢查時間：2025-01-19 15:30
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Dialogs */}
        <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
        <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      </div>
    </div>
  );
} 