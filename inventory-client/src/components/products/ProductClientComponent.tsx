'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Package, Search, Trash2 } from "lucide-react";
import { useProducts, useDeleteProduct, useDeleteMultipleProducts } from '@/hooks/useApi';

import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuthUser } from '@/lib/auth';

/**
 * 商品管理客戶端元件屬性
 */
interface ProductClientComponentProps {
  /** 從伺服器端傳入的已認證用戶資訊 */
  user: AuthUser;
}

/**
 * 商品管理客戶端頁面組件
 * 
 * 使用 shadcn/ui DataTable 重構的專業商品管理介面，
 * 提供完整的 CRUD 功能和現代化的使用者體驗。
 * 
 * 主要功能：
 * 1. 專業的資料表格展示 - 使用 TanStack React Table
 * 2. 搜尋和過濾功能 - 支援商品名稱和 SKU 搜尋
 * 3. 排序功能 - 點擊表頭排序
 * 4. 欄位顯示控制 - 動態顯示/隱藏欄位
 * 5. 分頁功能 - 處理大量資料
 * 6. 批量刪除功能 - 選擇多個商品進行刪除
 * 7. 商品操作 - 查看、編輯、刪除
 * 
 * 安全特性：
 * - 接收來自伺服器端驗證的用戶資訊
 * - 保持客戶端的互動功能
 */
export function ProductClientComponent({ }: ProductClientComponentProps) {
  
  // 搜索狀態管理
  const [searchQuery, setSearchQuery] = useState('');
  
  // 使用搜索功能的 useProducts hook
  const { data: productsResponse, isLoading, error } = useProducts(
    searchQuery ? { search: searchQuery } : {}
  );
  
  const deleteProductMutation = useDeleteProduct();
  const deleteMultipleProductsMutation = useDeleteMultipleProducts();
  
  // 刪除確認對話框狀態
  const [productToDelete, setProductToDelete] = useState<{ id: number; name: string } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [showBatchDeleteDialog, setShowBatchDeleteDialog] = useState(false);

  /**
   * 處理搜尋輸入變化
   */
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  /**
   * 處理單個商品刪除
   */
  const handleDeleteProduct = (product: { id: number; name: string }) => {
    setProductToDelete(product);
  };

  /**
   * 確認刪除單個商品
   */
  const confirmDeleteProduct = () => {
    if (!productToDelete?.id) {
      toast.error('無效的商品 ID');
      return;
    }

    deleteProductMutation.mutate(productToDelete.id, {
      onSuccess: () => {
        toast.success('商品刪除成功！');
        setProductToDelete(null);
      },
      onError: (error) => {
        toast.error(`刪除失敗：${error.message}`);
      }
    });
  };

  /**
   * 處理批量刪除
   */
  const handleBatchDelete = () => {
    if (selectedProducts.length === 0) {
      toast.error('請選擇要刪除的商品');
      return;
    }
    setShowBatchDeleteDialog(true);
  };

  /**
   * 確認批量刪除
   */
  const confirmBatchDelete = () => {
    deleteMultipleProductsMutation.mutate({ ids: selectedProducts }, {
      onSuccess: () => {
        toast.success(`成功刪除 ${selectedProducts.length} 個商品！`);
        setSelectedProducts([]);
        setShowBatchDeleteDialog(false);
      },
      onError: (error) => {
        toast.error(`批量刪除失敗：${error.message}`);
      }
    });
  };



  // 處理載入狀態
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">載入商品資料中...</span>
        </CardContent>
      </Card>
    );
  }

  // 處理錯誤狀態
  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">載入失敗</h3>
            <p className="text-gray-500">無法載入商品資料，請稍後再試。</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const products = productsResponse?.data || [];

  return (
    <div className="space-y-6">
      {/* 搜尋和操作區 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            商品列表
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-4 mb-4">
            {/* 搜尋框 */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜尋商品名稱或 SKU..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 批量操作按鈕 */}
            {selectedProducts.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBatchDelete}
                disabled={deleteMultipleProductsMutation.isPending}
              >
                {deleteMultipleProductsMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                刪除選中的商品 ({selectedProducts.length})
              </Button>
            )}
          </div>

          {/* 資料表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedProducts(products.map(p => p.id).filter((id): id is number => id !== undefined));
                        } else {
                          setSelectedProducts([]);
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                  <TableHead>商品名稱</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right">售價</TableHead>
                  <TableHead className="text-right">成本</TableHead>
                  <TableHead className="w-20">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">
                          {searchQuery ? '沒有找到符合條件的商品' : '尚無商品資料'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={product.id ? selectedProducts.includes(product.id) : false}
                          onChange={(e) => {
                            if (!product.id) return;
                            if (e.target.checked) {
                              setSelectedProducts([...selectedProducts, product.id]);
                            } else {
                              setSelectedProducts(selectedProducts.filter(id => id !== product.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="text-right font-medium">
                        NT$ {Number(product.selling_price).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        NT$ {Number(product.cost_price).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (product.id && product.name) {
                              handleDeleteProduct({ id: product.id, name: product.name });
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 單個商品刪除確認對話框 */}
      <AlertDialog open={!!productToDelete} onOpenChange={() => setProductToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認刪除商品</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除商品「{productToDelete?.name}」嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteProductMutation.isPending}
            >
              {deleteProductMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批量刪除確認對話框 */}
      <AlertDialog open={showBatchDeleteDialog} onOpenChange={setShowBatchDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批量刪除</AlertDialogTitle>
            <AlertDialogDescription>
              您確定要刪除選中的 {selectedProducts.length} 個商品嗎？此操作無法復原。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBatchDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMultipleProductsMutation.isPending}
            >
              {deleteMultipleProductsMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 