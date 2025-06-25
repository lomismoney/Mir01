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
} from "@/hooks/queries/useEntityQueries";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_STATUS_COLORS,
  getPurchasePermissions,
  getValidStatusTransitions,
  type PurchaseStatus,
} from "@/types/purchase";
import { useDebounce } from "@/hooks/use-debounce";
import { toast } from "sonner";
import { PurchasesResponse } from "@/types/api-helpers";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  }) as {
    data: PurchasesResponse | undefined;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };

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
    const purchases = purchasesResponse?.data || [];
    const today = new Date().toDateString();
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    return {
      todayCount: purchases.filter(
        (p: any) => new Date(p.created_at || "").toDateString() === today,
      ).length,
      weeklyCount: purchases.filter(
        (p: any) => new Date(p.created_at || "") >= weekAgo,
      ).length,
      total: purchasesResponse?.meta?.total || 0,
      pendingCount: purchases.filter((p: any) => p.status === "pending").length,
    };
  };

  const stats = getStatistics();

  if (error) {
    return (
      <div className="space-y-6 p-6" data-oid="2_6hzxv">
        <div className="flex flex-col space-y-2" data-oid="ro__d.t">
          <h1 className="text-2xl font-bold" data-oid="67kqe68">
            進貨單管理
          </h1>
          <p className="text-muted-foreground" data-oid="kd3j2ue">
            管理進貨單狀態、追蹤採購進度和庫存入庫
          </p>
        </div>

        <Card className="p-6" data-oid="ifcj49c">
          <div
            className="flex items-center gap-2 text-red-600"
            data-oid="q0zm-x0"
          >
            <AlertCircle className="h-5 w-5" data-oid="k-:o8ax" />
            <span data-oid="d1p.1gt">載入進貨單數據失敗</span>
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="mt-4"
            data-oid="tua-gb6"
          >
            <RefreshCw className="h-4 w-4 mr-2" data-oid="cqyzg4u" />
            重試
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-oid="wlkfaz:">
      {/* 頁面標題區 */}
      <div className="flex items-center justify-between" data-oid="ljn3zng">
        <div data-oid="yq7r.4z">
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            data-oid="ycy_en1"
          >
            <Package className="h-7 w-7 text-blue-600" data-oid="_fdx8.." />
            進貨單管理
          </h1>
          <p className="text-muted-foreground mt-1" data-oid="a0iuu-5">
            管理進貨單狀態、追蹤採購進度和庫存入庫流程
          </p>
        </div>

        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2"
          data-oid="32thczi"
        >
          <Plus className="h-4 w-4" data-oid=".okiej2" />
          新增進貨單
        </Button>
      </div>

      {/* 統計卡片區 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" data-oid="1awx8dq">
        <Card data-oid="mqde4ah">
          <CardContent className="p-4" data-oid="2hvvt2k">
            <div
              className="flex items-center justify-between"
              data-oid=":s-kg_-"
            >
              <div data-oid="et-.u34">
                <p
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="ei06ad4"
                >
                  今日新增
                </p>
                <p
                  className="text-2xl font-bold text-blue-600"
                  data-oid="csm6e70"
                >
                  {stats.todayCount}
                </p>
              </div>
              <ShoppingCart
                className="h-8 w-8 text-blue-600"
                data-oid="y4qntaz"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-oid="bjc2.2s">
          <CardContent className="p-4" data-oid="w2mguj:">
            <div
              className="flex items-center justify-between"
              data-oid="ae7ki12"
            >
              <div data-oid="khsetg:">
                <p
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="iec3a5d"
                >
                  本週進貨
                </p>
                <p
                  className="text-2xl font-bold text-green-600"
                  data-oid="qqd.dht"
                >
                  {stats.weeklyCount}
                </p>
              </div>
              <TrendingUp
                className="h-8 w-8 text-green-600"
                data-oid="mv2y0.i"
              />
            </div>
          </CardContent>
        </Card>

        <Card data-oid="_wrmlz5">
          <CardContent className="p-4" data-oid="nphxf9z">
            <div
              className="flex items-center justify-between"
              data-oid="1v9mnor"
            >
              <div data-oid="f_bmzud">
                <p
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="h_y-1ds"
                >
                  待處理
                </p>
                <p
                  className="text-2xl font-bold text-yellow-600"
                  data-oid="d4o7vp_"
                >
                  {stats.pendingCount}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" data-oid="2ezz:gr" />
            </div>
          </CardContent>
        </Card>

        <Card data-oid="89ro_t7">
          <CardContent className="p-4" data-oid="t0yaxtr">
            <div
              className="flex items-center justify-between"
              data-oid="pjvn6c:"
            >
              <div data-oid="k2ft79-">
                <p
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="d28j2_i"
                >
                  總計
                </p>
                <p
                  className="text-2xl font-bold text-purple-600"
                  data-oid="eo.om63"
                >
                  {stats.total}
                </p>
              </div>
              <Archive className="h-8 w-8 text-purple-600" data-oid="grj5x95" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 篩選器區域 */}
      <Card data-oid="-myti84">
        <CardHeader data-oid="lr2ox1y">
          <CardTitle className="flex items-center gap-2" data-oid="7uaze7-">
            <Filter className="h-5 w-5" data-oid="9prr7li" />
            篩選進貨單
          </CardTitle>
          <CardDescription data-oid="rrxjf71">
            使用以下篩選器來查找特定的進貨單
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="vygrwd.">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            data-oid="5gf2vts"
          >
            {/* 進貨單號搜尋 */}
            <div className="space-y-2" data-oid="pgk:ciu">
              <label className="text-sm font-medium" data-oid="f-09va5">
                進貨單號
              </label>
              <Input
                placeholder="搜尋進貨單號..."
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                data-oid="axn0:ae"
              />
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2" data-oid="jne0r4u">
              <label className="text-sm font-medium" data-oid="j78nghv">
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
                data-oid="qkgv1us"
              >
                <SelectTrigger data-oid="5ngjn9l">
                  <SelectValue placeholder="選擇門市" data-oid="u7xhcp." />
                </SelectTrigger>
                <SelectContent data-oid="iv49za8">
                  <SelectItem value="all" data-oid="zyp:ibm">
                    所有門市
                  </SelectItem>
                  {(storesData as any)?.data?.map((store: any) => (
                    <SelectItem
                      key={store.id}
                      value={store.id?.toString() || ""}
                      data-oid="arli_6v"
                    >
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 狀態篩選 */}
            <div className="space-y-2" data-oid="a_pn59k">
              <label className="text-sm font-medium" data-oid=".w69ux1">
                狀態
              </label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) => handleFilterChange("status", value)}
                data-oid=":82v_4e"
              >
                <SelectTrigger data-oid="44earpc">
                  <SelectValue placeholder="選擇狀態" data-oid="3fvjz4e" />
                </SelectTrigger>
                <SelectContent data-oid="3l2ivdp">
                  <SelectItem value="all" data-oid="_4gwl2d">
                    所有狀態
                  </SelectItem>
                  {Object.entries(PURCHASE_STATUS_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value} data-oid="ebh9:rl">
                        {label}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 操作按鈕 */}
            <div className="space-y-2" data-oid="jyughrn">
              <label
                className="text-sm font-medium opacity-0"
                data-oid=".-vx-9k"
              >
                操作
              </label>
              <div className="flex gap-2" data-oid=".-hf95b">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  data-oid="34qgjaq"
                >
                  重置
                </Button>
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  data-oid="_w6.tky"
                >
                  <RefreshCw className="h-4 w-4" data-oid="13xl:ue" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 進貨單列表 */}
      <Card data-oid="ifht1_b">
        <CardHeader data-oid="2c-3j2g">
          <CardTitle data-oid="-xvn8on">進貨單列表</CardTitle>
          <CardDescription data-oid="da8yncs">
            共 {stats.total} 筆進貨單
          </CardDescription>
        </CardHeader>
        <CardContent data-oid=":2skqo8">
          {isLoading ? (
            <div className="space-y-4" data-oid="ig6z2rw">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse" data-oid="lljfaai">
                  <div
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                    data-oid=":e3dls6"
                  >
                    <div
                      className="h-10 w-10 bg-muted rounded"
                      data-oid="7.3eq6j"
                    ></div>
                    <div className="space-y-2 flex-1" data-oid="c_zaa-i">
                      <div
                        className="h-4 bg-muted rounded w-3/4"
                        data-oid="c9mlmz7"
                      ></div>
                      <div
                        className="h-4 bg-muted rounded w-1/2"
                        data-oid="zhrf85q"
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : purchasesResponse?.data && purchasesResponse.data.length > 0 ? (
            <div className="space-y-4" data-oid="9f11xgo">
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
                    data-oid="kvo01ir"
                  >
                    <div
                      className="flex items-start justify-between"
                      data-oid="uwfw:4_"
                    >
                      <div className="space-y-2 flex-1" data-oid="r5vt.1v">
                        <div
                          className="flex items-center gap-2"
                          data-oid="eyf-ftp"
                        >
                          <h3 className="font-semibold" data-oid="dycnmqo">
                            {purchase.order_number}
                          </h3>
                          <Badge
                            className={
                              PURCHASE_STATUS_COLORS[
                                purchase.status as PurchaseStatus
                              ]
                            }
                            data-oid=".zneag_"
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
                          data-oid="2kv51ws"
                        >
                          <div
                            className="flex items-center gap-1"
                            data-oid="mo:.9dr"
                          >
                            <Store className="h-4 w-4" data-oid="0zq:xtb" />
                            <span data-oid="2_k:arv">
                              {purchase.store?.name}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-1"
                            data-oid="4avjk1."
                          >
                            <Calendar className="h-4 w-4" data-oid="tnnxxqy" />
                            <span data-oid="zwi5wcb">
                              {purchase.purchased_at
                                ? format(
                                    new Date(purchase.purchased_at),
                                    "yyyy/MM/dd",
                                    { locale: zhTW },
                                  )
                                : "未設定"}
                            </span>
                          </div>
                          <div data-oid="wgw5qfu">
                            總金額: NT${" "}
                            {Number(
                              purchase.total_amount || 0,
                            ).toLocaleString()}
                          </div>
                        </div>

                        {purchase.items && purchase.items.length > 0 && (
                          <div
                            className="text-sm text-muted-foreground"
                            data-oid="z53r-gi"
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
                      <DropdownMenu data-oid="pu72i-k">
                        <DropdownMenuTrigger asChild data-oid="5wuzrwv">
                          <Button variant="ghost" size="sm" data-oid="7kkebyq">
                            <MoreHorizontal
                              className="h-4 w-4"
                              data-oid="96sryz3"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" data-oid=":kckfnh">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/purchases/${purchase.id}`)
                            }
                            data-oid="427tkef"
                          >
                            <Eye className="h-4 w-4 mr-2" data-oid="98d:gqo" />
                            查看詳情
                          </DropdownMenuItem>

                          {permissions.canModify && (
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/purchases/${purchase.id}/edit`)
                              }
                              data-oid="015txwx"
                            >
                              <Edit
                                className="h-4 w-4 mr-2"
                                data-oid="69u8c2v"
                              />
                              編輯
                            </DropdownMenuItem>
                          )}

                          {statusTransitions.length > 0 && (
                            <>
                              <DropdownMenuSeparator data-oid="dv_n8v0" />
                              {statusTransitions.map((status) => (
                                <DropdownMenuItem
                                  key={status}
                                  onClick={() =>
                                    handleUpdateStatus(purchase.id, status)
                                  }
                                  data-oid="mkp64dl"
                                >
                                  <CheckCircle
                                    className="h-4 w-4 mr-2"
                                    data-oid="34.chd."
                                  />
                                  更新為 {PURCHASE_STATUS_LABELS[status]}
                                </DropdownMenuItem>
                              ))}
                            </>
                          )}

                          {permissions.canCancel && (
                            <>
                              <DropdownMenuSeparator data-oid="tygngi5" />
                              <AlertDialog data-oid="_flow-s">
                                <AlertDialogTrigger asChild data-oid="m4agy_n">
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    data-oid="3z5i4.7"
                                  >
                                    <X
                                      className="h-4 w-4 mr-2"
                                      data-oid="gw-l10r"
                                    />
                                    取消進貨單
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent data-oid="kummxil">
                                  <AlertDialogHeader data-oid="ww0x:8i">
                                    <AlertDialogTitle data-oid="z3cw6h5">
                                      確認取消進貨單
                                    </AlertDialogTitle>
                                    <AlertDialogDescription data-oid="4b07cp6">
                                      確定要取消進貨單 "{purchase.order_number}"
                                      嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter data-oid="0yzrp4_">
                                    <AlertDialogCancel data-oid="y4aw:ax">
                                      取消
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleCancel(purchase.id)}
                                      data-oid="hexldth"
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
                              <DropdownMenuSeparator data-oid="xyaemi0" />
                              <AlertDialog data-oid="p.l1_4i">
                                <AlertDialogTrigger asChild data-oid="poa4l6n">
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-red-600"
                                    data-oid="i2vkz1u"
                                  >
                                    <Trash2
                                      className="h-4 w-4 mr-2"
                                      data-oid="-6ni7z_"
                                    />
                                    刪除
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent data-oid="1tov2r4">
                                  <AlertDialogHeader data-oid="8.m-91l">
                                    <AlertDialogTitle data-oid="56xz9xl">
                                      確認刪除進貨單
                                    </AlertDialogTitle>
                                    <AlertDialogDescription data-oid="7-vd0n2">
                                      確定要刪除進貨單 "{purchase.order_number}"
                                      嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter data-oid=":p.r1p7">
                                    <AlertDialogCancel data-oid="6y6.0d_">
                                      取消
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(purchase.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                      data-oid="x9eqzax"
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
                    data-oid=":tq9.5k"
                  >
                    <div
                      className="text-sm text-muted-foreground"
                      data-oid="b9v0083"
                    >
                      第 {purchasesResponse.meta.current_page} 頁，共{" "}
                      {purchasesResponse.meta.last_page} 頁 （總計{" "}
                      {purchasesResponse.meta.total} 筆記錄）
                    </div>
                    <div className="flex items-center gap-2" data-oid="x4a5l9d">
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
                        data-oid="301v9i2"
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
                        data-oid="5xdcmsg"
                      >
                        下一頁
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div className="text-center py-12" data-oid="t:4doqw">
              <Package
                className="h-12 w-12 text-muted-foreground mx-auto mb-4"
                data-oid="0mj15hy"
              />

              <h3 className="text-lg font-semibold mb-2" data-oid=".0c-8gy">
                沒有進貨單
              </h3>
              <p className="text-muted-foreground mb-4" data-oid="eola.rw">
                還沒有任何進貨單，點擊上方按鈕創建第一個進貨單。
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                data-oid="_hbez8e"
              >
                <Plus className="h-4 w-4 mr-2" data-oid="b9pfio8" />
                新增進貨單
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 創建進貨單對話框 */}
      <CreatePurchaseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        data-oid=".okax5z"
      />
    </div>
  );
}
