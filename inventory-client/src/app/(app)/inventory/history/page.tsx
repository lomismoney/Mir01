"use client";

import { useState, useEffect, useMemo } from "react";
import { useAllInventoryTransactions } from "@/hooks/queries/useEntityQueries";
import {
  InventoryTransaction,
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
      <TrendingUp className="h-4 w-4 text-green-600" data-oid="gsw7z4." />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" data-oid="0umv::l" />
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
      <div className="container mx-auto py-8" data-oid="b8y8rdj">
        <Alert variant="destructive" data-oid="j4vi68z">
          <AlertDescription data-oid="ljijyfg">
            載入庫存交易記錄失敗，請稍後再試。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const pagination = transactionsResponse?.pagination;

  return (
    <div className="container mx-auto py-8 space-y-6" data-oid="tk7isus">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between" data-oid="hut569h">
        <div data-oid="dq3wmpx">
          <h1
            className="text-3xl font-bold flex items-center gap-2"
            data-oid="j5a8.b5"
          >
            <History className="h-8 w-8" data-oid="uegw.ng" />
            庫存變動歷史
          </h1>
          <p className="text-muted-foreground mt-2" data-oid="59cnedq">
            查看所有商品的庫存變動記錄
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          className="flex items-center gap-2"
          data-oid="mnkbp03"
        >
          <RefreshCw className="h-4 w-4" data-oid="qvp:g:a" />
          重新整理
        </Button>
      </div>

      {/* 篩選器區域 */}
      <Card data-oid="yv7hm:h">
        <CardHeader data-oid="lgy0l1w">
          <CardTitle className="flex items-center gap-2" data-oid=":rr695:">
            <Filter className="h-5 w-5" data-oid="1s6h__x" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="__ssi5n">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            data-oid="5wbwua."
          >
            {/* 商品名稱搜尋 */}
            <div className="space-y-2" data-oid="7-fojy4">
              <label className="text-sm font-medium" data-oid="tvrtggt">
                商品名稱
              </label>
              <div className="relative" data-oid="9g650o-">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
                  data-oid="tl1dmqd"
                />

                <Input
                  placeholder="搜尋商品名稱..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-oid="ljbn35d"
                />
              </div>
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2" data-oid="mn1akf5">
              <label className="text-sm font-medium" data-oid="zlgpff4">
                分店篩選
              </label>
              <StoreCombobox
                value={filters.store_id?.toString() || "all"}
                onValueChange={handleStoreChange}
                placeholder="全部分店"
                className="w-full"
                data-oid="6m0fjy1"
              />
            </div>

            {/* 交易類型篩選 */}
            <div className="space-y-2" data-oid="a--jq:4">
              <label className="text-sm font-medium" data-oid="4cpbuas">
                交易類型
              </label>
              <Select
                value={filters.type || "all"}
                onValueChange={handleTypeChange}
                data-oid="1x-a525"
              >
                <SelectTrigger data-oid="4l2xwwy">
                  <SelectValue placeholder="選擇交易類型" data-oid="5.t88-3" />
                </SelectTrigger>
                <SelectContent data-oid="ausa:wm">
                  <SelectItem value="all" data-oid="q65g9xf">
                    全部類型
                  </SelectItem>
                  <SelectItem value="addition" data-oid="gijoonp">
                    新增
                  </SelectItem>
                  <SelectItem value="reduction" data-oid="c.d44ub">
                    減少
                  </SelectItem>
                  <SelectItem value="adjustment" data-oid="2kbgaas">
                    調整
                  </SelectItem>
                  <SelectItem value="transfer_in" data-oid="bprcoue">
                    轉入
                  </SelectItem>
                  <SelectItem value="transfer_out" data-oid=".7mpcp5">
                    轉出
                  </SelectItem>
                  <SelectItem value="transfer_cancel" data-oid="1ki1em0">
                    轉移取消
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易記錄列表 */}
      <Card data-oid="pnmg3xb">
        <CardHeader data-oid="_bhfkeq">
          <CardTitle className="flex items-center gap-2" data-oid="z8-h9m2">
            <Package className="h-5 w-5" data-oid="q4ju:ff" />
            交易記錄
          </CardTitle>
          <CardDescription data-oid="j7lasqg">
            {pagination && `共 ${pagination.total} 筆記錄`}
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="l13ptvq">
          {isLoading ? (
            <div className="space-y-4" data-oid="6zf4o:k">
              {Array.from({ length: 10 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                  data-oid="z880s4c"
                >
                  <Skeleton className="h-12 w-12 rounded" data-oid="9q-a04g" />
                  <div className="flex-1 space-y-2" data-oid="vopwqe:">
                    <Skeleton className="h-4 w-[300px]" data-oid="t.2vkh9" />
                    <Skeleton className="h-4 w-[200px]" data-oid="elrad7_" />
                  </div>
                  <Skeleton className="h-6 w-[100px]" data-oid="h0vca57" />
                </div>
              ))}
            </div>
          ) : processedTransactions && processedTransactions.length > 0 ? (
            <div className="space-y-3" data-oid=".nubxgi">
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
                        data-oid="zjxi081"
                      >
                        <div
                          className="flex items-start space-x-4"
                          data-oid="aby69co"
                        >
                          <div
                            className="p-2 bg-blue-100 rounded-lg"
                            data-oid="mc_ua3j"
                          >
                            <Package
                              className="h-4 w-4 text-blue-600"
                              data-oid="iscg9nr"
                            />
                          </div>

                          <div className="flex-1 space-y-3" data-oid="iq.9kxw">
                            <div
                              className="flex items-center justify-between"
                              data-oid="u61.4d5"
                            >
                              <div
                                className="flex items-center gap-2 flex-wrap"
                                data-oid="gx5qobo"
                              >
                                <h3 className="font-medium" data-oid="vahq4y_">
                                  {transaction.product?.name}
                                </h3>
                                <Badge variant="outline" data-oid="et55n9a">
                                  SKU: {transaction.product?.sku}
                                </Badge>
                                <Badge
                                  variant="default"
                                  className="bg-blue-600"
                                  data-oid="f8nyl-y"
                                >
                                  庫存轉移
                                </Badge>
                                <span
                                  className="text-sm text-muted-foreground"
                                  data-oid="p:.2x8f"
                                >
                                  數量: {transaction.quantity}
                                </span>
                              </div>
                              <div
                                className="flex items-center gap-1 text-sm text-muted-foreground"
                                data-oid="co6czxe"
                              >
                                <Calendar
                                  className="h-4 w-4"
                                  data-oid="w7-ky.f"
                                />

                                <span data-oid="jgkrfxo">
                                  {formatDate(transaction.created_at || "")}
                                </span>
                              </div>
                            </div>

                            <div
                              className="flex items-center gap-2 text-sm"
                              data-oid="om5j:98"
                            >
                              <Badge variant="outline" data-oid="v9.lpu6">
                                {transaction.from_store?.name || "未知門市"}
                              </Badge>
                              <ArrowRight
                                className="h-4 w-4 text-muted-foreground"
                                data-oid="zl8i:cg"
                              />

                              <Badge variant="outline" data-oid="b0h_yl3">
                                {transaction.to_store?.name || "未知門市"}
                              </Badge>
                            </div>

                            <div
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                              data-oid="6erer6k"
                            >
                              {transaction._original?.out && (
                                <div data-oid="lkdg0gs">
                                  <span
                                    className="font-medium"
                                    data-oid="mpi1m-f"
                                  >
                                    {transaction.from_store?.name || "未知門市"}{" "}
                                    轉出後:
                                  </span>{" "}
                                  {transaction._original.out.after_quantity ??
                                    "未知"}
                                </div>
                              )}
                              {transaction._original?.in && (
                                <div data-oid="e:jad2_">
                                  <span
                                    className="font-medium"
                                    data-oid="buqnq5q"
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
                                data-oid="g_5mog5"
                              >
                                <User className="h-4 w-4" data-oid="p9ycaj:" />
                                <span
                                  className="font-medium"
                                  data-oid="2qpvc9t"
                                >
                                  操作人:
                                </span>{" "}
                                {transaction.user.name}
                              </div>
                            )}

                            {transaction.notes && (
                              <div
                                className="text-sm text-muted-foreground"
                                data-oid="0enu2p2"
                              >
                                <span
                                  className="font-medium"
                                  data-oid="-pdtqc1"
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
                      data-oid="i03ve5c"
                    >
                      <div
                        className="flex items-start space-x-4 flex-1"
                        data-oid="7ne5wfi"
                      >
                        <div
                          className="p-2 bg-muted rounded-lg"
                          data-oid="-n0lz2n"
                        >
                          {getQuantityIcon(transaction.quantity || 0)}
                        </div>
                        <div className="flex-1 space-y-2" data-oid="l3ufd18">
                          <div
                            className="flex items-center gap-2 flex-wrap"
                            data-oid="7c2n5tk"
                          >
                            <h3 className="font-medium" data-oid="e52am7.">
                              {transaction.product?.name}
                            </h3>
                            <Badge variant="outline" data-oid=".hbl3m6">
                              SKU: {transaction.product?.sku}
                            </Badge>
                            <Badge
                              variant={getTypeBadgeVariant(
                                transaction.type || "",
                              )}
                              data-oid="i6n5fqv"
                            >
                              {getTypeDisplayName(transaction.type || "")}
                            </Badge>
                          </div>

                          <div
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground"
                            data-oid=":qskras"
                          >
                            <div
                              className="flex items-center gap-1"
                              data-oid="-o_hpfd"
                            >
                              <Package className="h-4 w-4" data-oid="0za1ulh" />
                              <span data-oid="4u1:2fn">
                                數量: {transaction.quantity}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              data-oid="pokxmdl"
                            >
                              <span data-oid="a3qir1s">
                                前: {transaction.before_quantity}
                              </span>
                              <span data-oid="awt1-qm">→</span>
                              <span data-oid="5lctauh">
                                後: {transaction.after_quantity}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              data-oid="g:3l3rx"
                            >
                              <span data-oid="e8i1ig-">
                                {transaction.store?.name}
                              </span>
                            </div>
                            <div
                              className="flex items-center gap-1"
                              data-oid="lteb2fp"
                            >
                              <User className="h-4 w-4" data-oid="zj1z9en" />
                              <span data-oid="sqhid_w">
                                {transaction.user?.name}
                              </span>
                            </div>
                          </div>

                          {transaction.notes && (
                            <div
                              className="text-sm text-muted-foreground"
                              data-oid="376yxw2"
                            >
                              備註: {transaction.notes}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className="flex flex-col items-end gap-2"
                        data-oid="q:2u46k"
                      >
                        <div
                          className="flex items-center gap-1 text-sm text-muted-foreground"
                          data-oid="19rvz6l"
                        >
                          <Calendar className="h-4 w-4" data-oid="s6gzbr9" />
                          <span data-oid="6_.95jh">
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
              data-oid="5:_54zj"
            >
              <Package
                className="h-12 w-12 mx-auto mb-4 opacity-20"
                data-oid="ivddutg"
              />

              <p data-oid="w32k2i_">沒有找到交易記錄</p>
              <p className="text-sm" data-oid="-7e1f3u">
                請嘗試調整搜尋條件
              </p>
            </div>
          )}

          {/* 分頁控制 */}
          {pagination && pagination.last_page && pagination.last_page > 1 && (
            <div
              className="flex items-center justify-between mt-6 pt-6 border-t"
              data-oid="lq1_jgw"
            >
              <div className="text-sm text-muted-foreground" data-oid="zifnbpd">
                第 {pagination.current_page} 頁，共 {pagination.last_page} 頁
                （總計 {pagination.total} 筆記錄）
              </div>

              <div className="flex items-center gap-2" data-oid="gnjg1.3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange((pagination.current_page || 1) - 1)
                  }
                  disabled={pagination.current_page === 1}
                  data-oid="t24uv9a"
                >
                  <ChevronLeft className="h-4 w-4" data-oid="13heo02" />
                  上一頁
                </Button>

                <div className="flex items-center gap-1" data-oid="gd9z9ew">
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
                          data-oid="4tmr1hx"
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
                  data-oid=":swxf:c"
                >
                  下一頁
                  <ChevronRight className="h-4 w-4" data-oid="45zx.li" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
