"use client";

/**
 * ProductSelector 元件
 *
 * 一個獨立的商品選擇器元件，提供模態框介面讓使用者搜尋並選擇商品。
 * 支援多選功能，可用於訂單、進貨等需要選擇商品的場景。
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, Plus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts } from "@/hooks/queries/useEntityQueries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * 商品規格（變體/SKU）介面
 *
 * 代表一個商品的特定規格，例如：同一款衣服的不同尺寸或顏色
 */
export interface Variant {
  /** 規格的唯一識別碼 */
  id: string | number;
  /** SKU 編號 */
  sku: string;
  /** 規格描述 (例如：'60cm', '紅色', 'XL') */
  specifications: string;
  /** 單價 */
  price: number;
  /** 庫存數量 */
  stock: number;
  /** 規格專屬圖片 URL (可選) */
  imageUrl?: string;
  /** 商品名稱 */
  productName?: string;
}

/**
 * 商品介面 - 匹配數據精煉廠的輸出格式
 *
 * 代表一個商品主體，包含多個規格變體
 */
export interface Product {
  /** 商品的唯一識別碼 */
  id: string | number;
  /** 商品名稱 */
  name: string;
  /** 商品描述 */
  description?: string | null;
  /** 分類 ID */
  category_id?: number | null;
  /** 創建時間 */
  created_at?: string;
  /** 更新時間 */
  updated_at?: string;
  /** 圖片 URLs */
  image_urls?: {
    original?: string | null;
    thumb?: string | null;
    medium?: string | null;
    large?: string | null;
  } | null;
  /** 商品分類物件 */
  category?: {
    id: number;
    name: string;
    description?: string | null;
  } | null;
  /** 商品分類名稱（簡化格式） */
  categoryName: string;
  /** 商品主圖 URL（簡化格式） */
  mainImageUrl: string;
  /** 商品的所有規格變體 */
  variants: Variant[];
  /** 價格範圍 */
  price_range?: {
    min: number;
    max: number;
    count: number;
  };
  /** 屬性列表 */
  attributes?: any[];
}

// Shadcn/UI Dialog 相關元件
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Shadcn/UI 基礎元件
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Shadcn/UI Card 相關元件
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Shadcn/UI Table 相關元件
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Shadcn/UI Select 相關元件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * ProductSelector 元件屬性介面
 */
interface ProductSelectorProps {
  // 控制對話框的開啟狀態
  open: boolean;
  // 關閉對話框的回調函數
  onOpenChange: (open: boolean) => void;
  // 選擇商品後的回調函數 - 回傳完整的 Variant 物件陣列
  onSelect: (selectedVariants: Variant[]) => void;
  // 新增訂製商品的回調函數
  onCustomItemAdd: (item: any) => void;
  // 是否允許多選，預設為 true
  multiple?: boolean;
  // 已選擇的規格 (Variant) ID 列表，用於顯示已選狀態
  selectedIds?: (string | number)[];
}

/**
 * ProductSelector 元件實作
 *
 * @param props ProductSelectorProps
 * @returns React.FC
 */
