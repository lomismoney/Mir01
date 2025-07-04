"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  usePurchases,
  useUpdatePurchaseStatus,
  useCancelPurchase,
  useDeletePurchase,
  useStores,
} from "@/hooks";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  getPurchasePermissions,
  getValidStatusTransitions,
  type PurchaseStatus,
} from "@/types/purchase";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";

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
  Filter,
} from "lucide-react";

import { CreatePurchaseDialog } from "./CreatePurchaseDialog";

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

  // 狀態管理
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [filters, setFilters] = useState<PurchaseFilters>({
    page: 1,
    per_page: 20,
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
    setFilters({ page: 1, per_page: 20 });
    setOrderNumberInput("");
  };

  /**
   * 更新進貨單狀態
   */
  const handleUpdateStatus = async (purchaseId: number, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({
        id: purchaseId,
        status: newStatus,
      });
      toast.success("進貨單狀態已更新");
    } catch (error) {
      toast.error("更新狀態失敗");
    }
  };

  /**
   * 取消進貨單
   */
  const handleCancel = async (purchaseId: number) => {
    try {
      await cancelMutation.mutateAsync(purchaseId);
      toast.success("進貨單已取消");
    } catch (error) {
      toast.error("取消進貨單失敗");
    }
  };

  /**
   * 刪除進貨單
   */
  const handleDelete = async (purchaseId: number) => {
    try {
      await deleteMutation.mutateAsync(purchaseId);
      toast.success("進貨單已刪除");
    } catch (error) {
      toast.error("刪除進貨單失敗");
    }
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
      <div className="space-y-6 p-6" data-oid="2apcm7l">
        <div className="flex flex-col space-y-2" data-oid="_qmjpmy">
          <h1 className="text-2xl font-bold" data-oid="n1p3mc7">
            進貨單管理
          </h1>
          <p className="text-muted-foreground" data-oid="atq_4tw">
            管理進貨單狀態、追蹤採購進度和庫存入庫
          </p>
        </div>

        <Card className="p-6" data-oid="by9umld">
          <div
            className="flex items-center gap-2 text-red-600"
            data-oid="cwy741h"
          >
            <AlertCircle className="h-5 w-5" data-oid="0fji-wm" />
            <span data-oid="8xafp3s">載入進貨單數據失敗</span>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-4"
            data-oid="6zlxgro"
          >
            <RefreshCw className="h-4 w-4 mr-2" data-oid="26kpwpf" />
            重試
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col" data-oid="mex9nz0">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* 頁面標題區 */}
          <div className="flex items-center justify-between px-4 lg:px-6" data-oid="tjr7afo">
            <div data-oid="pqymmu0">
              <h1
                className="text-2xl font-bold flex items-center gap-2"
                data-oid="9hxitih"
              >
                <Package className="h-7 w-7 text-blue-600" data-oid="o_6eqkl" />
                進貨單管理
              </h1>
              <p className="text-muted-foreground mt-1" data-oid="i2zsapz">
                管理進貨單狀態、追蹤採購進度和庫存入庫流程
              </p>
            </div>

            <Button
              onClick={() => setCreateDialogOpen(true)}
              className="flex items-center gap-2"
              data-oid="v0cq69f"
            >
              <Plus className="h-4 w-4" data-oid="ccrmppz" />
              新增進貨單
            </Button>
          </div>

          {/* 統計卡片區 */}
          <div
            className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4"
            data-oid="e08x1cu"
          >
            <Card className="@container/card" data-oid="-47r_hj">
              <CardHeader data-oid="tmyfnnw">
                <CardDescription data-oid="a8msuh8">
                  今日新增
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="pgdkbhk"
                >
                  {stats.todayCount}
                </CardTitle>
                <CardAction data-oid="l5qcmvd">
                  <Badge variant="outline">
                    <ShoppingCart className="size-4" />
                    新增
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
                data-oid="9yhrz3r"
              >
                <div className="line-clamp-1 flex gap-2 font-medium" data-oid="o.hddtz">
                  今日進貨作業 <ShoppingCart className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  今日新增的進貨單數量
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card" data-oid="of7fvzq">
              <CardHeader data-oid="x413b55">
                <CardDescription data-oid="9a-vy.v">
                  本週進貨
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="9t0--la"
                >
                  {stats.weeklyCount}
                </CardTitle>
                <CardAction data-oid="6.q.-2n">
                  <Badge variant="outline">
                    <TrendingUp className="size-4" />
                    成長
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
                data-oid="wbex:6k"
              >
                <div className="line-clamp-1 flex gap-2 font-medium" data-oid="4b4v6kt">
                  進貨效率良好 <TrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  本週進貨單處理統計
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card" data-oid="gjeb8uq">
              <CardHeader data-oid="osqftb1">
                <CardDescription data-oid="s4v8jar">
                  待處理
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="hjsh1bs"
                >
                  {stats.pendingCount}
                </CardTitle>
                <CardAction data-oid="b6kz23v">
                  <Badge variant="outline">
                    <Clock className="size-4" />
                    待處理
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
                data-oid="tonoqfw"
              >
                <div className="line-clamp-1 flex gap-2 font-medium" data-oid="gd.:c1a">
                  需要處理 <Clock className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  等待處理的進貨單數量
                </div>
              </CardFooter>
            </Card>

            <Card className="@container/card" data-oid="93ouu81">
              <CardHeader data-oid="5.whrth">
                <CardDescription data-oid="6j7zgtt">
                  總計
                </CardDescription>
                <CardTitle
                  className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
                  data-oid="dzjggy5"
                >
                  {stats.total}
                </CardTitle>
                <CardAction data-oid="v_o8e4m">
                  <Badge variant="outline">
                    <Archive className="size-4" />
                    總計
                  </Badge>
                </CardAction>
              </CardHeader>
              <CardFooter
                className="flex-col items-start gap-1.5 text-sm"
                data-oid="tmkib7m"
              >
                <div className="line-clamp-1 flex gap-2 font-medium" data-oid="q9:fd1u">
                  系統總記錄 <Archive className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  歷史進貨單總數量
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* 篩選器區域 */}
          <div className="px-4 lg:px-6">
            <Card data-oid="u_-3mv5">
              <CardHeader data-oid="dn7okyo">
                <CardTitle className="flex items-center gap-2" data-oid="lsg8x8f">
                  <Filter className="h-5 w-5" data-oid="uc1dp0t" />
                  篩選進貨單
                </CardTitle>
                <CardDescription data-oid="rw3szll">
                  使用以下篩選器來查找特定的進貨單
                </CardDescription>
              </CardHeader>
              <CardContent data-oid="ef0:.wa">
                <div
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                  data-oid="pq0gvr8"
                >
                  {/* 進貨單號搜尋 */}
                  <div className="space-y-2" data-oid="oor1_q:">
                    <label className="text-sm font-medium" data-oid="uu3vr.j">
                      進貨單號
                    </label>
                    <Input
                      placeholder="搜尋進貨單號..."
                      value={orderNumberInput}
                      onChange={(e) => setOrderNumberInput(e.target.value)}
                      data-oid="df6_4vj"
                    />
                  </div>

                  {/* 門市篩選 */}
                  <div className="space-y-2" data-oid="f2oy7ue">
                    <label className="text-sm font-medium" data-oid="ji.114a">
                      門市
                    </label>
                    <Select
                      value={filters.store_id?.toString() || "all"}
                      onValueChange={(value) =>
                        handleFilterChange(
                          "store_id",
                          value === "all" ? undefined : parseInt(value),
                        )
                      }
                      data-oid="52.yjdr"
                    >
                      <SelectTrigger data-oid="f.ov_xu">
                        <SelectValue placeholder="選擇門市" data-oid="wvz9c8y" />
                      </SelectTrigger>
                      <SelectContent data-oid="760qw0z">
                        <SelectItem value="all" data-oid="bizr1fd">
                          所有門市
                        </SelectItem>
                        {(storesData as any)?.data?.map((store: any) => (
                          <SelectItem
                            key={store.id}
                            value={store.id?.toString() || ""}
                            data-oid="xa3r7fm"
                          >
                            {store.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 狀態篩選 */}
                  <div className="space-y-2" data-oid="j-75y02">
                    <label className="text-sm font-medium" data-oid="a4-ionr">
                      狀態
                    </label>
                    <Select
                      value={filters.status || "all"}
                      onValueChange={(value) => handleFilterChange("status", value)}
                      data-oid="o:u9jqp"
                    >
                      <SelectTrigger data-oid="3f_5h.8">
                        <SelectValue placeholder="選擇狀態" data-oid="r45hih9" />
                      </SelectTrigger>
                      <SelectContent data-oid="330n::b">
                        <SelectItem value="all" data-oid="1-jiuk9">
                          所有狀態
                        </SelectItem>
                        {Object.entries(PURCHASE_STATUS_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value} data-oid="igeyf4d">
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 操作按鈕 */}
                  <div className="space-y-2" data-oid="papk_o.">
                    <label
                      className="text-sm font-medium opacity-0"
                      data-oid="bqfrnsv"
                    >
                      操作
                    </label>
                    <div className="flex gap-2" data-oid="vuk.5bt">
                      <Button
                        variant="outline"
                        onClick={handleResetFilters}
                        data-oid=":jiz21k"
                      >
                        重置
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => refetch()}
                        data-oid="f7zbkrf"
                      >
                        <RefreshCw className="h-4 w-4" data-oid="zui06y3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 進貨單列表 */}
          <Card data-oid="jon:6-j">
            <CardHeader data-oid="yvygm_y">
              <CardTitle data-oid="tlr1ewn">進貨單列表</CardTitle>
              <CardDescription data-oid="nbqx4hv">
                共 {stats.total} 筆進貨單
              </CardDescription>
            </CardHeader>
            <CardContent data-oid="4n_y9z:">
              {isLoading ? (
                <div className="space-y-4" data-oid="64lnk2:">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="animate-pulse" data-oid="cc7k:t1">
                      <div
                        className="flex items-center space-x-4 p-4 border rounded-lg"
                        data-oid="e-f76my"
                      >
                        <div
                          className="h-10 w-10 bg-muted rounded"
                          data-oid="16rsdw7"
                        ></div>
                        <div className="space-y-2 flex-1" data-oid="rpp8sa.">
                          <div
                            className="h-4 bg-muted rounded w-3/4"
                            data-oid="miyl8ox"
                          ></div>
                          <div
                            className="h-4 bg-muted rounded w-1/2"
                            data-oid="f7jn55d"
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : purchasesResponse?.data && purchasesResponse.data.length > 0 ? (
                <div className="space-y-4" data-oid="b:rr_jp">
                  {purchasesResponse.data.map((purchase: any) => {
                    const permissions = getPurchasePermissions(
                      purchase.status as PurchaseStatus,
                    );
                    const statusTransitions = getValidStatusTransitions(
                      purchase.status as PurchaseStatus,
                    );

                    return (
                      <div
                        key={purchase.id}
                        className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                        data-oid="b7657pv"
                      >
                        <div
                          className="flex items-start justify-between"
                          data-oid="yh-n5ph"
                        >
                          <div className="space-y-2 flex-1" data-oid="wpa9lam">
                            <div
                              className="flex items-center gap-2"
                              data-oid="yo06j31"
                            >
                              <h3 className="font-semibold" data-oid="94g3-i-">
                                {purchase.order_number}
                              </h3>
                              <Badge
                                className={
                                  PURCHASE_STATUS_COLORS[
                                    purchase.status as PurchaseStatus
                                  ]
                                }
                                data-oid="5_l52vv"
                              >
                                {
                                  PURCHASE_STATUS_LABELS[
                                    purchase.status as PurchaseStatus
                                  ]
                                }
                              </Badge>
                            </div>

                            <div
                              className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground"
                              data-oid="jhxe4uh"
                            >
                              <div
                                className="flex items-center gap-1"
                                data-oid="dvd0kfh"
                              >
                                <Store className="h-4 w-4" data-oid="6c1r9.e" />
                                <span data-oid="1z39lta">
                                  {purchase.store?.name}
                                </span>
                              </div>
                              <div
                                className="flex items-center gap-1"
                                data-oid="lklw030"
                              >
                                <Calendar className="h-4 w-4" data-oid="0kid_ph" />
                                <span data-oid="ze9aocx">
                                  {purchase.purchased_at
                                    ? format(
                                        new Date(purchase.purchased_at),
                                        "yyyy/MM/dd",
                                        { locale: zhTW },
                                      )
                                    : "未設定"}
                                </span>
                              </div>
                              <div data-oid="sysz-ur">
                                總金額: NT${" "}
                                {Number(
                                  purchase.total_amount || 0,
                                ).toLocaleString()}
                              </div>
                            </div>

                            {purchase.items && purchase.items.length > 0 && (
                              <div
                                className="text-sm text-muted-foreground"
                                data-oid="yn0dntn"
                              >
                                共 {purchase.items.length} 項商品， 總數量:{" "}
                                {purchase.items.reduce(
                                  (sum: number, item: any) =>
                                    sum + (item.quantity || 0),
                                  0,
                                )}
                              </div>
                            )}
                          </div>

                          {/* 操作選單 */}
                          <DropdownMenu data-oid="cn8obkz">
                            <DropdownMenuTrigger asChild data-oid="zc8tm5z">
                              <Button variant="ghost" size="sm" data-oid="dkku3j0">
                                <MoreHorizontal
                                  className="h-4 w-4"
                                  data-oid="ew:hb58"
                                />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" data-oid="hfvj8n6">
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/purchases/${purchase.id}`)
                                }
                                data-oid="nylndaf"
                              >
                                <Eye className="h-4 w-4 mr-2" data-oid="jh5r..o" />
                                查看詳情
                              </DropdownMenuItem>

                              {permissions.canModify && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(`/purchases/${purchase.id}/edit`)
                                  }
                                  data-oid="tak7nc3"
                                >
                                  <Edit
                                    className="h-4 w-4 mr-2"
                                    data-oid="q:584yi"
                                  />
                                  編輯
                                </DropdownMenuItem>
                              )}

                              {statusTransitions.length > 0 && (
                                <>
                                  <DropdownMenuSeparator data-oid="8h:pd6q" />
                                  {statusTransitions.map((status) => (
                                    <DropdownMenuItem
                                      key={status}
                                      onClick={() =>
                                        handleUpdateStatus(purchase.id, status)
                                      }
                                      data-oid="eru5ya-"
                                    >
                                      <CheckCircle
                                        className="h-4 w-4 mr-2"
                                        data-oid="eo83k0x"
                                      />
                                      更新為 {PURCHASE_STATUS_LABELS[status]}
                                    </DropdownMenuItem>
                                  ))}
                                </>
                              )}

                              {permissions.canCancel && (
                                <>
                                  <DropdownMenuSeparator data-oid="y:0mqfb" />
                                  <AlertDialog data-oid="q6p3vwt">
                                    <AlertDialogTrigger asChild data-oid="k7d_2da">
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        data-oid="o-wcjmh"
                                      >
                                        <X
                                          className="h-4 w-4 mr-2"
                                          data-oid="rp_02t2"
                                        />
                                        取消進貨單
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent data-oid="1jlifgx">
                                      <AlertDialogHeader data-oid="79udxof">
                                        <AlertDialogTitle data-oid=".wmvpgy">
                                          確認取消進貨單
                                        </AlertDialogTitle>
                                        <AlertDialogDescription data-oid="zkmpdcy">
                                          確定要取消進貨單 "{purchase.order_number}"
                                          嗎？此操作無法復原。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter data-oid="2cyggwz">
                                        <AlertDialogCancel data-oid="8pz2fe6">
                                          取消
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleCancel(purchase.id)}
                                          data-oid="7dt8wan"
                                        >
                                          確認取消
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}

                              {permissions.canDelete && (
                                <>
                                  <DropdownMenuSeparator data-oid="l6gmor-" />
                                  <AlertDialog data-oid="k8tpimc">
                                    <AlertDialogTrigger asChild data-oid="hdiqeez">
                                      <DropdownMenuItem
                                        onSelect={(e) => e.preventDefault()}
                                        className="text-red-600"
                                        data-oid="i.vvftn"
                                      >
                                        <Trash2
                                          className="h-4 w-4 mr-2"
                                          data-oid="ptwy4o2"
                                        />
                                        刪除
                                      </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent data-oid="r4eqas_">
                                      <AlertDialogHeader data-oid="531rgga">
                                        <AlertDialogTitle data-oid="07igofc">
                                          確認刪除進貨單
                                        </AlertDialogTitle>
                                        <AlertDialogDescription data-oid="rijlm0a">
                                          確定要刪除進貨單 "{purchase.order_number}"
                                          嗎？此操作無法復原。
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter data-oid="_k1d60s">
                                        <AlertDialogCancel data-oid="b6fkt-k">
                                          取消
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(purchase.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                          data-oid="y2am:mb"
                                        >
                                          確認刪除
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })}

                  {/* 分頁控制 */}
                  {purchasesResponse?.meta &&
                    purchasesResponse.meta.last_page &&
                    purchasesResponse.meta.last_page > 1 && (
                      <div
                        className="flex items-center justify-between pt-4 border-t"
                        data-oid="fb-wud8"
                      >
                        <div
                          className="text-sm text-muted-foreground"
                          data-oid="t2xpqs4"
                        >
                          第 {purchasesResponse.meta.current_page} 頁，共{" "}
                          {purchasesResponse.meta.last_page} 頁 （總計{" "}
                          {purchasesResponse.meta.total} 筆記錄）
                        </div>
                        <div className="flex items-center gap-2" data-oid="pcm-3sz">
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
                            data-oid="bn6v5sx"
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
                            data-oid="ds.7wqx"
                          >
                            下一頁
                          </Button>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-12" data-oid="sjyxdag">
                  <Package
                    className="h-12 w-12 text-muted-foreground mx-auto mb-4"
                    data-oid="6he0v8."
                  />

                  <h3 className="text-lg font-semibold mb-2" data-oid="te78zw6">
                    沒有進貨單
                  </h3>
                  <p className="text-muted-foreground mb-4" data-oid="m9_n2_4">
                    還沒有任何進貨單，點擊上方按鈕創建第一個進貨單。
                  </p>
                  <Button
                    onClick={() => setCreateDialogOpen(true)}
                    data-oid="5_1s.yx"
                  >
                    <Plus className="h-4 w-4 mr-2" data-oid="-ix9v41" />
                    新增進貨單
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* 進貨單列表卡片結束 */}
        </div>
      </div>

      {/* 創建進貨單對話框 */}
      <CreatePurchaseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        data-oid="3km:pti"
      />
    </div>
  );
}
