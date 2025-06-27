"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useInstallation, useUpdateInstallationStatus, useDeleteInstallation } from "@/hooks/queries/useEntityQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  Clock, 
  Settings,
  ExternalLink,
  Edit,
  Package,
  Users,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { 
  INSTALLATION_STATUS_VARIANTS, 
  INSTALLATION_STATUS_LABELS,
  type InstallationStatus,
  INSTALLATION_ITEM_STATUS_LABELS
} from "@/types/installation";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface InstallationDetailComponentProps {
  installationId: number;
}

export function InstallationDetailComponent({ installationId }: InstallationDetailComponentProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { data: installation, isLoading, isError, error } = useInstallation(installationId);
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateInstallationStatus();
  const { mutate: deleteInstallation, isPending: isDeleting } = useDeleteInstallation();

  // 處理狀態更新
  const handleStatusChange = (newStatus: InstallationStatus) => {
    updateStatus({
      installationId,
      status: newStatus,
    }, {
      onSuccess: () => {
        toast.success(`安裝單狀態已更新為「${INSTALLATION_STATUS_LABELS[newStatus]}」`);
      },
      onError: (error) => {
        toast.error("狀態更新失敗", {
          description: error.message || "請稍後再試"
        });
      },
    });
  };

  // 處理刪除安裝單
  const handleDelete = () => {
    deleteInstallation(installationId, {
      onSuccess: () => {
        toast.success("安裝單已刪除");
        router.push("/installations");
      },
      onError: (error) => {
        toast.error("刪除失敗", {
          description: error.message || "請稍後再試"
        });
      },
    });
  };

  // 可用的狀態選項
  const statusOptions = [
    { value: "pending", label: "待處理" },
    { value: "scheduled", label: "已排程" },
    { value: "in_progress", label: "進行中" },
    { value: "completed", label: "已完成" },
    { value: "cancelled", label: "已取消" },
  ] as const;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <div className="flex space-x-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold text-destructive">無法載入安裝單詳情</h3>
            <p className="text-muted-foreground mt-2">
              {error?.message || "載入過程中發生錯誤，請稍後再試。"}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <Button onClick={() => window.location.reload()}>
              重試
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (!installation) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <Package className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold">找不到安裝單資料</h3>
            <p className="text-muted-foreground mt-2">
              請檢查安裝單 ID 是否正確，或聯繫系統管理員。
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/installations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回安裝單列表
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題和操作按鈕 */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{installation.installation_number}</h1>
            <Badge variant={INSTALLATION_STATUS_VARIANTS[installation.status as InstallationStatus]}>
              {INSTALLATION_STATUS_LABELS[installation.status as InstallationStatus]}
            </Badge>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              建立時間：{format(new Date(installation.created_at), "yyyy/MM/dd HH:mm", { locale: zhTW })}
            </div>
            {installation.scheduled_date && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                預計安裝：{format(new Date(installation.scheduled_date), "yyyy/MM/dd", { locale: zhTW })}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => router.push("/installations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回列表
          </Button>
          <Link href={`/installations/${installation.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
          </Link>
          {installation.order_id && (
            <Link href={`/orders/${installation.order_id}`}>
              <Button variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                查看訂單
              </Button>
            </Link>
          )}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                <Trash2 className="h-4 w-4 mr-2" />
                刪除
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>確認刪除安裝單</AlertDialogTitle>
                <AlertDialogDescription>
                  您確定要刪除安裝單「{installation.installation_number}」嗎？
                  此操作無法復原。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  確定刪除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 基本資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              客戶資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <User className="h-3 w-3" />
                  客戶姓名
                </label>
                <p className="mt-1 font-medium text-lg">{installation.customer_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  聯絡電話
                </label>
                <p className="mt-1 font-mono">
                  {installation.customer_phone || (
                    <span className="text-muted-foreground italic">未提供</span>
                  )}
                </p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                安裝地址
              </label>
              <p className="mt-1 bg-muted/50 p-3 rounded-lg leading-relaxed">
                {installation.installation_address}
              </p>
            </div>

            {installation.notes && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  安裝備註
                </label>
                <p className="mt-1 text-sm bg-muted/50 p-3 rounded-lg leading-relaxed">
                  {installation.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 排程和執行資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              排程與執行
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  預計安裝日期
                </label>
                <p className="mt-1 text-lg font-semibold">
                  {format(new Date(installation.scheduled_date), "yyyy 年 MM 月 dd 日", { locale: zhTW })}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(installation.scheduled_date), "EEEE", { locale: zhTW })}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  安裝師傅
                </label>
                <div className="mt-1">
                  {installation.installer ? (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {installation.installer.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        @{installation.installer.username}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">尚未分配師傅</span>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* 執行時間追蹤 */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">執行時間追蹤</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">實際開始時間</label>
                  <p className="mt-1">
                    {installation.actual_start_time ? (
                      <span className="text-green-600 font-medium">
                        {format(new Date(installation.actual_start_time), "yyyy/MM/dd HH:mm", { locale: zhTW })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">尚未開始</span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">實際完成時間</label>
                  <p className="mt-1">
                    {installation.actual_end_time ? (
                      <span className="text-green-600 font-medium">
                        {format(new Date(installation.actual_end_time), "yyyy/MM/dd HH:mm", { locale: zhTW })}
                      </span>
                    ) : (
                      <span className="text-muted-foreground italic">尚未完成</span>
                    )}
                  </p>
                </div>
              </div>

              {/* 工作時長計算 */}
              {installation.actual_start_time && installation.actual_end_time && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      總工作時長：
                      {Math.round(
                        (new Date(installation.actual_end_time).getTime() - 
                         new Date(installation.actual_start_time).getTime()) / (1000 * 60 * 60 * 100)
                      ) / 100} 小時
                    </span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* 建立者資訊 */}
            {installation.creator && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">建立者</label>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary">
                    {installation.creator.name}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    於 {format(new Date(installation.created_at), "MM/dd HH:mm", { locale: zhTW })} 建立
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 關聯訂單資訊 */}
      {installation.order && (
        <Card>
          <CardHeader>
            <CardTitle>關聯訂單</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">訂單編號</label>
                <p className="mt-1 font-medium">{installation.order.order_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">訂單 ID</label>
                <p className="mt-1">{installation.order.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">訂單客戶</label>
                <p className="mt-1">{installation.order.customer_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 安裝項目 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              安裝項目
              {installation.items && installation.items.length > 0 && (
                <Badge variant="secondary">{installation.items.length} 項</Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {installation.items && installation.items.length > 0 ? (
            <div className="space-y-4">
              {installation.items.map((item: any, index: number) => (
                <div key={item.id || index} className="p-4 border rounded-lg bg-muted/20">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-6 h-6 bg-primary/10 rounded-full text-xs font-medium">
                        {index + 1}
                      </div>
                      <h4 className="font-medium">{item.product_name || "未指定商品"}</h4>
                    </div>
                    <Badge variant={
                      item.status === 'completed' ? 'default' : 
                      item.status === 'pending' ? 'outline' : 'secondary'
                    }>
                      <CheckCircle2 className={`h-3 w-3 mr-1 ${item.status === 'completed' ? '' : 'opacity-50'}`} />
                      {INSTALLATION_ITEM_STATUS_LABELS[item.status as keyof typeof INSTALLATION_ITEM_STATUS_LABELS] || '未知狀態'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <label className="font-medium text-muted-foreground flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        商品名稱
                      </label>
                      <p className="mt-1 break-words">{item.product_name || "未指定"}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">SKU</label>
                      <p className="mt-1 font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                        {item.sku || "未指定"}
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">安裝數量</label>
                      <p className="mt-1 text-lg font-semibold">{item.quantity || 0}</p>
                    </div>
                    <div>
                      <label className="font-medium text-muted-foreground">項目狀態</label>
                      <p className="mt-1">{INSTALLATION_ITEM_STATUS_LABELS[item.status as keyof typeof INSTALLATION_ITEM_STATUS_LABELS] || '未知'}</p>
                    </div>
                  </div>

                  {(item.specifications || item.notes) && (
                    <div className="mt-4 pt-3 border-t border-muted">
                      {item.specifications && (
                        <div className="mb-3">
                          <label className="font-medium text-muted-foreground text-sm flex items-center gap-1">
                            <Settings className="h-3 w-3" />
                            安裝規格
                          </label>
                          <p className="mt-1 text-sm bg-muted/50 p-2 rounded leading-relaxed">
                            {item.specifications}
                          </p>
                        </div>
                      )}

                      {item.notes && (
                        <div>
                          <label className="font-medium text-muted-foreground text-sm flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            項目備註
                          </label>
                          <p className="mt-1 text-sm bg-muted/50 p-2 rounded leading-relaxed">
                            {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* 項目統計 */}
              <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <p className="text-muted-foreground">總項目數</p>
                    <p className="text-lg font-semibold">{installation.items.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">已完成</p>
                    <p className="text-lg font-semibold text-green-600">
                      {installation.items.filter((item: any) => item.status === 'completed').length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground">待安裝</p>
                    <p className="text-lg font-semibold text-orange-600">
                      {installation.items.filter((item: any) => item.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg font-medium">暫無安裝項目</p>
              <p className="text-sm">請編輯安裝單以添加項目</p>
            </div>
          )}
        </CardContent>
      </Card>

              {/* 狀態操作 */}
        {installation.status !== 'completed' && installation.status !== 'cancelled' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                狀態操作
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  根據當前狀態選擇下一步操作
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {installation.status === 'pending' && (
                    <>
                      <Button 
                        variant="default"
                        onClick={() => handleStatusChange('scheduled')}
                        disabled={isUpdatingStatus}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        設為已排程
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleStatusChange('in_progress')}
                        disabled={isUpdatingStatus}
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        直接開始安裝
                      </Button>
                    </>
                  )}
                  
                  {installation.status === 'scheduled' && (
                    <Button 
                      variant="default"
                      onClick={() => handleStatusChange('in_progress')}
                      disabled={isUpdatingStatus}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      開始安裝
                    </Button>
                  )}
                  
                  {installation.status === 'in_progress' && (
                    <Button 
                      variant="default"
                      onClick={() => handleStatusChange('completed')}
                      disabled={isUpdatingStatus}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      完成安裝
                    </Button>
                  )}
                  
                  {['pending', 'scheduled', 'in_progress'].includes(installation.status) && (
                    <Button 
                      variant="destructive" 
                      onClick={() => handleStatusChange('cancelled')}
                      disabled={isUpdatingStatus}
                    >
                      <AlertCircle className="h-4 w-4 mr-2" />
                      取消安裝
                    </Button>
                  )}
                </div>
                
                {isUpdatingStatus && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                    正在更新狀態...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* 已完成/已取消狀態說明 */}
        {(installation.status === 'completed' || installation.status === 'cancelled') && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center justify-center gap-3 text-center">
                {installation.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                    <div>
                      <p className="text-lg font-semibold text-green-600">安裝已完成</p>
                      <p className="text-sm text-muted-foreground">
                        {installation.actual_end_time && (
                          <>完成時間：{format(new Date(installation.actual_end_time), "yyyy/MM/dd HH:mm", { locale: zhTW })}</>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-8 w-8 text-orange-600" />
                    <div>
                      <p className="text-lg font-semibold text-orange-600">安裝已取消</p>
                      <p className="text-sm text-muted-foreground">此安裝單已被取消，無法繼續操作</p>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }