"use client";

import { useState } from "react";
import { InventoryTransferItem } from "@/types/api-helpers";
import { useInventoryTransfers } from "@/hooks/queries/useEntityQueries";
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
          <Badge variant="outline" data-oid="khez3r.">
            待處理
          </Badge>
        );

      case "in_transit":
        return (
          <Badge variant="secondary" data-oid=":z_x9ut">
            運送中
          </Badge>
        );

      case "completed":
        return (
          <Badge variant="default" data-oid="bvn1lc3">
            已完成
          </Badge>
        );

      case "cancelled":
        return (
          <Badge variant="destructive" data-oid="9ukng.j">
            已取消
          </Badge>
        );

      default:
        return (
          <Badge variant="secondary" data-oid="sxcq7a.">
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
    <div data-oid="dc92gv-">
      {isLoading ? (
        <div className="space-y-2" data-oid="a_kb:uj">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" data-oid="nc3y9i3" />
          ))}
        </div>
      ) : (
        <>
          <Table data-oid="_y95u9b">
            <TableHeader data-oid="xf_pxas">
              <TableRow
                className="border-b hover:bg-transparent"
                data-oid="-chlu7l"
              >
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid=":z_22rb"
                >
                  單號
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="xmw4h-5"
                >
                  日期
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="xgjgcdh"
                >
                  來源門市
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="6whvbnu"
                >
                  目標門市
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="tgljvch"
                >
                  產品
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="ln-vtt4"
                >
                  數量
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid=".f93lut"
                >
                  狀態
                </TableHead>
                <TableHead
                  className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="53b9cyv"
                >
                  備註
                </TableHead>
                <TableHead
                  className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                  data-oid="avxa94q"
                >
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-oid="cyj-4sq">
              {data && data.length === 0 ? (
                <TableRow data-oid="gfytj:4">
                  <TableCell
                    colSpan={9}
                    className="h-24 text-center"
                    data-oid="a3gook."
                  >
                    <div
                      className="flex flex-col items-center justify-center space-y-3 py-6"
                      data-oid="ef9qgs3"
                    >
                      <p
                        className="text-lg font-medium text-muted-foreground"
                        data-oid="qh3td71"
                      >
                        沒有庫存轉移記錄
                      </p>
                      <p
                        className="text-sm text-muted-foreground"
                        data-oid="q-1uh9t"
                      >
                        點擊"新增轉移"標籤來創建庫存轉移
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.map((transfer: any) => (
                  <TableRow key={transfer.id} data-oid="6c_3ijt">
                    <TableCell data-oid="a2.zwmp">{transfer.id}</TableCell>
                    <TableCell data-oid="x3sl61.">
                      {formatDate(transfer.created_at)}
                    </TableCell>
                    <TableCell data-oid=".bu5xse">
                      {transfer.from_store?.name ||
                        `門市 #${transfer.from_store_id}`}
                    </TableCell>
                    <TableCell data-oid="ri0tlme">
                      {transfer.to_store?.name ||
                        `門市 #${transfer.to_store_id}`}
                    </TableCell>
                    <TableCell data-oid="3r8cdvd">
                      {transfer.product_variant?.product?.name ||
                        `產品 #${transfer.product_variant_id}`}
                    </TableCell>
                    <TableCell data-oid="her816v">
                      {transfer.quantity}
                    </TableCell>
                    <TableCell data-oid="j851vpc">
                      {getStatusBadge(transfer.status || "unknown")}
                    </TableCell>
                    <TableCell data-oid="8nxam.r">
                      <div
                        className="max-w-[200px] truncate"
                        title={transfer.notes || ""}
                        data-oid="fw-2sms"
                      >
                        {transfer.notes || "-"}
                      </div>
                    </TableCell>
                    <TableCell data-oid="u:aykjw">
                      <DropdownMenu data-oid=":8jh9sp">
                        <DropdownMenuTrigger asChild data-oid="yk.laah">
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            data-oid=":y.rjb0"
                          >
                            <MoreHorizontal
                              className="h-4 w-4"
                              data-oid="8fpl.2t"
                            />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" data-oid="f82gdl5">
                          <DropdownMenuItem
                            onClick={() => setViewingHistoryTransfer(transfer)}
                            data-oid="nacklpe"
                          >
                            <History
                              className="mr-2 h-4 w-4"
                              data-oid="uo33zcr"
                            />
                            查看歷史
                          </DropdownMenuItem>
                          {canEditStatus(transfer.status || "") && (
                            <DropdownMenuItem
                              onClick={() => setEditingTransfer(transfer)}
                              data-oid="wfqfk3w"
                            >
                              <Edit
                                className="mr-2 h-4 w-4"
                                data-oid="_edq333"
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
            data-oid="przi:4-"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              data-oid="ggjlm0o"
            >
              上一頁
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!data || data.length < perPage}
              data-oid="stz-o_p"
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
              data-oid="0he3d3h"
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
              data-oid="bg:z2.a"
            />
          )}
        </>
      )}
    </div>
  );
};