export function ProductSelector({
  open,
  onOpenChange,
  onSelect,
  onCustomItemAdd,
  multiple = true,
  selectedIds = [],
}: ProductSelectorProps) {
  // 搜尋關鍵字狀態
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // 當前選擇查看的產品
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // 已選擇的規格 ID 集合
  const [selectedVariants, setSelectedVariants] = useState<
    Set<string | number>
  >(new Set(selectedIds));

  // 控制訂製表單的顯示
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // 訂製表單狀態
  const [customSpec, setCustomSpec] = useState("");
  const [customPrice, setCustomPrice] = useState<number | "">("");
  const [customQuantity, setCustomQuantity] = useState<number | "">(1);

  // 過濾和排序狀態 - 🎯 移到 useEffect 之前
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<string>("default");

  // 🎯 監聽 open 狀態變化，確保每次打開都重置到主頁面
  React.useEffect(() => {
    if (open) {
      // 每次打開時強制重置到主頁面
      setSelectedProduct(null);
      setIsAddingCustom(false);
      setSearchQuery("");
      setCategoryFilter("all");
      setSortOrder("default");
      // 重置選擇狀態為傳入的 selectedIds
      setSelectedVariants(new Set(selectedIds));
    }
  }, [open, selectedIds]);

  // 🎯 直接消費「數據精煉廠」處理過的純淨數據
  const {
    data: products = [], // 直接將 data 解構為 products，並提供預設值
    isLoading,
    error,
  } = useProducts({
    product_name: debouncedSearchQuery, // 將 debounced 搜尋字串作為 product_name 參數傳遞
    // 暫不傳遞 category，詳見戰術註記
  });

  /**
   * 處理規格選擇/取消選擇
   */
  const handleVariantToggle = (variantId: string | number) => {
    const newSelection = new Set(selectedVariants);

    if (multiple) {
      // 多選模式：切換選擇狀態
      if (newSelection.has(variantId)) {
        newSelection.delete(variantId);
      } else {
        newSelection.add(variantId);
      }
    } else {
      // 單選模式：清空其他選擇，只保留當前選擇
      newSelection.clear();
      newSelection.add(variantId);
    }

    setSelectedVariants(newSelection);
  };

  /**
   * 處理確認選擇
   */
  const handleConfirmSelection = () => {
    // 收集選中的變體並添加商品名稱
    const selectedVariantObjects: Variant[] = [];

    products.forEach((product) => {
      product.variants.forEach((variant: Variant) => {
        if (selectedVariants.has(variant.id)) {
          selectedVariantObjects.push({
            ...variant,
            productName: product.name, // 添加商品名稱
          });
        }
      });
    });

    // 將包含完整資訊的物件陣列回傳給父元件
    onSelect(selectedVariantObjects);
    onOpenChange(false);
  };

  /**
   * 處理取消操作
   */
  const handleCancel = () => {
    // 重置所有狀態
    setSelectedVariants(new Set(selectedIds));
    setSearchQuery("");
    setSelectedProduct(null);
    setIsAddingCustom(false);
    setCategoryFilter("all");
    setSortOrder("default");
    onOpenChange(false);
  };

  // 動態分類列表 - 根據當前商品資料自動生成
  const categories = useMemo(() => {
    if (products.length === 0) return [];
    const allCategories = new Set(products.map((p) => p.categoryName));
    return ["all", ...Array.from(allCategories)];
  }, [products]);

  // 最終顯示的商品列表 - 應用過濾和排序
  const displayedProducts = useMemo(() => {
    let items = [...products];

    // 應用分類過濾
    if (categoryFilter !== "all") {
      items = items.filter((p) => p.categoryName === categoryFilter);
    }

    // 應用排序
    switch (sortOrder) {
      case "price-asc":
        // 按最低價格升序排列
        items.sort(
          (a, b) =>
            Math.min(...a.variants.map((v: Variant) => v.price)) -
            Math.min(...b.variants.map((v: Variant) => v.price)),
        );
        break;
      case "price-desc":
        // 按最低價格降序排列
        items.sort(
          (a, b) =>
            Math.min(...b.variants.map((v: Variant) => v.price)) -
            Math.min(...a.variants.map((v: Variant) => v.price)),
        );
        break;
      default:
        // 保持原始順序
        break;
    }

    return items;
  }, [products, categoryFilter, sortOrder]);

  // 已移除模擬 API 資料獲取邏輯，改用 useProducts Hook

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // 🎯 關閉時重置所有狀態，確保下次打開是乾淨狀態
          setIsAddingCustom(false);
          setCustomSpec("");
          setCustomPrice("");
          setCustomQuantity(1);
          setSelectedProduct(null); // 🎯 重置選中的商品，確保回到主頁面
          setSearchQuery(""); // 🎯 重置搜尋
          setCategoryFilter("all"); // 🎯 重置分類篩選
          setSortOrder("default"); // 🎯 重置排序
        } else {
          // 🎯 開啟時也重置狀態，雙重保險
          setSelectedProduct(null);
          setIsAddingCustom(false);
        }
        onOpenChange(newOpen);
      }}
      data-oid="6i4d48c"
    >
      <DialogContent
        className={cn(
          "flex flex-col",
          // 🎯 動態高度設置：訂製模式下使用最大高度而非固定高度
          selectedProduct && isAddingCustom 
            ? "max-h-[90vh] h-auto" // 訂製模式：允許內容自適應，但不超過90vh
            : "h-[85vh]", // 其他模式：固定高度
          selectedProduct === null || isAddingCustom
            ? "max-w-[800px] w-[90vw]" // 選擇商品或訂製規格時的寬度（較窄）
            : "!max-w-[1400px] w-[90vw] [&>div]:max-w-full", // 選擇 SKU 規格時的寬度（較寬）
        )}
        data-oid="6f_9c8n"
      >
        <DialogHeader data-oid="n4qeotx">
          <DialogTitle data-oid="gwd4ysj">選擇商品</DialogTitle>
          <DialogDescription data-oid="e1d5hk5">
            {multiple
              ? "請選擇一個或多個商品。您可以使用搜尋功能快速找到所需商品。"
              : "請選擇一個商品。"}
          </DialogDescription>
        </DialogHeader>

        {/* 條件渲染：主產品列表 or 詳細視圖 */}
        {selectedProduct === null ? (
          // 主產品列表 (Master View)
          <div className="space-y-4" data-oid="ah8x3w1">
            {/* 搜尋框 */}
            <Input
              placeholder="搜尋商品名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
              data-oid="t2gx-p9"
            />

            {/* 過濾和排序控制項 */}
            <div className="flex flex-col sm:flex-row gap-2" data-oid="-wyy6uh">
              {/* 分類過濾選單 */}
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
                data-oid=".ckjge7"
              >
                <SelectTrigger
                  className="w-full sm:w-[180px]"
                  data-oid="juh64lb"
                >
                  <SelectValue placeholder="所有分類" data-oid="g0c4w0u" />
                </SelectTrigger>
                <SelectContent data-oid="ekpsgk4">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat} data-oid="gn6ut5_">
                      {cat === "all" ? "所有分類" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 排序方式選單 */}
              <Select
                value={sortOrder}
                onValueChange={setSortOrder}
                data-oid="mkp09ri"
              >
                <SelectTrigger
                  className="w-full sm:w-[180px]"
                  data-oid="k3ovkh6"
                >
                  <SelectValue placeholder="預設排序" data-oid="_27_n4j" />
                </SelectTrigger>
                <SelectContent data-oid="358ocdx">
                  <SelectItem value="default" data-oid="5.tdpxr">
                    預設排序
                  </SelectItem>
                  <SelectItem value="price-asc" data-oid="-:wc3vn">
                    價格：由低到高
                  </SelectItem>
                  <SelectItem value="price-desc" data-oid="i1p9zqb">
                    價格：由高到低
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 條件渲染：載入中、錯誤、空結果或產品列表 */}
            {isLoading ? (
              <div
                className="flex items-center justify-center h-[40vh]"
                data-oid="oumf8xx"
              >
                <div className="text-center space-y-2" data-oid="j7o_bf4">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
                    data-oid="nm0yi7o"
                  ></div>
                  <p className="text-muted-foreground" data-oid="qr2rn6f">
                    載入中...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div
                className="flex items-center justify-center h-[40vh]"
                data-oid="_uq_5gk"
              >
                <div className="text-center space-y-2" data-oid="7a2aibk">
                  <p className="text-destructive" data-oid="pdyxb.q">
                    {error?.message || "載入失敗"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    data-oid="vsk3dvk"
                  >
                    重試
                  </Button>
                </div>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div
                className="flex items-center justify-center h-[40vh]"
                data-oid="koorna0"
              >
                <div className="text-center space-y-2" data-oid="fs80jf0">
                  <p className="text-muted-foreground" data-oid="5pp.42p">
                    {searchQuery || categoryFilter !== "all"
                      ? "找不到符合條件的商品"
                      : "暫無商品資料"}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[50vh]"
                data-oid="v76:21r"
              >
                {displayedProducts.map((product) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                    onClick={() => setSelectedProduct(product)}
                    data-oid="6uxznhp"
                  >
                    <CardContent className="p-4" data-oid="bx49n5y">
                      {/* 產品圖片 */}
                      <div
                        className="relative aspect-square mb-3"
                        data-oid="anxxmca"
                      >
                        <Image
                          src={product.mainImageUrl}
                          alt={product.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover rounded-md"
                          data-oid="-72iy9r"
                        />
                      </div>

                      {/* 產品名稱 */}
                      <h3
                        className="font-semibold text-sm mb-2 line-clamp-2"
                        data-oid="mws7fo."
                      >
                        {product.name}
                      </h3>

                      {/* 產品分類標籤 */}
                      <Badge
                        variant="secondary"
                        className="text-xs"
                        data-oid="nbh2vq7"
                      >
                        {product.categoryName}
                      </Badge>

                      {/* 規格數量提示 */}
                      <p
                        className="text-xs text-muted-foreground mt-2"
                        data-oid="7yf3uzo"
                      >
                        {product.variants.length} 種規格
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          // 詳細視圖 - 規格選擇列表
          <div className="flex flex-col h-full" data-oid="36l3895">
            {/* 視圖標頭 - 只在非訂製模式下顯示 */}
            {!isAddingCustom && (
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
                data-oid="v8b7kdz"
              >
                <div
                  className="flex items-center gap-4 flex-1 min-w-0"
                  data-oid="rdekw.y"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedProduct(null);
                      setIsAddingCustom(false);
                    }}
                    data-oid="dd5tomn"
                  >
                    <ArrowLeft className="h-4 w-4" data-oid="1h:_7.k" />
                  </Button>
                  <div className="flex-1 min-w-0" data-oid="2y1a:x9">
                    <h2
                      className="text-xl font-semibold truncate"
                      data-oid="rylbogo"
                    >
                      {selectedProduct.name}
                    </h2>
                    <p
                      className="text-sm text-muted-foreground"
                      data-oid="iwnox48"
                    >
                      選擇規格
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCustom(true)}
                  data-oid="u7xb50-"
                >
                  <Plus className="h-4 w-4 mr-1" data-oid=".bs3:ss" />
                  新增訂製規格
                </Button>
              </div>
            )}

            {/* 條件渲染：訂製表單 or 標準規格選擇 */}
            {isAddingCustom ? (
              /* --- 這裡是新的訂製表單 --- */
              <div className="flex flex-col h-full" data-oid="6xnt.og">
                {/* 訂製表單標題區 */}
                <div className="border-b" data-oid="qgdnr1o">
                  <div className="px-6 py-4" data-oid="uqwcl-_">
                    <div className="flex items-center gap-4" data-oid="8esx..h">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsAddingCustom(false)}
                        data-oid="8k466jh"
                      >
                        <ArrowLeft className="h-4 w-4" data-oid="6t_ittu" />
                      </Button>
                      <div className="flex-1 min-w-0" data-oid="cxnwa32">
                        <div className="space-y-1" data-oid="u:7p7b0">
                          <h3
                            className="text-base font-medium text-muted-foreground"
                            data-oid="bgkj66z"
                          >
                            為{" "}
                            <span
                              className="font-semibold text-foreground"
                              data-oid="wept92b"
                            >
                              {selectedProduct.name}
                            </span>
                          </h3>
                          <h2 className="text-xl font-bold" data-oid="_4igsam">
                            新增訂製規格
                          </h2>
                        </div>
                        <p
                          className="text-sm text-muted-foreground mt-2"
                          data-oid="lzjdy6j"
                        >
                          請填寫訂製商品的詳細規格資訊
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 表單內容區 */}
                <div
                  className="overflow-y-auto px-6 py-8 flex-shrink"
                  style={{ maxHeight: "calc(90vh - 200px)" }}
                  data-oid="2vx.2mn"
                >
                  <div
                    className="max-w-xl mx-auto space-y-6"
                    data-oid="kljl42w"
                  >
                    {/* 訂製規格描述 */}
                    <div className="space-y-3" data-oid="_x2o7zg">
                      <Label
                        htmlFor="custom-spec"
                        className="text-base font-medium"
                        data-oid="vzxmu.g"
                      >
                        訂製規格描述{" "}
                        <span className="text-destructive" data-oid="0tw6.0k">
                          *
                        </span>
                      </Label>
                      <Textarea
                        id="custom-spec"
                        placeholder="例如：尺寸 85cm x 120cm，金色拉絲邊框"
                        value={customSpec}
                        onChange={(e) => setCustomSpec(e.target.value)}
                        className="min-h-[120px] resize-none"
                        data-oid="mcieuu0"
                      />

                      <p
                        className="text-xs text-muted-foreground"
                        data-oid="0dw2sio"
                      >
                        請詳細描述商品的訂製規格，包含尺寸、顏色、材質等資訊
                      </p>
                    </div>

                    {/* 數量和單價 */}
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                      data-oid="kkxvgf-"
                    >
                      <div className="space-y-3" data-oid="kzg5f:g">
                        <Label
                          htmlFor="custom-quantity"
                          className="text-base font-medium"
                          data-oid="gt_371b"
                        >
                          數量{" "}
                          <span className="text-destructive" data-oid="ubuvqk9">
                            *
                          </span>
                        </Label>
                        <Input
                          id="custom-quantity"
                          type="number"
                          min="1"
                          value={customQuantity}
                          onChange={(e) =>
                            setCustomQuantity(Number(e.target.value) || "")
                          }
                          placeholder="請輸入數量"
                          className="h-11"
                          data-oid="fcytvp1"
                        />
                      </div>
                      <div className="space-y-3" data-oid="1brp6hp">
                        <Label
                          htmlFor="custom-price"
                          className="text-base font-medium"
                          data-oid="si72ye."
                        >
                          單價 (NT$){" "}
                          <span className="text-destructive" data-oid="1.2dbq4">
                            *
                          </span>
                        </Label>
                        <Input
                          id="custom-price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={customPrice}
                          onChange={(e) =>
                            setCustomPrice(Number(e.target.value) || "")
                          }
                          placeholder="請輸入單價"
                          className="h-11"
                          data-oid="wi_5g9m"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🎯 合併的底部區域：小計顯示 + 確認按鈕 */}
                <div className="border-t p-6 bg-background" data-oid="73gbu72">
                  <div className="max-w-xl mx-auto space-y-4" data-oid="8p1giq4">
                    {/* 小計顯示卡片 */}
                    {customPrice && customQuantity && (
                      <div
                        className="p-4 bg-muted/50 rounded-lg space-y-2 border"
                        data-oid="ibv8cls"
                      >
                        <div
                          className="flex justify-between text-sm"
                          data-oid="e7w:i0g"
                        >
                          <span
                            className="text-muted-foreground"
                            data-oid="l-w0nv-"
                          >
                            單價
                          </span>
                          <span data-oid="bop:j84">
                            NT$ {Number(customPrice).toLocaleString()}
                          </span>
                        </div>
                        <div
                          className="flex justify-between text-sm"
                          data-oid="qsvl8q1"
                        >
                          <span
                            className="text-muted-foreground"
                            data-oid="s-o7k3t"
                          >
                            數量
                          </span>
                          <span data-oid="u6sal97">{customQuantity}</span>
                        </div>
                        <div
                          className="flex justify-between font-semibold text-base pt-2 border-t"
                          data-oid="jsqw_d3"
                        >
                          <span data-oid=":61oizc">小計</span>
                          <span className="text-primary" data-oid="xd1jm-u">
                            NT${" "}
                            {(
                              Number(customPrice) * Number(customQuantity)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* 操作按鈕組 */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 h-11"
                        onClick={() => setIsAddingCustom(false)}
                      >
                        取消
                      </Button>
                      <Button
                        className="flex-1 h-11 text-base"
                        size="lg"
                        onClick={() => {
                          if (
                            !selectedProduct ||
                            !customSpec ||
                            !customPrice ||
                            !customQuantity
                          ) {
                            toast.error("請填寫所有必填欄位");
                            return;
                          }
                          const customItem = {
                            product_id: selectedProduct.id,
                            product_variant_id: null, // 標示為訂製商品
                            custom_product_name: `${selectedProduct.name} (訂製)`,
                            custom_specifications: { 規格: customSpec },
                            price: customPrice,
                            quantity: customQuantity,
                            sku: `CUSTOM-${selectedProduct.id}-${Date.now()}`, // 生成一個臨時唯一 SKU
                          };
                          onCustomItemAdd(customItem);
                          setIsAddingCustom(false); // 重置視圖
                          setCustomSpec("");
                          setCustomPrice("");
                          setCustomQuantity(1);
                        }}
                        data-oid="zbw_v8x"
                      >
                        確認添加訂製商品
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* --- 這裡是原本的「規格選擇」視圖 --- */
              <>
                {/* 表格區域 */}
                <div
                  className="flex-grow overflow-y-auto overflow-x-auto"
                  data-oid="8be:19t"
                >
                  <Table data-oid="7re4ki0">
                    <TableHeader data-oid="zme_0we">
                      <TableRow
                        className="border-b hover:bg-transparent"
                        data-oid="zhjiyrt"
                      >
                        <TableHead
                          className="w-[50px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid="b0w:loo"
                        >
                          選擇
                        </TableHead>
                        <TableHead
                          className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid="4mm6bx:"
                        >
                          圖片
                        </TableHead>
                        <TableHead
                          className="w-[150px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid="mcl2ig4"
                        >
                          SKU
                        </TableHead>
                        <TableHead
                          className="min-w-[300px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid="0gcs:vp"
                        >
                          規格
                        </TableHead>
                        <TableHead
                          className="w-[100px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                          data-oid="7w2e99w"
                        >
                          庫存
                        </TableHead>
                        <TableHead
                          className="w-[120px] text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                          data-oid="3mpg:lh"
                        >
                          單價
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody data-oid="da67jge">
                      {selectedProduct.variants.map((variant) => {
                        const isSelected = selectedVariants.has(variant.id);
                        const stockLevel =
                          variant.stock === 0
                            ? "destructive"
                            : variant.stock <= 10
                              ? "secondary"
                              : "default";

                        return (
                          <TableRow
                            key={variant.id}
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              // 整行都可以點擊選擇
                              if (
                                !(
                                  !multiple &&
                                  selectedVariants.size > 0 &&
                                  !isSelected
                                )
                              ) {
                                handleVariantToggle(variant.id);
                              }
                            }}
                            data-oid="pcj2teq"
                          >
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                              data-oid="os3usa6"
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleVariantToggle(variant.id)
                                }
                                disabled={
                                  !multiple &&
                                  selectedVariants.size > 0 &&
                                  !isSelected
                                }
                                data-oid="__t19_l"
                              />
                            </TableCell>
                            <TableCell data-oid="mgxer9e">
                              {variant.imageUrl ? (
                                <div
                                  className="relative w-12 h-12"
                                  data-oid="e_pt:ci"
                                >
                                  <Image
                                    src={variant.imageUrl}
                                    alt={variant.sku}
                                    fill
                                    sizes="48px"
                                    className="object-cover rounded"
                                    data-oid="239prl8"
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs"
                                  data-oid="9l9jbk-"
                                >
                                  無圖
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-mono" data-oid="iw46cl3">
                              {variant.sku}
                            </TableCell>
                            <TableCell data-oid="wydgn1_">
                              {variant.specifications}
                            </TableCell>
                            <TableCell data-oid="tmkew0e">
                              <Badge variant={stockLevel} data-oid="iuoyz9d">
                                {variant.stock} 件
                              </Badge>
                            </TableCell>
                            <TableCell
                              className="text-right font-semibold"
                              data-oid="5k2appa"
                            >
                              NT$ {variant.price.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </div>
        )}

        {/* 🎯 條件性渲染 DialogFooter - 訂製模式下完全不顯示 */}
        {!(selectedProduct && isAddingCustom) && (
          <DialogFooter data-oid="deabc5q">
            {selectedProduct === null ? (
              // 主列表的按鈕
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  data-oid="ghnuhyk"
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={selectedVariants.size === 0}
                  data-oid="2lwmhz9"
                >
                  確認選擇{" "}
                  {selectedVariants.size > 0 && `(${selectedVariants.size})`}
                </Button>
              </>
            ) : (
              // 詳細視圖的按鈕
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedProduct(null);
                    setIsAddingCustom(false);
                  }}
                  data-oid="pu1tizp"
                >
                  返回列表
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={selectedVariants.size === 0}
                  data-oid="k3asifx"
                >
                  確認選擇{" "}
                  {selectedVariants.size > 0 && `(${selectedVariants.size})`}
                </Button>
              </>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
