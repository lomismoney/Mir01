'use client';

import { ProductForm } from '@/components/products';
import withAuth from '@/components/auth/withAuth';
import { Package } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 商品表單資料介面
 */
interface ProductFormData {
  name: string;
  description?: string;
  category_id?: number | null;
}

/**
 * 新增商品頁面
 * 
 * 提供完整的商品創建功能，包含：
 * - SPU 基本資訊設定
 * - 規格屬性選擇
 * - SKU 變體配置
 */
function NewProductPage() {
  /**
   * 處理表單提交
   */
  const handleSubmit = (formData: ProductFormData) => {
    console.log('提交的表單資料：', formData);
    console.log('當前 variants 狀態將在下一步開發中可用');
    toast.success('商品資料已接收，開發中...');
    // TODO: 整合後端 API 呼叫
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center gap-3">
        <Package className="h-6 w-6" />
        <div>
          <h1 className="text-2xl font-bold">新增商品</h1>
          <p className="text-muted-foreground">
            建立新的商品，支援單規格和多規格商品類型
          </p>
        </div>
      </div>

      {/* 商品表單 */}
      <ProductForm
        title="新增商品"
        description="請填寫商品的基本資訊和規格定義"
        onSubmit={handleSubmit}
        isLoading={false}
      />
    </div>
  );
}

export default withAuth(NewProductPage); 