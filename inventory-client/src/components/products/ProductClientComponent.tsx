'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  useProducts, 
  useUpdateProduct, 
  useDeleteProduct,
  useDeleteMultipleProducts,
  useCategories
} from "@/hooks/useApi";
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { transformProductsResponse, transformCategoriesGroupedResponse } from '@/types/api-helpers';
import { useDebounce } from "@/hooks/useDebounce";
import { CategoryCombobox } from '@/components/categories';
import { 
  Loader2, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Package,
  Search
} from "lucide-react";
import { toast } from "sonner";

/**
 * 商品資料介面定義
 */
interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  selling_price: string;
  cost_price: string;
  category_id?: number | null;
}

/**
 * 商品管理客戶端元件
 * 
 * 負責處理所有與使用者互動的動態邏輯：
 * - 搜尋和篩選
 * - 商品 CRUD 操作
 * - 表格選擇和批量操作
 * - 表單驗證和提交
 */
export function ProductClientComponent() {
  // 獲取用戶認證資訊以控制操作權限
  const { user } = useAuth();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms 防抖
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [editFormData, setEditFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    selling_price: '',
    cost_price: '',
    category_id: null,
  });

  // API Hooks - 使用防抖後的搜尋條件
  const { data: productsResponse, isLoading, error, refetch } = useProducts({ search: debouncedSearchQuery });
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useCategories();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const deleteMultipleMutation = useDeleteMultipleProducts();

  // ✅ 使用 API 類型轉換助手，符合架構規範
  const transformedProducts = transformProductsResponse(productsResponse || { data: [] });
  const products = transformedProducts.data;
  
  // ✅ 使用類型安全的分類轉換
  const transformedCategories = transformCategoriesGroupedResponse(categoriesResponse);
  
  // 建立帶有完整顯示路徑的扁平化分類列表，用於 CategoryCombobox
  const flatCategoriesWithOptions = useMemo(() => {
    const result: (Category & { displayPath: string; hasChildren: boolean })[] = [];
    
    // 使用遞迴函式來建構帶有路徑的列表
    const buildList = (parentId: string | null, path: string) => {
      // 修正：當 parentId 為 null 時，使用空字串而非 "null"
      const key = parentId === null ? '' : String(parentId);
      const children = transformedCategories[key] || [];
      children.forEach(category => {
        const currentPath = path ? `${path} > ${category.name}` : category.name;
        const hasChildren = (transformedCategories[category.id] || []).length > 0;
        
        result.push({
          ...category,
          displayPath: currentPath,
          hasChildren: hasChildren,
        });
        
        buildList(String(category.id), currentPath);
      });
    };

    buildList(null, '');
    return result;
  }, [transformedCategories]);

  /**
   * 重置編輯表單資料
   */
  const resetEditForm = () => {
    setEditFormData({
      name: '',
      sku: '',
      description: '',
      selling_price: '',
      cost_price: '',
      category_id: null,
    });
  };

  /**
   * 處理編輯表單輸入變更
   */
  const handleEditInputChange = (field: keyof ProductFormData, value: string) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 全選邏輯
  const isAllSelected = products.length > 0 && selectedProducts.size === products.length;
  const isIndeterminate = selectedProducts.size > 0 && selectedProducts.size < products.length;

  /**
   * 處理全選
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(products.map(p => p.id).filter((id): id is number => id !== undefined));
      setSelectedProducts(allIds);
    } else {
      setSelectedProducts(new Set());
    }
  };

  /**
   * 處理單個商品選擇
   */
  const handleSelectProduct = (productId: number, checked: boolean) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(productId);
      } else {
        newSet.delete(productId);
      }
      return newSet;
    });
  };

  /**
   * 開啟編輯對話框
   */
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setEditFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      selling_price: product.selling_price.toString(),
      cost_price: product.cost_price.toString(),
      category_id: product.category_id || null,
    });
    setIsEditDialogOpen(true);
  };

  /**
   * 處理商品更新
   */
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        name: editFormData.name,
        sku: editFormData.sku,
        description: editFormData.description || null,
        selling_price: parseFloat(editFormData.selling_price),
        cost_price: parseFloat(editFormData.cost_price),
        category_id: editFormData.category_id,
      });
      
      toast.success('商品已成功更新！');
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetEditForm();
    } catch {
      toast.error('更新失敗，請稍後再試。');
    }
  };

  /**
   * 處理商品刪除
   */
  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProductMutation.mutateAsync(id);
      toast.success('商品已刪除');
    } catch {
      toast.error('刪除失敗，請稍後再試。');
    }
  };

  /**
   * 計算利潤率
   */
  const calculateProfitMargin = (sellingPrice: number, costPrice: number): string => {
    if (costPrice === 0) return 'N/A';
    const margin = ((sellingPrice - costPrice) / costPrice) * 100;
    return `${margin.toFixed(1)}%`;
  };

  /**
   * 處理批量刪除
   */
  const handleBatchDelete = async () => {
    if (selectedProducts.size === 0) return;

    try {
      await deleteMultipleMutation.mutateAsync({ ids: Array.from(selectedProducts) });
      toast.success(`已刪除 ${selectedProducts.size} 項商品`);
      setSelectedProducts(new Set());
    } catch {
      toast.error('批量刪除失敗，請稍後再試。');
    }
  };

  // 載入狀態處理
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">載入商品資料中...</span>
      </div>
    );
  }

  // 錯誤狀態處理
  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">載入失敗</h3>
            <p className="text-muted-foreground mb-4">無法載入商品資料，請檢查網路連線。</p>
            <Button onClick={() => refetch()}>重試</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜尋和操作工具列 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜尋商品名稱或 SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 w-80"
            />
          </div>
          
          {selectedProducts.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  刪除選中項目 ({selectedProducts.size})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>確認批量刪除</AlertDialogTitle>
                  <AlertDialogDescription>
                    您確定要刪除選中的 {selectedProducts.size} 項商品嗎？此操作無法復原。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>取消</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBatchDelete}>
                    確認刪除
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        <Link href="/products/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            新增商品
          </Button>
        </Link>
      </div>

      {/* 商品資料表格 */}
      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
          <CardDescription>
            管理您的商品庫存和定價
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">尚無商品</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? '沒有符合搜尋條件的商品' : '開始新增您的第一個商品'}
              </p>
              <Link href="/products/new">
                <Button>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  新增商品
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        ref={(el) => {
                          if (el) el.indeterminate = isIndeterminate;
                        }}
                      />
                    </TableHead>
                    <TableHead>商品名稱</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>分類</TableHead>
                    <TableHead className="text-right">售價</TableHead>
                    <TableHead className="text-right">成本</TableHead>
                    <TableHead className="text-right">利潤率</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      {user?.is_admin && (
                        <TableCell>
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={(checked) =>
                              handleSelectProduct(product.id, !!checked)
                            }
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-muted-foreground">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.sku}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="secondary">
                            {product.category.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">未分類</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ${product.selling_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${product.cost_price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          variant={
                            product.selling_price > product.cost_price 
                              ? "default" 
                              : "destructive"
                          }
                        >
                          {calculateProfitMargin(product.selling_price, product.cost_price)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {user?.is_admin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(product)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>確認刪除</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您確定要刪除商品「{product.name}」嗎？此操作無法復原。
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>取消</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteProduct(product.id)}
                                    >
                                      確認刪除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編輯商品對話框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>編輯商品</DialogTitle>
            <DialogDescription>
              修改商品的基本資訊和定價
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">商品名稱</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => handleEditInputChange('name', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-sku">SKU</Label>
              <Input
                id="edit-sku"
                value={editFormData.sku}
                onChange={(e) => handleEditInputChange('sku', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">商品描述</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => handleEditInputChange('description', e.target.value)}
                rows={3}
              />
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-selling-price">售價</Label>
                <Input
                  id="edit-selling-price"
                  type="number"
                  step="0.01"
                  value={editFormData.selling_price}
                  onChange={(e) => handleEditInputChange('selling_price', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="edit-cost-price">成本價</Label>
                <Input
                  id="edit-cost-price"
                  type="number"
                  step="0.01"
                  value={editFormData.cost_price}
                  onChange={(e) => handleEditInputChange('cost_price', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>商品分類</Label>
              <CategoryCombobox
                categories={flatCategoriesWithOptions}
                value={editFormData.category_id}
                onValueChange={(value) => setEditFormData(prev => ({ ...prev, category_id: value }))}
                isLoading={isLoadingCategories}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleUpdateProduct}>
              儲存變更
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 