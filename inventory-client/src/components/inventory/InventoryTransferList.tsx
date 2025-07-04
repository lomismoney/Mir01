"use client";

import { useState } from "react";
import { InventoryTransferItem } from "@/types/api-helpers";
import { useInventoryTransfers } from "@/hooks";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshIcon } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, History } from "lucide-react";
import { TransferStatusEditDialog } from "./TransferStatusEditDialog";
import { TransferHistoryDialog } from "./TransferHistoryDialog";

export const InventoryTransferList = () => {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [editingTransfer, setEditingTransfer] =
    useState<InventoryTransferItem | null>(null);
  const [viewingHistoryTransfer, setViewingHistoryTransfer] =
    useState<InventoryTransferItem | null>(null);

  const { data, isLoading, error, refetch } = useInventoryTransfers({
    page,
    per_page: perPage,
  });

  if (error) {
    toast({
      variant: "destructive",
      title: "錯誤",
      description: "讀取庫存轉移記錄失敗",
    });
  }

  const handleRefresh = () => {
    refetch();
    toast({
      title: "重新整理",
      description: "已重新載入庫存轉移記錄",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" data-oid="cu88:we">
            待處理
          </Badge>
        );

      case "in_transit":
        return (
          <Badge variant="secondary" data-oid="8prsa.u">
            運送中
          </Badge>
        );

      case "completed":
        return (
          <Badge variant="default" data-oid="lbumnmc">
            已完成
          </Badge>
        );

      case "cancelled":
        return (
          <Badge variant="destructive" data-oid="u2xutri">
            已取消
          </Badge>
        );

      default:
        return (
          <Badge variant="secondary" data-oid="12fts1v">
            {status}
          </Badge>
        );
    }
  };

  const canEditStatus = (status: string) => {
    // 已完成和已取消的記錄不能編輯
    return status !== "completed" && status !== "cancelled";
  };

  const handleEditSuccess = () => {
    setEditingTransfer(null);
    refetch();
  };

  return (
    <div data-oid="wo233u6">
      {isLoading ? (
        <div className="space-y-2" data-oid="0xwlbcb">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" data-oid="whp6_47" />
          ))}
        </div>
      ) : (
        <>
          <Table data-oid="qzkvvp1">
            <TableHeader data-oid="d6:yfii">
              <TableRow
                className="border-b hover:bg-transparent"
                data-oid="hc6:da5"
              >
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="k:imuvn"
                >
                  單號
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="ku8._ws"
                >
                  日期
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="zvs0sw1"
                >
                  來源門市
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="2834kj1"
                >
                  目標門市
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="dbxtq5-"
                >
                  產品
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="8njy7p_"
                >
                  數量
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="oe1:0.8"
                >
                  狀態
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="qp:no6m"
                >
                  備註
                </TableHead>
                <TableHead
                  className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="mmlzspw"
                >
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="8fmq-sd">
              {data && data.length === 0 ? (
                <TableRow data-oid=".j4jd._">
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center"
                    data-oid="m1rm0u-"
                  >
                    <div
                      className="flex flex-col items-center justify-center space-y-3 py-6"
                      data-oid="rjurk.b"
                    >
                      <p
                        className="text-lg font-medium text-muted-foreground"
                        data-oid=":0zrq.k"
                      >
                        沒有庫存轉移記錄
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        data-oid=".b27a4n"
                      >
                        點擊"新增轉移"標籤來創建庫存轉移
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((transfer: any) => (
                  <TableRow key={transfer.id} data-oid="o7ut.1o">
                    <TableCell data-oid="lbf.rj1">{transfer.id}</TableCell>
                    <TableCell data-oid="ioczgs5">
                      {formatDate(transfer.created_at)}
                    </TableCell>
                    <TableCell data-oid="1o-.0.z">
                      {transfer.from_store?.name ||
                        `門市 #${transfer.from_store_id}`}
                    </TableCell>
                    <TableCell data-oid="4c40:a1">
                      {transfer.to_store?.name ||
                        `門市 #${transfer.to_store_id}`}
                    </TableCell>
                    <TableCell data-oid="4i:6w5b">
                      {transfer.product_variant?.product?.name ||
                        `產品 #${transfer.product_variant_id}`}
                    </TableCell>
                    <TableCell data-oid="i06e22k">
                      {transfer.quantity}
                    </TableCell>
                    <TableCell data-oid="4fei7ea">
                      {getStatusBadge(transfer.status || "unknown")}
                    </TableCell>
                    <TableCell data-oid="isc4-hj">
                      <div
                        className="max-w-[200px] truncate"
                        title={transfer.notes || ""}
                        data-oid="_.9pz22"
                      >
                        {transfer.notes || "-"}
                      </div>
                    </TableCell>
                    <TableCell data-oid="c06cvhe">
                      <DropdownMenu data-oid="w47o8t0">
                        <DropdownMenuTrigger asChild data-oid="i20ga3v">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            data-oid="k2xt7kg"
                          >
                            <MoreHorizontal
                              className="h-4 w-4"
                              data-oid="ceymzno"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" data-oid="eikz:hs">
                          <DropdownMenuItem
                            onClick={() => setViewingHistoryTransfer(transfer)}
                            data-oid="7kibyuq"
                          >
                            <History
                              className="mr-2 h-4 w-4"
                              data-oid="_xjhcfc"
                            />
                            查看歷史
                          </DropdownMenuItem>
                          {canEditStatus(transfer.status || "") && (
                            <DropdownMenuItem
                              onClick={() => setEditingTransfer(transfer)}
                              data-oid="qrs7n:g"
                            >
                              <Edit
                                className="mr-2 h-4 w-4"
                                data-oid="a:i.bsr"
                              />
                              編輯狀態
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div
            className="flex justify-center mt-4 space-x-2"
            data-oid="xbhouio"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              data-oid="a3dcz-d"
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!data || data.length < perPage}
              data-oid="fdqbtao"
            >
              下一頁
            </Button>
          </div>

          {/* 編輯狀態對話框 */}
          {editingTransfer && (
            <TransferStatusEditDialog
              transfer={editingTransfer}
              open={!!editingTransfer}
              onOpenChange={(open: boolean) =>
                !open && setEditingTransfer(null)
              }
              onSuccess={handleEditSuccess}
              data-oid="hv13zyq"
            />
          )}

          {/* 查看歷史對話框 */}
          {viewingHistoryTransfer && (
            <TransferHistoryDialog
              transfer={viewingHistoryTransfer}
              open={!!viewingHistoryTransfer}
              onOpenChange={(open: boolean) =>
                !open && setViewingHistoryTransfer(null)
              }
              data-oid="5pspt01"
            />
          )}
        </>
      )}
    </div>
  );
};
