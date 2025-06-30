"use client";

import React from "react";
import { useInstallation } from "@/hooks/queries/useEntityQueries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  FileText, 
  Clock, 
  Package,
  Users,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { 
  INSTALLATION_STATUS_VARIANTS, 
  INSTALLATION_STATUS_LABELS,
  type InstallationStatus,
  INSTALLATION_ITEM_STATUS_LABELS
} from "@/types/installation";
import Link from "next/link";

interface InstallationPreviewContentProps {
  installationId: number;
}

/**
 * 安裝單預覽內容組件
 * 
 * 在模態對話框中顯示安裝單的完整資訊
 */
export function InstallationPreviewContent({ installationId }: InstallationPreviewContentProps) {
  const { data: installation, isLoading, isError, error } = useInstallation(installationId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <p className="font-semibold text-destructive">無法載入安裝單資料</p>
            <p className="text-sm text-muted-foreground">
              {error?.message || "載入過程中發生錯誤"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="p-4 text-center">
        <div className="flex flex-col items-center gap-3">
          <Package className="h-12 w-12 text-muted-foreground" />
          <p className="font-semibold">找不到安裝單資料</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* 標題區域 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">{installation.installation_number}</h2>
          <div className="flex items-center gap-2">
            <Badge variant={INSTALLATION_STATUS_VARIANTS[installation.status as InstallationStatus]}>
              {INSTALLATION_STATUS_LABELS[installation.status as InstallationStatus]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              建立於 {format(new Date(installation.created_at), "yyyy/MM/dd HH:mm", { locale: zhTW })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/installations/${installation.id}`}>
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              查看詳情
            </Button>
          </Link>
          <Link href={`/installations/${installation.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              編輯
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 客戶資訊 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5" />
              客戶資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">客戶姓名</label>
              <p className="font-semibold">{installation.customer_name}</p>
            </div>
            {installation.customer_phone && (
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  聯絡電話
                </label>
                <p className="font-mono">{installation.customer_phone}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                安裝地址
              </label>
              <p className="bg-muted/50 p-2 rounded text-sm leading-relaxed">
                {installation.installation_address}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 排程與執行資訊 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              排程資訊
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                預計安裝日期
              </label>
              <p className="font-semibold">
                {installation.scheduled_date ? 
                  format(new Date(installation.scheduled_date), "yyyy 年 MM 月 dd 日 (EEEE)", { locale: zhTW }) :
                  <span className="text-muted-foreground italic">尚未安排</span>
                }
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Users className="h-3 w-3" />
                安裝師傅
              </label>
              {installation.installer ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{installation.installer.name}</Badge>
                  <span className="text-xs text-muted-foreground">@{installation.installer.username}</span>
                </div>
              ) : (
                <span className="text-muted-foreground italic">尚未分配</span>
              )}
            </div>

            {/* 執行時間 */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div>
                <label className="text-xs font-medium text-muted-foreground">開始時間</label>
                <p className="text-sm">
                  {installation.actual_start_time ? 
                    format(new Date(installation.actual_start_time), "MM/dd HH:mm") :
                    <span className="text-muted-foreground italic">未開始</span>
                  }
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">完成時間</label>
                <p className="text-sm">
                  {installation.actual_end_time ? 
                    format(new Date(installation.actual_end_time), "MM/dd HH:mm") :
                    <span className="text-muted-foreground italic">未完成</span>
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 關聯訂單 */}
      {installation.order && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ExternalLink className="h-5 w-5" />
              關聯訂單
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">訂單編號</label>
                <p className="font-semibold">{installation.order.order_number}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">訂單 ID</label>
                <p>{installation.order.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">訂單客戶</label>
                <p>{installation.order.customer_name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 安裝項目 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Package className="h-5 w-5" />
            安裝項目
            {installation.items && installation.items.length > 0 && (
              <Badge variant="secondary">{installation.items.length} 項</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {installation.items && installation.items.length > 0 ? (
            <div className="space-y-3">
              {installation.items.map((item: any, index: number) => (
                <div key={item.id || index} className="p-3 border rounded-lg bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-5 h-5 bg-primary/10 rounded-full text-xs font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.product_name || "未指定商品"}</span>
                    </div>
                    <Badge variant={
                      item.status === 'completed' ? 'default' : 'outline'
                    } className="text-xs">
                      <CheckCircle2 className={`h-3 w-3 mr-1 ${item.status === 'completed' ? '' : 'opacity-50'}`} />
                      {INSTALLATION_ITEM_STATUS_LABELS[item.status as keyof typeof INSTALLATION_ITEM_STATUS_LABELS] || '未知'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">SKU</label>
                      <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
                        {item.sku || "未指定"}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">數量</label>
                      <p className="font-semibold">{item.quantity || 0}</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">狀態</label>
                      <p>{INSTALLATION_ITEM_STATUS_LABELS[item.status as keyof typeof INSTALLATION_ITEM_STATUS_LABELS] || '未知'}</p>
                    </div>
                  </div>

                  {(item.specifications || item.notes) && (
                    <div className="mt-3 pt-2 border-t border-muted text-sm">
                      {item.specifications && (
                        <div className="mb-2">
                          <label className="text-xs font-medium text-muted-foreground">安裝規格</label>
                          <p className="text-muted-foreground">{item.specifications}</p>
                        </div>
                      )}
                      {item.notes && (
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">項目備註</label>
                          <p className="text-muted-foreground">{item.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {/* 項目統計 */}
              <div className="mt-4 p-3 bg-muted/20 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center text-sm">
                  <div>
                    <p className="text-muted-foreground">總項目</p>
                    <p className="font-semibold">{installation.items.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">已完成</p>
                    <p className="font-semibold text-green-600">
                      {installation.items.filter((item: any) => item.status === 'completed').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">待安裝</p>
                    <p className="font-semibold text-orange-600">
                      {installation.items.filter((item: any) => item.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>暫無安裝項目</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 備註 */}
      {installation.notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              安裝備註
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="bg-muted/50 p-3 rounded-lg leading-relaxed">
              {installation.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 建立者資訊 */}
      {installation.creator && (
        <div className="text-center text-sm text-muted-foreground pt-4 border-t">
          由 <span className="font-medium">{installation.creator.name}</span> 於{" "}
          {format(new Date(installation.created_at), "yyyy/MM/dd HH:mm", { locale: zhTW })} 建立
        </div>
      )}
    </div>
  );
} 