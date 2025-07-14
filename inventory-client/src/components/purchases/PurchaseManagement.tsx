"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  usePurchases,
  useUpdatePurchaseStatus,
  useCancelPurchase,
  useDeletePurchase,
  useStores,
  useModalManager,
  useErrorHandler,
} from "@/hooks";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  getPurchasePermissions,
  getValidStatusTransitions,
  type PurchaseStatus,
} from "@/types/purchase";
import { useDebounce } from "@/hooks/use-debounce";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
  CardAction,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Package,
  Plus,
  RefreshCw,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  Archive,
  AlertCircle,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Store,
} from "lucide-react";

import { CreatePurchaseDialog } from "./CreatePurchaseDialog";
import { PurchaseProgressTracker } from "./PurchaseProgressTracker";
import { PartialReceiptDialog } from "./PartialReceiptDialog";

interface PurchaseFilters {
  store_id?: number;
  status?: string;
  order_number?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  per_page?: number;
}

// 定義進貨單響應的類型
type PurchaseResponseData = {
  data: any[];
  meta: {
    current_page?: number;
    per_page?: number;
    total?: number;
    last_page?: number;
  };
  links?: any;
} | any[];

export function PurchaseManagement() {
  const router = useRouter();

  // 🎯 統一的 Modal 管理器和錯誤處理
  const modalManager = useModalManager<any>();
  const { handleError, handleSuccess } = useErrorHandler();

  // 部分收貨對話框狀態
  const [partialReceiptDialog, setPartialReceiptDialog] = useState<{
    isOpen: boolean;
    purchase: any | null;
  }>({
    isOpen: false,
    purchase: null,
  });

  // 狀態管理
  const [filters, setFilters] = useState<PurchaseFilters>({
    page: 1,
    per_page: 10, // 改為每頁10筆，提升使用者體驗
    status: "",
  });
  const [orderNumberInput, setOrderNumberInput] = useState("");

  // Debounce 搜尋
  const debouncedOrderNumber = useDebounce(orderNumberInput, 300);

  // API 查詢
  const { data: storesData } = useStores();
  const {
    data: purchasesResponse,
    isLoading,
    error,
    refetch,
  } = usePurchases({
    ...filters,
    order_number: debouncedOrderNumber || undefined,
  });

  // Mutations
  const updateStatusMutation = useUpdatePurchaseStatus();
  const cancelMutation = useCancelPurchase();
  const deleteMutation = useDeletePurchase();

  /**
   * 處理篩選變更
   */
  const handleFilterChange = (key: keyof PurchaseFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? undefined : value,
      page: 1,
    }));
  };

  /**
   * 重置篩選器
   */
  const handleResetFilters = () => {
    setFilters({ page: 1, per_page: 10 });
    setOrderNumberInput("");
  };

  /**
   * 更新進貨單狀態
   */
  const handleUpdateStatus = async (purchaseId: number, newStatus: string) => {
    updateStatusMutation.mutate(
      {
        id: purchaseId,
        status: newStatus,
      },
      {
        onSuccess: () => {
          handleSuccess("進貨單狀態已更新");
        },
        onError: (error) => handleError(error),
      }
    );
  };

  /**
   * 取消進貨單
   */
  const handleCancel = async (purchaseId: number) => {
    cancelMutation.mutate(purchaseId, {
      onSuccess: () => {
        handleSuccess("進貨單已取消");
        modalManager.closeModal();
      },
      onError: (error) => handleError(error),
    });
  };

  /**
   * 刪除進貨單
   */
  const handleDelete = async (purchaseId: number) => {
    deleteMutation.mutate(purchaseId, {
      onSuccess: () => {
        handleSuccess("進貨單已刪除");
        modalManager.closeModal();
      },
      onError: (error) => handleError(error),
    });
  };

  /**
   * 開啟部分收貨對話框
   */
  const handleOpenPartialReceipt = (purchase: any) => {
    setPartialReceiptDialog({
      isOpen: true,
      purchase,
    });
  };

  /**
   * 關閉部分收貨對話框
   */
  const handleClosePartialReceipt = () => {
    setPartialReceiptDialog({
      isOpen: false,
      purchase: null,
    });
  };

  /**
   * 計算統計數據
   */
  const getStatistics = () => {
    // 檢查響應格式並提取購買數據
    const purchases = Array.isArray(purchasesResponse) 
      ? purchasesResponse 
      : purchasesResponse?.data || [];
    
    const meta = Array.isArray(purchasesResponse) 
      ? null 
      : purchasesResponse?.meta;
    
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      todayCount: purchases.filter(
        (p: any) => new Date(p.created_at || "").toDateString() === today,
      ).length,
      weeklyCount: purchases.filter(
        (p: any) => new Date(p.created_at || "") >= weekAgo,
      ).length,
      total: meta?.total || purchases.length,
      pendingCount: purchases.filter((p: any) => p.status === "pending").length,
    };
  };

  const stats = getStatistics();

  if (error) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-2xl font-bold">
            進貨單管理
          </h1>
          <p className="text-muted-foreground">
            管理進貨單狀態、追蹤採購進度和庫存入庫
          </p>
        </div>

        <Card className="p-6">
          <div
            className="flex items-center gap-2 text-red-600"
           
          >
            <AlertCircle className="h-5 w-5" />
            <span>載入進貨單數據失敗</span>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-4"
           
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            重試
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* 頁面標題區 */}
          <div className="flex items-center justify-between px-4 lg:px-6">
            <div>
              <h1
                className="text-2xl font-bold flex items-center gap-2"
               
              >
                <Package className="h-7 w-7 text-blue-600" />
                進貨單管理
              </h1>
              <p className="text-muted-foreground mt-1">
                管理進貨單狀態、追蹤採購進度和庫存入庫流程
              </p>
            </div>

            <Button
              onClick={() => modalManager.openModal('create')}
              className="flex items-center gap-2"
             
            >
              <Plus className="h-4 w-4" />
              新增進貨單
            </Button>
          </div>

          {/* 統計卡片區 */}
          <div
            className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
           
          >
            <Card className="@container/card">
              <CardHeader>
                <CardDescription>
                  今日新增
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                 
                >
                  {stats.todayCount}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <ShoppingCart className="size-4" />
                    新增
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
               
              >
                <div className="line-clamp-1 flex gap-2 font-medium">
                  今日進貨作業 <ShoppingCart className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  今日新增的進貨單數量
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>
                  本週進貨
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                 
                >
                  {stats.weeklyCount}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <TrendingUp className="size-4" />
                    成長
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
               
              >
                <div className="line-clamp-1 flex gap-2 font-medium">
                  進貨效率良好 <TrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  本週進貨單處理統計
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>
                  待處理
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                 
                >
                  {stats.pendingCount}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Clock className="size-4" />
                    待處理
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
               
              >
                <div className="line-clamp-1 flex gap-2 font-medium">
                  需要處理 <Clock className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  等待處理的進貨單數量
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card">
              <CardHeader>
                <CardDescription>
                  總計
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                 
                >
                  {stats.total}
                </CardTitle>
                <CardAction>
                  <Badge variant="outline">
                    <Archive className="size-4" />
                    總計
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
               
              >
                <div className="line-clamp-1 flex gap-2 font-medium">
                  系統總記錄 <Archive className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  歷史進貨單總數量
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* 進貨單列表 */}
          <div className="px-4 lg:px-6">
            <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* 左側：標題區域 */}
                <div>
                  <CardTitle>進貨單列表</CardTitle>
                  <CardDescription>
                    共 {stats.total} 筆進貨單
                  </CardDescription>
                </div>
                
                {/* 右側：篩選功能 */}
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:gap-3">
                  {/* 進貨單號搜尋 */}
                  <div className="min-w-[200px]">
                    <Input
                      placeholder="搜尋進貨單號..."
                      value={orderNumberInput}
                      onChange={(e) => setOrderNumberInput(e.target.value)}
                     
                    />
                  </div>

                  {/* 門市篩選 */}
                  <div className="min-w-[140px]">
                    <Select
                      value={filters.store_id?.toString() || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "store_id",
                          value === "all" ? undefined : parseInt(value),
                        )
                      }
                     
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="門市" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          所有門市
                        </SelectItem>
                        {(storesData as any)?.data?.map((store: any) => (
                          <SelectItem
                            key={store.id}
                            value={store.id?.toString() || ""}
                           
                          >
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 狀態篩選 */}
                  <div className="min-w-[120px]">
                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) => handleFilterChange("status", value)}
                     
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="狀態" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          所有狀態
                        </SelectItem>
                        {Object.entries(PURCHASE_STATUS_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleResetFilters}
                     
                    >
                      重置
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => refetch()}
                     
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                       
                      >
                        <div
                          className="h-10 w-10 bg-muted rounded"
                         
                        ></div>
                        <div className="space-y-2 flex-1">
                          <div
                            className="h-4 bg-muted rounded w-3/4"
                           
                          ></div>
                          <div
                            className="h-4 bg-muted rounded w-1/2"
                           
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : purchasesResponse?.data && purchasesResponse.data.length > 0 ? (
                <div className="space-y-6">
                  {purchasesResponse.data.map((purchase: any, index: number) => {
                    const permissions = getPurchasePermissions(
                      purchase.status as PurchaseStatus,
                    );
                    const statusTransitions = getValidStatusTransitions(
                      purchase.status as PurchaseStatus,
                    );

                    return (
                      <React.Fragment key={purchase.id}>
                        {/* 主要資料行 */}
                        <div
                          className={`
                            border rounded-lg transition-all duration-200
                            ${index % 2 === 0 ? 'bg-background/60' : 'bg-muted/20'}
                            hover:bg-accent/50 hover:shadow-sm
                          `}
                        >
                          {/* 進貨單頭部信息 */}
                          <div className="p-4 border-b border-border/50">
                            <div className="flex items-start justify-between">
                              <div className="space-y-2 flex-1">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold text-foreground">
                                    {purchase.order_number}
                                  </h3>
                                  <Badge
                                    className={
                                      PURCHASE_STATUS_COLORS[
                                        purchase.status as PurchaseStatus
                                      ]
                                    }
                                  >
                                    {
                                      PURCHASE_STATUS_LABELS[
                                        purchase.status as PurchaseStatus
                                      ]
                                    }
                                  </Badge>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Store className="h-4 w-4" />
                                    <span className="font-medium">門市：</span>
                                    <span>{purchase.store?.name || '未指定'}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span className="font-medium">進貨日期：</span>
                                    <span>
                                      {purchase.purchased_at
                                        ? format(
                                            new Date(purchase.purchased_at),
                                            "yyyy/MM/dd",
                                            { locale: zhTW },
                                          )
                                        : "未設定"}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4" />
                                    <span className="font-medium">總金額：</span>
                                    <span className="text-green-600 font-semibold">
                                      NT$ {Number(purchase.total_amount || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {purchase.items && purchase.items.length > 0 && (
                                  <div className="text-sm text-muted-foreground">
                                    <Package className="h-4 w-4 inline mr-1" />
                                    共 {purchase.items.length} 項商品，總數量：{" "}
                                    {purchase.items.reduce(
                                      (sum: number, item: any) =>
                                        sum + (item.quantity || 0),
                                      0,
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* 操作選單 */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() =>
                                      router.push(`/purchases/${purchase.id}`)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    查看詳情
                                  </DropdownMenuItem>

                                  {permissions.canModify && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        router.push(`/purchases/${purchase.id}/edit`)
                                      }
                                    >
                                      <Edit className="h-4 w-4 mr-2" />
                                      編輯
                                    </DropdownMenuItem>
                                  )}

                                  {statusTransitions.length > 0 && (
                                    <>
                                      <DropdownMenuSeparator />
                                      {statusTransitions.map((status) => {
                                        // 特殊處理部分收貨狀態
                                        if (status === 'partially_received') {
                                          return (
                                            <DropdownMenuItem
                                              key={status}
                                              onClick={() => handleOpenPartialReceipt(purchase)}
                                            >
                                              <Package className="h-4 w-4 mr-2" />
                                              部分收貨處理
                                            </DropdownMenuItem>
                                          );
                                        }
                                        
                                        // 其他狀態使用原有邏輯
                                        return (
                                          <DropdownMenuItem
                                            key={status}
                                            onClick={() =>
                                              handleUpdateStatus(purchase.id, status)
                                            }
                                          >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            更新為 {PURCHASE_STATUS_LABELS[status]}
                                          </DropdownMenuItem>
                                        );
                                      })}
                                    </>
                                  )}

                                  {permissions.canCancel && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => modalManager.openModal('cancel', purchase)}
                                      >
                                        <X className="h-4 w-4 mr-2" />
                                        取消進貨單
                                      </DropdownMenuItem>
                                    </>
                                  )}

                                  {permissions.canDelete && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => modalManager.openModal('delete', purchase)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        刪除
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          
                          {/* 進度條行 */}
                          <div className="p-4">
                            <div className="flex justify-center">
                              <div className="w-full max-w-4xl">
                                <PurchaseProgressTracker 
                                  purchase={{
                                    ...purchase,
                                    confirmed_at: purchase.confirmed_at || purchase.purchased_at,
                                  }}
                                  variant="compact" 
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}

                  {/* 分頁控制 */}
                  {purchasesResponse?.meta &&
                    purchasesResponse.meta.last_page &&
                    purchasesResponse.meta.last_page > 1 && (
                      <div
                        className="flex items-center justify-between pt-4 border-t"
                       
                      >
                        <div
                          className="text-sm text-muted-foreground"
                         
                        >
                          第 {purchasesResponse.meta.current_page} 頁，共{" "}
                          {purchasesResponse.meta.last_page} 頁 （總計{" "}
                          {purchasesResponse.meta.total} 筆記錄）
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              (purchasesResponse.meta.current_page || 1) <= 1
                            }
                            onClick={() =>
                              handleFilterChange(
                                "page",
                                (purchasesResponse.meta?.current_page || 1) - 1,
                              )
                            }
                           
                          >
                            上一頁
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={
                              (purchasesResponse.meta.current_page || 1) >=
                              (purchasesResponse.meta.last_page || 1)
                            }
                            onClick={() =>
                              handleFilterChange(
                                "page",
                                (purchasesResponse.meta?.current_page || 1) + 1,
                              )
                            }
                           
                          >
                            下一頁
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package
                    className="h-12 w-12 text-muted-foreground mx-auto mb-4"
                   
                  />

                  <h3 className="text-lg font-semibold mb-2">
                    沒有進貨單
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    還沒有任何進貨單，點擊上方按鈕創建第一個進貨單。
                  </p>
                  <Button
                    onClick={() => modalManager.openModal('create')}
                   
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    新增進貨單
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          </div>
          
          {/* 進貨單列表卡片結束 */}
        </div>
      </div>

      {/* 🎯 創建進貨單對話框 */}
      <CreatePurchaseDialog
        open={modalManager.isModalOpen('create')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
        onSuccess={() => {
          modalManager.handleSuccess();
          handleSuccess("進貨單已成功創建");
        }}
      />

      {/* 🎯 取消進貨單確認對話框 */}
      <AlertDialog
        open={modalManager.isModalOpen('cancel')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認取消進貨單</AlertDialogTitle>
            <AlertDialogDescription>
              確定要取消進貨單 &ldquo;{modalManager.currentData?.order_number}&rdquo; 嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleCancel(modalManager.currentData?.id)}
            >
              確認取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🎯 刪除進貨單確認對話框 */}
      <AlertDialog
        open={modalManager.isModalOpen('delete')}
        onOpenChange={(open) => !open && modalManager.closeModal()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除進貨單</AlertDialogTitle>
            <AlertDialogDescription>
              確定要刪除進貨單 &ldquo;{modalManager.currentData?.order_number}&rdquo; 嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleDelete(modalManager.currentData?.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 🎯 部分收貨對話框 */}
      <PartialReceiptDialog
        isOpen={partialReceiptDialog.isOpen}
        onClose={handleClosePartialReceipt}
        purchase={partialReceiptDialog.purchase}
        onSuccess={() => {
          handleSuccess("進貨單部分收貨已更新");
          handleClosePartialReceipt();
          refetch(); // 刷新列表
        }}
      />
    </div>
  );
}
