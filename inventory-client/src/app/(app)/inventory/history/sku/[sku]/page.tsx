"use client";

import { useState, useEffect, useMemo } from "react";
import { useSkuInventoryHistory } from "@/hooks/queries/useEntityQueries";
import {
  getTransactionIcon,
  getTransactionTypeName,
  getTransactionTypeVariant,
  getTransactionIconColor,
} from "@/lib/inventory-utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StoreCombobox } from "@/components/ui/store-combobox";
import {
  Calendar,
  Clock,
  User,
  RefreshCw,
  Search,
  Building,
  ArrowRight,
  Package,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
// 定義 API 響應類型
interface SkuHistoryResponse {
  message: string;
  data: InventoryTransaction[];
  inventories: InventoryItem[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

interface InventoryTransaction {
  id: number;
  inventory_id: number;
  user_id: number;
  type: string;
  quantity: number;
  before_quantity: number;
  after_quantity: number;
  notes?: string;
  metadata?: any;
  created_at: string;
  updated_at: string;
  store?: {
    id: number;
    name: string;
  };
  user?: {
    name: string;
  };
  product?: {
    name: string;
    sku: string;
  };
}

interface InventoryItem {
  id: number;
  quantity: number;
  low_stock_threshold: number;
  store?: {
    id: number;
    name: string;
  };
  product_variant?: {
    sku: string;
    product?: {
      name: string;
    };
  };
}

interface SkuHistoryPageProps {
  params: Promise<{
    sku: string;
  }>;
  searchParams: Promise<{
    productName?: string;
  }>;
}

export default function SkuHistoryPage({
  params,
  searchParams,
}: SkuHistoryPageProps) {
  const [sku, setSku] = useState<string>("");
  const [productName, setProductName] = useState<string>("未知商品");
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    store_id: "",
    start_date: "",
    end_date: "",
    per_page: 20,
    page: 1,
  });

  useEffect(() => {
    async function resolveParams() {
      const resolvedParams = await params;
      const resolvedSearchParams = await searchParams;
      setSku(decodeURIComponent(resolvedParams.sku));
      setProductName(resolvedSearchParams.productName || "未知商品");
      setMounted(true);
    }
    resolveParams();
  }, [params, searchParams]);

  // 🎯 最終純化：直接使用標準化的 SKU 歷史查詢 API
  const {
    data: skuHistoryData,
    isLoading: isLoadingHistory,
    error: historyError,
  } = useSkuInventoryHistory({
    sku: sku || "",
    ...filters,
  });

  // 🎯 最終的純淨形態：直接從 Hook 返回的結構中解構，無需任何手動處理
  const matchingInventories = useMemo(() => {
    return skuHistoryData?.inventories ?? [];
  }, [skuHistoryData]);

  const allTransactions = useMemo(() => {
    return skuHistoryData?.data ?? [];
  }, [skuHistoryData]);

  // 處理並合併轉移記錄
  const processedTransactions = useMemo(() => {
    const processed: any[] = [];
    const transferMap = new Map<string, any>();

    // 首先收集所有轉移記錄
    allTransactions.forEach((transaction: any) => {
      if (
        transaction.type === "transfer_out" ||
        transaction.type === "transfer_in"
      ) {
        // 嘗試從 metadata 獲取 transfer_id
        let transferId = null;
        if (transaction.metadata) {
          // 處理可能的字符串形式的 metadata
          let metadataObj = transaction.metadata;
          if (typeof metadataObj === "string") {
            try {
              metadataObj = JSON.parse(metadataObj);
            } catch (e) {
              // 解析失敗，保持原樣
            }
          }
          transferId = metadataObj?.transfer_id || metadataObj?.Transfer?.Id;
        }

        if (transferId) {
          if (!transferMap.has(transferId)) {
            transferMap.set(transferId, { out: null, in: null });
          }
          const transfer = transferMap.get(transferId);
          if (transaction.type === "transfer_out") {
            transfer.out = transaction;
          } else {
            transfer.in = transaction;
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
        const fromInventory = matchingInventories.find(
          (inv: any) => inv.id === transfer.out.inventory_id,
        );
        const toInventory = matchingInventories.find(
          (inv: any) => inv.id === transfer.in.inventory_id,
        );

        processed.push({
          id: `transfer-${transferId}`,
          type: "transfer",
          quantity: Math.abs(transfer.out.quantity),
          from_store: fromInventory?.store || { name: "未知門市" },
          to_store: toInventory?.store || { name: "未知門市" },
          created_at: transfer.out.created_at,
          user: transfer.out.user,
          notes: transfer.out.notes,
          metadata: transfer.out.metadata,
          // 保留原始記錄以備需要
          _original: { out: transfer.out, in: transfer.in },
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
  }, [allTransactions, matchingInventories]);

  // 根據篩選條件進行過濾
  const filteredTransactions = useMemo(() => {
    let filtered = processedTransactions;

    // 類型篩選
    if (filters.type) {
      filtered = filtered.filter((transaction: any) => {
        // 處理合併的轉移記錄
        if (filters.type === "transfer") {
          return (
            transaction.type === "transfer" ||
            transaction.type === "transfer_in" ||
            transaction.type === "transfer_out"
          );
        }
        return transaction.type === filters.type;
      });
    }

    // 分店篩選
    if (filters.store_id) {
      const storeIdToFilter = parseInt(filters.store_id);
      filtered = filtered.filter((transaction: any) => {
        if (transaction.type === "transfer") {
          // 轉移記錄，檢查是否涉及篩選的門市
          return (
            transaction.from_store?.id === storeIdToFilter ||
            transaction.to_store?.id === storeIdToFilter
          );
        } else {
          // 其他記錄，檢查庫存所屬門市
          const relatedInventory = matchingInventories.find(
            (inv: any) => inv.id === transaction.inventory_id,
          );
          return relatedInventory?.store?.id === storeIdToFilter;
        }
      });
    }

    return filtered;
  }, [
    processedTransactions,
    filters.type,
    filters.store_id,
    matchingInventories,
  ]);

  // 條件性渲染移到最後
  if (!mounted || !sku) {
    return (
      <div className="container mx-auto py-8" data-oid="m3a83o:">
        <Card data-oid=".ox2roo">
          <CardContent className="p-6" data-oid="1fv_bth">
            <div className="space-y-4" data-oid="ni5bufi">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-16 w-full"
                  data-oid="onz:0dw"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoadingHistory) {
    return (
      <div className="container mx-auto py-8" data-oid="k8as6gr">
        <Card data-oid="0teab43">
          <CardContent className="p-6" data-oid="3rcgzfd">
            <div className="space-y-4" data-oid="wq551bl">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-16 w-full"
                  data-oid="q256qz4"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="container mx-auto py-8" data-oid="i:6nuy-">
        <Alert variant="destructive" data-oid="8af08sz">
          <AlertDescription data-oid="cxswmj6">
            載入庫存歷史記錄失敗，請稍後再試。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (matchingInventories.length === 0) {
    return (
      <div className="container mx-auto py-8" data-oid="thaj61d">
        <Alert data-oid="wvx-pbt">
          <AlertDescription data-oid="egma5kz">
            找不到 SKU 為 "{sku}" 的庫存項目。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" data-oid="binpewz">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between" data-oid="e2jxqec">
        <div data-oid="mc7jg64">
          <h2 className="text-2xl font-bold" data-oid="snt.a79">
            SKU 庫存變動歷史
          </h2>
          <p className="text-muted-foreground" data-oid="mdx.77_">
            {productName} (SKU: {sku})
          </p>
          <p className="text-sm text-muted-foreground mt-1" data-oid=":u8_w4_">
            覆蓋 {matchingInventories.length} 個分店的庫存記錄
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          data-oid="u50hhgn"
        >
          <RefreshCw className="h-4 w-4 mr-2" data-oid="_u._yzw" />
          重新整理
        </Button>
      </div>

      {/* 分店概覽 */}
      <Card data-oid="4aty-ol">
        <CardHeader data-oid="sqgu_7v">
          <CardTitle className="flex items-center gap-2" data-oid="qdayqdb">
            <Building className="h-5 w-5" data-oid="br_jwmk" />
            分店庫存概覽
          </CardTitle>
        </CardHeader>
        <CardContent data-oid=":fc_ktj">
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            data-oid="8k-rqiy"
          >
            {matchingInventories.map((inventory: InventoryItem) => (
              <div
                key={inventory.id}
                className="p-3 border rounded-lg"
                data-oid="cj_p1fb"
              >
                <div className="font-medium" data-oid="q5h1.d-">
                  {inventory.store?.name || `分店 ${inventory.store?.id}`}
                </div>
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="o-7r0p2"
                >
                  當前庫存:{" "}
                  <span className="font-medium" data-oid="f_0uk:9">
                    {inventory.quantity || 0}
                  </span>
                </div>
                {inventory.low_stock_threshold && (
                  <div
                    className="text-xs text-muted-foreground"
                    data-oid="7ks8dd9"
                  >
                    低庫存門檻: {inventory.low_stock_threshold}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 篩選器 */}
      <Card data-oid="ldyjwpg">
        <CardHeader data-oid="8vz-9wq">
          <CardTitle className="flex items-center gap-2" data-oid="al:85yp">
            <Search className="h-5 w-5" data-oid="f14osov" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="hv:vvoe">
          <div
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
            data-oid=":0gepn8"
          >
            <div className="space-y-2" data-oid="tmozg16">
              <Label data-oid="yg6xi54">交易類型</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: value === "all" ? "" : value,
                    page: 1,
                  }))
                }
                data-oid="_9d_6xg"
              >
                <SelectTrigger data-oid="eahg8i6">
                  <SelectValue placeholder="全部類型" data-oid="_76605g" />
                </SelectTrigger>
                <SelectContent data-oid="uhxhs-5">
                  <SelectItem value="all" data-oid=".zr-zul">
                    全部類型
                  </SelectItem>
                  <SelectItem value="addition" data-oid="roos7lq">
                    入庫
                  </SelectItem>
                  <SelectItem value="reduction" data-oid=".4o2ucx">
                    出庫
                  </SelectItem>
                  <SelectItem value="adjustment" data-oid="3l:mo2t">
                    調整
                  </SelectItem>
                  <SelectItem value="transfer" data-oid="xvqw-t2">
                    轉移
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-oid="tw7vzw5">
              <Label data-oid="l0ql9m1">分店篩選</Label>
              <StoreCombobox
                value={filters.store_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, store_id: value, page: 1 }))
                }
                placeholder="全部分店"
                className="w-full"
                data-oid=":cawkdk"
              />
            </div>

            <div className="space-y-2" data-oid="pctdiu3">
              <Label data-oid="jeqtdyn">起始日期</Label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                    page: 1,
                  }))
                }
                data-oid="l1v6nl8"
              />
            </div>
            <div className="space-y-2" data-oid="q7g.yq1">
              <Label data-oid="x7lyqfl">結束日期</Label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                    page: 1,
                  }))
                }
                data-oid="7_8bud-"
              />
            </div>
            <div className="space-y-2" data-oid="4bptshb">
              <Label data-oid="swhq1l5">每頁顯示</Label>
              <Select
                value={filters.per_page.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    per_page: parseInt(value),
                    page: 1,
                  }))
                }
                data-oid="tk28.o7"
              >
                <SelectTrigger data-oid="vioy34t">
                  <SelectValue data-oid="f0j2kqx" />
                </SelectTrigger>
                <SelectContent data-oid="7jze7ib">
                  <SelectItem value="10" data-oid="kr0npvz">
                    10 筆
                  </SelectItem>
                  <SelectItem value="20" data-oid=":3yzokl">
                    20 筆
                  </SelectItem>
                  <SelectItem value="50" data-oid="t8g7ijy">
                    50 筆
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 歷史記錄 */}
      <Card data-oid="nf89o1f">
        <CardHeader data-oid="hfxxg7y">
          <CardTitle className="flex items-center gap-2" data-oid="r10arf_">
            <Clock className="h-5 w-5" data-oid="e0ey.7q" />
            變動記錄
          </CardTitle>
          <CardDescription data-oid="empwmze">
            共 {filteredTransactions.length} 筆記錄
            {filters.store_id && ` (已篩選分店)`}
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="y-a1022">
          {isLoadingHistory ? (
            <div className="space-y-4" data-oid="g_nbx6m">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                  data-oid="t0ibnl-"
                >
                  <Skeleton
                    className="h-10 w-10 rounded-full"
                    data-oid="ano0x5s"
                  />

                  <div className="space-y-2" data-oid="ps09pfx">
                    <Skeleton className="h-4 w-[250px]" data-oid=":4zvy_y" />
                    <Skeleton className="h-4 w-[200px]" data-oid=".42h8v0" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4" data-oid=".o3t1t:">
              {filteredTransactions.map((transaction: any, index: number) => {
                // 處理合併的轉移記錄
                if (transaction.type === "transfer") {
                  return (
                    <div
                      key={`${transaction.id}-${index}`}
                      className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-oid=":tz2zfy"
                    >
                      <div className="mt-1" data-oid="5j71-c5">
                        <Package
                          className="h-4 w-4 text-blue-600"
                          data-oid="4v23rec"
                        />
                      </div>

                      <div className="flex-1 space-y-2" data-oid="skhzkq8">
                        <div
                          className="flex items-center justify-between"
                          data-oid="y6ifzb-"
                        >
                          <div
                            className="flex items-center gap-2"
                            data-oid="k.8t6lc"
                          >
                            <Badge
                              variant="default"
                              className="bg-blue-600"
                              data-oid="bdknmx5"
                            >
                              庫存轉移
                            </Badge>
                            <span
                              className="text-sm text-muted-foreground"
                              data-oid="tm6zlxw"
                            >
                              數量: {transaction.quantity}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                            data-oid="4aa2cw5"
                          >
                            <Calendar className="h-4 w-4" data-oid="cmh:2ae" />
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
                          className="flex items-center gap-2 text-sm"
                          data-oid="67ftqxu"
                        >
                          <Badge variant="outline" data-oid="_ys1kmn">
                            {transaction.from_store.name}
                          </Badge>
                          <ArrowRight
                            className="h-4 w-4 text-muted-foreground"
                            data-oid="_2jjjfl"
                          />

                          <Badge variant="outline" data-oid="4auis5b">
                            {transaction.to_store.name}
                          </Badge>
                        </div>

                        <div
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                          data-oid="5leke.b"
                        >
                          {transaction._original?.out && (
                            <div data-oid="hirrl6i">
                              <span className="font-medium" data-oid="5mq.o4q">
                                {transaction.from_store.name} 轉出後:
                              </span>{" "}
                              {transaction._original.out.after_quantity ??
                                "未知"}
                            </div>
                          )}
                          {transaction._original?.in && (
                            <div data-oid="sbio_cf">
                              <span className="font-medium" data-oid="-_j4q8x">
                                {transaction.to_store.name} 轉入後:
                              </span>{" "}
                              {transaction._original.in.after_quantity ??
                                "未知"}
                            </div>
                          )}
                          {transaction.user && (
                            <div
                              className="flex items-center gap-1 md:col-span-2"
                              data-oid=":c5pbfi"
                            >
                              <User className="h-3 w-3" data-oid="_9neieh" />
                              <span className="font-medium" data-oid="l1d54l7">
                                操作人:
                              </span>{" "}
                              {transaction.user.name}
                            </div>
                          )}
                        </div>

                        {transaction.notes && (
                          <div
                            className="text-sm text-muted-foreground"
                            data-oid="-6y3_4o"
                          >
                            <span className="font-medium" data-oid="4e45ki-">
                              備註:
                            </span>{" "}
                            {transaction.notes}
                          </div>
                        )}

                        {transaction.metadata && (
                          <div
                            className="text-xs text-muted-foreground"
                            data-oid="2rztl3_"
                          >
                            <span className="font-medium" data-oid="wo2kczz">
                              轉移編號:
                            </span>
                            {(() => {
                              let metadataObj = transaction.metadata;
                              if (typeof metadataObj === "string") {
                                try {
                                  metadataObj = JSON.parse(metadataObj);
                                } catch (e) {
                                  return "未知";
                                }
                              }
                              return (
                                metadataObj?.transfer_id ||
                                metadataObj?.Transfer?.Id ||
                                "未知"
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // 原始的單一記錄顯示邏輯
                const relatedInventory = matchingInventories.find(
                  (inv: any) => inv.id === transaction.inventory_id,
                );

                return (
                  <div
                    key={`${transaction.id}-${index}`}
                    className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    data-oid="06dj-gc"
                  >
                    <div className="mt-1" data-oid="9.co6mn">
                      {(() => {
                        const IconComponent = getTransactionIcon(
                          transaction.type,
                        );
                        return (
                          <IconComponent
                            className={`h-4 w-4 ${getTransactionIconColor(transaction.type)}`}
                            data-oid="p_mi.wd"
                          />
                        );
                      })()}
                    </div>

                    <div className="flex-1 space-y-2" data-oid="qbl1fhv">
                      <div
                        className="flex items-center justify-between"
                        data-oid="a4y-bwf"
                      >
                        <div
                          className="flex items-center gap-2"
                          data-oid="qsm_e3z"
                        >
                          <Badge
                            variant={getTransactionTypeVariant(
                              transaction.type,
                            )}
                            data-oid=":up.v0k"
                          >
                            {getTransactionTypeName(transaction.type)}
                          </Badge>
                          <Badge variant="outline" data-oid="y6re.a0">
                            {relatedInventory?.store?.name ||
                              `分店 ${relatedInventory?.store?.id}`}
                          </Badge>
                          <span
                            className="text-sm text-muted-foreground"
                            data-oid="1yh6odw"
                          >
                            數量變動:{" "}
                            {(transaction.quantity || 0) > 0 ? "+" : ""}
                            {transaction.quantity || 0}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                          data-oid="j8uip4k"
                        >
                          <Calendar className="h-4 w-4" data-oid="cnrehrb" />
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
                        data-oid="9nhqexr"
                      >
                        <div data-oid="wid88p3">
                          <span className="font-medium" data-oid="0s79oaz">
                            變動前:
                          </span>{" "}
                          {transaction.before_quantity ?? "未知"}
                        </div>
                        <div data-oid="1eb.m38">
                          <span className="font-medium" data-oid="gmn1:z9">
                            變動後:
                          </span>{" "}
                          {transaction.after_quantity ?? "未知"}
                        </div>
                        {transaction.user && (
                          <div
                            className="flex items-center gap-1"
                            data-oid="9cwz929"
                          >
                            <User className="h-3 w-3" data-oid="5j73tij" />
                            <span className="font-medium" data-oid="vf8xuvl">
                              操作人:
                            </span>{" "}
                            {transaction.user.name}
                          </div>
                        )}
                      </div>

                      {transaction.notes && (
                        <div
                          className="text-sm text-muted-foreground"
                          data-oid="tflwfzd"
                        >
                          <span className="font-medium" data-oid="y-vkt2j">
                            備註:
                          </span>{" "}
                          {transaction.notes}
                        </div>
                      )}

                      <div
                        className="text-xs text-muted-foreground"
                        data-oid="s3gfxjm"
                      >
                        <span className="font-medium" data-oid="c5cva7c">
                          額外資訊:
                        </span>
                        {(() => {
                          if (!transaction.metadata) return "無";
                          // 處理 metadata，可能是字符串或對象
                          let metadataObj = transaction.metadata;

                          // 如果是字符串，嘗試解析為 JSON
                          if (typeof metadataObj === "string") {
                            try {
                              metadataObj = JSON.parse(metadataObj);
                            } catch (e) {
                              // 如果解析失敗，直接返回原始字符串
                              return metadataObj;
                            }
                          }

                          // 格式化顯示 metadata 對象
                          if (
                            typeof metadataObj === "object" &&
                            metadataObj !== null
                          ) {
                            const entries = Object.entries(metadataObj);
                            if (entries.length === 0) return "無";

                            return entries
                              .map(([key, value]) => {
                                // 轉換 key 為更友好的顯示名稱
                                const displayKey = key
                                  .replace(/_/g, " ")
                                  .replace(/\b\w/g, (l) => l.toUpperCase())
                                  .replace("Order Id", "訂單編號")
                                  .replace("Source", "來源")
                                  .replace("Reason", "原因")
                                  .replace("Purchase Order", "採購單號")
                                  .replace("Transfer Id", "轉移編號");

                                return `${displayKey}: ${value}`;
                              })
                              .join(", ");
                          }

                          return "無";
                        })()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              className="text-center py-8 text-muted-foreground"
              data-oid="22ad6fi"
            >
              <Clock
                className="h-12 w-12 mx-auto mb-4 opacity-20"
                data-oid="wq33-sl"
              />

              <p data-oid="ty07iwf">暫無變動記錄</p>
              <p className="text-sm" data-oid="v6i_-dz">
                該 SKU 尚無任何庫存變動記錄
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
