"use client";

/**
 * ProductSelector 元件
 *
 * 一個獨立的商品選擇器元件，提供模態框介面讓使用者搜尋並選擇商品。
 * 支援多選功能，可用於訂單、進貨等需要選擇商品的場景。
 */

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, Plus, Package } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useProducts, ProcessedProduct } from "@/hooks";
import { useErrorHandler } from "@/hooks";
import { cn } from "@/lib/utils";
import { MoneyHelper } from "@/lib/money-helper";

/**
 * 訂製商品項目介面
 */
export interface CustomItem {
  product_id: string | number;
  product_variant_id: null;
  custom_product_name: string;
  custom_specifications: Record<string, string>;
  price: number;
  quantity: number;
  sku: string;
}

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

// 使用從 hook 導入的 ProcessedProduct 類型，並創建兼容的 Product 類型別名
type Product = ProcessedProduct & {
  categoryName: string;
  mainImageUrl: string;
  variants: Variant[];
};

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
  onCustomItemAdd: (item: CustomItem) => void;
  // 是否允許多選，預設為 true
  multiple?: boolean;
  // 已選擇的規格 (Variant) ID 列表，用於顯示已選狀態
  selectedIds?: (string | number)[];
  // 分店 ID，用於篩選該分店的商品庫存
  storeId?: number;
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
  storeId,
}: ProductSelectorProps) {
  // 統一錯誤處理
  const { handleError } = useErrorHandler();
  
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
    data: rawProducts = [], 
    isLoading,
    error,
  } = useProducts({
    product_name: debouncedSearchQuery, // 將 debounced 搜尋字串作為 product_name 參數傳遞
    per_page: 50, // 限制每次載入的商品數量，避免過多數據導致崩潰
    store_id: storeId, // 傳遞分店 ID 以篩選該分店的商品
    // 暫不傳遞 category，詳見戰術註記
  });
  
  // 日誌已移除 - 系統現在正常運作

  // 類型安全的數據轉換
  const products = useMemo(() => {
    return (rawProducts as unknown[]).map((product: unknown) => {
      const p = product as ProcessedProduct;
      // 處理圖片：若 image_urls 為物件則取 thumb/original，若為 string[] 則取第一張圖
      let thumbUrl = '';
      let originalUrl = '';
      if (p.image_urls && Array.isArray(p.image_urls)) {
        // 若為 string[]，取第一張作為主圖
        thumbUrl = p.image_urls[0] || '';
        originalUrl = p.image_urls[0] || '';
      } else if (p.image_urls && typeof p.image_urls === 'object') {
        // 若為物件，取 thumb/original
        thumbUrl = (p.image_urls as any).thumb || (p.image_urls as any).original || '';
        originalUrl = (p.image_urls as any).original || (p.image_urls as any).thumb || '';
      }
      return {
        ...p,
        categoryName: p.category?.name || "未分類",
        mainImageUrl: thumbUrl || originalUrl || '',
        variants: (p.variants || []).map((variant): Variant => {
          // 計算庫存數量
          let stockQuantity = 0;
          
          // 🎯 如果有 inventory 陣列，優先使用（這會是特定門市的庫存）
          if (Array.isArray(variant.inventory) && variant.inventory.length > 0) {
            // 當指定了 storeId，後端只會返回該門市的庫存
            // 所以這裡的加總應該只會是單一門市的庫存
            stockQuantity = variant.inventory.reduce((sum: number, inv: any) => 
              sum + (Number(inv.quantity) || 0), 0);
          } else if (variant.stock_quantity !== undefined) {
            // 如果沒有 inventory 資料，使用 stock_quantity（總庫存）
            stockQuantity = Number(variant.stock_quantity) || 0;
          } else if (variant.stock !== undefined) {
            // 🎯 如果後端直接返回了 stock 欄位（ProductVariantResource 計算的結果）
            stockQuantity = Number(variant.stock) || 0;
          }
          
          // 回傳標準化 Variant 物件
          return {
            id: variant.id,
            sku: variant.sku || "",
            specifications: variant.sku || `規格-${variant.id}`,
            price: variant.price || 0,
            stock: stockQuantity,
            imageUrl: thumbUrl || originalUrl || '', // 使用主圖
            productName: p.name
          };
        })
      } as Product;
    });
  }, [rawProducts]);

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
            imageUrl: variant.imageUrl || product.mainImageUrl, // 添加圖片資訊，優先使用變體圖片，否則使用商品主圖片
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
       
      >
        <DialogHeader>
          <DialogTitle>選擇商品</DialogTitle>
          <DialogDescription>
            {multiple
              ? "請選擇一個或多個商品。您可以使用搜尋功能快速找到所需商品。"
              : "請選擇一個商品。"}
          </DialogDescription>
        </DialogHeader>

        {/* 條件渲染：主產品列表 or 詳細視圖 */}
        {selectedProduct === null ? (
          // 主產品列表 (Master View)
          <div className="space-y-4">
            {/* 搜尋框 */}
            <Input
              placeholder="搜尋商品名稱..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
             
            />

            {/* 過濾和排序控制項 */}
            <div className="flex flex-col sm:flex-row gap-2">
              {/* 分類過濾選單 */}
              <Select
                value={categoryFilter}
                onValueChange={setCategoryFilter}
               
              >
                <SelectTrigger
                  className="w-full sm:w-[180px]"
                 
                >
                  <SelectValue placeholder="所有分類" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "所有分類" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 排序方式選單 */}
              <Select
                value={sortOrder}
                onValueChange={setSortOrder}
               
              >
                <SelectTrigger
                  className="w-full sm:w-[180px]"
                 
                >
                  <SelectValue placeholder="預設排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">
                    預設排序
                  </SelectItem>
                  <SelectItem value="price-asc">
                    價格：由低到高
                  </SelectItem>
                  <SelectItem value="price-desc">
                    價格：由高到低
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 條件渲染：載入中、錯誤、空結果或產品列表 */}
            {isLoading ? (
              <div
                className="flex items-center justify-center h-[40vh]"
               
              >
                <div className="text-center space-y-2">
                  <div
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"
                   
                  ></div>
                  <p className="text-muted-foreground">
                    載入中...
                  </p>
                </div>
              </div>
            ) : error ? (
              <div
                className="flex items-center justify-center h-[40vh]"
               
              >
                <div className="text-center space-y-2">
                  <p className="text-destructive">
                    {error?.message || "載入失敗"}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                   
                  >
                    重試
                  </Button>
                </div>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div
                className="flex items-center justify-center h-[40vh]"
               
              >
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    {searchQuery || categoryFilter !== "all"
                      ? "找不到符合條件的商品"
                      : "暫無商品資料"}
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[50vh]"
               
              >
                {displayedProducts.map((product, index) => (
                  <Card
                    key={product.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <CardContent className="p-4">
                      {/* 產品圖片 */}
                      <div
                        className="relative aspect-square mb-3"
                       
                      >
                        {product.mainImageUrl && product.mainImageUrl.trim() !== "" ? (
                          <Image
                            src={product.mainImageUrl}
                            alt={product.name}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover rounded-md"
                           
                          />
                        ) : (
                          <div
                            className="w-full h-full bg-muted rounded-md flex items-center justify-center text-muted-foreground"
                           
                          >
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                      </div>

                      {/* 產品名稱 */}
                      <h3
                        className="font-semibold text-sm mb-2 line-clamp-2"
                       
                      >
                        {product.name}
                      </h3>

                      {/* 產品分類標籤 */}
                      <Badge
                        variant="secondary"
                        className="text-xs"
                       
                      >
                        {product.categoryName}
                      </Badge>

                      {/* 規格數量提示 */}
                      <p
                        className="text-xs text-muted-foreground mt-2"
                       
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
          <div className="flex flex-col h-full">
            {/* 視圖標頭 - 只在非訂製模式下顯示 */}
            {!isAddingCustom && (
              <div
                className="flex items-center justify-between px-6 py-4 border-b"
               
              >
                <div
                  className="flex items-center gap-4 flex-1 min-w-0"
                 
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSelectedProduct(null);
                      setIsAddingCustom(false);
                    }}
                   
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-xl font-semibold truncate"
                     
                    >
                      {selectedProduct.name}
                    </h2>
                    <p
                      className="text-sm text-muted-foreground"
                     
                    >
                      選擇規格
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingCustom(true)}
                 
                >
                  <Plus className="h-4 w-4 mr-1" />
                  新增訂製規格
                </Button>
              </div>
            )}

            {/* 條件渲染：訂製表單 or 標準規格選擇 */}
            {isAddingCustom ? (
              /* --- 這裡是新的訂製表單 --- */
              <div className="flex flex-col h-full">
                {/* 訂製表單標題區 */}
                <div className="border-b">
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsAddingCustom(false)}
                       
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <div className="space-y-1">
                          <h3
                            className="text-base font-medium text-muted-foreground"
                           
                          >
                            為{" "}
                            <span
                              className="font-semibold text-foreground"
                             
                            >
                              {selectedProduct.name}
                            </span>
                          </h3>
                          <h2 className="text-xl font-bold">
                            新增訂製規格
                          </h2>
                        </div>
                        <p
                          className="text-sm text-muted-foreground mt-2"
                         
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
                 
                >
                  <div
                    className="max-w-xl mx-auto space-y-6"
                   
                  >
                    {/* 訂製規格描述 */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="custom-spec"
                        className="text-base font-medium"
                       
                      >
                        訂製規格描述{" "}
                        <span className="text-destructive">
                          *
                        </span>
                      </Label>
                      <Textarea
                        id="custom-spec"
                        placeholder="例如：尺寸 85cm x 120cm，金色拉絲邊框"
                        value={customSpec}
                        onChange={(e) => setCustomSpec(e.target.value)}
                        className="min-h-[120px] resize-none"
                       
                      />

                      <p
                        className="text-xs text-muted-foreground"
                       
                      >
                        請詳細描述商品的訂製規格，包含尺寸、顏色、材質等資訊
                      </p>
                    </div>

                    {/* 數量和單價 */}
                    <div
                      className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                     
                    >
                      <div className="space-y-3">
                        <Label
                          htmlFor="custom-quantity"
                          className="text-base font-medium"
                         
                        >
                          數量{" "}
                          <span className="text-destructive">
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
                         
                        />
                      </div>
                      <div className="space-y-3">
                        <Label
                          htmlFor="custom-price"
                          className="text-base font-medium"
                         
                        >
                          單價 (NT$){" "}
                          <span className="text-destructive">
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
                         
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 🎯 合併的底部區域：小計顯示 + 確認按鈕 */}
                <div className="border-t p-6 bg-background">
                  <div className="max-w-xl mx-auto space-y-4">
                    {/* 小計顯示卡片 */}
                    {customPrice && customQuantity && (
                      <div
                        className="p-4 bg-muted/50 rounded-lg space-y-2 border"
                       
                      >
                        <div
                          className="flex justify-between text-sm"
                         
                        >
                          <span
                            className="text-muted-foreground"
                           
                          >
                            單價
                          </span>
                          <span>
                            {MoneyHelper.format(Number(customPrice))}
                          </span>
                        </div>
                        <div
                          className="flex justify-between text-sm"
                         
                        >
                          <span
                            className="text-muted-foreground"
                           
                          >
                            數量
                          </span>
                          <span>{customQuantity}</span>
                        </div>
                        <div
                          className="flex justify-between font-semibold text-base pt-2 border-t"
                         
                        >
                          <span>小計</span>
                          <span className="text-primary">
                            NT${" "}
                            {(
                              Number(customPrice) * Number(customQuantity)
                            ), '$')}
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
                            handleError("請填寫所有必填欄位");
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
                 
                >
                  <Table>
                    <TableHeader>
                      <TableRow
                        className="border-b hover:bg-transparent"
                       
                      >
                        <TableHead
                          className="w-[50px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                         
                        >
                          選擇
                        </TableHead>
                        <TableHead
                          className="w-[80px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                         
                        >
                          圖片
                        </TableHead>
                        <TableHead
                          className="w-[150px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                         
                        >
                          SKU
                        </TableHead>
                        <TableHead
                          className="min-w-[300px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                         
                        >
                          規格
                        </TableHead>
                        <TableHead
                          className="w-[100px] h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                         
                        >
                          庫存
                        </TableHead>
                        <TableHead
                          className="w-[120px] text-right h-12 px-4 align-middle font-medium text-muted-foreground"
                         
                        >
                          單價
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedProduct.variants.map((variant) => {
                        const isSelected = selectedVariants.has(variant.id);
                        const v = variant as unknown as Variant;
                        const stockLevel =
                          v.stock === 0
                            ? "destructive"
                            : v.stock <= 10
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
                          >
                            <TableCell
                              onClick={(e) => e.stopPropagation()}
                             
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
                               
                              />
                            </TableCell>
                            <TableCell>
                              {v.imageUrl && v.imageUrl.trim() !== "" ? (
                                <div
                                  className="relative w-12 h-12"
                                 
                                >
                                  <Image
                                    src={v.imageUrl}
                                    alt={variant.sku}
                                    fill
                                    sizes="48px"
                                    className="object-cover rounded"
                                   
                                  />
                                </div>
                              ) : (
                                <div
                                  className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs"
                                 
                                >
                                  無圖
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-mono">
                              {variant.sku}
                            </TableCell>
                            <TableCell>
                              {v.specifications}
                            </TableCell>
                            <TableCell>
                              <Badge variant={stockLevel}>
                                {v.stock} 件
                              </Badge>
                            </TableCell>
                            <TableCell
                              className="text-right font-semibold"
                             
                            >
                              {MoneyHelper.format(variant.price)}
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
          <DialogFooter>
            {selectedProduct === null ? (
              // 主列表的按鈕
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                 
                >
                  取消
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={selectedVariants.size === 0}
                 
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
                 
                >
                  返回列表
                </Button>
                <Button
                  onClick={handleConfirmSelection}
                  disabled={selectedVariants.size === 0}
                 
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
