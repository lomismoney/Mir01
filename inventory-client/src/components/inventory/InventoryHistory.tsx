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
import {
  Calendar,
  Clock,
  User,
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
  }) as {
    data: InventoryHistoryResponse;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };

  if (error) {
    return (
      <Card data-oid="7.:_0wy">
        <CardContent className="p-6" data-oid="uvm_nbp">
          <Alert data-oid="axfahl-">
            <AlertDescription data-oid="hh362yz">
              載入庫存歷史記錄失敗，請稍後再試。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-oid="gn8nabg">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between" data-oid="9432pvx">
        <div data-oid="bcdewy:">
          <h2 className="text-2xl font-bold" data-oid="sgzk-xf">
            庫存變動歷史
          </h2>
          {productName && (
            <p className="text-muted-foreground" data-oid="b.bkvm1">
              {productName} {sku && `(${sku})`}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1" data-oid="apk0i79">
            此為特定庫存記錄（ID: {inventoryId}）的歷史
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
          data-oid="5.-3g8o"
        >
          <RefreshCw className="h-4 w-4 mr-2" data-oid="69128l4" />
          重新整理
        </Button>
      </div>

      {/* 篩選器 */}
      <Card data-oid="kc5-wor">
        <CardHeader data-oid="3yk5ta0">
          <CardTitle className="flex items-center gap-2" data-oid="3g:3ipb">
            <Search className="h-5 w-5" data-oid="yzesj5v" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="kwmtmm8">
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
            data-oid="nk39gas"
          >
            <div className="space-y-2" data-oid="vkiwaif">
              <Label data-oid="2lc.qnm">交易類型</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, type: value, page: 1 }))
                }
                data-oid="-lfy1xq"
              >
                <SelectTrigger data-oid="oa8xos2">
                  <SelectValue placeholder="全部類型" data-oid="nqu-.w_" />
                </SelectTrigger>
                <SelectContent data-oid="gstlf57">
                  <SelectItem value="all" data-oid="210xl6.">
                    全部類型
                  </SelectItem>
                  <SelectItem value="addition" data-oid="at6bbs.">
                    入庫
                  </SelectItem>
                  <SelectItem value="reduction" data-oid="z45_-6p">
                    出庫
                  </SelectItem>
                  <SelectItem value="adjustment" data-oid="z8fncz.">
                    調整
                  </SelectItem>
                  <SelectItem value="transfer_in" data-oid="71es0bx">
                    轉入
                  </SelectItem>
                  <SelectItem value="transfer_out" data-oid="_o_eywh">
                    轉出
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2" data-oid="e34j1uh">
              <Label data-oid="q::3f3p">開始日期</Label>
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
                data-oid="aq0z2c5"
              />
            </div>

            <div className="space-y-2" data-oid="vrn1jnv">
              <Label data-oid="z59b6w8">結束日期</Label>
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
                data-oid=".t2zhm_"
              />
            </div>

            <div className="space-y-2" data-oid="z8pkbp-">
              <Label data-oid="2gv4dy0">每頁筆數</Label>
              <Select
                value={filters.per_page.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    per_page: parseInt(value),
                    page: 1,
                  }))
                }
                data-oid="v:7g30i"
              >
                <SelectTrigger data-oid="8:n:vxk">
                  <SelectValue data-oid="22af_1d" />
                </SelectTrigger>
                <SelectContent data-oid="u.ae49d">
                  <SelectItem value="10" data-oid="5vrbirp">
                    10 筆
                  </SelectItem>
                  <SelectItem value="20" data-oid="emf9h2-">
                    20 筆
                  </SelectItem>
                  <SelectItem value="50" data-oid="5k:g_45">
                    50 筆
                  </SelectItem>
                  <SelectItem value="100" data-oid="z3r9pm-">
                    100 筆
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 歷史記錄列表 */}
      <Card data-oid="av6v0t-">
        <CardHeader data-oid="8yqihew">
          <CardTitle className="flex items-center gap-2" data-oid="0de4rgw">
            <Clock className="h-5 w-5" data-oid="l_y1r4g" />
            變動記錄
          </CardTitle>
          <CardDescription data-oid="eemoyxm">
            {historyData?.total && `共 ${historyData.total} 筆記錄`}
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="l3.2vtd">
          {isLoading ? (
            <div className="space-y-4" data-oid="8-8-.z3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                  data-oid="a-1asc6"
                >
                  <Skeleton
                    className="h-10 w-10 rounded-full"
                    data-oid="0jn9n.3"
                  />

                  <div className="space-y-2" data-oid=".-g1q76">
                    <Skeleton className="h-4 w-[250px]" data-oid="glkxfk8" />
                    <Skeleton className="h-4 w-[200px]" data-oid=".cj85mp" />
                  </div>
                </div>
              ))}
            </div>
          ) : historyData?.data && historyData.data.length > 0 ? (
            <div className="space-y-4" data-oid=":x2-f0p">
              {historyData.data.map((transaction: InventoryTransaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  data-oid="flxvl72"
                >
                  <div className="mt-1" data-oid="irac18e">
                    {(() => {
                      const IconComponent = getTransactionIcon(
                        transaction.type,
                      );
                      return (
                        <IconComponent
                          className={`h-4 w-4 ${getTransactionIconColor(transaction.type)}`}
                          data-oid="psabdsm"
                        />
                      );
                    })()}
                  </div>

                  <div className="flex-1 space-y-2" data-oid="9cj4h_h">
                    <div
                      className="flex items-center justify-between"
                      data-oid="e5iki-z"
                    >
                      <div
                        className="flex items-center gap-2"
                        data-oid="p:bhdto"
                      >
                        <Badge
                          variant={getTransactionTypeVariant(transaction.type)}
                          data-oid="g2ix23:"
                        >
                          {getTransactionTypeName(transaction.type)}
                        </Badge>
                        <span
                          className="text-sm text-muted-foreground"
                          data-oid="uy:30t1"
                        >
                          數量變動: {(transaction.quantity || 0) > 0 ? "+" : ""}
                          {transaction.quantity || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                        data-oid="3wo8mr5"
                      >
                        <Calendar className="h-4 w-4" data-oid="adq_wkg" />
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
                      data-oid="-rssv0d"
                    >
                      <div data-oid="vwwwshh">
                        <span className="font-medium" data-oid="-roeezi">
                          變動前:
                        </span>{" "}
                        {transaction.before_quantity ?? "未知"}
                      </div>
                      <div data-oid="e5i0qy.">
                        <span className="font-medium" data-oid="4kh-f63">
                          變動後:
                        </span>{" "}
                        {transaction.after_quantity ?? "未知"}
                      </div>
                      {transaction.user && (
                        <div
                          className="flex items-center gap-1"
                          data-oid="8g9f9kv"
                        >
                          <User className="h-3 w-3" data-oid="2jl--_2" />
                          <span className="font-medium" data-oid="z.061yx">
                            操作人:
                          </span>{" "}
                          {transaction.user.name}
                        </div>
                      )}
                    </div>

                    {transaction.notes && (
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="jgr:voe"
                      >
                        <span className="font-medium" data-oid="k9zqxrb">
                          備註:
                        </span>{" "}
                        {transaction.notes}
                      </div>
                    )}

                    <div
                      className="text-xs text-muted-foreground"
                      data-oid="6qfml2l"
                    >
                      <span className="font-medium" data-oid="4e5htj4">
                        額外資訊:
                      </span>
                      <span data-oid=":c5gmkk">
                        {(() => {
                          if (!transaction.metadata) return "無";

                          // 處理 metadata，可能是字符串或對象
                          let metadataObj: any = transaction.metadata;

                          // 如果是字符串，嘗試解析為 JSON
                          if (typeof metadataObj === "string") {
                            try {
                              metadataObj = JSON.parse(metadataObj);
                            } catch (e) {
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

              {/* 分頁控制 */}
              {(historyData.last_page || 0) > 1 && (
                <div
                  className="flex items-center justify-between pt-4"
                  data-oid="9:stl5e"
                >
                  <div
                    className="text-sm text-muted-foreground"
                    data-oid="0dyob_s"
                  >
                    顯示第 {historyData.from || 0} - {historyData.to || 0}{" "}
                    筆，共 {historyData.total || 0} 筆
                  </div>
                  <div className="flex items-center gap-2" data-oid="0qw1viy">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={(historyData.current_page || 1) <= 1}
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: prev.page - 1 }))
                      }
                      data-oid="3v1j-.7"
                    >
                      上一頁
                    </Button>
                    <span className="text-sm" data-oid="lk0e6_-">
                      第 {historyData.current_page || 1} /{" "}
                      {historyData.last_page || 1} 頁
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        (historyData.current_page || 1) >=
                        (historyData.last_page || 1)
                      }
                      onClick={() =>
                        setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
                      }
                      data-oid="zmr.691"
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
              data-oid="ggrdd6u"
            >
              <Package
                className="h-12 w-12 mx-auto mb-4 opacity-50"
                data-oid="-irnnmi"
              />

              <p data-oid="rbzi-4k">尚無庫存變動記錄</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
