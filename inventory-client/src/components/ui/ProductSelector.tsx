'use client';

/**
 * ProductSelector 元件
 * 
 * 一個獨立的商品選擇器元件，提供模態框介面讓使用者搜尋並選擇商品。
 * 支援多選功能，可用於訂單、進貨等需要選擇商品的場景。
 */

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useProducts } from '@/hooks/queries/useEntityQueries';

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
} from '@/components/ui/dialog';

// Shadcn/UI 基礎元件
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

// Shadcn/UI Card 相關元件
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Shadcn/UI Table 相關元件
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';

// Shadcn/UI Select 相關元件
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  multiple = true,
  selectedIds = [],
}: ProductSelectorProps) {
  // 搜尋關鍵字狀態
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500);
  
  // 當前選擇查看的產品
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // 已選擇的規格 ID 集合
  const [selectedVariants, setSelectedVariants] = useState<Set<string | number>>(
    new Set(selectedIds)
  );
  
  // 🎯 直接消費「數據精煉廠」處理過的純淨數據
  const { 
    data: products = [], // 直接將 data 解構為 products，並提供預設值
    isLoading, 
    error 
  } = useProducts({
    product_name: debouncedSearchQuery, // 將 debounced 搜尋字串作為 product_name 參數傳遞
    // 暫不傳遞 category，詳見戰術註記
  });
  
  // 過濾和排序狀態
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('default');

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
    
    products.forEach(product => {
      product.variants.forEach((variant: Variant) => {
        if (selectedVariants.has(variant.id)) {
          selectedVariantObjects.push({
            ...variant,
            productName: product.name // 添加商品名稱
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
    setSearchQuery('');
    setSelectedProduct(null);
    setCategoryFilter('all');
    setSortOrder('default');
    onOpenChange(false);
  };

  // 動態分類列表 - 根據當前商品資料自動生成
  const categories = useMemo(() => {
    if (products.length === 0) return [];
    const allCategories = new Set(products.map(p => p.categoryName));
    return ['all', ...Array.from(allCategories)];
  }, [products]);

  // 最終顯示的商品列表 - 應用過濾和排序
  const displayedProducts = useMemo(() => {
    let items = [...products];

    // 應用分類過濾
    if (categoryFilter !== 'all') {
      items = items.filter(p => p.categoryName === categoryFilter);
    }

    // 應用排序
    switch (sortOrder) {
      case 'price-asc':
        // 按最低價格升序排列
        items.sort((a, b) => 
          Math.min(...a.variants.map((v: Variant) => v.price)) - 
          Math.min(...b.variants.map((v: Variant) => v.price))
        );
        break;
      case 'price-desc':
        // 按最低價格降序排列
        items.sort((a, b) => 
          Math.min(...b.variants.map((v: Variant) => v.price)) - 
          Math.min(...a.variants.map((v: Variant) => v.price))
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>選擇商品</DialogTitle>
          <DialogDescription>
            {multiple 
              ? '請選擇一個或多個商品。您可以使用搜尋功能快速找到所需商品。' 
              : '請選擇一個商品。'}
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
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="所有分類" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>
                      {cat === 'all' ? '所有分類' : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 排序方式選單 */}
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="預設排序" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">預設排序</SelectItem>
                  <SelectItem value="price-asc">價格：由低到高</SelectItem>
                  <SelectItem value="price-desc">價格：由高到低</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 條件渲染：載入中、錯誤、空結果或產品列表 */}
            {isLoading ? (
              <div className="flex items-center justify-center h-[40vh]">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground">載入中...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-[40vh]">
                <div className="text-center space-y-2">
                  <p className="text-destructive">{error?.message || '載入失敗'}</p>
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
              <div className="flex items-center justify-center h-[40vh]">
                <div className="text-center space-y-2">
                  <p className="text-muted-foreground">
                    {searchQuery || categoryFilter !== 'all' ? '找不到符合條件的商品' : '暫無商品資料'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto max-h-[50vh]">
                {displayedProducts.map((product) => (
                <Card 
                  key={product.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                  onClick={() => setSelectedProduct(product)}
                >
                  <CardContent className="p-4">
                    {/* 產品圖片 */}
                    <div className="relative aspect-square mb-3">
                      <Image
                        src={product.mainImageUrl}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover rounded-md"
                      />
                    </div>
                    
                    {/* 產品名稱 */}
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* 產品分類標籤 */}
                    <Badge variant="secondary" className="text-xs">
                      {product.categoryName}
                    </Badge>
                    
                    {/* 規格數量提示 */}
                    <p className="text-xs text-muted-foreground mt-2">
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
            {/* 視圖標頭 */}
            <div className="flex items-center gap-4 p-6 border-b">
              <Button variant="outline" size="icon" onClick={() => setSelectedProduct(null)}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
            </div>

            {/* 表格區域 */}
            <div className="flex-grow overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">選擇</TableHead>
                    <TableHead className="w-24">圖片</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>規格</TableHead>
                    <TableHead>庫存</TableHead>
                    <TableHead className="text-right">單價</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedProduct.variants.map((variant) => {
                    const isSelected = selectedVariants.has(variant.id);
                    const stockLevel = variant.stock === 0 ? 'destructive' : 
                                     variant.stock <= 10 ? 'secondary' : 'default';
                    
                    return (
                      <TableRow key={variant.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleVariantToggle(variant.id)}
                            disabled={!multiple && selectedVariants.size > 0 && !isSelected}
                          />
                        </TableCell>
                        <TableCell>
                          {variant.imageUrl ? (
                            <div className="relative w-16 h-16">
                              <Image
                                src={variant.imageUrl}
                                alt={variant.sku}
                                fill
                                sizes="64px"
                                className="object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                              無圖片
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono">{variant.sku}</TableCell>
                        <TableCell>{variant.specifications}</TableCell>
                        <TableCell>
                          <Badge variant={stockLevel}>
                            {variant.stock} 件
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          NT$ {variant.price.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          {selectedProduct === null ? (
            // 主列表的按鈕
            <>
              <Button variant="outline" onClick={handleCancel}>
                取消
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={selectedVariants.size === 0}
              >
                確認選擇 {selectedVariants.size > 0 && `(${selectedVariants.size})`}
              </Button>
            </>
          ) : (
            // 詳細視圖的按鈕
            <>
              <Button 
                variant="outline" 
                onClick={() => setSelectedProduct(null)}
              >
                返回列表
              </Button>
              <Button 
                onClick={handleConfirmSelection}
                disabled={selectedVariants.size === 0}
              >
                確認選擇 {selectedVariants.size > 0 && `(${selectedVariants.size})`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 