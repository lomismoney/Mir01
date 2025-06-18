'use client';

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
  History
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductItem, ProductVariant } from "@/types/api-helpers";
import { InventoryModificationDialog } from "./InventoryModificationDialog";

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
  onManageProduct 
}: InventoryNestedTableProps) {
  
  const router = useRouter()
  
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
  const calculateSkuStatus = (quantity: number, threshold: number): SkuStatus => {
    if (quantity === 0) return "缺貨";
    if (quantity <= threshold) return "低庫存";
    return "正常";
  };

  /**
   * 計算 SPU 整體狀態
   */
  const calculateSpuStatus = (skus: EnhancedSku[]): SpuStatus => {
    if (skus.length === 0) return "全部缺貨";
    const outOfStockCount = skus.filter(sku => sku.status === "缺貨").length;
    if (outOfStockCount === skus.length) return "全部缺貨";
    if (outOfStockCount > 0) return "部分缺貨";
    return "正常";
  };

  /**
   * 格式化屬性值為可讀字符串
   */
  const formatAttributes = (attributeValues?: ProductVariant['attribute_values']): string => {
    if (!attributeValues || attributeValues.length === 0) {
      return "標準規格";
    }
    
    return attributeValues
      .map(attr => `${attr.attribute?.name || '屬性'}:${attr.value || '未知'}`)
      .join(', ');
  };

  /**
   * 轉換產品數據為增強格式
   */
  const transformToEnhancedData = (products: ProductItem[]): EnhancedSpu[] => {
    return products.map(product => {
      const enhancedSkus: EnhancedSku[] = (product.variants || []).map(variant => {
        // 計算所有分店的總庫存
        const totalQuantity = variant.inventory?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0;
        // 取最低的低庫存閾值
        const threshold = Math.min(...(variant.inventory?.map((inv: any) => inv.low_stock_threshold || 0) || [0]));
        
        return {
          ...variant,
          status: calculateSkuStatus(totalQuantity, threshold),
          attributes: formatAttributes(variant.attribute_values),
          quantity: totalQuantity,
          threshold,
        };
      });

      const totalStock = enhancedSkus.reduce((sum, sku) => sum + sku.quantity, 0);
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
  const getStatusBadgeVariant = (status: SpuStatus | SkuStatus): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "正常": return "default";
      case "低庫存":
      case "部分缺貨": return "secondary";
      case "缺貨": 
      case "全部缺貨": return "destructive";
      default: return "default";
    }
  };

  /**
   * 獲取狀態圖標
   */
  const getStatusIcon = (status: SpuStatus | SkuStatus) => {
    switch (status) {
      case "正常": return <CheckCircle className="h-4 w-4" />;
      case "低庫存":
      case "部分缺貨": return <AlertTriangle className="h-4 w-4" />;
      case "缺貨": 
      case "全部缺貨": return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  // 轉換數據
  const enhancedData = transformToEnhancedData(data);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>產品名稱</TableHead>
            <TableHead className="text-center">總庫存</TableHead>
            <TableHead className="text-center">規格數量</TableHead>
            <TableHead className="text-center">狀態</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            // 載入中顯示骨架屏
            Array.from({ length: 3 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`}>
                <TableCell colSpan={6}>
                  <Skeleton className="h-12 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : enhancedData.length === 0 ? (
            // 無資料顯示
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-3 py-6">
                  <Package className="h-12 w-12 text-muted-foreground" />
                  <p className="text-lg font-medium text-muted-foreground">沒有庫存資料</p>
                  <p className="text-sm text-muted-foreground">
                    此區域顯示按商品分組的庫存詳情，點擊商品可展開查看各變體的庫存狀況
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    請先為商品變體建立庫存記錄，或調整上方篩選條件
                  </p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            // 產品庫存資料 - 使用 Fragment 避免額外的包裝元素
            enhancedData.map((spu) => {
              const spuId = spu.id?.toString() || '';
              const isExpanded = expandedRows.has(spuId);
              
              return [
                // SPU 主行
                <TableRow key={`spu-${spuId}`} className="bg-muted/20 hover:bg-muted/50 transition-colors">
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => toggleRow(spuId)}
                    >
                      <ChevronRight 
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExpanded ? 'rotate-90' : ''
                        }`} 
                      />
                      <span className="sr-only">展開產品變體</span>
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{spu.name || '未命名產品'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {spu.totalStock.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {spu.skuCount} 個規格
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getStatusBadgeVariant(spu.status)} className="gap-1">
                      {getStatusIcon(spu.status)}
                      {spu.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onManageProduct?.(spu.id || 0)}
                    >
                      管理產品
                    </Button>
                  </TableCell>
                </TableRow>,
                
                // SKU 詳情行（條件渲染）
                ...(isExpanded ? [
                  <TableRow key={`sku-header-${spuId}`} className="bg-background">
                    <TableCell colSpan={6} className="p-0">
                      <div className="p-4 border-l-4 border-l-blue-200 bg-slate-50">
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <ChevronsUpDown className="h-4 w-4" />
                            產品變體詳情
                          </h4>
                        </div>
                        
                        {/* SKU 詳情表格 */}
                        <div className="rounded border bg-white">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">SKU 編號</TableHead>
                                <TableHead className="text-xs">規格屬性</TableHead>
                                <TableHead className="text-xs text-center">總庫存</TableHead>
                                <TableHead className="text-xs text-center">低庫存閾值</TableHead>
                                <TableHead className="text-xs text-center">狀態</TableHead>
                                <TableHead className="text-xs text-right">操作</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {spu.enhancedSkus.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    此產品暫無變體資料
                                  </TableCell>
                                </TableRow>
                              ) : (
                                spu.enhancedSkus.map((sku, index) => {
                                  // 生成絕對唯一的 key，結合多個標識符
                                  const uniqueKey = `spu-${spu.id}-sku-${sku.id || 'unknown'}-index-${index}-${sku.sku || 'no-sku'}`;
                                  
                                  return (
                                    <TableRow key={uniqueKey} className="hover:bg-muted/30">
                                      <TableCell className="font-mono text-xs">
                                        {sku.sku || 'N/A'}
                                      </TableCell>
                                      <TableCell className="text-sm">
                                        {sku.attributes}
                                      </TableCell>
                                      <TableCell className="text-center font-medium">
                                        {sku.quantity.toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-center text-muted-foreground">
                                        {sku.threshold.toLocaleString()}
                                      </TableCell>
                                      <TableCell className="text-center">
                                        <Badge 
                                          variant={getStatusBadgeVariant(sku.status)} 
                                          className="gap-1 text-xs"
                                        >
                                          {getStatusIcon(sku.status)}
                                          {sku.status}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            title="查看庫存歷史"
                                            onClick={() => {
                                              const inventoryId = sku.inventory?.[0]?.id
                                              if (inventoryId) {
                                                router.push(`/inventory/history/${inventoryId}?productName=${encodeURIComponent(spu.name || '')}&sku=${encodeURIComponent(sku.sku || '')}`)
                                              }
                                            }}
                                          >
                                            <History className="h-4 w-4" />
                                            <span className="sr-only">查看歷史</span>
                                          </Button>
                                          <InventoryModificationDialog
                                            productVariantId={sku.id || 0}
                                            currentQuantity={sku.quantity}
                                            storeId={sku.inventory?.[0]?.store?.id}
                                            productName={spu.name}
                                            sku={sku.sku}
                                            onSuccess={() => {
                                              // 這裡可以觸發父組件的刷新邏輯
                                              onAdjustInventory?.(sku.id || 0, sku.quantity)
                                            }}
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
                  </TableRow>
                ] : [])
              ];
            }).flat()
          )}
        </TableBody>
      </Table>
    </div>
  );
} 