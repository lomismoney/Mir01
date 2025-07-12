"use client";

import React, { useState } from 'react';
import {
  useUserPreferences,
  useNotificationSettings,
  useFeatureToggle,
  useSettingsManager,
} from '@/contexts/GlobalStateContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  User,
  Bell,
  Zap,
  Download,
  Upload,
  RotateCcw,
  Save,
  Info,
  Palette,
  Globe,
  Table,
  Volume2,
  VolumeX,
  Monitor,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * 全局設置面板組件
 * 
 * 提供統一的設置管理界面，包含：
 * - 用戶偏好設置
 * - 通知設置
 * - 功能開關
 * - 設置導入導出
 */
export function GlobalSettingsPanel() {
  const { userPreferences, updateUserPreferences, resetUserPreferences } = useUserPreferences();
  const { notificationSettings, updateNotificationSettings } = useNotificationSettings();
  const { activeFeatures, toggleFeature } = useFeatureToggle();
  const { exportSettings, importSettings, resetAllSettings } = useSettingsManager();
  
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // 處理設置導出
  const handleExportSettings = () => {
    try {
      const settingsJson = exportSettings();
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('設置已導出成功');
    } catch (error) {
      toast.error('導出設置失敗');
    }
  };

  // 處理設置導入
  const handleImportSettings = async () => {
    if (!importText.trim()) {
      toast.error('請輸入要導入的設置');
      return;
    }

    setIsImporting(true);
    try {
      await importSettings(importText);
      setImportText('');
      toast.success('設置導入成功');
    } catch (error) {
      toast.error('導入設置失敗，請檢查格式是否正確');
    } finally {
      setIsImporting(false);
    }
  };

  // 處理文件導入
  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  // 重置所有設置
  const handleResetAllSettings = () => {
    if (window.confirm('確定要重置所有設置嗎？此操作不可復原。')) {
      resetAllSettings();
      toast.success('所有設置已重置');
    }
  };

  return (
    <div className="space-y-6">
      {/* 設置概覽 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            全局設置管理
          </CardTitle>
          <CardDescription>
            配置系統的用戶偏好、通知和功能開關
          </CardDescription>
        </CardHeader>
      </Card>

      {/* 設置面板 */}
      <Tabs defaultValue="preferences" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            用戶偏好
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            通知設置
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            功能開關
          </TabsTrigger>
          <TabsTrigger value="management" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            設置管理
          </TabsTrigger>
        </TabsList>

        {/* 用戶偏好設置 */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                外觀設置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>主題模式</Label>
                <Select
                  value={userPreferences.theme}
                  onValueChange={(value: 'light' | 'dark' | 'system') =>
                    updateUserPreferences({ theme: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">淺色主題</SelectItem>
                    <SelectItem value="dark">深色主題</SelectItem>
                    <SelectItem value="system">跟隨系統</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>語言設置</Label>
                <Select
                  value={userPreferences.language}
                  onValueChange={(value: 'zh-TW' | 'en-US') =>
                    updateUserPreferences({ language: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="zh-TW">繁體中文</SelectItem>
                    <SelectItem value="en-US">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>緊湊模式</Label>
                  <p className="text-sm text-muted-foreground">
                    減少間距，顯示更多內容
                  </p>
                </div>
                <Switch
                  checked={userPreferences.compactMode}
                  onCheckedChange={(checked) =>
                    updateUserPreferences({ compactMode: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>啟用動畫</Label>
                  <p className="text-sm text-muted-foreground">
                    界面切換和互動動畫
                  </p>
                </div>
                <Switch
                  checked={userPreferences.enableAnimations}
                  onCheckedChange={(checked) =>
                    updateUserPreferences({ enableAnimations: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="h-5 w-5" />
                表格設置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>每頁顯示項目數</Label>
                <Select
                  value={userPreferences.itemsPerPage.toString()}
                  onValueChange={(value) =>
                    updateUserPreferences({ itemsPerPage: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 項</SelectItem>
                    <SelectItem value="15">15 項</SelectItem>
                    <SelectItem value="20">20 項</SelectItem>
                    <SelectItem value="25">25 項</SelectItem>
                    <SelectItem value="50">50 項</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>默認啟用虛擬化</Label>
                  <p className="text-sm text-muted-foreground">
                    大數據集時自動啟用虛擬化渲染
                  </p>
                </div>
                <Switch
                  checked={userPreferences.enableVirtualization}
                  onCheckedChange={(checked) =>
                    updateUserPreferences({ enableVirtualization: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 通知設置 */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                通知偏好
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>啟用提示訊息</Label>
                  <p className="text-sm text-muted-foreground">
                    顯示操作結果和狀態提示
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.enableToasts}
                  onCheckedChange={(checked) =>
                    updateNotificationSettings({ enableToasts: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label>啟用提示音</Label>
                    {notificationSettings.enableSounds ? (
                      <Volume2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    操作完成時播放提示音
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.enableSounds}
                  onCheckedChange={(checked) =>
                    updateNotificationSettings({ enableSounds: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>自動關閉</Label>
                  <p className="text-sm text-muted-foreground">
                    提示訊息自動消失
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.autoClose}
                  onCheckedChange={(checked) =>
                    updateNotificationSettings({ autoClose: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>提示位置</Label>
                <Select
                  value={notificationSettings.position}
                  onValueChange={(value: typeof notificationSettings.position) =>
                    updateNotificationSettings({ position: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-right">右上角</SelectItem>
                    <SelectItem value="top-left">左上角</SelectItem>
                    <SelectItem value="bottom-right">右下角</SelectItem>
                    <SelectItem value="bottom-left">左下角</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>顯示時長（毫秒）</Label>
                <Input
                  type="number"
                  value={notificationSettings.duration}
                  onChange={(e) =>
                    updateNotificationSettings({
                      duration: parseInt(e.target.value) || 4000,
                    })
                  }
                  min={1000}
                  max={10000}
                  step={500}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 功能開關 */}
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                性能功能
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label>全局虛擬化</Label>
                    <Badge
                      variant={
                        activeFeatures.isVirtualizationGloballyEnabled
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {activeFeatures.isVirtualizationGloballyEnabled ? '已啟用' : '已停用'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    所有表格默認使用虛擬化渲染
                  </p>
                </div>
                <Switch
                  checked={activeFeatures.isVirtualizationGloballyEnabled}
                  onCheckedChange={() => toggleFeature('isVirtualizationGloballyEnabled')}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label>樂觀更新</Label>
                    <Badge
                      variant={
                        activeFeatures.isOptimisticUpdatesEnabled
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {activeFeatures.isOptimisticUpdatesEnabled ? '已啟用' : '已停用'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    立即顯示操作結果，提升響應速度
                  </p>
                </div>
                <Switch
                  checked={activeFeatures.isOptimisticUpdatesEnabled}
                  onCheckedChange={() => toggleFeature('isOptimisticUpdatesEnabled')}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                開發功能
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label>調試模式</Label>
                    <Badge
                      variant={activeFeatures.isDebugMode ? 'destructive' : 'outline'}
                    >
                      {activeFeatures.isDebugMode ? 'DEBUG' : '正常'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    顯示詳細的調試信息和性能指標
                  </p>
                </div>
                <Switch
                  checked={activeFeatures.isDebugMode}
                  onCheckedChange={() => toggleFeature('isDebugMode')}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 設置管理 */}
        <TabsContent value="management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                導出設置
              </CardTitle>
              <CardDescription>
                備份當前的所有設置配置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportSettings} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                導出設置檔案
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                導入設置
              </CardTitle>
              <CardDescription>
                從備份檔案恢復設置配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>選擇設置檔案</Label>
                <Input
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label>或貼上設置內容</Label>
                <Textarea
                  placeholder="在此貼上設置 JSON 內容..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                onClick={handleImportSettings}
                disabled={!importText.trim() || isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>載入中...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    導入設置
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                重置設置
              </CardTitle>
              <CardDescription>
                將所有設置恢復為預設值
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  此操作將重置所有設置為預設值，但不會影響表格的臨時狀態。
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={resetUserPreferences}
                  className="flex-1"
                >
                  重置用戶偏好
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleResetAllSettings}
                  className="flex-1"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  重置所有設置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}