'use client';

import React, { useState } from 'react';
import { Check, Search, Package } from 'lucide-react';
import { useProducts } from '@/hooks/queries/useEntityQueries';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ProductItem, ProductVariant } from '@/types/api-helpers';

interface ProductVariantSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (selectedVariants: ProductVariant[]) => void;
}

export function ProductVariantSelector({ open, onOpenChange, onSelect }: ProductVariantSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>([]);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: response, isLoading } = useProducts({ 
    product_name: debouncedSearch 
  });

  // 安全地處理 API 響應
  const products: ProductItem[] = (response && 'data' in response && Array.isArray(response.data)) 
    ? response.data as ProductItem[] 
    : [];

  // 將所有商品的變體扁平化為一個列表
  const allVariants = products.flatMap(product => 
    product.variants?.map(variant => ({
      ...variant,
      product_name: product.name,
      product_category: product.category?.name,
      // 計算庫存總量
      total_inventory: variant.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0
    })) || []
  );

  const handleVariantToggle = (variant: ProductVariant & { product_name?: string }) => {
    setSelectedVariants(prev => {
      const isSelected = prev.some(v => v.id === variant.id);
      if (isSelected) {
        return prev.filter(v => v.id !== variant.id);
      } else {
        return [...prev, variant];
      }
    });
  };

  const handleConfirm = () => {
    onSelect(selectedVariants);
    setSelectedVariants([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedVariants([]);
    setSearchQuery('');
    onOpenChange(false);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { label: '缺貨', variant: 'destructive' as const };
    if (quantity <= 10) return { label: '低庫存', variant: 'secondary' as const };
    return { label: '有庫存', variant: 'default' as const };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-[1400px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            選擇商品項目
          </DialogTitle>
        </DialogHeader>

        {/* 搜尋欄 */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜尋商品名稱或 SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline">
            已選擇 {selectedVariants.length} 項
          </Badge>
        </div>

        {/* 商品變體表格 */}
        <div className="flex-1 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">選擇</TableHead>
                <TableHead>商品名稱</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>規格</TableHead>
                <TableHead>分類</TableHead>
                <TableHead className="text-right">單價</TableHead>
                <TableHead className="text-center">庫存</TableHead>
                <TableHead className="text-center">狀態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    載入中...
                  </TableCell>
                </TableRow>
              ) : allVariants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    {searchQuery ? '找不到符合條件的商品' : '暫無商品資料'}
                  </TableCell>
                </TableRow>
              ) : (
                allVariants.map((variant) => {
                  const isSelected = selectedVariants.some(v => v.id === variant.id);
                  const stockStatus = getStockStatus(variant.total_inventory);
                  
                  return (
                    <TableRow 
                      key={variant.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                      onClick={() => handleVariantToggle(variant)}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleVariantToggle(variant)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {variant.product_name}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {variant.sku}
                      </TableCell>
                      <TableCell>
                        {variant.attribute_values?.map(av => av.value).join(', ') || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {variant.product_category || '未分類'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${parseFloat(variant.price || '0').toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {variant.total_inventory}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={stockStatus.variant}>
                          {stockStatus.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={selectedVariants.length === 0}
          >
            確認添加 ({selectedVariants.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 