import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  History,
  Calendar,
  User,
  Store,
  FileText,
  Package,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { zhTW } from "date-fns/locale";
import {
  getTransactionIcon,
  getTransactionTypeName,
  getTransactionTypeVariant,
} from "@/lib/inventory-utils";

interface TransactionsListProps {
  transactionsData: any;
  isLoadingTransactions: boolean;
  handlePageChange: (page: number) => void;
}

export function TransactionsList({
  transactionsData,
  isLoadingTransactions,
  handlePageChange,
}: TransactionsListProps) {
  if (isLoadingTransactions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            入庫歷史記錄
          </CardTitle>
          <CardDescription>
            顯示所有商品入庫記錄，包括操作者、時間和詳細資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!transactionsData?.data || transactionsData.data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            入庫歷史記錄
          </CardTitle>
          <CardDescription>
            顯示所有商品入庫記錄，包括操作者、時間和詳細資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">暫無入庫記錄</h3>
            <p className="text-muted-foreground mb-4">
              還沒有任何商品入庫記錄，當有入庫操作時會顯示在這裡。
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          入庫歷史記錄
        </CardTitle>
        <CardDescription>
          顯示所有商品入庫記錄，包括操作者、時間和詳細資訊
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactionsData.data.map((transaction: any) => (
            <div
              key={transaction.id}
              className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="mt-1">
                {(() => {
                  const IconComponent = getTransactionIcon(
                    transaction.type || "addition",
                  );
                  return (
                    <IconComponent className="h-5 w-5 text-green-600" />
                  );
                })()}
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-800"
                    >
                      商品入庫
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      數量: +{transaction.quantity || 0}
                    </span>
                    {transaction.product?.name && (
                      <span className="text-sm font-medium">
                        {transaction.product.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">變動前:</span>{" "}
                    {transaction.before_quantity ?? "未知"}
                  </div>
                  <div>
                    <span className="font-medium">變動後:</span>{" "}
                    {transaction.after_quantity ?? "未知"}
                  </div>
                  {transaction.user && (
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span className="font-medium">操作人:</span>{" "}
                      {transaction.user.name}
                    </div>
                  )}
                </div>

                {transaction.store && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Store className="h-3 w-3" />
                    <span className="font-medium">門市:</span>{" "}
                    {transaction.store.name}
                  </div>
                )}

                {transaction.notes && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">備註:</span>{" "}
                    {transaction.notes}
                  </div>
                )}

                {transaction.metadata && (
                  <div className="text-xs text-muted-foreground">
                    <FileText className="h-3 w-3 inline mr-1" />
                    詳細資訊: {JSON.stringify(transaction.metadata)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 分頁控制 */}
        {transactionsData.meta &&
          transactionsData.meta.last_page &&
          transactionsData.meta.last_page > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                第 {transactionsData.meta.current_page} 頁，共{" "}
                {transactionsData.meta.last_page} 頁 （總計{" "}
                {transactionsData.meta.total} 筆記錄）
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    (transactionsData.meta.current_page || 1) <= 1
                  }
                  onClick={() =>
                    handlePageChange(
                      (transactionsData.meta?.current_page || 1) - 1
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一頁
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    (transactionsData.meta.current_page || 1) >=
                    (transactionsData.meta.last_page || 1)
                  }
                  onClick={() =>
                    handlePageChange(
                      (transactionsData.meta?.current_page || 1) + 1
                    )
                  }
                >
                  下一頁
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
}