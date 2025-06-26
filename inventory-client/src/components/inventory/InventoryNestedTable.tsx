"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronRight,
  ChevronsUpDown,
  Package,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
  Settings,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductItem, ProductVariant } from "@/types/api-helpers";
import { InventoryModificationDialog } from "./InventoryModificationDialog";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * SKU 庫存狀態類型
 */
type SkuStatus = "正常" | "低庫存" | "缺貨";

/**
 * SPU 整體狀態類型
 */
type SpuStatus = "正常" | "部分缺貨" | "全部缺貨";

/**
 * 增強的 SKU 數據結構
 */
interface EnhancedSku extends ProductVariant {
  status: SkuStatus;
  attributes: string;
  quantity: number;
  threshold: number;
  average_cost?: number;
}

/**
 * 增強的 SPU 數據結構
 */
interface EnhancedSpu extends ProductItem {
  totalStock: number;
  skuCount: number;
  status: SpuStatus;
  enhancedSkus: EnhancedSku[];
}

/**
 * 組件屬性接口
 */
interface InventoryNestedTableProps {
  /** 產品數據列表 */
  data: ProductItem[];
  /** 載入狀態 */
  isLoading: boolean;
  /** SKU 調整庫存回調 */
  onAdjustInventory?: (skuId: number, currentQuantity: number) => void;
  /** SPU 管理回調 */
  onManageProduct?: (spuId: number) => void;
}

/**
 * 庫存巢狀表格組件
 *
 * 使用純 HTML 表格結構實現可展開的庫存管理界面
 * 避免使用 Collapsible 組件以防止 HTML 結構衝突
 */
