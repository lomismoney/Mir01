"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { ProductItem } from "@/types/api-helpers";

/**
 * 商品表格欄位定義 (SPU 架構)
 * 
 * @description
 * 定義商品管理表格的所有欄位結構，採用 SPU (Standard Product Unit) 架構：
 * - 複選框欄位（用於批量操作）
 * - 商品基本資訊（名稱、描述、分類）
 * - 價格範圍資訊（最低價-最高價，基於 SKU 變體計算）
 * - 規格數量（顯示該 SPU 下有多少個 SKU）
 * - 操作欄位（編輯、刪除、查看規格）
 * 
 * 使用 TanStack Table 的 ColumnDef 類型，確保類型安全
 * 使用統一的 ProductItem 類型，支援 SPU+SKU 架構
 */

// 使用統一的權威 Product 類型
export type Product = ProductItem;

/**
 * 安全的價格範圍格式化函數
 * 
 * @description
 * 根據商品的 price_range 資訊，格式化顯示價格範圍：
 * - 單一價格：顯示 "NT$1,200"
 * - 價格範圍：顯示 "NT$1,200 - NT$1,500"
 * - 無變體：顯示 "N/A"
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
 * @description
 * 將商品變體的屬性值組合成易讀的字串
 * 例如：["紅色", "大號"] -> "紅色, 大號"
 * 
 * @param attributeValues - 屬性值陣列
 * @returns 格式化的屬性字串
 */
const formatAttributes = (attributeValues?: { value?: string; attribute?: { name?: string } }[]) => {
  if (!attributeValues || attributeValues.length === 0) {
    return <span className="text-muted-foreground">無規格</span>;
  }

  const attributes = attributeValues
    .map(attr => attr.value)
    .filter(Boolean)
    .join(', ');

  return attributes || <span className="text-muted-foreground">無規格</span>;
};

export const columns: ColumnDef<Product>[] = [
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
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="選擇商品"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // 商品名稱欄位
  {
    accessorKey: "name",
    header: "商品名稱",
    cell: ({ row }) => {
      const name = row.original.name;
      return (
        <div className="font-medium">
          {name || <span className="text-muted-foreground">未命名商品</span>}
        </div>
      );
    },
  },

  // 商品描述欄位
  {
    accessorKey: "description",
    header: "描述",
    cell: ({ row }) => {
      const description = row.original.description;
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
      const category = row.original.category;
      return category?.name ? (
        <Badge variant="secondary">{category.name}</Badge>
      ) : (
        <span className="text-muted-foreground">未分類</span>
      );
    },
  },

  // 價格範圍欄位 (SPU 核心功能)
  {
    id: "price_range",
    header: "價格範圍",
    cell: ({ row }) => {
      const priceRange = row.original.price_range;
      return (
        <div className="font-medium">
          {formatPriceRange(priceRange)}
        </div>
      );
    },
  },

  // 規格數量欄位 (新增)
  {
    id: "variant_count",
    header: "規格數量",
    cell: ({ row }) => {
      const variantCount = row.original.variants?.length || 0;
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
      const createdAt = row.original.created_at;
      if (!createdAt) return <span className="text-muted-foreground">N/A</span>;
      
      return new Date(createdAt).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
    },
  },

  // 操作欄位 (增強版)
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const product = row.original;

      const handleEdit = () => {
        const event = new CustomEvent('editProduct', { detail: product });
        window.dispatchEvent(event);
      };

      const handleDelete = () => {
        const event = new CustomEvent('deleteProduct', { detail: product });
        window.dispatchEvent(event);
      };

      const handleViewVariants = () => {
        const event = new CustomEvent('viewVariants', { detail: product });
        window.dispatchEvent(event);
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
            <DropdownMenuItem onClick={handleViewVariants}>
              <Eye className="mr-2 h-4 w-4" />
              查看規格
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="mr-2 h-4 w-4" />
              編輯
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
    },
    enableSorting: false,
    enableHiding: false,
  },
]; 