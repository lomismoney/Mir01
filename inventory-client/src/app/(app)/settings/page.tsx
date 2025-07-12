"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, User, Shield, Database, Palette, Bell, Globe, HardDrive } from "lucide-react";

/**
 * 系統設定頁面
 * 
 * 提供系統配置和用戶設定選項
 */
export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">系統設定</h1>
          <p className="text-muted-foreground">
            管理系統配置和個人偏好設定
          </p>
        </div>
      </div>

      <Separator />

      {/* 設定區塊 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 用戶設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              用戶設定
            </CardTitle>
            <CardDescription>
              管理個人帳戶和偏好設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">個人資料</h4>
              <Button variant="outline" size="sm" className="w-full">
                編輯個人資料
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">密碼安全</h4>
              <Button variant="outline" size="sm" className="w-full">
                變更密碼
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">通知設定</h4>
              <Button variant="outline" size="sm" className="w-full">
                通知偏好
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 安全設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              安全設定
            </CardTitle>
            <CardDescription>
              管理系統安全和權限設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">雙重驗證</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">已啟用</span>
                <Badge variant="secondary">啟用</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">活動日誌</h4>
              <Button variant="outline" size="sm" className="w-full">
                查看登入記錄
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">API 金鑰</h4>
              <Button variant="outline" size="sm" className="w-full">
                管理 API 金鑰
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 系統設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              系統設定
            </CardTitle>
            <CardDescription>
              系統級配置和維護選項
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">資料庫備份</h4>
              <Button variant="outline" size="sm" className="w-full">
                立即備份
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">系統維護</h4>
              <Button variant="outline" size="sm" className="w-full">
                維護模式
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">日誌管理</h4>
              <Button variant="outline" size="sm" className="w-full">
                清理日誌
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 介面設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              介面設定
            </CardTitle>
            <CardDescription>
              自訂系統外觀和使用體驗
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">主題設定</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">系統預設</span>
                <Badge variant="outline">自動</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">語言設定</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">繁體中文</span>
                <Badge variant="outline">zh-TW</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">時區設定</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">台北</span>
                <Badge variant="outline">UTC+8</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 通知設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              通知設定
            </CardTitle>
            <CardDescription>
              管理系統通知和提醒設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">庫存預警</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">低庫存提醒</span>
                <Badge variant="secondary">啟用</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">訂單通知</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">新訂單提醒</span>
                <Badge variant="secondary">啟用</Badge>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">系統維護</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">維護通知</span>
                <Badge variant="outline">停用</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 整合設定 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              整合設定
            </CardTitle>
            <CardDescription>
              第三方服務和 API 整合設定
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">支付服務</h4>
              <Button variant="outline" size="sm" className="w-full">
                配置支付閘道
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">物流服務</h4>
              <Button variant="outline" size="sm" className="w-full">
                物流 API 設定
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">會計系統</h4>
              <Button variant="outline" size="sm" className="w-full">
                同步設定
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 系統資訊 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            系統資訊
          </CardTitle>
          <CardDescription>
            系統版本和狀態資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <h4 className="text-sm font-medium">系統版本</h4>
              <p className="text-2xl font-bold">v2.1.0</p>
              <p className="text-xs text-muted-foreground">最新版本</p>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">資料庫狀態</h4>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <span className="text-sm">正常運行</span>
              </div>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-medium">系統負載</h4>
              <p className="text-2xl font-bold text-green-600">12%</p>
              <p className="text-xs text-muted-foreground">CPU 使用率</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 