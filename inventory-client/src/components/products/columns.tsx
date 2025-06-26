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
import Image from "next/image";
import { ProductItem } from "@/types/api-helpers";
import { cn } from "@/lib/utils";
import { addImageCacheBuster } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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
export interface ExpandedProductItem extends Omit<ProductItem, "id"> {
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
    inventory?: Array<{
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
    return (
      <span className="text-muted-foreground" data-oid=".9ha825">
        N/A
      </span>
    );
  }

  const formatter = new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return formatter.format(price);
};

/**
 * 安全的價格範圍格式化函數
 *
 * @param priceRange - 價格範圍物件，包含 min, max, count
 * @returns 格式化的價格範圍字串
 */
const formatPriceRange = (priceRange?: {
  min?: number;
  max?: number;
  count?: number;
}) => {
  if (!priceRange || priceRange.count === 0 || priceRange.min === undefined) {
    return (
      <span className="text-muted-foreground" data-oid="npypk0i">
        N/A
      </span>
    );
  }

  const formatter = new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  // 如果最低價和最高價相同，只顯示一個價格
  if (priceRange.min === priceRange.max) {
    return (
      <span className="font-medium" data-oid=":jhsr1t">
        {formatter.format(priceRange.min)}
      </span>
    );
  }

  // 顯示最低價格（不加"從"字）
  return (
    <span className="font-medium" data-oid="exs9anp">
      {formatter.format(priceRange.min)}
    </span>
  );
};

/**
 * 格式化規格屬性顯示
 *
 * @param attributeValues - 屬性值陣列
 * @returns 格式化的屬性字串
 */
