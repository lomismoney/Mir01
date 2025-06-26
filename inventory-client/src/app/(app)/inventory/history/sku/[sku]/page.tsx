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
      <div className="container mx-auto py-8" data-oid="ly_4lcz">
        <Card data-oid="dxh3lc9">
          <CardContent className="p-6" data-oid="jkb.uux">
            <div className="space-y-4" data-oid="j08a7zr">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-16 w-full"
                  data-oid="whca.ny"
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
      <div className="container mx-auto py-8" data-oid="6bdlba5">
        <Card data-oid="r5p417p">
          <CardContent className="p-6" data-oid=".4o3kir">
            <div className="space-y-4" data-oid="20xct-8">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-16 w-full"
                  data-oid="rq-qyu5"
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
      <div className="container mx-auto py-8" data-oid="hsjzb4m">
        <Alert variant="destructive" data-oid="lm:5eq.">
          <AlertDescription data-oid="l9q9m-d">
            載入庫存歷史記錄失敗，請稍後再試。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (matchingInventories.length === 0) {
    return (
      <div className="container mx-auto py-8" data-oid=".10785l">
        <Alert data-oid="x_hzzs3">
          <AlertDescription data-oid="zr30q7u">
            找不到 SKU 為 "{sku}" 的庫存項目。
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6" data-oid="enxecgm">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between" data-oid="7kbeu9_">
        <div data-oid="stkybf2">
          <h2 className="text-2xl font-bold" data-oid="7:lvug8">
            SKU 庫存變動歷史
          </h2>
          <p className="text-muted-foreground" data-oid="khu9wp:">
            {productName} (SKU: {sku})
          </p>
          <p className="text-sm text-muted-foreground mt-1" data-oid="oqbndxv">
            覆蓋 {matchingInventories.length} 個分店的庫存記錄
          </p>
        </div>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          size="sm"
          data-oid="g.hgpwb"
        >
          <RefreshCw className="h-4 w-4 mr-2" data-oid="ow1uet." />
          重新整理
        </Button>
      </div>

      {/* 分店概覽 */}
      <Card data-oid="1yadsed">
        <CardHeader data-oid="o5e2zkr">
          <CardTitle className="flex items-center gap-2" data-oid="30zbhjk">
            <Building className="h-5 w-5" data-oid="_s8ge:s" />
            分店庫存概覽
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="nbjy_gq">
          <div
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
            data-oid="pep95_e"
          >
            {matchingInventories.map((inventory: InventoryItem) => (
              <div
                key={inventory.id}
                className="p-3 border rounded-lg"
                data-oid="ts7k-ou"
              >
                <div className="font-medium" data-oid="ty8bqt0">
                  {inventory.store?.name || `分店 ${inventory.store?.id}`}
                </div>
                <div
                  className="text-sm text-muted-foreground"
                  data-oid="6r98abd"
                >
                  當前庫存:{" "}
                  <span className="font-medium" data-oid="u56vdvv">
                    {inventory.quantity || 0}
                  </span>
                </div>
                {inventory.low_stock_threshold && (
                  <div
                    className="text-xs text-muted-foreground"
                    data-oid="nehsyc4"
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
      <Card data-oid="_vjxvv_">
        <CardHeader data-oid="leisz40">
          <CardTitle className="flex items-center gap-2" data-oid="y81lfie">
            <Search className="h-5 w-5" data-oid="sjmz5tj" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="_ebgxt-">
          <div
            className="grid grid-cols-1 md:grid-cols-5 gap-4"
            data-oid="0x6sga2"
          >
            <div className="space-y-2" data-oid="z1heiwo">
              <Label data-oid="s:18g.s">交易類型</Label>
              <Select
                value={filters.type || "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: value === "all" ? "" : value,
                    page: 1,
                  }))
                }
                data-oid="ly9.0sh"
              >
                <SelectTrigger data-oid="a:jnn.k">
                  <SelectValue placeholder="全部類型" data-oid="yuqwmnp" />
                </SelectTrigger>
                <SelectContent data-oid="d:4e-4f">
                  <SelectItem value="all" data-oid=":5-z-6d">
                    全部類型
                  </SelectItem>
                  <SelectItem value="addition" data-oid="8v5ykoh">
                    入庫
                  </SelectItem>
                  <SelectItem value="reduction" data-oid="2nb5kro">
                    出庫
                  </SelectItem>
                  <SelectItem value="adjustment" data-oid="pd.ang5">
                    調整
                  </SelectItem>
                  <SelectItem value="transfer" data-oid="7n.hklb">
                    轉移
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-oid=".v::jpj">
              <Label data-oid="mbiesd3">分店篩選</Label>
              <StoreCombobox
                value={filters.store_id}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, store_id: value, page: 1 }))
                }
                placeholder="全部分店"
                className="w-full"
                data-oid="3l9lu9p"
              />
            </div>

            <div className="space-y-2" data-oid="cm30g25">
              <Label data-oid="ubee1_1">起始日期</Label>
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
                data-oid="j0zuipl"
              />
            </div>
            <div className="space-y-2" data-oid="2k5hbnp">
              <Label data-oid="avk.6ns">結束日期</Label>
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
                data-oid="mefzzz9"
              />
            </div>
            <div className="space-y-2" data-oid="yvju-jf">
              <Label data-oid="3dgco_o">每頁顯示</Label>
              <Select
                value={filters.per_page.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    per_page: parseInt(value),
                    page: 1,
                  }))
                }
                data-oid="m1vnno3"
              >
                <SelectTrigger data-oid="b6g-ea2">
                  <SelectValue data-oid="sg:l0m3" />
                </SelectTrigger>
                <SelectContent data-oid="ui11v7.">
                  <SelectItem value="10" data-oid="xiy3mbi">
                    10 筆
                  </SelectItem>
                  <SelectItem value="20" data-oid="1momptu">
                    20 筆
                  </SelectItem>
                  <SelectItem value="50" data-oid="757p73n">
                    50 筆
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 歷史記錄 */}
      <Card data-oid="vivrtjs">
        <CardHeader data-oid="z-nx.n5">
          <CardTitle className="flex items-center gap-2" data-oid="8a40g7f">
            <Clock className="h-5 w-5" data-oid=".vt7jvu" />
            變動記錄
          </CardTitle>
          <CardDescription data-oid="2wicai0">
            共 {filteredTransactions.length} 筆記錄
            {filters.store_id && ` (已篩選分店)`}
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="r:t:7rc">
          {isLoadingHistory ? (
            <div className="space-y-4" data-oid="w5yfyvh">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                  data-oid="4n.gh5e"
                >
                  <Skeleton
                    className="h-10 w-10 rounded-full"
                    data-oid="6-18ra2"
                  />

                  <div className="space-y-2" data-oid="km8tsar">
                    <Skeleton className="h-4 w-[250px]" data-oid="7m7gmsu" />
                    <Skeleton className="h-4 w-[200px]" data-oid="_doo0jt" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4" data-oid="i-rih:c">
              {filteredTransactions.map((transaction: any, index: number) => {
                // 處理合併的轉移記錄
                if (transaction.type === "transfer") {
                  return (
                    <div
                      key={`${transaction.id}-${index}`}
                      className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-oid="t_bbiv-"
                    >
                      <div className="mt-1" data-oid="vlcmwks">
                        <Package
                          className="h-4 w-4 text-blue-600"
                          data-oid="ruxnd2x"
                        />
                      </div>

                      <div className="flex-1 space-y-2" data-oid="2an17tt">
                        <div
                          className="flex items-center justify-between"
                          data-oid="zst7rl5"
                        >
                          <div
                            className="flex items-center gap-2"
                            data-oid="1b_4bd-"
                          >
                            <Badge
                              variant="default"
                              className="bg-blue-600"
                              data-oid="dpttkjx"
                            >
                              庫存轉移
                            </Badge>
                            <span
                              className="text-sm text-muted-foreground"
                              data-oid="xprf.io"
                            >
                              數量: {transaction.quantity}
                            </span>
                          </div>
                          <div
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                            data-oid="u.v8_na"
                          >
                            <Calendar className="h-4 w-4" data-oid="6xkau0." />
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
                          data-oid="qd87.ql"
                        >
                          <Badge variant="outline" data-oid=":p_ab98">
                            {transaction.from_store.name}
                          </Badge>
                          <ArrowRight
                            className="h-4 w-4 text-muted-foreground"
                            data-oid="_67-fm5"
                          />

                          <Badge variant="outline" data-oid="vrulr.3">
                            {transaction.to_store.name}
                          </Badge>
                        </div>

                        <div
                          className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"
                          data-oid="49dgo2o"
                        >
                          {transaction._original?.out && (
                            <div data-oid="3xip:l2">
                              <span className="font-medium" data-oid="c_n80qw">
                                {transaction.from_store.name} 轉出後:
                              </span>{" "}
                              {transaction._original.out.after_quantity ??
                                "未知"}
                            </div>
                          )}
                          {transaction._original?.in && (
                            <div data-oid="81sgk-p">
                              <span className="font-medium" data-oid="hggp:ht">
                                {transaction.to_store.name} 轉入後:
                              </span>{" "}
                              {transaction._original.in.after_quantity ??
                                "未知"}
                            </div>
                          )}
                          {transaction.user && (
                            <div
                              className="flex items-center gap-1 md:col-span-2"
                              data-oid="qizcrp8"
                            >
                              <User className="h-3 w-3" data-oid="j_synzq" />
                              <span className="font-medium" data-oid="b2qwo2:">
                                操作人:
                              </span>{" "}
                              {transaction.user.name}
                            </div>
                          )}
                        </div>

                        {transaction.notes && (
                          <div
                            className="text-sm text-muted-foreground"
                            data-oid="1d.gf_c"
                          >
                            <span className="font-medium" data-oid="cnvwdn1">
                              備註:
                            </span>{" "}
                            {transaction.notes}
                          </div>
                        )}

                        {transaction.metadata && (
                          <div
                            className="text-xs text-muted-foreground"
                            data-oid="rlshneq"
                          >
                            <span className="font-medium" data-oid="tlzv1ge">
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
                    data-oid="jr.dpw7"
                  >
                    <div className="mt-1" data-oid="w_4mtwd">
                      {(() => {
                        const IconComponent = getTransactionIcon(
                          transaction.type,
                        );
                        return (
                          <IconComponent
                            className={`h-4 w-4 ${getTransactionIconColor(transaction.type)}`}
                            data-oid="ab422-d"
                          />
                        );
                      })()}
                    </div>

                    <div className="flex-1 space-y-2" data-oid="::cer.o">
                      <div
                        className="flex items-center justify-between"
                        data-oid="0p:vzvi"
                      >
                        <div
                          className="flex items-center gap-2"
                          data-oid="-sr-qk6"
                        >
                          <Badge
                            variant={getTransactionTypeVariant(
                              transaction.type,
                            )}
                            data-oid="gftp8t5"
                          >
                            {getTransactionTypeName(transaction.type)}
                          </Badge>
                          <Badge variant="outline" data-oid="0e1hvpw">
                            {relatedInventory?.store?.name ||
                              `分店 ${relatedInventory?.store?.id}`}
                          </Badge>
                          <span
                            className="text-sm text-muted-foreground"
                            data-oid="h7e3kvb"
                          >
                            數量變動:{" "}
                            {(transaction.quantity || 0) > 0 ? "+" : ""}
                            {transaction.quantity || 0}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                          data-oid="xlgw:jj"
                        >
                          <Calendar className="h-4 w-4" data-oid="kd1-oz-" />
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
                        data-oid="i5o9:u-"
                      >
                        <div data-oid="ynd22pq">
                          <span className="font-medium" data-oid="4.zlp.1">
                            變動前:
                          </span>{" "}
                          {transaction.before_quantity ?? "未知"}
                        </div>
                        <div data-oid="xd-2qeo">
                          <span className="font-medium" data-oid="zv3doic">
                            變動後:
                          </span>{" "}
                          {transaction.after_quantity ?? "未知"}
                        </div>
                        {transaction.user && (
                          <div
                            className="flex items-center gap-1"
                            data-oid="v4cx_an"
                          >
                            <User className="h-3 w-3" data-oid="sn6cqdd" />
                            <span className="font-medium" data-oid="02h4isw">
                              操作人:
                            </span>{" "}
                            {transaction.user.name}
                          </div>
                        )}
                      </div>

                      {transaction.notes && (
                        <div
                          className="text-sm text-muted-foreground"
                          data-oid="i:nahb_"
                        >
                          <span className="font-medium" data-oid="jin6zxz">
                            備註:
                          </span>{" "}
                          {transaction.notes}
                        </div>
                      )}

                      <div
                        className="text-xs text-muted-foreground"
                        data-oid="bt-m2gp"
                      >
                        <span className="font-medium" data-oid="ez.r1ot">
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
              data-oid="-l7vb3w"
            >
              <Clock
                className="h-12 w-12 mx-auto mb-4 opacity-20"
                data-oid=".w-shsy"
              />

              <p data-oid="q-0.5mo">暫無變動記錄</p>
              <p className="text-sm" data-oid="dce2-49">
                該 SKU 尚無任何庫存變動記錄
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
