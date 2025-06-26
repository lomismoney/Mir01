"use client";

import { useState, useEffect, useMemo } from "react";
import { useAllInventoryTransactions } from "@/hooks/queries/useEntityQueries";
import {
  InventoryTransaction,
  InventoryTransactionsResponse,
} from "@/types/api-helpers";
import { StoreCombobox } from "@/components/ui/store-combobox";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ArrowRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  History,
  Package,
  Search,
  TrendingUp,
  TrendingDown,
  User,
  RefreshCw,
} from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryHistoryPage() {
  const [filters, setFilters] = useState({
    store_id: undefined as number | undefined,
    type: undefined as string | undefined,
    page: 1,
    per_page: 20,
  });

  // 🎯 新增商品名稱搜尋功能
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // 查詢庫存交易記錄
  const {
    data: transactionsResponse,
    isLoading,
    error,
    refetch,
  } = useAllInventoryTransactions({
    store_id: filters.store_id,
    type: filters.type,
    page: filters.page,
    per_page: filters.per_page,
    product_name: debouncedSearchTerm || undefined,
  });

  // 處理並合併轉移記錄
  const processedTransactions = useMemo(() => {
    if (!transactionsResponse?.data) return [];

    const processed: InventoryTransaction[] = [];
    const transferMap = new Map<
      string,
      { out: InventoryTransaction | null; in: InventoryTransaction | null }
    >();

    // 首先收集所有轉移記錄
    transactionsResponse.data.forEach((transaction: InventoryTransaction) => {
      if (
        transaction.type === "transfer_out" ||
        transaction.type === "transfer_in"
      ) {
        // 從 metadata 獲取 transfer_id
        let transferId = null;
        if (transaction.metadata) {
          let metadataObj = transaction.metadata;
          if (typeof metadataObj === "string") {
            try {
              metadataObj = JSON.parse(metadataObj);
            } catch (e) {
              // 解析失敗，保持原樣
            }
          }
          transferId = metadataObj?.transfer_id;
        }

        if (transferId) {
          if (!transferMap.has(transferId)) {
            transferMap.set(transferId, { out: null, in: null });
          }
          const transfer = transferMap.get(transferId);
          if (transfer) {
            if (transaction.type === "transfer_out") {
              transfer.out = transaction;
            } else {
              transfer.in = transaction;
            }
          }
        } else {
          // 沒有 transfer_id 的轉移記錄，單獨顯示
          processed.push(transaction);
        }
      } else {
        // 非轉移記錄，直接加入
        processed.push(transaction);
      }
    });

    // 處理配對的轉移記錄
    transferMap.forEach((transfer, transferId) => {
      if (transfer.out && transfer.in) {
        // 找到配對的轉移記錄，創建合併記錄
        let fromStoreInfo = null;
        let toStoreInfo = null;

        // 從 metadata 獲取門市資訊
        if (transfer.out.metadata) {
          let metadataObj = transfer.out.metadata;
          if (typeof metadataObj === "string") {
            try {
              metadataObj = JSON.parse(metadataObj);
            } catch (e) {
              // 解析失敗
            }
          }
          if (metadataObj) {
            fromStoreInfo = {
              id: metadataObj.from_store_id,
              name: metadataObj.from_store_name || transfer.out.store?.name,
            };
            toStoreInfo = {
              id: metadataObj.to_store_id,
              name: metadataObj.to_store_name || transfer.in.store?.name,
            };
          }
        }

        // 如果沒有從 metadata 獲取到門市資訊，使用關聯的 store
        if (!fromStoreInfo) {
          fromStoreInfo = transfer.out.store || { id: null, name: "未知門市" };
        }
        if (!toStoreInfo) {
          toStoreInfo = transfer.in.store || { id: null, name: "未知門市" };
        }

        processed.push({
          id: -Math.abs(Date.now() + Math.floor(Math.random() * 10000)),
          type: "transfer",
          quantity: Math.abs(transfer.out.quantity || 0),
          product: transfer.out.product || transfer.in.product,
          from_store: fromStoreInfo,
          to_store: toStoreInfo,
          created_at: transfer.out.created_at,
          user: transfer.out.user,
          notes: transfer.out.notes,
          metadata: transfer.out.metadata,
          // 保留原始記錄以備需要
          _original: { out: transfer.out, in: transfer.in },
        } as InventoryTransaction & {
          from_store: { id: number | null; name: string };
          to_store: { id: number | null; name: string };
          _original: { out: InventoryTransaction; in: InventoryTransaction };
        });
      } else {
        // 沒有配對的轉移記錄，單獨顯示
        if (transfer.out) processed.push(transfer.out);
        if (transfer.in) processed.push(transfer.in);
      }
    });

    // 按時間排序
    return processed.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA; // 降序排列
    });
  }, [transactionsResponse?.data]);

  const handleStoreChange = (value: string) => {
    const storeId = value === "all" ? undefined : parseInt(value);
    setFilters((prev) => ({
      ...prev,
      store_id: storeId,
      page: 1, // 重置到第一頁
    }));
  };

  const handleTypeChange = (value: string) => {
    const type = value === "all" ? undefined : value;
    setFilters((prev) => ({
      ...prev,
      type,
      page: 1, // 重置到第一頁
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleRefresh = () => {
    refetch();
  };

  const getTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      addition: "新增",
      reduction: "減少",
      adjustment: "調整",
      transfer_in: "轉入",
      transfer_out: "轉出",
      transfer: "庫存轉移",
      transfer_cancel: "轉移取消",
    };
    return typeMap[type] || type;
  };

  const getTypeBadgeVariant = (type: string) => {
    const variantMap: Record<
      string,
      "default" | "secondary" | "destructive" | "outline"
    > = {
      addition: "default",
      reduction: "destructive",
      adjustment: "secondary",
      transfer_in: "default",
      transfer_out: "outline",
      transfer: "default",
      transfer_cancel: "destructive",
    };
    return variantMap[type] || "outline";
  };

  const getQuantityIcon = (quantity: number) => {
    return quantity > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" data-oid=".tv3xw8" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" data-oid="-gishjz" />
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy/MM/dd HH:mm", { locale: zhTW });
    } catch {
      return dateString;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8" data-oid="s2pgh4a">
        <Alert variant="destructive" data-oid=":3ns3s2">
          <AlertDescription data-oid="qxw1f50">
            載入庫存交易記錄失敗，請稍後再試。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pagination = transactionsResponse?.pagination;

  return (
    <div className="container mx-auto py-8 space-y-6" data-oid="7cm4pcn">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between" data-oid="1:l7wxg">
        <div data-oid="69jgs3l">
          <h1
            className="text-3xl font-bold flex items-center gap-2"
            data-oid="fqyvn10"
          >
            <History className="h-8 w-8" data-oid="yc896x2" />
            庫存變動歷史
          </h1>
          <p className="text-muted-foreground mt-2" data-oid="pvvqv18">
            查看所有商品的庫存變動記錄
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
          data-oid="kqwdg_e"
        >
          <RefreshCw className="h-4 w-4" data-oid="ubw4wp_" />
          重新整理
        </Button>
      </div>

      {/* 篩選器區域 */}
      <Card data-oid="-xqo57:">
        <CardHeader data-oid="lcf01yv">
          <CardTitle className="flex items-center gap-2" data-oid="rvg2dqr">
            <Filter className="h-5 w-5" data-oid="j0u:9ip" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="01pitr9">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            data-oid="rn8fseu"
          >
            {/* 商品名稱搜尋 */}
            <div className="space-y-2" data-oid="833fz5z">
              <label className="text-sm font-medium" data-oid="ev.b3w2">
                商品名稱
              </label>
              <div className="relative" data-oid="2v:f:cx">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  data-oid="4z54jow"
                />

                <Input
                  placeholder="搜尋商品名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-oid="3fd8mln"
                />
              </div>
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2" data-oid="_rt-rp0">
              <label className="text-sm font-medium" data-oid="7.tqxh:">
                分店篩選
              </label>
              <StoreCombobox
                value={filters.store_id?.toString() || "all"}
                onValueChange={handleStoreChange}
                placeholder="全部分店"
                className="w-full"
                data-oid="o6jp0xa"
              />
            </div>

            {/* 交易類型篩選 */}
            <div className="space-y-2" data-oid="xn:gm_2">
              <label className="text-sm font-medium" data-oid="wxms3cw">
                交易類型
              </label>
              <Select
                value={filters.type || "all"}
                onValueChange={handleTypeChange}
                data-oid="o1i6.16"
              >
                <SelectTrigger data-oid="u5a3v0o">
                  <SelectValue placeholder="選擇交易類型" data-oid="pz:9n0l" />
                </SelectTrigger>
                <SelectContent data-oid="gwprifj">
                  <SelectItem value="all" data-oid=".3obh3q">
                    全部類型
                  </SelectItem>
                  <SelectItem value="addition" data-oid="fylk79o">
                    新增
                  </SelectItem>
                  <SelectItem value="reduction" data-oid="vl8b:44">
                    減少
                  </SelectItem>
                  <SelectItem value="adjustment" data-oid="dnx.6hy">
                    調整
                  </SelectItem>
                  <SelectItem value="transfer_in" data-oid="a.z0e6c">
                    轉入
                  </SelectItem>
                  <SelectItem value="transfer_out" data-oid="mswn-uv">
                    轉出
                  </SelectItem>
                  <SelectItem value="transfer_cancel" data-oid="edgarj_">
                    轉移取消
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易記錄列表 */}
      <Card data-oid="a0i:.f5">
        <CardHeader data-oid="r0k8-sg">
          <CardTitle className="flex items-center gap-2" data-oid="deqku6t">
            <Package className="h-5 w-5" data-oid="djeto06" />
            交易記錄
          </CardTitle>
          <CardDescription data-oid="_xycdt6">
            {pagination && `共 ${pagination.total} 筆記錄`}
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="d9drgr7">
          {isLoading ? (
            <div className="space-y-4" data-oid="o6_:izg">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                  data-oid="exib5tx"
                >
                  <Skeleton className="h-12 w-12 rounded" data-oid="cglf6w0" />
                  <div className="flex-1 space-y-2" data-oid="j5yvhqy">
                    <Skeleton className="h-4 w-[300px]" data-oid=".5bhsf_" />
                    <Skeleton className="h-4 w-[200px]" data-oid="4lvq-l3" />
                  </div>
                  <Skeleton className="h-6 w-[100px]" data-oid="2_cq8bb" />
                </div>
              ))}
            </div>
          ) : processedTransactions && processedTransactions.length > 0 ? (
            <div className="space-y-3" data-oid="2hqu9-j">
              {processedTransactions.map(
                (
                  transaction: InventoryTransaction & {
                    from_store?: { id: number | null; name: string };
                    to_store?: { id: number | null; name: string };
                    _original?: {
                      out: InventoryTransaction;
                      in: InventoryTransaction;
                    };
                  },
                  index: number,
                ) => {
                  // 處理合併的轉移記錄
                  if (transaction.type === "transfer") {
                    return (
                      <div
                        key={`${transaction.id}-${index}`}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                        data-oid="oy-4i48"
                      >
                        <div
                          className="flex items-start space-x-4"
                          data-oid="8bbj6-l"
                        >
                          <div
                            className="p-2 bg-blue-100 rounded-lg"
                            data-oid="6e29-pb"
                          >
                            <Package
                              className="h-4 w-4 text-blue-600"
                              data-oid="4go.ndf"
                            />
                          </div>

                          <div className="flex-1 space-y-3" data-oid="gnrmk4u">
                            <div
                              className="flex items-center justify-between"
                              data-oid="2ea3b_y"
                            >
                              <div
                                className="flex items-center gap-2 flex-wrap"
                                data-oid="4-9bbg6"
                              >
                                <h3 className="font-medium" data-oid="4ic_n8.">
                                  {transaction.product?.name}
                                </h3>
                                <Badge variant="outline" data-oid="yqftti:">
                                  SKU: {transaction.product?.sku}
                                </Badge>
                                <Badge
                                  variant="default"
                                  className="bg-blue-600"
                                  data-oid="qf0i1rq"
                                >
                                  庫存轉移
                                </Badge>
                                <span
                                  className="text-sm text-muted-foreground"
                                  data-oid="akpory6"
                                >
                                  數量: {transaction.quantity}
                                </span>
                              </div>
                              <div
                                className="flex items-center gap-1 text-sm text-muted-foreground"
                                data-oid="w16gfcn"
                              >
                                <Calendar
                                  className="h-4 w-4"
                                  data-oid="-cherk9"
                                />

                                <span data-oid="_t5:2s2">
                                  {formatDate(transaction.created_at || "")}
                                </span>
                              </div>
                            </div>

                            <div
                              className="flex items-center gap-2 text-sm"
                              data-oid="u3jkesk"
                            >
                              <Badge variant="outline" data-oid="spb9uzp">
                                {transaction.from_store?.name || "未知門市"}
                              </Badge>
                              <ArrowRight
                                className="h-4 w-4 text-muted-foreground"
                                data-oid="zsmje9c"
                              />

                              <Badge variant="outline" data-oid="v4u14bb">
                                {transaction.to_store?.name || "未知門市"}
                              </Badge>
                            </div>

                            <div
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                              data-oid="-f4w4f3"
                            >
                              {transaction._original?.out && (
                                <div data-oid="icnzpc3">
                                  <span
                                    className="font-medium"
                                    data-oid="51.-g_9"
                                  >
                                    {transaction.from_store?.name || "未知門市"}{" "}
                                    轉出後:
                                  </span>{" "}
                                  {transaction._original.out.after_quantity ??
                                    "未知"}
                                </div>
                              )}
                              {transaction._original?.in && (
                                <div data-oid="3307fe-">
                                  <span
                                    className="font-medium"
                                    data-oid="vct:voe"
                                  >
                                    {transaction.to_store?.name || "未知門市"}{" "}
                                    轉入後:
                                  </span>{" "}
                                  {transaction._original.in.after_quantity ??
                                    "未知"}
                                </div>
                              )}
                            </div>

                            {transaction.user && (
                              <div
                                className="flex items-center gap-1 text-sm text-muted-foreground"
                                data-oid="ed45v79"
                              >
                                <User className="h-4 w-4" data-oid="x6bmxkk" />
                                <span
                                  className="font-medium"
                                  data-oid="ojtk0ai"
                                >
                                  操作人:
                                </span>{" "}
                                {transaction.user.name}
                              </div>
                            )}

                            {transaction.notes && (
                              <div
                                className="text-sm text-muted-foreground"
                                data-oid="scu.fek"
                              >
                                <span
                                  className="font-medium"
                                  data-oid="urjm_:8"
                                >
                                  備註:
                                </span>{" "}
                                {transaction.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // 原始的單一記錄顯示邏輯
                  return (
                    <div
                      key={`${transaction.id}-${index}`}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-oid="t8h6y62"
                    >
                      <div
                        className="flex items-start space-x-4 flex-1"
                        data-oid="61_0mwm"
                      >
                        <div
                          className="p-2 bg-muted rounded-lg"
                          data-oid="l1vm3c:"
                        >
                          {getQuantityIcon(transaction.quantity || 0)}
                        </div>
                        <div className="flex-1 space-y-2" data-oid="w6wof8.">
                          <div
                            className="flex items-center gap-2 flex-wrap"
                            data-oid="wi6wee."
                          >
                            <h3 className="font-medium" data-oid="e6huc15">
                              {transaction.product?.name}
                            </h3>
                            <Badge variant="outline" data-oid="bkylw3.">
                              SKU: {transaction.product?.sku}
                            </Badge>
                            <Badge
                              variant={getTypeBadgeVariant(
                                transaction.type || "",
                              )}
                              data-oid="-y8v.:s"
                            >
                              {getTypeDisplayName(transaction.type || "")}
                            </Badge>
                          </div>

                          <div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground"
                            data-oid="kja7b1e"
                          >
                            <div
                              className="flex items-center gap-1"
                              data-oid="yzoenwm"
                            >
                              <Package className="h-4 w-4" data-oid="zbcxt.f" />
                              <span data-oid="es1t8zn">
                                數量: {transaction.quantity}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              data-oid="wgl72-:"
                            >
                              <span data-oid="xdy00z7">
                                前: {transaction.before_quantity}
                              </span>
                              <span data-oid="owjq48k">→</span>
                              <span data-oid="h6..wk6">
                                後: {transaction.after_quantity}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              data-oid="4vlf-qj"
                            >
                              <span data-oid="jvmyq1t">
                                {transaction.store?.name}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              data-oid="jo2jhzt"
                            >
                              <User className="h-4 w-4" data-oid="3kp-klk" />
                              <span data-oid=":_r4sqz">
                                {transaction.user?.name}
                              </span>
                            </div>
                          </div>

                          {transaction.notes && (
                            <div
                              className="text-sm text-muted-foreground"
                              data-oid="3_yd:yv"
                            >
                              備註: {transaction.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className="flex flex-col items-end gap-2"
                        data-oid="1i369cd"
                      >
                        <div
                          className="flex items-center gap-1 text-sm text-muted-foreground"
                          data-oid="1yny-dz"
                        >
                          <Calendar className="h-4 w-4" data-oid="0s6tc:p" />
                          <span data-oid="kafh-px">
                            {formatDate(transaction.created_at || "")}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                },
              )}
            </div>
          ) : (
            <div
              className="text-center py-8 text-muted-foreground"
              data-oid="zh871ru"
            >
              <Package
                className="h-12 w-12 mx-auto mb-4 opacity-20"
                data-oid="yzx80oi"
              />

              <p data-oid="0u44bsb">沒有找到交易記錄</p>
              <p className="text-sm" data-oid="e_.h09e">
                請嘗試調整搜尋條件
              </p>
            </div>
          )}

          {/* 分頁控制 */}
          {pagination && pagination.last_page && pagination.last_page > 1 && (
            <div
              className="flex items-center justify-between mt-6 pt-6 border-t"
              data-oid="ua5rd80"
            >
              <div className="text-sm text-muted-foreground" data-oid="l3lwbcn">
                第 {pagination.current_page} 頁，共 {pagination.last_page} 頁
                （總計 {pagination.total} 筆記錄）
              </div>

              <div className="flex items-center gap-2" data-oid="2e7h91z">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange((pagination.current_page || 1) - 1)
                  }
                  disabled={pagination.current_page === 1}
                  data-oid="68uvr_7"
                >
                  <ChevronLeft className="h-4 w-4" data-oid="92p1kff" />
                  上一頁
                </Button>

                <div className="flex items-center gap-1" data-oid="2ps5:n.">
                  {Array.from(
                    { length: Math.min(5, pagination.last_page || 1) },
                    (_, i) => {
                      const currentPage = pagination.current_page || 1;
                      const totalPages = pagination.last_page || 1;

                      let pageNumber: number;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            pageNumber === currentPage ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => handlePageChange(pageNumber)}
                          className="w-10"
                          data-oid="ucie_qi"
                        >
                          {pageNumber}
                        </Button>
                      );
                    },
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange((pagination.current_page || 1) + 1)
                  }
                  disabled={pagination.current_page === pagination.last_page}
                  data-oid="kp80p_j"
                >
                  下一頁
                  <ChevronRight className="h-4 w-4" data-oid="jdmp3pq" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