const formatAttributes = (
  attributeValues?: { value?: string; attribute?: { name?: string } }[],
) => {
  if (!attributeValues || attributeValues.length === 0) {
    return (
      <span className="text-muted-foreground text-sm" data-oid="q24jbxz">
        無規格
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1" data-oid="y430d6c">
      {attributeValues.map((attr, index) => (
        <Badge
          key={index}
          variant="outline"
          className="text-xs h-5 px-2"
          data-oid="53dqo8g"
        >
          <span className="text-muted-foreground" data-oid="c215cmm">
            {attr.attribute?.name}:
          </span>
          <span className="ml-1 font-medium" data-oid="ibjpjo3">
            {attr.value}
          </span>
        </Badge>
      ))}
    </div>
  );
};

/**
 * 格式化庫存資訊顯示
 *
 * @param inventories - 庫存陣列
 * @returns 格式化的庫存資訊
 */
const formatInventories = (
  inventories?: Array<{
    store_id?: number;
    id?: number;
    quantity?: number;
    store?: {
      id?: number;
      name?: string;
    };
  }>,
) => {
  if (!inventories || inventories.length === 0) {
    return (
      <Badge variant="secondary" className="font-normal" data-oid="q_vja8e">
        <Box className="h-3 w-3 mr-1" data-oid="9tn79zn" />
        無庫存
      </Badge>
    );
  }

  const totalStock = inventories.reduce(
    (sum, inv) => sum + (inv.quantity || 0),
    0,
  );
  const storeCount = inventories.length;

  // 使用 Badge 組件顯示庫存狀態
  if (totalStock === 0) {
    return (
      <div className="space-y-1" data-oid="r7-r:kz">
        <Badge variant="destructive" data-oid="mg0muv1">
          <Box className="h-3 w-3 mr-1" data-oid="1h09yf0" />
          缺貨
        </Badge>
        <div className="text-xs text-muted-foreground" data-oid="uoge6qm">
          {storeCount} 個門市
        </div>
      </div>
    );
  } else if (totalStock < 10) {
    return (
      <div className="space-y-1" data-oid="ahzasms">
        <Badge variant="outline" data-oid="0ysma8_">
          <Box className="h-3 w-3 mr-1" data-oid=":1nf0_s" />
          低庫存 ({totalStock})
        </Badge>
        <div className="text-xs text-muted-foreground" data-oid="7a.7w5f">
          {storeCount} 個門市
        </div>
      </div>
    );
  } else {
    return (
      <div className="space-y-1" data-oid="vaq0d36">
        <Badge variant="secondary" data-oid="67-63cp">
          <Box className="h-3 w-3 mr-1" data-oid="k6cmn_q" />
          庫存 {totalStock}
        </Badge>
        <div className="text-xs text-muted-foreground" data-oid="pcf8c.a">
          {storeCount} 個門市
        </div>
      </div>
    );
  }
};

export const columns: ColumnDef<ExpandedProductItem>[] = [
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
        className="translate-y-[2px]"
        data-oid="pzmftq0"
      />
    ),

    cell: ({ row }) => {
      if (row.original.isVariantRow) return null;
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="選擇商品"
          className="translate-y-[2px]"
          data-oid="t:mxh_6"
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // 展開/收合欄位
  {
    id: "expander",
    header: "",
    cell: ({ row, table }) => {
      // 如果是變體行，顯示連接線
      if (row.original.isVariantRow) {
        return (
          <div
            className="flex h-full w-full items-center justify-center"
            data-oid="d-fj3m0"
          >
            <div className="h-full w-px bg-border" data-oid="x8a5yh4"></div>
          </div>
        );
      }

      const hasVariants = (row.original.variants?.length || 0) > 1;
      if (!hasVariants) {
        return null;
      }

      return (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-muted data-[state=open]:bg-muted"
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
          data-oid="js3hzk:"
        >
          {row.getIsExpanded() ? (
            <ChevronDown
              className="h-4 w-4 transition-transform duration-200"
              data-oid="fsy9lvt"
            />
          ) : (
            <ChevronRight
              className="h-4 w-4 transition-transform duration-200"
              data-oid="zmbwxb6"
            />
          )}
        </Button>
      );
    },
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },

  // 重鑄的商品主欄（移除複選框，保持圖片+名稱+SKU）
  {
    id: "product",
    header: "商品",
    cell: ({ row }) => {
      const item = row.original;

      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示
        return (
          <div
            className="flex items-center gap-3 py-2 pl-10"
            data-oid="qbyyy09"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-md bg-muted/50 border border-muted"
              data-oid="svphyhj"
            >
              <Package
                className="h-4 w-4 text-muted-foreground"
                data-oid="ven3yn9"
              />
            </div>
            <div className="flex flex-col gap-0.5" data-oid="5bdbufe">
              <span className="font-mono text-sm" data-oid="g5thj5n">
                {item.variantInfo.sku}
              </span>
              <span
                className="text-xs text-muted-foreground"
                data-oid="h4v8sw0"
              >
                變體規格
              </span>
            </div>
          </div>
        );
      }

      // SPU 主行顯示
      let imageUrl = item.image_urls?.thumb || item.image_urls?.original;
      if (imageUrl) {
        imageUrl = imageUrl.replace("localhost", "127.0.0.1");
      }

      return (
        <div className="flex items-center gap-4" data-oid="387-5:5">
          {/* 圖片縮圖 */}
          <div
            className="h-12 w-12 flex-shrink-0 bg-muted rounded-md flex items-center justify-center overflow-hidden"
            data-oid="l.tokml"
          >
            {imageUrl ? (
              <Image
                src={addImageCacheBuster(imageUrl, item.updated_at) || ""}
                alt={item.name || "商品圖片"}
                width={48}
                height={48}
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  target.parentElement?.classList.add("image-error");
                }}
                data-oid="qy3c6j2"
              />
            ) : (
              <ImageIcon
                className="h-6 w-6 text-muted-foreground"
                data-oid="6fy2:yy"
              />
            )}
          </div>

          {/* 名稱與 SKU */}
          <div className="min-w-0" data-oid="1a7-ba4">
            <Link
              href={`/products/${item.originalId}`}
              className="font-medium truncate hover:underline inline-block max-w-[200px]"
              onClick={(e) => {
                e.stopPropagation();
              }}
              data-oid="zsjgpnd"
            >
              {item.name || "未命名商品"}
            </Link>
            {item.variants &&
              item.variants.length > 0 &&
              item.variants[0].sku && (
                <div
                  className="text-sm text-muted-foreground truncate"
                  data-oid="11s5jlx"
                >
                  SKU: {item.variants[0].sku}
                </div>
              )}
          </div>
        </div>
      );
    },
    size: 400,
  },

  // 規格/分類欄位
  {
    id: "specs",
    header: "規格/分類",
    cell: ({ row }) => {
      const item = row.original;

      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示規格
        return formatAttributes(item.variantInfo.attribute_values);
      }

      // SPU 主行顯示分類
      const category = item.category;
      const variantCount = item.variants?.length || 0;

      return (
        <div className="flex flex-col gap-2" data-oid="p.gubdd">
          {category?.name && (
            <Badge variant="outline" className="w-fit" data-oid="-11d3pz">
              <Tag className="h-3 w-3 mr-1" data-oid="tl_k4n0" />
              {category.name}
            </Badge>
          )}
          <Badge variant="secondary" className="w-fit" data-oid="adbt:si">
            {variantCount} 個規格
          </Badge>
        </div>
      );
    },
  },

  // 價格欄位
  {
    id: "price",
    header: () => (
      <div className="flex items-center gap-1" data-oid="g2erk9m">
        <DollarSign className="h-4 w-4" data-oid="mwal0za" />
        <span data-oid="ad-wfra">價格</span>
      </div>
    ),

    cell: ({ row }) => {
      const item = row.original;

      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示具體價格
        return (
          <div className="text-sm" data-oid="ppchqsr">
            {formatPrice(item.variantInfo.price)}
          </div>
        );
      }

      // SPU 主行顯示價格範圍
      const priceRange = item.price_range;
      return formatPriceRange(priceRange);
    },
  },

  // 狀態欄位（視覺化顯示）
  {
    id: "status",
    header: "狀態",
    cell: ({ row }) => {
      const item = row.original;

      // 變體行不顯示狀態
      if (item.isVariantRow) {
        return null;
      }

      // 計算每個變體的庫存狀態
      const variantsWithStock =
        item.variants?.filter((v: any) => {
          const totalStock =
            v.inventory?.reduce(
              (sum: number, inv: any) => sum + (inv.quantity || 0),
              0,
            ) || 0;
          return totalStock > 0;
        }) || [];

      const totalVariants = item.variants?.length || 0;
      const variantsWithStockCount = variantsWithStock.length;

      // 判斷庫存狀態
      let status: "full_stock" | "partial_stock" | "no_stock";
      if (variantsWithStockCount === 0) {
        status = "no_stock";
      } else if (variantsWithStockCount === totalVariants) {
        status = "full_stock";
      } else {
        status = "partial_stock";
      }

      const statusConfig = {
        full_stock: {
          text: "有庫存",
          variant: "secondary" as const,
          icon: <CheckCircle className="h-3 w-3 mr-1.5" data-oid="uj:2.:1" />,
        },
        partial_stock: {
          text: "部分庫存",
          variant: "outline" as const,
          icon: <Package className="h-3 w-3 mr-1.5" data-oid="6vao7ma" />,
        },
        no_stock: {
          text: "無庫存",
          variant: "destructive" as const,
          icon: <Box className="h-3 w-3 mr-1.5" data-oid="am8oyqn" />,
        },
      };

      const config = statusConfig[status];

      return (
        <Badge
          variant={config.variant}
          className="flex items-center w-fit"
          data-oid="7augw2u"
        >
          {config.icon}
          {config.text}
        </Badge>
      );
    },
  },

  // 庫存欄位（數據化顯示）
  {
    id: "inventory",
    header: "庫存",
    cell: ({ row }) => {
      const item = row.original;

      if (item.isVariantRow && item.variantInfo) {
        // SKU 變體行顯示庫存資訊
        const totalStock =
          item.variantInfo.inventory?.reduce(
            (sum, inv) => sum + (inv.quantity || 0),
            0,
          ) || 0;
        const lowStockThreshold = 10;
        const progress = Math.min(
          (totalStock / (lowStockThreshold * 2)) * 100,
          100,
        );

        return (
          <div className="flex flex-col gap-1 w-32" data-oid="9.n98n:">
            <span className="text-sm" data-oid="1gskoy-">
              {totalStock} 件可用
            </span>
            <Progress
              value={progress}
              className={cn(
                "h-1.5",
                totalStock === 0
                  ? "[&>div]:bg-destructive"
                  : totalStock <= lowStockThreshold
                    ? "[&>div]:bg-muted-foreground"
                    : "[&>div]:bg-primary",
              )}
              data-oid="44dtq9a"
            />
          </div>
        );
      }

      // SPU 主行：檢查是否為單一規格
      const variantCount = item.variants?.length || 0;

      if (variantCount === 1 && item.variants?.[0]) {
        // 單一規格商品，直接顯示庫存
        const singleVariant = item.variants[0];
        const totalStock =
          singleVariant.inventory?.reduce(
            (sum: number, inv: any) => sum + (inv.quantity || 0),
            0,
          ) || 0;
        const lowStockThreshold = 10;
        const progress = Math.min(
          (totalStock / (lowStockThreshold * 2)) * 100,
          100,
        );

        return (
          <div className="flex flex-col gap-1 w-32" data-oid="rcu2t13">
            <span className="text-sm" data-oid="a8jm-pj">
              {totalStock} 件可用
            </span>
            <Progress
              value={progress}
              className={cn(
                "h-1.5",
                totalStock === 0
                  ? "[&>div]:bg-destructive"
                  : totalStock <= lowStockThreshold
                    ? "[&>div]:bg-muted-foreground"
                    : "[&>div]:bg-primary",
              )}
              data-oid="gfh32wl"
            />
          </div>
        );
      }

      // 多規格商品，提示查看變體
      return (
        <Badge
          variant="outline"
          className="flex items-center w-fit"
          data-oid="9me103e"
        >
          <Eye className="h-3 w-3 mr-1.5" data-oid="vefazkc" />
          查看變體
        </Badge>
      );
    },
  },

  // 建立時間欄位
  {
    id: "created_at",
    header: () => (
      <div className="flex items-center gap-1" data-oid="q58-tmx">
        <Calendar className="h-4 w-4" data-oid="kgztmcy" />
        <span data-oid="bwgcxrp">建立時間</span>
      </div>
    ),

    cell: ({ row }) => {
      const item = row.original;

      if (item.isVariantRow) {
        return null;
      }

      const createdAt = item.created_at;
      if (!createdAt)
        return (
          <span className="text-muted-foreground" data-oid="fn0wqf:">
            N/A
          </span>
        );

      const date = new Date(createdAt);
      return (
        <div className="text-sm" data-oid="zmwlieg">
          <div data-oid="2rne3_g">{date.toLocaleDateString("zh-TW")}</div>
          <div className="text-xs text-muted-foreground" data-oid=":20jigw">
            {date.toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      );
    },
  },

  // 操作欄位
  {
    id: "actions",
    header: "",
    cell: ({ row }) => {
      const item = row.original;

      if (item.isVariantRow) {
        return null;
      }

      function ActionsComponent() {
        const router = useRouter();

        const handleEdit = () => {
          window.dispatchEvent(
            new CustomEvent("editProduct", { detail: { id: item.originalId } }),
          );
        };

        const handleDelete = () => {
          window.dispatchEvent(
            new CustomEvent("deleteProduct", {
              detail: { id: item.originalId, name: item.name },
            }),
          );
        };

        const handleViewVariants = () => {
          window.dispatchEvent(
            new CustomEvent("viewVariants", { detail: item }),
          );
        };

        return (
          <DropdownMenu data-oid="9philjy">
            <DropdownMenuTrigger asChild data-oid="02j_0o:">
              <Button
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-muted data-[state=open]:bg-muted"
                data-oid="0b-0a36"
              >
                <span className="sr-only" data-oid="qnj2zx1">
                  開啟選單
                </span>
                <MoreHorizontal className="h-4 w-4" data-oid="t41hsnu" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[160px]"
              data-oid="hvqb-k3"
            >
              <DropdownMenuLabel data-oid="51qylun">操作選項</DropdownMenuLabel>
              <DropdownMenuSeparator data-oid="2w9nwfg" />
              <DropdownMenuItem
                onClick={handleEdit}
                className="cursor-pointer"
                data-oid="05s.eq0"
              >
                <Edit className="mr-2 h-4 w-4" data-oid="taq:95n" />
                編輯商品
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleViewVariants}
                className="cursor-pointer"
                data-oid="aeahotp"
              >
                <Eye className="mr-2 h-4 w-4" data-oid="z_2e:9s" />
                查看規格
              </DropdownMenuItem>
              <DropdownMenuSeparator data-oid="3b2fq:j" />
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                data-oid="7xca1wh"
              >
                <Trash2 className="mr-2 h-4 w-4" data-oid="pwp53kt" />
                刪除商品
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }

      return <ActionsComponent data-oid="p:9oquc" />;
    },
    size: 80,
  },
];
