"use client";

import React from "react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AlertTriangle, 
  Package, 
  ShoppingCart, 
  Truck,
  Clock,
  CheckCircle2
} from "lucide-react";

/**
 * 缺貨商品資訊介面
 * 對應後端 OrderService 中的 insufficientStockItems 結構
 */
interface InsufficientStockItem {
  /** 商品名稱 */
  product_name: string;
  /** 商品 SKU */
  sku: string;
  /** 需求數量 */
  requested_quantity: number;
  /** 現有庫存數量 */
  available_quantity: number;
  /** 缺貨數量 */
  shortage: number;
}

/**
 * StockCheckDialog Props 介面
 */
interface StockCheckDialogProps {
  /** 對話框是否開啟 */
  open: boolean;
  /** 對話框開啟狀態變更回調 */
  onOpenChange: (open: boolean) => void;
  /** 缺貨商品清單 */
  insufficientStockItems: InsufficientStockItem[];
  /** 確認強制建單回調 */
  onConfirmBackorder: () => void;
  /** 取消建單回調 */
  onCancel: () => void;
  /** 是否正在處理中 */
  isProcessing?: boolean;
}

/**
 * 庫存檢查對話框元件
 * 
 * 🎯 預訂系統核心元件：處理庫存不足場景的用戶交互
 * 
 * 功能特性：
 * 1. 📊 清晰展示：缺貨商品詳情表格，包含需求vs庫存對比
 * 2. 🎨 視覺化設計：使用顏色和圖標突出重要資訊
 * 3. ⚠️ 智能提示：明確告知用戶預訂模式的後果
 * 4. 🔒 安全確認：使用 AlertDialog 確保用戶充分理解風險
 * 5. 📱 響應式設計：適配不同螢幕尺寸
 * 6. ♿ 無障礙支援：完整的 ARIA 標籤和鍵盤導航
 * 7. 🛡️ 類型安全：100% TypeScript 類型安全保證
 * 
 * 使用場景：
 * - 訂單建立時發現庫存不足
 * - 用戶需要決定是否建立預訂訂單
 * - 供應商補貨前的訂單處理
 */
export default function StockCheckDialog({
  open,
  onOpenChange,
  insufficientStockItems,
  onConfirmBackorder,
  onCancel,
  isProcessing = false,
}: StockCheckDialogProps) {
  
  /**
   * 處理取消操作
   * 關閉對話框並執行取消回調
   */
  const handleCancel = () => {
    onOpenChange(false);
    onCancel();
  };

  /**
   * 處理確認預訂操作
   * 執行強制建單回調
   */
  const handleConfirmBackorder = () => {
    onConfirmBackorder();
  };

  /**
   * 計算統計資訊
   */
  const totalShortage = insufficientStockItems.reduce(
    (sum, item) => sum + item.shortage, 
    0
  );
  const affectedProducts = insufficientStockItems.length;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="h-5 w-5" />
            庫存不足警告
          </AlertDialogTitle>
          <AlertDialogDescription>
            以下商品庫存不足，您可以選擇建立預訂訂單，待供應商補貨後出貨。
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* 統計概覽卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Card className="border-l-4 border-l-error">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="h-4 w-4" />
                影響商品
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-error">
                {affectedProducts} 項
              </div>
            </CardContent>
          </Card>

                      <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                總缺貨量
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-warning">
                {totalShortage} 件
              </div>
            </CardContent>
          </Card>

                      <Card className="border-l-4 border-l-info">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Truck className="h-4 w-4" />
                處理方式
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                              <div className="text-sm font-medium text-info flex items-center gap-1">
                <Clock className="h-4 w-4" />
                預訂出貨
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 缺貨商品詳情表格 */}
        <div className="flex-1 overflow-y-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%]">商品資訊</TableHead>
                <TableHead className="text-center">需求數量</TableHead>
                <TableHead className="text-center">現有庫存</TableHead>
                <TableHead className="text-center">缺貨數量</TableHead>
                <TableHead className="text-center">狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insufficientStockItems.map((item, index) => (
                <TableRow key={`${item.sku}-${index}`} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="space-y-1">
                                              <div className="font-medium text-foreground">
                        {item.product_name}
                      </div>
                                              <div className="text-sm text-muted-foreground font-mono">
                        SKU: {item.sku}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {item.requested_quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant={item.available_quantity > 0 ? "secondary" : "destructive"}
                      className="font-mono"
                    >
                      {item.available_quantity}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="destructive" className="font-mono">
                      -{item.shortage}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-warning border-warning/30">
                      <Clock className="h-3 w-3 mr-1" />
                      待補貨
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* 預訂模式說明 */}
        <Card className="bg-info/10 border-info/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                                  <h4 className="font-medium text-info">
                  預訂模式說明
                </h4>
                                  <div className="text-sm text-info space-y-1">
                  <p>• <strong>立即建立訂單</strong>：系統將建立預訂訂單，不會扣減現有庫存</p>
                  <p>• <strong>補貨通知</strong>：採購部門將收到補貨通知，安排供應商進貨</p>
                  <p>• <strong>分批出貨</strong>：有庫存的商品可先出貨，其餘商品補貨後出貨</p>
                  <p>• <strong>客戶通知</strong>：系統將自動通知客戶預計出貨時間</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel 
            onClick={handleCancel}
            disabled={isProcessing}
            className="flex items-center gap-2"
          >
            取消建單
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmBackorder}
            disabled={isProcessing}
            className="bg-info hover:bg-info/90 flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                建立中...
              </>
            ) : (
              <>
                <Truck className="h-4 w-4" />
                確認建立預訂訂單
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 