export function InventoryNestedTable({
  data,
  isLoading,
  onAdjustInventory,
  onManageProduct,
}: InventoryNestedTableProps) {
  const router = useRouter();

  /**
   * 展開狀態管理
   */
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  /**
   * 切換行展開狀態
   */
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  /**
   * 計算 SKU 庫存狀態
   */
  const calculateSkuStatus = (
    quantity: number,
    threshold: number,
  ): SkuStatus => {
    if (quantity === 0) return "缺貨";
    if (quantity <= threshold) return "低庫存";
    return "正常";
  };

  /**
   * 計算 SPU 整體狀態
   */
  const calculateSpuStatus = (skus: EnhancedSku[]): SpuStatus => {
    if (skus.length === 0) return "全部缺貨";
    const outOfStockCount = skus.filter((sku) => sku.status === "缺貨").length;
    if (outOfStockCount === skus.length) return "全部缺貨";
    if (outOfStockCount > 0) return "部分缺貨";
    return "正常";
  };

  /**
   * 格式化屬性值為可讀字符串
   */
  const formatAttributes = (
    attributeValues?: ProductVariant["attribute_values"],
  ): string => {
    if (!attributeValues || attributeValues.length === 0) {
      return "標準規格";
    }

    return attributeValues
      .map(
        (attr) => `${attr.attribute?.name || "屬性"}:${attr.value || "未知"}`,
      )
      .join(", ");
  };

  /**
   * 轉換產品數據為增強格式
   */
  const transformToEnhancedData = (products: ProductItem[]): EnhancedSpu[] => {
    return products.map((product) => {
      const enhancedSkus: EnhancedSku[] = (product.variants || []).map(
        (variant) => {
          // 計算所有分店的總庫存
          const totalQuantity =
            variant.inventory?.reduce(
              (sum: number, inv: any) => sum + (inv.quantity || 0),
              0,
            ) || 0;
          // 取最低的低庫存閾值
          const threshold = Math.min(
            ...(variant.inventory?.map(
              (inv: any) => inv.low_stock_threshold || 0,
            ) || [0]),
          );
          // 獲取平均成本（如果有的話）
          const average_cost = (variant as any)?.average_cost;

          return {
            ...variant,
            status: calculateSkuStatus(totalQuantity, threshold),
            attributes: formatAttributes(variant.attribute_values),
            quantity: totalQuantity,
            threshold,
            average_cost,
          };
        },
      );

      const totalStock = enhancedSkus.reduce(
        (sum, sku) => sum + sku.quantity,
        0,
      );
      const skuCount = enhancedSkus.length;
      const status = calculateSpuStatus(enhancedSkus);

      return {
        ...product,
        totalStock,
        skuCount,
        status,
        enhancedSkus,
      };
    });
  };

  /**
   * 獲取狀態徽章樣式
   */
  const getStatusBadgeVariant = (
    status: SpuStatus | SkuStatus,
  ): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "正常":
        return "default";
      case "低庫存":
      case "部分缺貨":
        return "secondary";
      case "缺貨":
      case "全部缺貨":
        return "destructive";
      default:
        return "default";
    }
  };

  /**
   * 獲取狀態圖標
   */
  const getStatusIcon = (status: SpuStatus | SkuStatus) => {
    switch (status) {
      case "正常":
        return <CheckCircle className="h-4 w-4" data-oid="62:v-kj" />;
      case "低庫存":
      case "部分缺貨":
        return <AlertTriangle className="h-4 w-4" data-oid="x8ikozt" />;
      case "缺貨":
      case "全部缺貨":
        return <XCircle className="h-4 w-4" data-oid="x_s50p3" />;
      default:
        return <Package className="h-4 w-4" data-oid="bvbx9yw" />;
    }
  };

  // 轉換數據
  const enhancedData = transformToEnhancedData(data);

  return (
    <div className="rounded-md border" data-oid="qlf1-6y">
      <Table data-oid="mmjm51-">
        <TableHeader data-oid="6hk2wvq">
          <TableRow
            className="border-b hover:bg-transparent"
            data-oid="em705va"
          >
            <TableHead
              className="w-[50px] p-4 h-12 text-left align-middle font-medium text-muted-foreground"
              data-oid="r2jqwqk"
            ></TableHead>
            <TableHead
              className="w-[300px] p-4 h-12 text-left align-middle font-medium text-muted-foreground"
              data-oid="07p6sfs"
            >
              產品名稱
            </TableHead>
            <TableHead
              className="text-right w-[120px] p-4 h-12 align-middle font-medium text-muted-foreground"
              data-oid="nt:jzli"
            >
              總庫存
            </TableHead>
            <TableHead
              className="text-center w-[120px] p-4 h-12 align-middle font-medium text-muted-foreground"
              data-oid="xwl5t.9"
            >
              規格數量
            </TableHead>
            <TableHead
              className="text-center w-[120px] p-4 h-12 align-middle font-medium text-muted-foreground"
              data-oid="5bo0o3h"
            >
              狀態
            </TableHead>
            <TableHead
              className="text-center w-[120px] p-4 h-12 align-middle font-medium text-muted-foreground"
              data-oid="_dqies9"
            >
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody data-oid="2x28pqk">
          {isLoading ? (
            // 載入中顯示骨架屏
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} data-oid="9bqzgr4">
                <TableCell colSpan={8} data-oid="g-kzj-x">
                  <Skeleton className="h-12 w-full" data-oid="1q.3wjb" />
                </TableCell>
              </TableRow>
            ))
          ) : enhancedData.length === 0 ? (
            // 無資料顯示
            <TableRow data-oid="w83k.-y">
              <TableCell
                colSpan={8}
                className="h-24 text-center"
                data-oid="s1td3on"
              >
                <div
                  className="flex flex-col items-center justify-center space-y-3 py-6"
                  data-oid="vtsqmsk"
                >
                  <Package
                    className="h-12 w-12 text-muted-foreground"
                    data-oid="6_c0ut8"
                  />

                  <p
                    className="text-lg font-medium text-muted-foreground"
                    data-oid="fp5cimc"
                  >
                    沒有庫存資料
                  </p>
                  <p
                    className="text-sm text-muted-foreground"
                    data-oid="rwi74ou"
                  >
                    此區域顯示按商品分組的庫存詳情，點擊商品可展開查看各變體的庫存狀況
                  </p>
                  <p
                    className="text-xs text-muted-foreground mt-2"
                    data-oid="l:i-su4"
                  >
                    請先為商品變體建立庫存記錄，或調整上方篩選條件
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // 產品庫存資料 - 使用 Fragment 避免額外的包裝元素
            enhancedData
              .map((spu) => {
                const spuId = spu.id?.toString() || "";
                const isExpanded = expandedRows.has(spuId);

                return [
                  // SPU 主行
                  <TableRow
                    key={`spu-${spuId}`}
                    className="bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                    onClick={() => toggleRow(spuId)}
                    data-oid="ptf94_v"
                  >
                    <TableCell
                      onClick={(e) => e.stopPropagation()}
                      className="p-4"
                      data-oid="taqb0t1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleRow(spuId)}
                        data-oid="so7zmny"
                      >
                        <ChevronRight
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                          data-oid="e:q.-e-"
                        />

                        <span className="sr-only" data-oid="rtbbzlw">
                          展開產品變體
                        </span>
                      </Button>
                    </TableCell>
                    <TableCell
                      className="font-medium text-nowrap"
                      data-oid="3i4gakz"
                    >
                      <div
                        className="flex items-center gap-3"
                        data-oid="ah.:1v1"
                      >
                        {/* 商品圖片 */}
                        <div
                          className="relative h-12 w-12 overflow-hidden rounded-md border bg-muted"
                          data-oid="c87iu11"
                        >
                          {spu.image_urls?.thumb ||
                          spu.image_urls?.medium ||
                          spu.image_urls?.original ? (
                            <Image
                              src={
                                spu.image_urls?.thumb ||
                                spu.image_urls?.medium ||
                                spu.image_urls?.original ||
                                ""
                              }
                              alt={spu.name || ""}
                              fill
                              className="object-cover"
                              sizes="48px"
                              data-oid="k706_61"
                            />
                          ) : (
                            <div
                              className="flex h-full w-full items-center justify-center text-muted-foreground"
                              data-oid=".yw4_id"
                            >
                              <ImageIcon
                                className="h-6 w-6"
                                data-oid="49hn9ek"
                              />
                            </div>
                          )}
                        </div>
                        {/* 商品名稱 */}
                        <span data-oid="qlf0srz">{spu.name}</span>
                      </div>
                    </TableCell>
                    <TableCell
                      className="text-right font-mono font-medium p-4"
                      data-oid="uo8_u73"
                    >
                      {spu.totalStock.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center p-4" data-oid="1wn:zhs">
                      <Badge variant="outline" data-oid="7fms4xw">
                        {spu.skuCount} 個規格
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center p-4" data-oid="9t44tww">
                      <Badge
                        variant={getStatusBadgeVariant(spu.status)}
                        className="gap-1"
                        data-oid="hg._anu"
                      >
                        {getStatusIcon(spu.status)}
                        {spu.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-center p-4"
                      onClick={(e) => e.stopPropagation()}
                      data-oid="c2g81dk"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onManageProduct?.(spu.id || 0)}
                        title="管理產品"
                        data-oid="o88_ejt"
                      >
                        <Settings className="h-4 w-4" data-oid="a2b-q15" />
                        <span className="sr-only" data-oid="kpqa-a:">
                          管理產品
                        </span>
                      </Button>
                    </TableCell>
                  </TableRow>,

                  // SKU 詳情行（條件渲染）
                  ...(isExpanded
                    ? [
                        <TableRow
                          key={`sku-header-${spuId}`}
                          className="bg-background"
                          data-oid="c2_hlfl"
                        >
                          <TableCell
                            colSpan={8}
                            className="p-0"
                            data-oid="e.3-tv-"
                          >
                            <div
                              className="p-6 bg-secondary/50 border-l-4 border-l-primary"
                              data-oid="a0od2:g"
                            >
                              <div className="mb-4" data-oid="bo_114h">
                                <h4
                                  className="text-base font-semibold flex items-center gap-2"
                                  data-oid="x605s:p"
                                >
                                  <ChevronsUpDown
                                    className="h-5 w-5 text-primary"
                                    data-oid="ino6apn"
                                  />
                                  產品規格詳情
                                </h4>
                                <p
                                  className="text-sm text-muted-foreground mt-1"
                                  data-oid="azjhtmd"
                                >
                                  此產品包含 {spu.enhancedSkus.length}{" "}
                                  個規格變體
                                </p>
                              </div>

                              {/* SKU 詳情表格 */}
                              <div
                                className="rounded-lg border border-border/50 bg-card overflow-hidden"
                                data-oid=":9xwjjv"
                              >
                                <Table data-oid="j8jfub0">
                                  <TableHeader data-oid="polj-ok">
                                    <TableRow
                                      className="border-b hover:bg-transparent"
                                      data-oid="sftv70q"
                                    >
                                      <TableHead
                                        className="text-xs w-[120px] p-3 h-12 text-left align-middle font-medium text-muted-foreground"
                                        data-oid="_pj-170"
                                      >
                                        SKU 編號
                                      </TableHead>
                                      <TableHead
                                        className="text-xs w-[200px] p-3 h-12 text-left align-middle font-medium text-muted-foreground"
                                        data-oid=".dl3:xq"
                                      >
                                        規格屬性
                                      </TableHead>
                                      <TableHead
                                        className="text-xs text-right w-[100px] p-3 h-12 align-middle font-medium text-muted-foreground"
                                        data-oid="-1-4t6_"
                                      >
                                        總庫存
                                      </TableHead>
                                      <TableHead
                                        className="text-xs text-right w-[100px] p-3 h-12 align-middle font-medium text-muted-foreground"
                                        data-oid="d_ie2j:"
                                      >
                                        低庫存閾值
                                      </TableHead>
                                      <TableHead
                                        className="text-xs text-right w-[120px] p-3 h-12 align-middle font-medium text-muted-foreground"
                                        data-oid="87yelfz"
                                      >
                                        售價
                                      </TableHead>
                                      <TableHead
                                        className="text-xs text-right w-[120px] p-3 h-12 align-middle font-medium text-muted-foreground"
                                        data-oid="ehsv904"
                                      >
                                        平均成本
                                      </TableHead>
                                      <TableHead
                                        className="text-xs text-center w-[100px] p-3 h-12 align-middle font-medium text-muted-foreground"
                                        data-oid="l_t_rmb"
                                      >
                                        狀態
                                      </TableHead>
                                      <TableHead
                                        className="text-xs text-center w-[100px] p-3 h-12 align-middle font-medium text-muted-foreground"
                                        data-oid="a0xde8."
                                      >
                                        操作
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody data-oid="7jn.4j1">
                                    {spu.enhancedSkus.length === 0 ? (
                                      <TableRow data-oid="376zyde">
                                        <TableCell
                                          colSpan={8}
                                          className="text-center py-4 text-muted-foreground"
                                          data-oid="i_c2v9n"
                                        >
                                          此產品暫無變體資料
                                        </TableCell>
                                      </TableRow>
                                    ) : (
                                      spu.enhancedSkus.map((sku, index) => {
                                        // 生成絕對唯一的 key，結合多個標識符
                                        const uniqueKey = `spu-${spu.id}-sku-${sku.id || "unknown"}-index-${index}-${sku.sku || "no-sku"}`;

                                        return (
                                          <TableRow
                                            key={uniqueKey}
                                            className="hover:bg-muted/50"
                                            data-oid="ab56zlh"
                                          >
                                            <TableCell
                                              className="font-mono text-xs p-3"
                                              data-oid="f2k0_61"
                                            >
                                              {sku.sku || "N/A"}
                                            </TableCell>
                                            <TableCell
                                              className="text-sm p-3"
                                              data-oid="_vo:t9:"
                                            >
                                              {sku.attributes}
                                            </TableCell>
                                            <TableCell
                                              className="text-right font-mono font-medium p-3"
                                              data-oid="b9_ylc."
                                            >
                                              {sku.quantity.toLocaleString()}
                                            </TableCell>
                                            <TableCell
                                              className="text-right font-mono text-muted-foreground p-3"
                                              data-oid="ooezm:f"
                                            >
                                              {sku.threshold.toLocaleString()}
                                            </TableCell>
                                            <TableCell
                                              className="text-right font-mono font-medium p-3"
                                              data-oid="zulg45v"
                                            >
                                              {typeof sku.price === "string" &&
                                              parseFloat(sku.price) > 0
                                                ? `NT$ ${parseFloat(sku.price).toLocaleString()}`
                                                : sku.price &&
                                                    Number(sku.price) > 0
                                                  ? `NT$ ${Number(sku.price).toLocaleString()}`
                                                  : "—"}
                                            </TableCell>
                                            <TableCell
                                              className="text-right font-mono font-medium p-3"
                                              data-oid="skkx4tm"
                                            >
                                              {(sku as any)?.average_cost &&
                                              (sku as any).average_cost > 0
                                                ? `NT$ ${(sku as any).average_cost.toLocaleString()}`
                                                : "—"}
                                            </TableCell>
                                            <TableCell
                                              className="text-center p-3"
                                              data-oid="0c.a5l."
                                            >
                                              <Badge
                                                variant={getStatusBadgeVariant(
                                                  sku.status,
                                                )}
                                                className="gap-1 text-xs"
                                                data-oid="sars.3x"
                                              >
                                                {getStatusIcon(sku.status)}
                                                {sku.status}
                                              </Badge>
                                            </TableCell>
                                            <TableCell
                                              className="text-center p-3"
                                              data-oid="-89eiai"
                                            >
                                              <div
                                                className="flex items-center justify-center gap-1"
                                                data-oid="mnjrqhc"
                                              >
                                                <Button
                                                  variant="ghost"
                                                  size="icon"
                                                  className="h-8 w-8"
                                                  title="查看庫存歷史"
                                                  onClick={() => {
                                                    // 改為跳轉到 SKU 歷史頁面，顯示所有分店的該 SKU 歷史
                                                    if (sku.sku) {
                                                      router.push(
                                                        `/inventory/history/sku/${encodeURIComponent(sku.sku)}?productName=${encodeURIComponent(spu.name || "")}`,
                                                      );
                                                    }
                                                  }}
                                                  data-oid="0kpzpos"
                                                >
                                                  <History
                                                    className="h-4 w-4"
                                                    data-oid="6q2mar:"
                                                  />

                                                  <span
                                                    className="sr-only"
                                                    data-oid="ipyl-v1"
                                                  >
                                                    查看歷史
                                                  </span>
                                                </Button>
                                                <InventoryModificationDialog
                                                  productVariantId={sku.id || 0}
                                                  currentQuantity={sku.quantity}
                                                  storeId={
                                                    sku.inventory?.[0]?.store
                                                      ?.id
                                                  }
                                                  productName={spu.name}
                                                  sku={sku.sku}
                                                  onSuccess={() => {
                                                    // 這裡可以觸發父組件的刷新邏輯
                                                    onAdjustInventory?.(
                                                      sku.id || 0,
                                                      sku.quantity,
                                                    );
                                                  }}
                                                  data-oid="chy-8rb"
                                                />
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>,
                      ]
                    : []),
                ];
              })
              .flat()
          )}
        </TableBody>
      </Table>
    </div>
  );
}
