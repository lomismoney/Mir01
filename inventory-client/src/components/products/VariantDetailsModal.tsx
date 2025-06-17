"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
} from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Package, Search } from "lucide-react";
import { ProductItem, ProductVariant } from "@/types/api-helpers";

/**
 * 商品規格詳細資訊模態框元件
 * 
 * @description
 * 用於顯示單一 SPU 下所有 SKU 變體的詳細資訊，包含：
 * - SKU 編碼和屬性組合
 * - 價格資訊
 * - 庫存狀態（預留接口）
 * - 單個 SKU 的編輯操作
 * 
 * 採用 TanStack Table 架構，與主表格保持一致的使用體驗
 * 
 * @param isOpen - 模態框開啟狀態
 * @param onClose - 關閉模態框的回調函數
 * @param product - 要顯示規格的商品資料（SPU）
 */
interface VariantDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
}

/**
 * 安全的價格格式化函數
 * 
 * @description
 * 格式化單一 SKU 的價格顯示
 * 
 * @param price - 價格數值
 * @returns 格式化的價格字串
 */
const formatPrice = (price?: number) => {
  if (price === undefined || price === null) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  return new Intl.NumberFormat('zh-TW', { 
    style: 'currency', 
    currency: 'TWD' 
  }).format(price);
};

/**
 * 格式化規格屬性顯示
 * 
 * @description
 * 將 SKU 的屬性值組合成易讀的字串
 * 例如：[{attribute: {name: "顏色"}, value: "紅色"}, {attribute: {name: "尺寸"}, value: "L"}] 
 *       -> "顏色: 紅色, 尺寸: L"
 * 
 * @param attributeValues - 屬性值陣列
 * @returns 格式化的屬性字串
 */
const formatVariantAttributes = (attributeValues?: ProductVariant['attribute_values']) => {
  if (!attributeValues || attributeValues.length === 0) {
    return <span className="text-muted-foreground">無規格</span>;
  }

  const attributes = attributeValues
    .map(attr => `${attr.attribute?.name || '未知屬性'}: ${attr.value || '未知值'}`)
    .join(', ');

  return attributes || <span className="text-muted-foreground">無規格</span>;
};

/**
 * SKU 表格欄位定義
 * 
 * @description
 * 定義 SKU 變體表格的所有欄位結構，包含：
 * - SKU 編碼（唯一識別碼）
 * - 規格屬性（顏色、尺寸等組合）
 * - 價格資訊
 * - 庫存狀態（預留接口）
 * - 編輯操作
 */
const skuColumns: ColumnDef<ProductVariant>[] = [
  // SKU 編碼欄位
  {
    accessorKey: "sku",
    header: "SKU 編碼",
    cell: ({ row }) => {
      const sku = row.original.sku;
      return (
        <Badge variant="outline" className="font-mono">
          {sku || <span className="text-muted-foreground">無 SKU</span>}
        </Badge>
      );
    },
  },

  // 規格屬性欄位
  {
    id: "attributes",
    header: "規格屬性",
    cell: ({ row }) => {
      const attributeValues = row.original.attribute_values;
      return (
        <div className="max-w-[250px]">
          {formatVariantAttributes(attributeValues)}
        </div>
      );
    },
  },

  // 價格欄位
  {
    accessorKey: "price",
    header: "價格",
    cell: ({ row }) => {
      const price = row.original.price;
      return (
        <div className="font-medium">
          {formatPrice(typeof price === 'string' ? parseFloat(price) : price)}
        </div>
      );
    },
  },

  // 庫存狀態欄位（預留接口）
  {
    id: "inventory",
    header: "當前庫存",
    cell: ({ row }) => {
      const inventory = row.original.inventory;
      
      // 如果有庫存資料，顯示總庫存
      if (inventory && inventory.length > 0) {
        const totalQuantity = inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
        return (
          <div className="text-center">
            <Badge variant={totalQuantity > 0 ? "default" : "destructive"}>
              {totalQuantity} 件
            </Badge>
          </div>
        );
      }
      
      // 預留接口提示
      return (
        <div className="text-center">
          <Badge variant="secondary">
            待對接
          </Badge>
        </div>
      );
    },
  },

  // 建立時間欄位
  {
    accessorKey: "created_at",
    header: "建立時間",
    cell: ({ row }) => {
      const createdAt = row.original.created_at;
      if (!createdAt) return <span className="text-muted-foreground">N/A</span>;
      
      return new Date(createdAt).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
  },

  // 操作欄位
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const variant = row.original;

      const handleEditVariant = () => {
        // TODO: 實現 SKU 編輯功能
        console.log('編輯 SKU:', variant);
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">開啟選單</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEditVariant}>
              <Edit className="mr-2 h-4 w-4" />
              編輯 SKU
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
];

const VariantDetailsModal = ({ isOpen, onClose, product }: VariantDetailsModalProps) => {
  // 準備 SKU 資料
  const variants = product?.variants ?? [];
  
  // TanStack Table 狀態管理
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  // 初始化表格
  const table = useReactTable({
    data: variants,
    columns: skuColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    autoResetPageIndex: false, // 🎯 斬斷循環：禁用分頁自動重設
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            <span>商品規格詳情</span>
            {product?.name && (
              <span className="text-muted-foreground">- {product.name}</span>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* SKU 詳細表格 */}
        <div className="mt-4">
          {product ? (
            <div className="space-y-4">
              {/* 商品摘要資訊 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">商品名稱</span>
                  <p className="font-medium">{product.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">規格數量</span>
                  <p className="font-medium">{variants.length} 個 SKU</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">價格範圍</span>
                  <p className="font-medium">
                    {product.price_range ? 
                      `${formatPrice(product.price_range.min)} - ${formatPrice(product.price_range.max)}` : 
                      'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* SKU 表格 */}
              {variants.length > 0 ? (
                <div className="space-y-4">
                  {/* 搜尋框 */}
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="搜尋 SKU 編碼..."
                      value={globalFilter ?? ""}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* 表格 */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                              <TableHead key={header.id}>
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext()
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={skuColumns.length}
                              className="h-24 text-center"
                            >
                              沒有找到相符的 SKU
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 分頁控制 */}
                  <div className="flex items-center justify-between space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                      共 {table.getFilteredRowModel().rows.length} 個 SKU
                    </div>
                    <div className="space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        上一頁
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        下一頁
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>此商品尚無 SKU 規格</p>
                  <p className="text-sm">請先為商品添加規格變體</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>請選擇一個商品以查看其規格詳情</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariantDetailsModal; 