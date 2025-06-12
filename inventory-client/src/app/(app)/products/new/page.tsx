'use client';

import withAuth from '@/components/auth/withAuth';
import { ProductForm } from '@/components/products/ProductForm';
import { useRouter } from 'next/navigation';

/**
 * 新增商品頁面
 * 
 * 此頁面作為 ProductForm 元件的容器，提供：
 * - 頁面標題和描述
 * - 表單成功提交後的導航處理
 * - 取消操作的返回處理
 */
function CreateProductPage() {
  const router = useRouter();

  /**
   * 表單成功提交後的回呼函式
   * 成功後跳轉回商品列表頁面
   */
  const handleFormSubmit = () => {
    // 成功後，可以跳轉回商品列表頁
    router.push('/products');
  };

  /**
   * 取消操作處理函式
   * 返回商品列表頁面
   */
  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頁面標題區域 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">新增商品</h1>
        <p className="text-muted-foreground mt-2">
          建立新的商品，支援單規格和多規格商品類型。
        </p>
      </div>
      
      {/* 商品表單元件 */}
      <ProductForm 
        onSubmitSuccess={handleFormSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}

// 使用 withAuth 保護此頁面
export default withAuth(CreateProductPage); 