"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useStores,
  useAllInventoryTransactions,
} from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/components/ui/use-toast";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Package,
  PackagePlus,
  History,
  User,
  Calendar,
  Store,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowUp,
  Plus,
  FileText,
  TrendingUp,
  Clock,
  Activity,
} from "lucide-react";
import { CreatePurchaseDialog } from "@/components/purchases/CreatePurchaseDialog";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  getTransactionIcon,
  getTransactionTypeName,
  getTransactionTypeVariant,
} from "@/lib/inventory-utils";

interface IncomingFilters {
  store_id?: number;
  start_date?: string;
  end_date?: string;
  product_name?: string;
  order_number?: string;
  page?: number;
  per_page?: number;
}

export function IncomingManagement() {
  const { toast } = useToast();
  const router = useRouter();

  // 狀態管理
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [filters, setFilters] = useState<IncomingFilters>({
    page: 1,
    per_page: 20,
  });
  const [productNameInput, setProductNameInput] = useState("");

  // 使用 debounce 優化商品名稱搜尋
  const debouncedProductName = useDebounce(productNameInput, 300);

  // 獲取門市列表
  const { data: storesData, isLoading: isLoadingStores } = useStores();

  // 獲取入庫歷史（只查詢 addition 類型的交易記錄）
  const {
    data: transactionsData,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useAllInventoryTransactions({
    type: "addition", // 只查詢入庫記錄
    store_id: filters.store_id,
    start_date: filters.start_date,
    end_date: filters.end_date,
    product_name: debouncedProductName || undefined,
    page: filters.page,
    per_page: filters.per_page,
  });

  /**
   * 處理門市篩選變更
   */
  const handleStoreChange = (value: string) => {
    const storeId = value === "all" ? undefined : parseInt(value);
    setFilters((prev) => ({
      ...prev,
      store_id: storeId,
      page: 1,
    }));
  };

  /**
   * 處理日期篩選變更
   */
  const handleDateChange = (
    field: "start_date" | "end_date",
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value || undefined,
      page: 1,
    }));
  };

  /**
   * 重置所有篩選器
   */
  const handleResetFilters = () => {
    setFilters({
      page: 1,
      per_page: 20,
    });
    setProductNameInput("");
  };

  /**
   * 刷新數據
   */
  const handleRefresh = () => {
    refetchTransactions();
    toast({
      title: "重新整理",
      description: "已重新載入入庫數據",
    });
  };

  /**
   * 計算當前篩選器的數量
   */
  const getActiveFiltersCount = () => {
    let count = 0;
    if (debouncedProductName) count++;
    if (filters.store_id) count++;
    if (filters.start_date) count++;
    if (filters.end_date) count++;
    return count;
  };

  /**
   * 分頁處理
   */
  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // 顯示錯誤狀態
  if (transactionsError) {
    return (
      <div className="space-y-6 p-6" data-oid="i8jjcu_">
        <div className="flex flex-col space-y-2" data-oid="e:hw.i3">
          <h1 className="text-2xl font-bold" data-oid="x0v_jig">
            商品入庫管理
          </h1>
          <p className="text-muted-foreground" data-oid="0jvad58">
            專注處理商品入庫操作和歷史記錄管理
          </p>
        </div>

        <Alert className="mt-4" data-oid="0kkis72">
          <AlertCircle className="h-4 w-4" data-oid="ej-uzr1" />
          <AlertTitle data-oid="p8ef9ft">載入失敗</AlertTitle>
          <AlertDescription
            className="flex items-center justify-between"
            data-oid="f5v.ntw"
          >
            <span data-oid="4c54aut">無法載入入庫數據，請稍後再試</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-4"
              data-oid="szqjho:"
            >
              <RefreshCw className="h-4 w-4 mr-2" data-oid="tyh1cfa" />
              重試
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-oid="sm2kw.p">
      {/* 頁面標題區 */}
      <div
        className="flex items-center justify-between mb-6"
        data-oid="3kpj7se"
      >
        <div data-oid="2:ux65u">
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            data-oid="arit-le"
          >
            <PackagePlus
              className="h-7 w-7 text-green-600"
              data-oid="4v:an8q"
            />
            商品入庫管理
          </h1>
          <p className="text-muted-foreground mt-1" data-oid="ordnk6f">
            專注處理商品入庫操作、查看入庫歷史記錄和追蹤入庫進度
          </p>
        </div>

        <Button
          onClick={() => setPurchaseDialogOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          data-oid="u5s7wdz"
        >
          <Plus className="h-4 w-4" data-oid="l536-28" />
          新增進貨單
        </Button>
      </div>

      {/* 統計卡片區 */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 mb-6"
        data-oid="jxr69lp"
      >
        <Card className="@container/card" data-oid="-n7ik2r">
          <CardHeader data-oid="ogfk_b5">
            <CardDescription data-oid="x9ev6l8">
              今日入庫
            </CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
              data-oid="o_rxagw"
            >
              {transactionsData?.data?.filter((t: any) => {
                const today = new Date().toDateString();
                const transactionDate = new Date(
                  t.created_at || "",
                ).toDateString();
                return transactionDate === today;
              }).length || 0}
            </CardTitle>
            <CardAction data-oid="extopfo">
              <Badge variant="outline" className="text-green-600">
                <ArrowUp className="size-4" />
                新增
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter
            className="flex-col items-start gap-1.5 text-sm"
            data-oid="js3gos_"
          >
            <div className="line-clamp-1 flex gap-2 font-medium" data-oid=":pyp2ye">
              入庫作業進行中 <Activity className="size-4" />
            </div>
            <div className="text-muted-foreground">
              今日商品入庫操作次數
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card" data-oid="wntktvh">
          <CardHeader data-oid="m.bkg91">
            <CardDescription data-oid="a54-9.n">
              本週入庫
            </CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
              data-oid="sbikgnv"
            >
              {transactionsData?.data?.filter((t: any) => {
                const now = new Date();
                const weekAgo = new Date(
                  now.getTime() - 7 * 24 * 60 * 60 * 1000,
                );
                const transactionDate = new Date(t.created_at || "");
                return transactionDate >= weekAgo;
              }).length || 0}
            </CardTitle>
            <CardAction data-oid=".j5yn4k">
              <Badge variant="outline" className="text-blue-600">
                <TrendingUp className="size-4" />
                成長
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter
            className="flex-col items-start gap-1.5 text-sm"
            data-oid="jb14:s5"
          >
            <div className="line-clamp-1 flex gap-2 font-medium" data-oid="n1mpaw8">
              入庫效率良好 <Package className="size-4" />
            </div>
            <div className="text-muted-foreground">
              本週商品入庫統計
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card" data-oid="jifz05j">
          <CardHeader data-oid="unwvf--">
            <CardDescription data-oid="99_l3w7">
              總入庫次數
            </CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
              data-oid="45dxesw"
            >
              {transactionsData?.pagination?.total || 0}
            </CardTitle>
            <CardAction data-oid="-p0ecaa">
              <Badge variant="outline" className="text-purple-600">
                <History className="size-4" />
                總計
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter
            className="flex-col items-start gap-1.5 text-sm"
            data-oid="5jlrk3e"
          >
            <div className="line-clamp-1 flex gap-2 font-medium" data-oid="luffvxn">
              系統累計記錄 <History className="size-4" />
            </div>
            <div className="text-muted-foreground">
              歷史入庫操作總計
            </div>
          </CardFooter>
        </Card>

        <Card className="@container/card" data-oid="new_card">
          <CardHeader>
            <CardDescription>
              本月入庫
            </CardDescription>
            <CardTitle
              className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl"
            >
              {transactionsData?.data?.filter((t: any) => {
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const transactionDate = new Date(t.created_at || "");
                return transactionDate >= monthStart;
              }).length || 0}
            </CardTitle>
            <CardAction>
              <Badge variant="outline" className="text-orange-600">
                <Clock className="size-4" />
                本月
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter
            className="flex-col items-start gap-1.5 text-sm"
          >
            <div className="line-clamp-1 flex gap-2 font-medium">
              月度入庫統計 <Calendar className="size-4" />
            </div>
            <div className="text-muted-foreground">
              本月商品入庫次數
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* 篩選器區域 */}
      <Card className="@container/card" data-oid="1_p34cq">
        <CardHeader data-oid=".2w2b3u">
          <CardDescription data-oid="24lniga">
            使用以下篩選器來精確查找入庫記錄和相關資訊
          </CardDescription>
          <CardTitle className="flex items-center gap-2" data-oid="exo5gcn">
            <Search className="h-5 w-5" data-oid="wv-_pp6" />
            篩選入庫記錄
          </CardTitle>
          <CardAction data-oid="d1ew63r">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()} 項篩選
              </Badge>
            )}
          </CardAction>
        </CardHeader>
        <CardContent data-oid="g5oc1b-">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            data-oid="xvnqb6q"
          >
            {/* 商品名稱搜尋 */}
            <div className="space-y-2" data-oid="jos66j7">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="s41uy6j"
              >
                <Search className="h-4 w-4" data-oid="8tdv1oj" />
                商品名稱
              </label>
              <Input
                placeholder="搜尋商品名稱..."
                value={productNameInput}
                onChange={(e) => setProductNameInput(e.target.value)}
                className="w-full"
                data-oid="w5so9:a"
              />
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2" data-oid="xpdw7p:">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="6a4mty-"
              >
                <Store className="h-4 w-4" data-oid="n:ld__3" />
                門市
              </label>
              <Select
                value={filters.store_id?.toString() || "all"}
                onValueChange={handleStoreChange}
                data-oid=":gmv-ku"
              >
                <SelectTrigger data-oid=":q3r.cn">
                  <SelectValue placeholder="選擇門市" data-oid="u6r8bx1" />
                </SelectTrigger>
                <SelectContent data-oid=":o78ppc">
                  <SelectItem value="all" data-oid="yu.gbc-">
                    所有門市
                  </SelectItem>
                  {storesData?.data?.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={store.id?.toString() || ""}
                      data-oid="8wjsivm"
                    >
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 開始日期 */}
            <div className="space-y-2" data-oid="jjx1yg.">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="1x23kf2"
              >
                <Calendar className="h-4 w-4" data-oid=".0o0nf4" />
                開始日期
              </label>
              <Input
                type="date"
                value={filters.start_date || ""}
                onChange={(e) => handleDateChange("start_date", e.target.value)}
                data-oid="smjc3qw"
              />
            </div>

            {/* 結束日期 */}
            <div className="space-y-2" data-oid="d8hna85">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="7gsrpo6"
              >
                <Calendar className="h-4 w-4" data-oid="afkuheu" />
                結束日期
              </label>
              <Input
                type="date"
                value={filters.end_date || ""}
                onChange={(e) => handleDateChange("end_date", e.target.value)}
                data-oid="864g_w-"
              />
            </div>
          </div>

          {/* 操作按鈕區域 */}
          <div
            className="flex items-center justify-between pt-4"
            data-oid="u3fq9:x"
          >
            <div className="flex items-center gap-2" data-oid="jq7zarh">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                data-oid=".wteph7"
              >
                重置篩選
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                data-oid="_j:yrel"
              >
                <RefreshCw className="h-4 w-4 mr-2" data-oid="6cpb37q" />
                重新整理
              </Button>
            </div>
            {getActiveFiltersCount() > 0 && (
              <p className="text-sm text-muted-foreground" data-oid="n7_x:.8">
                找到 {transactionsData?.data?.length || 0} 筆結果
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 入庫歷史記錄 */}
      <Card data-oid="bytcqb2">
        <CardHeader data-oid="pfe1l-8">
          <CardTitle className="flex items-center gap-2" data-oid="7cdht5y">
            <History className="h-5 w-5" data-oid="otwc51_" />
            入庫歷史記錄
          </CardTitle>
          <CardDescription data-oid="n38c5vi">
            顯示所有商品入庫記錄，包括操作者、時間和詳細資訊
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="4bt3w13">
          {isLoadingTransactions ? (
            <div className="space-y-4" data-oid="h-2a24m">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse" data-oid="dnsj4c_">
                  <div
                    className="flex items-center space-x-4 p-4 border rounded-lg"
                    data-oid="gaax.2g"
                  >
                    <div
                      className="h-10 w-10 bg-muted rounded-full"
                      data-oid="zysvc7s"
                    ></div>
                    <div className="space-y-2 flex-1" data-oid="lq32uo6">
                      <div
                        className="h-4 bg-muted rounded w-3/4"
                        data-oid="-11r9tb"
                      ></div>
                      <div
                        className="h-4 bg-muted rounded w-1/2"
                        data-oid="d3de9cy"
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : transactionsData?.data && transactionsData.data.length > 0 ? (
            <div className="space-y-4" data-oid="cuoe-1a">
              {transactionsData.data.map((transaction: any) => (
                <div
                  key={transaction.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-oid="_ivcr78"
                >
                  <div className="mt-1" data-oid="d-8v:55">
                    {(() => {
                      const IconComponent = getTransactionIcon(
                        transaction.type || "addition",
                      );
                      return (
                        <IconComponent
                          className="h-5 w-5 text-green-600"
                          data-oid="9y266a4"
                        />
                      );
                    })()}
                  </div>

                  <div className="flex-1 space-y-2" data-oid="a6cnrn9">
                    <div
                      className="flex items-center justify-between"
                      data-oid="t3s3m4v"
                    >
                      <div
                        className="flex items-center gap-2"
                        data-oid="egdtme2"
                      >
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                          data-oid="lwgc68h"
                        >
                          商品入庫
                        </Badge>
                        <span
                          className="text-sm text-muted-foreground"
                          data-oid="luz60vj"
                        >
                          數量: +{transaction.quantity || 0}
                        </span>
                        {transaction.product?.name && (
                          <span
                            className="text-sm font-medium"
                            data-oid="4jx6_jf"
                          >
                            {transaction.product.name}
                          </span>
                        )}
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        data-oid=":eb4ime"
                      >
                        <Calendar className="h-4 w-4" data-oid="fbk4jyy" />
                        {transaction.created_at &&
                          formatDistanceToNow(
                            new Date(transaction.created_at),
                            {
                              addSuffix: true,
                              locale: zhTW,
                            },
                          )}
                      </div>
                    </div>

                    <div
                      className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"
                      data-oid=":wytr15"
                    >
                      <div data-oid="_fm69q_">
                        <span className="font-medium" data-oid="sx.120e">
                          變動前:
                        </span>{" "}
                        {transaction.before_quantity ?? "未知"}
                      </div>
                      <div data-oid="qvti07_">
                        <span className="font-medium" data-oid=".o5:b0k">
                          變動後:
                        </span>{" "}
                        {transaction.after_quantity ?? "未知"}
                      </div>
                      {transaction.user && (
                        <div
                          className="flex items-center gap-1"
                          data-oid="08e2tb0"
                        >
                          <User className="h-3 w-3" data-oid=".m3rsfp" />
                          <span className="font-medium" data-oid="w3rncng">
                            操作人:
                          </span>{" "}
                          {transaction.user.name}
                        </div>
                      )}
                    </div>

                    {transaction.store && (
                      <div
                        className="flex items-center gap-1 text-sm text-muted-foreground"
                        data-oid="lzam10f"
                      >
                        <Store className="h-3 w-3" data-oid="g4._mm:" />
                        <span className="font-medium" data-oid="sjnsvha">
                          門市:
                        </span>{" "}
                        {transaction.store.name}
                      </div>
                    )}

                    {transaction.notes && (
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="1s_yt86"
                      >
                        <span className="font-medium" data-oid="o:hsilr">
                          備註:
                        </span>{" "}
                        {transaction.notes}
                      </div>
                    )}

                    {transaction.metadata && (
                      <div
                        className="text-xs text-muted-foreground"
                        data-oid="y20y6rk"
                      >
                        <FileText
                          className="h-3 w-3 inline mr-1"
                          data-oid="hjocjhm"
                        />

                        <span className="font-medium" data-oid="63.6fws">
                          詳細資訊:
                        </span>
                        <span className="ml-1" data-oid="2cz5hz6">
                          {(() => {
                            let metadataObj: any = transaction.metadata;

                            if (typeof metadataObj === "string") {
                              try {
                                metadataObj = JSON.parse(metadataObj);
                              } catch (e) {
                                return String(metadataObj);
                              }
                            }

                            if (
                              typeof metadataObj === "object" &&
                              metadataObj !== null
                            ) {
                              const entries = Object.entries(metadataObj);
                              if (entries.length === 0) return "無";

                              return entries
                                .map(([key, value]) => {
                                  const displayKey = key
                                    .replace(/_/g, " ")
                                    .replace(/\b\w/g, (l) => l.toUpperCase())
                                    .replace("Order Id", "進貨單號")
                                    .replace("Purchase Order", "採購單號")
                                    .replace("Source", "來源");

                                  return `${displayKey}: ${String(value)}`;
                                })
                                .join(", ");
                            }

                            return "無";
                          })()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 分頁控制 */}
              {transactionsData.pagination &&
                (transactionsData.pagination.last_page || 0) > 1 && (
                  <div
                    className="flex items-center justify-between pt-4 border-t"
                    data-oid="qhllt7b"
                  >
                    <div
                      className="text-sm text-muted-foreground"
                      data-oid="2f_45h-"
                    >
                      頁面 {transactionsData.pagination.current_page || 1}，共{" "}
                      {transactionsData.pagination.total || 0} 筆記錄
                    </div>
                    <div className="flex items-center gap-2" data-oid="m.3ano9">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          (transactionsData.pagination.current_page || 1) <= 1
                        }
                        onClick={() =>
                          handlePageChange(
                            (transactionsData.pagination?.current_page || 1) -
                              1,
                          )
                        }
                        data-oid="f49eqp-"
                      >
                        上一頁
                      </Button>
                      <span className="text-sm" data-oid="291_ais">
                        第 {transactionsData.pagination.current_page || 1} /{" "}
                        {transactionsData.pagination.last_page || 1} 頁
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          (transactionsData.pagination.current_page || 1) >=
                          (transactionsData.pagination.last_page || 1)
                        }
                        onClick={() =>
                          handlePageChange(
                            (transactionsData.pagination?.current_page || 1) +
                              1,
                          )
                        }
                        data-oid="p80zwq6"
                      >
                        下一頁
                      </Button>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            <div
              className="text-center py-8 text-muted-foreground"
              data-oid="1_fv119"
            >
              <PackagePlus
                className="h-12 w-12 mx-auto mb-4 opacity-50"
                data-oid="o_m3g8x"
              />

              <p className="text-lg font-medium mb-2" data-oid="od35hcc">
                尚無入庫記錄
              </p>
              <p className="text-sm" data-oid="v8lwud2">
                點擊上方「新增進貨單」開始管理商品入庫
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增進貨單對話框 */}
      <CreatePurchaseDialog
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onSuccess={() => {
          refetchTransactions();
          toast({
            title: "進貨成功",
            description: "商品已成功入庫，庫存已更新",
          });
        }}
        data-oid="kyjz007"
      />
    </div>
  );
}
