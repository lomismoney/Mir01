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
    return (
      <span className="text-muted-foreground" data-oid="98a:4vg">
        N/A
      </span>
    );
  }

  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
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
const formatVariantAttributes = (
  attributeValues?: ProductVariant["attribute_values"],
) => {
  if (!attributeValues || attributeValues.length === 0) {
    return (
      <span className="text-muted-foreground" data-oid="mgqa-6d">
        無規格
      </span>
    );
  }

  const attributes = attributeValues
    .map(
      (attr) =>
        `${attr.attribute?.name || "未知屬性"}: ${attr.value || "未知值"}`,
    )
    .join(", ");

  return (
    attributes || (
      <span className="text-muted-foreground" data-oid="0mpw924">
        無規格
      </span>
    )
  );
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
        <Badge variant="outline" className="font-mono" data-oid="wacxk9x">
          {sku || (
            <span className="text-muted-foreground" data-oid="401r2lu">
              無 SKU
            </span>
          )}
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
        <div className="max-w-[250px]" data-oid="-zqlitb">
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
        <div className="font-medium" data-oid="-dal5xe">
          {formatPrice(
            Number.isFinite(Number(price)) ? Number(price) : undefined,
          )}
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
        const totalQuantity = inventory.reduce(
          (sum, inv) => sum + (inv.quantity || 0),
          0,
        );
        return (
          <div className="text-center" data-oid="ms95f3a">
            <Badge
              variant={totalQuantity > 0 ? "default" : "destructive"}
              data-oid="fmo38nm"
            >
              {totalQuantity} 件
            </Badge>
          </div>
        );
      }

      // 預留接口提示
      return (
        <div className="text-center" data-oid="hz9n-1_">
          <Badge variant="secondary" data-oid="k4dfzqh">
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
      if (!createdAt)
        return (
          <span className="text-muted-foreground" data-oid="o.dcbm5">
            N/A
          </span>
        );

      return new Date(createdAt).toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
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
        // 編輯功能尚未實現
      };
      return (
        <DropdownMenu data-oid="pmhio3o">
          <DropdownMenuTrigger asChild data-oid="el4gt-i">
            <Button variant="ghost" className="h-8 w-8 p-0" data-oid="12wjmf0">
              <span className="sr-only" data-oid="1t_.gc6">
                開啟選單
              </span>
              <MoreHorizontal className="h-4 w-4" data-oid="p5igxwa" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" data-oid="4ur_o1o">
            <DropdownMenuItem onClick={handleEditVariant} data-oid="7pg7lf6">
              <Edit className="mr-2 h-4 w-4" data-oid=":qdia54" />
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

const VariantDetailsModal = ({
  isOpen,
  onClose,
  product,
}: VariantDetailsModalProps) => {
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
    <Dialog open={isOpen} onOpenChange={onClose} data-oid="xmi7c56">
      <DialogContent
        className="max-w-6xl max-h-[80vh] overflow-y-auto"
        data-oid="-0b9lba"
      >
        <DialogHeader data-oid="-j:5t9t">
          <DialogTitle className="flex items-center gap-2" data-oid="rsw0g46">
            <Package className="h-5 w-5" data-oid="67l8bma" />
            <span data-oid="oxinu4k">商品規格詳情</span>
            {product?.name && (
              <span className="text-muted-foreground" data-oid="o4c20hw">
                - {product.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* SKU 詳細表格 */}
        <div className="mt-4" data-oid="tlwji:8">
          {product ? (
            <div className="space-y-4" data-oid="l3db_mx">
              {/* 商品摘要資訊 */}
              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg"
                data-oid="d3ybe1t"
              >
                <div data-oid="v5s18.4">
                  <span
                    className="text-sm font-medium text-muted-foreground"
                    data-oid="c615zl0"
                  >
                    商品名稱
                  </span>
                  <p className="font-medium" data-oid="5ee-yiw">
                    {product.name}
                  </p>
                </div>
                <div data-oid="nn1iu2a">
                  <span
                    className="text-sm font-medium text-muted-foreground"
                    data-oid="0mqgl08"
                  >
                    規格數量
                  </span>
                  <p className="font-medium" data-oid="4cd9m0_">
                    {variants.length} 個 SKU
                  </p>
                </div>
                <div data-oid="p:x0hob">
                  <span
                    className="text-sm font-medium text-muted-foreground"
                    data-oid="83d8unj"
                  >
                    價格範圍
                  </span>
                  <p className="font-medium" data-oid="3l2rj-v">
                    {product.price_range
                      ? `${formatPrice(product.price_range.min)} - ${formatPrice(product.price_range.max)}`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* SKU 表格 */}
              {variants.length > 0 ? (
                <div className="space-y-4" data-oid="wist7ep">
                  {/* 搜尋框 */}
                  <div className="relative max-w-sm" data-oid="om4i5-z">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
                      data-oid="1y6-x1q"
                    />

                    <Input
                      placeholder="搜尋 SKU 編碼..."
                      value={globalFilter ?? ""}
                      onChange={(e) => setGlobalFilter(e.target.value)}
                      className="pl-10"
                      data-oid="sxzw7ib"
                    />
                  </div>

                  {/* 表格 */}
                  <div className="rounded-md border" data-oid="7tby66:">
                    <Table data-oid="0tplza6">
                      <TableHeader data-oid="t72ugly">
                        {table.getHeaderGroups().map((headerGroup) => (
                          <TableRow
                            key={headerGroup.id}
                            className="border-b hover:bg-transparent"
                            data-oid="8x0.e9z"
                          >
                            {headerGroup.headers.map((header) => (
                              <TableHead
                                key={header.id}
                                className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                                data-oid="c-uh.qa"
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody data-oid="n0-pdlj">
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map((row) => (
                            <TableRow
                              key={row.id}
                              data-state={row.getIsSelected() && "selected"}
                              data-oid="4mtt_d8"
                            >
                              {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id} data-oid="bzxxgxy">
                                  {flexRender(
                                    cell.column.columnDef.cell,
                                    cell.getContext(),
                                  )}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow data-oid="o9b13p5">
                            <TableCell
                              colSpan={skuColumns.length}
                              className="h-24 text-center"
                              data-oid="vyveysz"
                            >
                              沒有找到相符的 SKU
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* 分頁控制 */}
                  <div
                    className="flex items-center justify-between space-x-2 py-4"
                    data-oid="7pgsxdr"
                  >
                    <div
                      className="text-sm text-muted-foreground"
                      data-oid="oxeyimu"
                    >
                      共 {table.getFilteredRowModel().rows.length} 個 SKU
                    </div>
                    <div className="space-x-2" data-oid="p54cdqr">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        data-oid="f.lsxz3"
                      >
                        上一頁
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        data-oid="jzw7rf."
                      >
                        下一頁
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-oid="qcevq8d"
                >
                  <Package
                    className="h-12 w-12 mx-auto mb-4 opacity-50"
                    data-oid="gb7yrjx"
                  />

                  <p data-oid="tr5amif">此商品尚無 SKU 規格</p>
                  <p className="text-sm" data-oid="6i7i0ts">
                    請先為商品添加規格變體
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className="text-center py-8 text-muted-foreground"
              data-oid="mne42kr"
            >
              <Package
                className="h-12 w-12 mx-auto mb-4 opacity-50"
                data-oid="pakv_hk"
              />

              <p data-oid="887ifuf">請選擇一個商品以查看其規格詳情</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VariantDetailsModal;
