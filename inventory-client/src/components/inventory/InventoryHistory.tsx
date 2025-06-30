"use client";

import { useState } from "react";
import { useInventoryHistory } from "@/hooks/queries/useEntityQueries";
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
import { InventoryPagination } from "@/components/inventory/InventoryPagination";
import {
  Calendar,
  Clock,
  Package,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { paths } from "@/types/api";

// 使用正確的 API 型別定義
type InventoryHistoryResponse =
  paths["/api/inventory/{id}/history"]["get"]["responses"]["200"]["content"]["application/json"];
type InventoryTransaction = NonNullable<InventoryHistoryResponse["data"]>[0];

interface InventoryHistoryProps {
  inventoryId: number;
  productName?: string;
  sku?: string;
}

export function InventoryHistory({
  inventoryId,
  productName,
  sku,
}: InventoryHistoryProps) {
  const [filters, setFilters] = useState({
    type: "all",
    start_date: "",
    end_date: "",
    per_page: 20,
    page: 1,
  });

  const {
    data: historyData,
    isLoading,
    error,
    refetch,
  } = useInventoryHistory({
    id: inventoryId,
    ...filters,
  });

  /**
   * 處理分頁變更
   * @param page - 新的頁碼
   */
  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  if (error) {
    return (
      <Card data-oid="pef721:">
        <CardContent className="p-6" data-oid="wdl_f6y">
          <Alert data-oid="jy.tu10">
            <AlertDescription data-oid="y3q6ypc">
              載入庫存歷史記錄失敗，請稍後再試。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-oid="w2j6qvo">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between" data-oid="jrmll8h">
        <div data-oid="-x6wexv">
          <h2 className="text-2xl font-bold" data-oid="g_80tu.">
            庫存變動歷史
          </h2>
          {productName && (
            <p className="text-muted-foreground" data-oid="5bl:3:9">
              {productName} {sku && `(${sku})`}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1" data-oid="xz_muts">
            此為特定庫存記錄（ID: {inventoryId}）的歷史
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          data-oid="_0o_lnp"
        >
          <RefreshCw className="h-4 w-4 mr-2" data-oid="2r5fl2-" />
          重新整理
        </Button>
      </div>

      {/* 篩選器 */}
      <Card data-oid="kwbyyej">
        <CardHeader data-oid="pbt7:8v">
          <CardTitle className="flex items-center gap-2" data-oid="bin7eu_">
            <Search className="h-5 w-5" data-oid="rvdvu3-" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="dbm.0i7">
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            data-oid="n_5:hf5"
          >
            <div className="space-y-2" data-oid="5l82w9k">
              <Label data-oid="adne.p9">交易類型</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, type: value, page: 1 }))
                }
                data-oid="4jogzv0"
              >
                <SelectTrigger data-oid="2j.hnso">
                  <SelectValue placeholder="全部類型" data-oid="9clqu66" />
                </SelectTrigger>
                <SelectContent data-oid="0rqklh:">
                  <SelectItem value="all" data-oid="f0fgb7w">
                    全部類型
                  </SelectItem>
                  <SelectItem value="addition" data-oid="f67vy2u">
                    入庫
                  </SelectItem>
                  <SelectItem value="reduction" data-oid="f7ba482">
                    出庫
                  </SelectItem>
                  <SelectItem value="adjustment" data-oid="9luc0sf">
                    調整
                  </SelectItem>
                  <SelectItem value="transfer_in" data-oid="x0ky7ze">
                    轉入
                  </SelectItem>
                  <SelectItem value="transfer_out" data-oid="weu93:a">
                    轉出
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-oid="dk1u7f-">
              <Label data-oid="9ynjmcg">開始日期</Label>
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
                data-oid="c6.zcxa"
              />
            </div>

            <div className="space-y-2" data-oid="wvtpw6_">
              <Label data-oid="g1.gbbz">結束日期</Label>
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
                data-oid="013_gh0"
              />
            </div>

            <div className="space-y-2" data-oid="miavtyx">
              <Label data-oid="yri_utu">每頁筆數</Label>
              <Select
                value={filters.per_page.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    per_page: parseInt(value),
                    page: 1,
                  }))
                }
                data-oid="4sx.ke1"
              >
                <SelectTrigger data-oid="v4u.8z.">
                  <SelectValue data-oid="_.b.deb" />
                </SelectTrigger>
                <SelectContent data-oid="uf:89e9">
                  <SelectItem value="10" data-oid="lnzj.nl">
                    10 筆
                  </SelectItem>
                  <SelectItem value="20" data-oid="qsqiik_">
                    20 筆
                  </SelectItem>
                  <SelectItem value="50" data-oid="cem-wr7">
                    50 筆
                  </SelectItem>
                  <SelectItem value="100" data-oid="idslr2v">
                    100 筆
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 歷史記錄列表 */}
      <Card data-oid="t.0yf2t">
        <CardHeader data-oid="_eoihsq">
          <CardTitle className="flex items-center gap-2" data-oid="u6b.1cl">
            <Clock className="h-5 w-5" data-oid="a7vmz7:" />
            變動記錄
          </CardTitle>
          <CardDescription data-oid="qjw083:">
            {/* 修正：顯示總記錄數而不是當前頁面的記錄數 */}
            {historyData?.total !== undefined && `共 ${historyData.total} 筆記錄`}
            {historyData?.current_page && historyData?.last_page && 
              ` (第 ${historyData.current_page} 頁，共 ${historyData.last_page} 頁)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="-5.mh5h">
          {isLoading ? (
            <div className="space-y-4" data-oid="2zs.5ac">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                  data-oid="xd63q.l"
                >
                  <Skeleton
                    className="h-10 w-10 rounded-full"
                    data-oid="-8s:72c"
                  />

                  <div className="space-y-2" data-oid="8wrzjmi">
                    <Skeleton className="h-4 w-[250px]" data-oid="yw:bq_9" />
                    <Skeleton className="h-4 w-[200px]" data-oid="qykij8r" />
                  </div>
                </div>
              ))}
            </div>
          ) : historyData?.data && historyData.data.length > 0 ? (
            <div className="space-y-4" data-oid="jwe8hn-">
              {historyData.data.map((transaction: InventoryTransaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-oid=":zss6mj"
                >
                  <div className="mt-1" data-oid="p6hkpft">
                    {(() => {
                      const IconComponent = getTransactionIcon(
                        transaction.type,
                      );
                      return (
                        <IconComponent
                          className={`h-4 w-4 ${getTransactionIconColor(transaction.type)}`}
                          data-oid="o762igb"
                        />
                      );
                    })()}
                  </div>

                  <div className="flex-1 space-y-2" data-oid="ja4ehz_">
                    <div
                      className="flex items-center justify-between"
                      data-oid="6scojhb"
                    >
                      <div
                        className="flex items-center gap-2"
                        data-oid="970k-m:"
                      >
                        <Badge
                          variant={getTransactionTypeVariant(transaction.type)}
                          data-oid="ow9l8d7"
                        >
                          {getTransactionTypeName(transaction.type)}
                        </Badge>
                        <span
                          className="text-sm text-muted-foreground"
                          data-oid="aut2mk3"
                        >
                          數量變動: {(transaction.quantity || 0) > 0 ? "+" : ""}
                          {transaction.quantity || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        data-oid="g.j39w3"
                      >
                        <Calendar className="h-4 w-4" data-oid="yk0udkf" />
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
                      data-oid="z1dtk-k"
                    >
                      <div data-oid="nbdimjm">
                        <span className="font-medium" data-oid="i3zc4a_">
                          變動前:
                        </span>{" "}
                        {transaction.before_quantity ?? "未知"}
                      </div>
                      <div data-oid="kadarn0">
                        <span className="font-medium" data-oid="b3w7xm:">
                          變動後:
                        </span>{" "}
                        {transaction.after_quantity ?? "未知"}
                      </div>
                      {/* 暫時移除 relations.user 引用，因為型別不包含此屬性 */}
                      {/* 後續需要根據實際 API 回應結構調整 */}
                    </div>

                    {transaction.notes && (
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid=":md:kv-"
                      >
                        <span className="font-medium" data-oid="jvbcj28">
                          備註:
                        </span>{" "}
                        {transaction.notes}
                      </div>
                    )}

                    <div
                      className="text-xs text-muted-foreground"
                      data-oid="3_j25d-"
                    >
                      <span className="font-medium" data-oid="bzjm19r">
                        額外資訊:
                      </span>
                      <span data-oid="jq5s0er">
                        {(() => {
                          if (!transaction.metadata) return "無";

                          // 處理 metadata，可能是字符串或對象
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          let metadataObj: any = transaction.metadata;

                          // 如果是字符串，嘗試解析為 JSON
                          if (typeof metadataObj === "string") {
                            try {
                              metadataObj = JSON.parse(metadataObj);
                            } catch {
                              // 如果解析失敗，直接返回原始字符串
                              return String(metadataObj);
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

                                return `${displayKey}: ${String(value)}`;
                              })
                              .join(", ");
                          }

                          return "無";
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-8 text-muted-foreground"
              data-oid="4fv:q_y"
            >
              <Package
                className="h-12 w-12 mx-auto mb-4 opacity-50"
                data-oid="zqaugxo"
              />
              <p data-oid="pdjsrjt">尚無庫存變動記錄</p>
            </div>
          )}
        </CardContent>

        {/* 新增分頁控制區塊 */}
        {historyData && historyData.total > historyData.per_page && (
          <div className="border-t p-4">
            <InventoryPagination
              meta={{
                current_page: historyData.current_page || 1,
                last_page: historyData.last_page || 1,
                per_page: historyData.per_page || 20,
                total: historyData.total || 0,
              }}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
