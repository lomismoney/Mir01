"use client";

import { useState } from "react";
import { useInventoryHistory } from "@/hooks";
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

// 使用更安全的類型定義方式
interface InventoryTransaction {
  id?: number;
  inventory_id?: number;
  user_id?: number;
  type?: string;
  quantity?: number;
  before_quantity?: number;
  after_quantity?: number;
  notes?: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  store?: {
    id?: number;
    name?: string;
  };
  user?: {
    name?: string;
  };
  product?: {
    name?: string;
    sku?: string;
  };
}

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
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              載入庫存歷史記錄失敗，請稍後再試。
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* 標題區塊 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            庫存變動歷史
          </h2>
          {productName && (
            <p className="text-muted-foreground">
              {productName} {sku && `(${sku})`}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            此為特定庫存記錄（ID: {inventoryId}）的歷史
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          size="sm"
         
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          重新整理
        </Button>
      </div>

      {/* 篩選器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            篩選條件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-1 md:grid-cols-4 gap-4"
           
          >
            <div className="space-y-2">
              <Label>交易類型</Label>
              <Select
                value={filters.type}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, type: value, page: 1 }))
                }
               
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    全部類型
                  </SelectItem>
                  <SelectItem value="addition">
                    入庫
                  </SelectItem>
                  <SelectItem value="reduction">
                    出庫
                  </SelectItem>
                  <SelectItem value="adjustment">
                    調整
                  </SelectItem>
                  <SelectItem value="transfer_in">
                    轉入
                  </SelectItem>
                  <SelectItem value="transfer_out">
                    轉出
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>開始日期</Label>
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
               
              />
            </div>

            <div className="space-y-2">
              <Label>結束日期</Label>
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
               
              />
            </div>

            <div className="space-y-2">
              <Label>每頁筆數</Label>
              <Select
                value={filters.per_page.toString()}
                onValueChange={(value) =>
                  setFilters((prev) => ({
                    ...prev,
                    per_page: parseInt(value),
                    page: 1,
                  }))
                }
               
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">
                    10 筆
                  </SelectItem>
                  <SelectItem value="20">
                    20 筆
                  </SelectItem>
                  <SelectItem value="50">
                    50 筆
                  </SelectItem>
                  <SelectItem value="100">
                    100 筆
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 歷史記錄列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            變動記錄
          </CardTitle>
          <CardDescription>
            {/* 修正：顯示總記錄數而不是當前頁面的記錄數 */}
            {historyData?.total !== undefined && `共 ${historyData.total} 筆記錄`}
            {historyData?.current_page && historyData?.last_page && 
              ` (第 ${historyData.current_page} 頁，共 ${historyData.last_page} 頁)`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 p-4 border rounded-lg"
                 
                >
                  <Skeleton
                    className="h-10 w-10 rounded-full"
                   
                  />

                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : historyData?.data && historyData.data.length > 0 ? (
            <div className="space-y-4">
              {historyData.data.map((transaction: InventoryTransaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                 
                >
                  <div className="mt-1">
                    {(() => {
                      const IconComponent = getTransactionIcon(
                        transaction.type,
                      );
                      return (
                        <IconComponent
                          className={`h-4 w-4 ${getTransactionIconColor(transaction.type)}`}
                         
                        />
                      );
                    })()}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div
                      className="flex items-center justify-between"
                     
                    >
                      <div
                        className="flex items-center gap-2"
                       
                      >
                        <Badge
                          variant={getTransactionTypeVariant(transaction.type)}
                         
                        >
                          {getTransactionTypeName(transaction.type)}
                        </Badge>
                        <span
                          className="text-sm text-muted-foreground"
                         
                        >
                          數量變動: {(transaction.quantity || 0) > 0 ? "+" : ""}
                          {transaction.quantity || 0}
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                       
                      >
                        <Calendar className="h-4 w-4" />
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
                     
                    >
                      <div>
                        <span className="font-medium">
                          變動前:
                        </span>{" "}
                        {transaction.before_quantity ?? "未知"}
                      </div>
                      <div>
                        <span className="font-medium">
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
                       
                      >
                        <span className="font-medium">
                          備註:
                        </span>{" "}
                        {transaction.notes}
                      </div>
                    )}

                    <div
                      className="text-xs text-muted-foreground"
                     
                    >
                      <span className="font-medium">
                        額外資訊:
                      </span>
                      <span>
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
             
            >
              <Package
                className="h-12 w-12 mx-auto mb-4 opacity-50"
               
              />
              <p>尚無庫存變動記錄</p>
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
