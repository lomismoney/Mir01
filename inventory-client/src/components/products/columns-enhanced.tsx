"use client";

import { ColumnDef, Row } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ChevronRight,
  ChevronDown,
  Package,
  Image as ImageIcon,
  Tag,
  DollarSign,
  Box,
  Calendar,
  CheckCircle,
  Pencil,
  Archive,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductItem } from "@/types/api-helpers";
import { cn } from "@/lib/utils";
import { MoneyHelper } from "@/lib/money-helper";
import { addImageCacheBuster } from "@/lib/utils";

// 導入懶加載圖片組件
import { LazyImage } from "@/components/ui/lazy-image";

// 使用統一的權威 Product 類型
export type Product = ProductItem;

/**
 * 擴展的商品項目類型，支援巢狀顯示
 */
export interface ExpandedProductItem extends Omit<ProductItem, "id"> {
  id: string;
  originalId?: number;
  isVariantRow?: boolean;
  parentId?: number;
  variantInfo?: {
    id: number;
    sku: string;
    price: string;
    attribute_values?: Array<{
      id: number;
      value: string;
      attribute?: {
        id: number;
        name: string;
      };
    }>;
    inventory?: Array<{
      id?: number;
      quantity: number;
      low_stock_threshold?: number;
      store?: {
        id: number;
        name: string;
      };
    }>;
  };
  processedVariants?: ExpandedProductItem[];
}

/**
 * 增強版商品欄位定義 - 支援圖片懶加載
 */
