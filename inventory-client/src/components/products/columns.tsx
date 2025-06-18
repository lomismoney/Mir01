"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, ChevronRight, ChevronDown, Package, Image as ImageIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ProductItem } from "@/types/api-helpers";

/**
 * 商品表格欄位定義 (SPU+SKU 巢狀架構)
 * 
 * @description
 * 定義商品管理表格的所有欄位結構，採用 SPU+SKU 巢狀顯示架構：
 * - 展開/收合欄位（控制 SKU 變體顯示）
 * - 複選框欄位（用於批量操作）
 * - 商品基本資訊（名稱、描述、分類）
 * - 價格範圍資訊（SPU 層級顯示範圍，SKU 層級顯示具體價格）
 * - 規格詳情（SPU 顯示數量，SKU 顯示具體規格）
 * - 庫存資訊（SKU 層級顯示）
 * - 操作欄位（編輯、刪除、查看規格）
 * 
 * 使用 TanStack Table 的 ColumnDef 類型，確保類型安全
 * 使用統一的 ProductItem 類型，支援 SPU+SKU 架構
 */

// 使用統一的權威 Product 類型
export type Product = ProductItem;

/**
 * 擴展的商品項目類型，支援巢狀顯示
 */
export interface ExpandedProductItem extends Omit<ProductItem, 'id'> {
  // 使用字符串 ID 來支援變體行的複合 ID
  id: string;
  // 原始數字 ID（僅 SPU 主行使用）
  originalId?: number;
  // 標記是否為 SKU 變體行
  isVariantRow?: boolean;
  // 父商品 ID（僅 SKU 變體行使用）
  parentId?: number;
  // 變體資訊（僅 SKU 變體行使用）
  variantInfo?: {
    id: number;
    sku: string;
    price: number;
    attribute_values?: Array<{
      id: number;
      value: string;
      attribute?: {
        id: number;
        name: string;
      };
    }>;
    inventories?: Array<{
      store_id: number;
      quantity: number;
      store?: {
        id: number;
        name: string;
      };
    }>;
  };
  // 預處理的變體資訊（僅 SPU 主行使用，供 getSubRows 使用）
  processedVariants?: ExpandedProductItem[];
}

/**
 * 安全的價格格式化函數
 * 
 * @param price - 價格數值
 * @returns 格式化的價格字串
 */
const formatPrice = (price?: number) => {
  if (price === undefined || price === null) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const formatter = new Intl.NumberFormat('zh-TW', { 
    style: 'currency', 
    currency: 'TWD' 
  });

  return formatter.format(price);
};

/**
 * 安全的價格範圍格式化函數
 * 
 * @param priceRange - 價格範圍物件，包含 min, max, count
 * @returns 格式化的價格範圍字串
 */
const formatPriceRange = (priceRange?: { min?: number; max?: number; count?: number }) => {
  if (!priceRange || priceRange.count === 0 || priceRange.min === undefined) {
    return <span className="text-muted-foreground">N/A</span>;
  }

  const formatter = new Intl.NumberFormat('zh-TW', { 
    style: 'currency', 
    currency: 'TWD' 
  });

  // 如果最低價和最高價相同，只顯示一個價格
  if (priceRange.min === priceRange.max) {
    return formatter.format(priceRange.min);
  }

  // 顯示價格範圍
  return `${formatter.format(priceRange.min)} - ${formatter.format(priceRange.max!)}`;
};

/**
 * 格式化規格屬性顯示
 * 
 * @param attributeValues - 屬性值陣列
 * @returns 格式化的屬性字串
 */
const formatAttributes = (attributeValues?: { value?: string; attribute?: { name?: string } }[]) => {
  if (!attributeValues || attributeValues.length === 0) {
    return <span className="text-muted-foreground">無規格</span>;
  }

  const attributes = attributeValues
    .map(attr => `${attr.attribute?.name}: ${attr.value}`)
    .filter(Boolean)
    .join(' | ');

  return attributes || <span className="text-muted-foreground">無規格</span>;
};

/**
 * 格式化庫存資訊顯示
 * 
 * @param inventories - 庫存陣列
 * @returns 格式化的庫存資訊
 */
const formatInventories = (inventories?: Array<{ store_id: number; quantity: number; store?: { name: string } }>) => {
  if (!inventories || inventories.length === 0) {
    return <span className="text-muted-foreground">無庫存資料</span>;
  }

  const totalStock = inventories.reduce((sum, inv) => sum + inv.quantity, 0);
  const storeCount = inventories.length;

  return (
    <div className="text-sm">
      <div className="font-medium">總庫存: {totalStock}</div>
      <div className="text-muted-foreground">{storeCount} 個門市</div>
    </div>
  );
};

