"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Tag,
  DollarSign,
  Warehouse,
  Edit,
  Star,
  Share2,
  Heart,
} from 'lucide-react';

// 導入懶加載圖片畫廊
import { LazyImageGallery } from '@/components/ui/lazy-image';
import { ProductItem } from '@/types/api-helpers';
import { formatPrice } from '@/lib/utils';

interface ProductDetailPageEnhancedProps {
  product: ProductItem;
  onEdit?: () => void;
}

/**
 * 增強版產品詳情頁面組件
 * 
 * 特性：
 * 1. 使用懶加載圖片畫廊展示產品圖片
 * 2. 支援燈箱模式查看大圖
 * 3. 優化的圖片載入性能
 * 4. 響應式設計
 */
export function ProductDetailPageEnhanced({
  product,
  onEdit,
}: ProductDetailPageEnhancedProps) {
  const [selectedVariant, setSelectedVariant] = useState(
    product.variants?.[0] || null
  );

  // 準備圖片數據
  const images = React.useMemo(() => {
    const imageUrls = product.image_urls;
    const productImages = [];

    // 主圖片
    if (imageUrls?.original) {
      productImages.push({
        src: imageUrls.original.replace("localhost", "127.0.0.1"),
        alt: product.name,
        thumbnail: imageUrls.thumb?.replace("localhost", "127.0.0.1"),
      });
    }

    // 如果有其他圖片，可以在這裡添加
    // 這裡假設 API 可能會提供多個圖片
    if (imageUrls?.gallery) {
      imageUrls.gallery.forEach((img: string, index: number) => {
        productImages.push({
          src: img.replace("localhost", "127.0.0.1"),
          alt: `${product.name} - 圖片 ${index + 2}`,
        });
      });
    }

    return productImages;
  }, [product.image_urls, product.name]);

  // 計算價格範圍
  const priceRange = React.useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return { min: product.price, max: product.price };
    }

    const prices = product.variants.map(v => parseFloat(v.price));
    return {
      min: Math.min(...prices).toString(),
      max: Math.max(...prices).toString(),
    };
  }, [product.variants, product.price]);

  // 計算總庫存
  const totalStock = React.useMemo(() => {
    if (selectedVariant?.inventory) {
      return selectedVariant.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );
    }
    
    if (product.inventory) {
      return product.inventory.reduce(
        (sum, inv) => sum + inv.quantity,
        0
      );
    }
    
    return 0;
  }, [selectedVariant, product.inventory]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左側：圖片畫廊 */}
        <div className="space-y-4">
          <LazyImageGallery
            images={images}
            mainImageHeight={500}
            showThumbnails={images.length > 1}
            enableLightbox={true}
            className="sticky top-4"
          />
          
          {/* 圖片載入提示 */}
          {images.length === 0 && (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">暫無商品圖片</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* 右側：產品信息 */}
        <div className="space-y-6">
          {/* 產品基本信息 */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{product.name}</h1>
                {product.brands && product.brands.length > 0 && (
                  <Badge variant="secondary" className="text-sm">
                    {product.brands[0].name}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4" />
                </Button>
                {onEdit && (
                  <Button onClick={onEdit} className="gap-2">
                    <Edit className="h-4 w-4" />
                    編輯
                  </Button>
                )}
              </div>
            </div>

            {/* 價格 */}
            <div className="space-y-2">
              {priceRange.min === priceRange.max ? (
                <div className="text-3xl font-bold text-primary">
                  {formatPrice(priceRange.min)}
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-primary">
                    {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}
                  </div>
                  <p className="text-sm text-muted-foreground">價格範圍</p>
                </div>
              )}
            </div>

            {/* 狀態和庫存 */}
            <div className="flex items-center gap-4">
              <Badge
                variant={product.status === 'active' ? 'default' : 'secondary'}
                className="gap-1"
              >
                <Package className="h-3 w-3" />
                {product.status === 'active' ? '上架中' : '已下架'}
              </Badge>
              
              <div className="flex items-center gap-2 text-sm">
                <Warehouse className="h-4 w-4 text-muted-foreground" />
                <span>庫存：{totalStock} 件</span>
              </div>
            </div>

            {/* 描述 */}
            {product.description && (
              <div className="prose prose-sm max-w-none">
                <p className="text-muted-foreground">{product.description}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* 規格選擇 */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">選擇規格</h3>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const specText = variant.attribute_values
                    ?.map(av => av.value)
                    .join(' / ') || variant.sku;
                  
                  return (
                    <Button
                      key={variant.id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => setSelectedVariant(variant)}
                      className="justify-start h-auto p-4"
                    >
                      <div className="text-left">
                        <div className="font-medium">{specText}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatPrice(variant.price)}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
              
              {selectedVariant && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">SKU</span>
                        <span className="font-mono text-sm">{selectedVariant.sku}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">價格</span>
                        <span className="font-semibold">{formatPrice(selectedVariant.price)}</span>
                      </div>
                      {selectedVariant.inventory && selectedVariant.inventory.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">庫存</span>
                          <span>{selectedVariant.inventory.reduce((sum, inv) => sum + inv.quantity, 0)} 件</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <Separator />

          {/* 分類和屬性 */}
          <div className="space-y-4">
            {product.categories && product.categories.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">分類</h3>
                <div className="flex flex-wrap gap-2">
                  {product.categories.map((category) => (
                    <Badge key={category.id} variant="outline">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {product.attributes && product.attributes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">產品屬性</h3>
                <div className="space-y-2">
                  {product.attributes.map((attr) => (
                    <div key={attr.id} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{attr.name}</span>
                      <span>{attr.display_name || attr.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-3 pt-4">
            <Button size="lg" className="flex-1">
              <DollarSign className="h-4 w-4 mr-2" />
              立即購買
            </Button>
            <Button variant="outline" size="lg" className="flex-1">
              <Package className="h-4 w-4 mr-2" />
              加入購物車
            </Button>
          </div>
        </div>
      </div>

      {/* 詳細信息標籤頁 */}
      <div className="mt-12">
        <Card>
          <CardHeader>
            <CardTitle>產品詳細信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* 基本信息 */}
              <div className="space-y-2">
                <h4 className="font-medium">基本信息</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品 ID</span>
                    <span>{product.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">創建時間</span>
                    <span>{new Date(product.created_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">更新時間</span>
                    <span>{new Date(product.updated_at).toLocaleDateString('zh-TW')}</span>
                  </div>
                </div>
              </div>

              {/* 庫存信息 */}
              {product.inventory && product.inventory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">庫存分佈</h4>
                  <div className="space-y-1 text-sm">
                    {product.inventory.map((inv, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">
                          {inv.store?.name || '默認倉庫'}
                        </span>
                        <span>{inv.quantity} 件</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 規格統計 */}
              {product.variants && product.variants.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">規格統計</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">總規格數</span>
                      <span>{product.variants.length} 個</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">價格範圍</span>
                      <span>{formatPrice(priceRange.min)} - {formatPrice(priceRange.max)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}