export const columnsEnhanced: ColumnDef<ExpandedProductItem>[] = [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行不顯示展開按鈕
      if (item.isVariantRow) {
        return null;
      }
      
      // 只有具有變體的商品才顯示展開按鈕
      const hasVariants = item.variants && item.variants.length > 0;
      if (!hasVariants) {
        return <div className="w-[24px]" />;
      }
      
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => row.toggleExpanded()}
          className="h-8 w-8 p-0"
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      );
    },
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  
  {
    id: "select",
    header: ({ table }) => (
      <div className="pr-2">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="選擇所有"
          className="translate-y-[2px]"
        />
      </div>
    ),
    cell: ({ row }) => {
      // SKU 變體行不顯示複選框
      if (row.original.isVariantRow) {
        return null;
      }
      
      return (
        <div className="pr-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="選擇行"
            className="translate-y-[2px]"
          />
        </div>
      );
    },
    size: 40,
    enableSorting: false,
    enableHiding: false,
  },
  
  {
    id: "product",
    accessorKey: "name",
    header: "商品",
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行的特殊顯示
      if (item.isVariantRow && item.variantInfo) {
        const variant = item.variantInfo;
        const specText = variant.attribute_values
          ?.map((av) => av.value)
          .join(" / ") || "無規格";
          
        return (
          <div className="pl-12 py-2">
            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium text-sm">{specText}</div>
                <div className="text-xs text-muted-foreground">
                  SKU: {variant.sku}
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      // SPU 主行顯示 - 使用懶加載圖片
      let imageUrl = item.image_urls?.thumb || item.image_urls?.original;
      if (imageUrl) {
        imageUrl = imageUrl.replace("localhost", "127.0.0.1");
      }
      
      return (
        <div className="flex items-start gap-3 min-w-[250px]">
          <div className="flex-shrink-0">
            {imageUrl ? (
              <LazyImage
                src={addImageCacheBuster(imageUrl)}
                alt={item.name}
                width={48}
                height={48}
                className="rounded-md"
                containerClassName="w-12 h-12 rounded-md overflow-hidden"
                objectFit="cover"
                placeholder="shimmer"
                threshold={0.1}
                rootMargin="100px"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-1">
            <div>
              <Link
                href={`/products/${item.originalId}/edit`}
                className="font-medium text-sm hover:text-primary transition-colors line-clamp-2"
              >
                {item.name}
              </Link>
              {item.brands && item.brands.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {item.brands[0].name}
                </Badge>
              )}
            </div>
            
            {item.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {item.description}
              </p>
            )}
            
            {item.variants && item.variants.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                <span>{item.variants.length} 個規格</span>
              </div>
            )}
          </div>
        </div>
      );
    },
    size: 300,
    enableSorting: true,
  },
  
  {
    id: "specs",
    header: "規格/分類",
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行不顯示此欄位
      if (item.isVariantRow) {
        return null;
      }
      
      return (
        <div className="space-y-2">
          {item.categories && item.categories.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {item.categories.map((category) => (
                <Badge
                  key={category.id}
                  variant="outline"
                  className="text-xs"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}
          
          {item.attributes && item.attributes.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {item.attributes.length} 個屬性
            </div>
          )}
        </div>
      );
    },
    size: 150,
  },
  
  {
    id: "price",
    header: "價格",
    accessorFn: (row) => {
      if (row.isVariantRow && row.variantInfo) {
        return parseFloat(row.variantInfo.price);
      }
      return parseFloat(row.price);
    },
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行顯示具體價格
      if (item.isVariantRow && item.variantInfo) {
        return (
          <div className="font-medium">
            {MoneyHelper.format(parseFloat(item.variantInfo.price) || 0, 'NT$')}
          </div>
        );
      }
      
      // SPU 主行顯示價格範圍
      if (item.variants && item.variants.length > 0) {
        const prices = item.variants.map((v) => parseFloat(v.price));
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
        if (minPrice === maxPrice) {
          return (
            <div className="font-medium">
              {MoneyHelper.format(minPrice || 0, 'NT$')}
            </div>
          );
        }
        
        return (
          <div className="space-y-1">
            <div className="text-sm">
              {MoneyHelper.format(minPrice || 0, 'NT$')} -{" "}
              {MoneyHelper.format(maxPrice || 0, 'NT$')}
            </div>
            <div className="text-xs text-muted-foreground">
              價格範圍
            </div>
          </div>
        );
      }
      
      // 單一商品顯示單一價格
      return (
        <div className="font-medium">
          {MoneyHelper.format(parseFloat(item.price) || 0, 'NT$')}
        </div>
      );
    },
    size: 120,
    enableSorting: true,
  },
  
  {
    id: "status",
    accessorKey: "status",
    header: "狀態",
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行不顯示狀態
      if (item.isVariantRow) {
        return null;
      }
      
      const status = item.status;
      const statusConfig = {
        active: {
          label: "上架中",
          variant: "default" as const,
          icon: CheckCircle,
        },
        draft: {
          label: "草稿",
          variant: "secondary" as const,
          icon: Pencil,
        },
        archived: {
          label: "已下架",
          variant: "outline" as const,
          icon: Archive,
        },
      };
      
      const config = statusConfig[status as keyof typeof statusConfig] || {
        label: status,
        variant: "outline" as const,
        icon: Package,
      };
      
      const Icon = config.icon;
      
      return (
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      );
    },
    size: 100,
    enableSorting: true,
  },
  
  {
    id: "inventory",
    header: "庫存",
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行顯示具體庫存
      if (item.isVariantRow && item.variantInfo?.inventory) {
        const totalQuantity = item.variantInfo.inventory.reduce(
          (sum, inv) => sum + inv.quantity,
          0
        );
        
        const hasLowStock = item.variantInfo.inventory.some((inv) => {
          const threshold = inv.low_stock_threshold || 10;
          return inv.quantity <= threshold;
        });
        
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "font-medium",
                hasLowStock && "text-destructive"
              )}>
                {totalQuantity}
              </span>
            </div>
            
            {item.variantInfo.inventory.length > 1 && (
              <div className="text-xs text-muted-foreground">
                分佈於 {item.variantInfo.inventory.length} 個倉庫
              </div>
            )}
          </div>
        );
      }
      
      // SPU 主行顯示總庫存
      if (!item.isVariantRow && item.inventory) {
        const totalInventory = item.inventory.reduce(
          (sum, inv) => sum + inv.quantity,
          0
        );
        
        // 檢查是否有低庫存
        const hasLowStock = item.inventory.some((inv) => {
          const threshold = inv.low_stock_threshold || 10;
          return inv.quantity <= threshold;
        });
        
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className={cn(
                "font-medium",
                hasLowStock && "text-destructive"
              )}>
                {totalInventory}
              </span>
            </div>
            
            {hasLowStock && (
              <Badge variant="destructive" className="text-xs">
                庫存不足
              </Badge>
            )}
            
            {totalInventory > 0 && (
              <Progress
                value={(totalInventory / 200) * 100}
                className="h-1.5"
              />
            )}
          </div>
        );
      }
      
      return <span className="text-muted-foreground">-</span>;
    },
    size: 120,
  },
  
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "建立時間",
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行不顯示建立時間
      if (item.isVariantRow) {
        return null;
      }
      
      const date = new Date(item.created_at);
      
      return (
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span>{date.toLocaleDateString("zh-TW")}</span>
        </div>
      );
    },
    size: 120,
    enableSorting: true,
  },
  
  {
    id: "actions",
    header: "操作",
    cell: ({ row }) => {
      const item = row.original;
      
      // SKU 變體行不顯示操作
      if (item.isVariantRow) {
        return null;
      }
      
      const hasVariants = item.variants && item.variants.length > 0;
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <span className="sr-only">開啟選單</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("editProduct", {
                    detail: { id: item.originalId },
                  })
                );
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              編輯商品
            </DropdownMenuItem>
            
            {hasVariants && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("viewVariants", {
                        detail: item,
                      })
                    );
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  查看規格詳情
                </DropdownMenuItem>
              </>
            )}
            
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("deleteProduct", {
                    detail: {
                      id: item.originalId,
                      name: item.name,
                    },
                  })
                );
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              刪除商品
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 60,
    enableSorting: false,
    enableHiding: false,
  },
];