export const columns: ColumnDef<ExpandedProductItem>[] = [
  // 展開/收合欄位
  {
    id: "expander",
    header: "",
    cell: ({ row, table }) => {
      // 只有 SPU 主行才顯示展開按鈕
      if (row.original.isVariantRow) {
        return <div className="w-6" />; // 佔位符，保持對齊
      }

      const hasVariants = (row.original.variants?.length || 0) > 1;
      if (!hasVariants) {
        return <div className="w-6" />; // 單規格商品不需要展開按鈕
      }

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => row.toggleExpanded()}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // 複選框欄位
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="全選"
      />
    ),
    cell: ({ row }) => {
      // SKU 變體行不顯示複選框
      if (row.original.isVariantRow) {
        return <div className="w-4" />;
      }

      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="選擇商品"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // 商品名稱/SKU 欄位
  {
    accessorKey: "name",
    header: "商品名稱 / SKU",
    cell: ({ row }) => {
      const item = row.original;
      
      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示
        return (
          <div className="pl-8 flex items-center space-x-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <div className="font-mono text-sm font-medium">{item.variantInfo.sku}</div>
              <div className="text-xs text-muted-foreground">SKU 變體</div>
            </div>
          </div>
        );
      }

      // SPU 主行顯示
      const name = item.name;
      return (
        <div className="font-medium">
          {name || <span className="text-muted-foreground">未命名商品</span>}
        </div>
      );
    },
  },

  // 商品描述/規格 欄位
  {
    accessorKey: "description",
    header: "描述 / 規格",
    cell: ({ row }) => {
      const item = row.original;
      
      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示規格
        return (
          <div className="pl-8">
            {formatAttributes(item.variantInfo.attribute_values)}
          </div>
        );
      }

      // SPU 主行顯示描述
      const description = item.description;
      return (
        <div className="max-w-[200px] truncate">
          {description || <span className="text-muted-foreground">無描述</span>}
        </div>
      );
    },
  },

  // 分類欄位
  {
    accessorKey: "category",
    header: "分類",
    cell: ({ row }) => {
      const item = row.original;
      
      if (item.isVariantRow) {
        // SKU 變體行不顯示分類
        return <div className="pl-8" />;
      }

      // SPU 主行顯示分類
      const category = item.category;
      return category?.name ? (
        <Badge variant="secondary">{category.name}</Badge>
      ) : (
        <span className="text-muted-foreground">未分類</span>
      );
    },
  },

  // 縮圖欄位
  {
    id: "thumbnail",
    header: "縮圖",
    cell: ({ row }) => {
      const item = row.original;
      
      if (item.isVariantRow) {
        // SKU 變體行不顯示縮圖
        return <div className="pl-8" />;
      }

      // SPU 主行顯示縮圖
      const product = item;
      return product.image_urls?.thumb ? (
        <img
          src={product.image_urls.thumb}
          alt={product.name}
          className="h-16 w-16 rounded-md object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-md bg-secondary">
          <ImageIcon className="h-6 w-6 text-muted-foreground" />
        </div>
      );
    },
    enableSorting: false,
    size: 80,
  },

  // 價格欄位
  {
    id: "price",
    header: "價格",
    cell: ({ row }) => {
      const item = row.original;
      
      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示具體價格
        return (
          <div className="pl-8 font-medium">
            {formatPrice(item.variantInfo.price)}
          </div>
        );
      }

      // SPU 主行顯示價格範圍
      const priceRange = item.price_range;
      return (
        <div className="font-medium">
          {formatPriceRange(priceRange)}
        </div>
      );
    },
  },

  // 庫存/規格數量 欄位
  {
    id: "inventory_or_variant_count",
    header: "庫存 / 規格數量",
    cell: ({ row }) => {
      const item = row.original;
      
      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示庫存資訊
        return (
          <div className="pl-8">
            {formatInventories(item.variantInfo.inventories)}
          </div>
        );
      }

      // SPU 主行顯示規格數量
      const variantCount = item.variants?.length || 0;
      return (
        <div className="text-center">
          <Badge variant={variantCount > 1 ? "default" : "secondary"}>
            {variantCount} 個規格
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
      const item = row.original;
      
      if (item.isVariantRow) {
        // SKU 變體行不顯示建立時間
        return <div className="pl-8" />;
      }

      // SPU 主行顯示建立時間
      const createdAt = item.created_at;
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
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;
      
      if (item.isVariantRow) {
        // SKU 變體行不顯示操作按鈕
        return <div className="pl-8" />;
      }

      // SPU 主行顯示完整操作選單
      function ActionsComponent() {
        const router = useRouter();

        const handleEdit = () => {
          window.dispatchEvent(new CustomEvent('editProduct', { detail: { id: item.originalId } }));
        };

        const handleDelete = () => {
          window.dispatchEvent(new CustomEvent('deleteProduct', { detail: { id: item.originalId, name: item.name } }));
        };

        const handleViewVariants = () => {
          window.dispatchEvent(new CustomEvent('viewVariants', { detail: item }));
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
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                編輯
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleViewVariants}>
                <Eye className="mr-2 h-4 w-4" />
                查看規格
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                刪除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      return <ActionsComponent />;
    },
  },
]; 