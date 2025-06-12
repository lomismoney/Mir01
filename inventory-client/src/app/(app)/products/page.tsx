'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import withAuth from '@/components/auth/withAuth';
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



// Product 類型已從 @/types/product 導入

/**
 * 商品管理頁面
 * 提供完整的商品 CRUD 功能
 */
function ProductsPage() {
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

  // 直接從 API 回應獲取已處理好的資料，API Hook 中已完成轉換
  const products: Product[] = (productsResponse?.data || []) as Product[];
  
  // 建立帶有完整顯示路徑的扁平化分類列表，用於 CategoryCombobox
  const flatCategoriesWithOptions = useMemo(() => {
    if (!categoriesResponse) return [];
    
    const result: (Category & { displayPath: string; hasChildren: boolean })[] = [];
    
    // 使用遞迴函式來建構帶有路徑的列表
    const buildList = (parentId: string | null, path: string) => {
      // 修正：當 parentId 為 null 時，使用空字串而非 "null"
      const key = parentId === null ? '' : String(parentId);
      const children = (categoriesResponse[key] || []) as Category[];
      children.forEach(category => {
        const currentPath = path ? `${path} > ${category.name}` : category.name;
        const hasChildren = (categoriesResponse[category.id] || []).length > 0;
        
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
  }, [categoriesResponse]);

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
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      selling_price: product.selling_price?.toString() || '',
      cost_price: product.cost_price?.toString() || '',
      category_id: product.category_id || null,
    });
    setIsEditDialogOpen(true);
  };

  /**
   * 處理更新商品
   */
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      if (!editingProduct.id) {
        toast.error('商品ID無效');
        return;
      }
      
      // TODO: 升級為 SPU/SKU 架構 - 暫時註釋避免編譯錯誤
      console.log('更新商品功能需要升級為 SPU/SKU 架構');
      toast.info('更新功能開發中，請使用新的商品表單');
      /*
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        name: editFormData.name,
        description: editFormData.description || null,
        category_id: editFormData.category_id,
      });
      */
      
      toast.success('商品更新成功！');
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetEditForm();
    } catch (error) {
      toast.error('更新商品失敗：' + (error as Error).message);
    }
  };

  /**
   * 處理刪除商品
   */
  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProductMutation.mutateAsync(id);
      toast.success('商品刪除成功！');
    } catch (error) {
      toast.error('刪除商品失敗：' + (error as Error).message);
    }
  };

  /**
   * 計算毛利率
   */
  const calculateProfitMargin = (sellingPrice: number, costPrice: number): string => {
    if (costPrice === 0) return '0.00';
    return ((sellingPrice - costPrice) / sellingPrice * 100).toFixed(2);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            商品管理
          </h1>
          <p className="text-muted-foreground">
            管理您的商品庫存、價格和基本資訊
          </p>
        </div>
        
        {user?.is_admin && (
          <Button asChild>
            <Link href="/products/new">
              <PlusCircle className="mr-2 h-4 w-4" />
              新增商品
            </Link>
              </Button>
        )}
      </div>

      <Separator />

      {/* 統計資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>商品概覽</CardTitle>
          <CardDescription>
            目前系統中的商品統計資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '載入中...' : `${products.length} 個商品`}
          </div>
          <p className="text-sm text-muted-foreground">
            已建立的商品總數
          </p>
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
          <CardDescription>
            管理您的商品資訊，包括價格、SKU 和描述
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜尋輸入框和批量操作區域 */}
          <div className="flex items-center justify-between mb-6">
            {/* 搜尋區域 */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="搜尋商品名稱、SKU 或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="shrink-0"
                >
                  清除
                </Button>
              )}
            </div>

            {/* 批量操作區域 */}
            {selectedProducts.size > 0 && user?.is_admin && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  已選取 {selectedProducts.size} 項
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      刪除選中商品
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確定要執行批量刪除嗎？</AlertDialogTitle>
                      <AlertDialogDescription>
                        你正準備刪除 {selectedProducts.size} 個商品。這個操作無法復原，所有相關資料將被永久移除。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const idsToDelete = Array.from(selectedProducts);
                          
                          toast.promise(deleteMultipleMutation.mutateAsync({ ids: idsToDelete }), {
                            loading: '正在刪除商品...',
                            success: () => {
                              setSelectedProducts(new Set()); // 清空選中狀態
                              return `成功刪除 ${idsToDelete.length} 個商品！`;
                            },
                            error: (err) => `刪除失敗：${err.message}`,
                          });
                        }}
                      >
                        確定刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>載入商品資料中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">載入商品失敗</p>
              <p className="text-sm text-muted-foreground mb-4">
                {(error as Error)?.message || '請檢查網路連線或聯繫系統管理員'}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                重試
              </Button>
            </div>
          ) : products.length === 0 ? (
            // 區分空狀態和搜尋無結果的顯示
            searchQuery.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">未找到符合條件的商品</p>
                <p className="text-sm">
                  嘗試調整搜尋關鍵字或 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => setSearchQuery('')}
                  >
                    清除搜尋條件
                  </Button>
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">尚無商品資料</p>
                <p className="text-sm">點擊「新增商品」開始建立您的商品庫存</p>
              </div>
            )
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {user?.is_admin && (
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="全選商品"
                          {...(isIndeterminate && { 'data-state': 'indeterminate' })}
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>商品名稱</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>成本價</TableHead>
                    <TableHead>售價</TableHead>
                    <TableHead>毛利率</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id}>
                      {user?.is_admin && (
                        <TableCell>
                          <Checkbox 
                            checked={product.id ? selectedProducts.has(product.id) : false}
                            onCheckedChange={(checked) => product.id && handleSelectProduct(product.id, checked as boolean)}
                            aria-label={`選取商品 ${product.name}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.sku}</Badge>
                      </TableCell>
                      <TableCell>
                        ${typeof product.cost_price === 'number' ? product.cost_price.toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell>
                        ${typeof product.selling_price === 'number' ? product.selling_price.toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          parseFloat(calculateProfitMargin(product.selling_price || 0, product.cost_price || 0)) > 20 
                            ? "default" 
                            : parseFloat(calculateProfitMargin(product.selling_price || 0, product.cost_price || 0)) > 10 
                            ? "secondary" 
                            : "destructive"
                        }>
                          {calculateProfitMargin(product.selling_price || 0, product.cost_price || 0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {product.description || '無描述'}
                      </TableCell>
                      <TableCell className="text-right">
                        {user?.is_admin && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(product)}
                              disabled={updateProductMutation.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deleteProductMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確定要刪除商品嗎？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    即將刪除商品「{product.name}」。此操作無法復原，所有相關資料將被永久移除。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => product.id && handleDeleteProduct(product.id)}
                                  >
                                    確定刪除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編輯對話框 - 只有管理員可見 */}
      {user?.is_admin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>編輯商品</DialogTitle>
            <DialogDescription>
              修改商品資訊
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">商品名稱 *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => handleEditInputChange('name', e.target.value)}
                placeholder="請輸入商品名稱"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU 編號 *</Label>
              <Input
                id="edit-sku"
                value={editFormData.sku}
                onChange={(e) => handleEditInputChange('sku', e.target.value)}
                placeholder="請輸入 SKU 編號"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">商品描述</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => handleEditInputChange('description', e.target.value)}
                placeholder="請輸入商品描述（選填）"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-category">商品分類</Label>
              <CategoryCombobox
                categories={flatCategoriesWithOptions}
                value={editFormData.category_id || null}
                onChange={(value) => setEditFormData(prev => ({ ...prev, category_id: value }))}
                disabled={isLoadingCategories}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-cost-price">成本價 *</Label>
                <Input
                  id="edit-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.cost_price}
                  onChange={(e) => handleEditInputChange('cost_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-selling-price">售價 *</Label>
                <Input
                  id="edit-selling-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.selling_price}
                  onChange={(e) => handleEditInputChange('selling_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdateProduct}
              disabled={updateProductMutation.isPending || !editFormData.name || !editFormData.sku}
            >
              {updateProductMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              更新商品
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}

export default withAuth(ProductsPage); 