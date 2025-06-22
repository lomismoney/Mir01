'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

/**
 * 商品編輯表單骨架屏組件
 * 
 * 提供與實際表單結構一致的載入佔位符，
 * 避免載入完成後的佈局跳躍，提升用戶體驗。
 */
export function EditProductFormSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      {/* --- 頁面標題骨架 --- */}
      <div className="mb-8">
        <Skeleton className="h-9 w-32 mb-2" /> {/* 標題 */}
        <Skeleton className="h-5 w-64" /> {/* 副標題 */}
      </div>

      {/* --- 統一的內容容器 --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* --- 左欄：步驟指示器骨架 --- */}
        <aside className="md:col-span-1">
          {/* 進度概覽骨架 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" /> {/* "創建進度" 文字 */}
              <Skeleton className="h-5 w-16 rounded-full" /> {/* Badge */}
            </div>
            <Progress value={25} className="w-full h-2" />
          </div>

          {/* 步驟列表骨架 */}
          <div className="space-y-2">
            {[1, 2, 3, 4].map((step) => (
              <div 
                key={step} 
                className={`flex items-start space-x-3 p-3 rounded-lg transition-all ${
                  step === 1 ? 'bg-primary/10 border border-primary/20' : 'bg-transparent'
                }`}
              >
                {/* 步驟圖標骨架 */}
                <div className="flex-shrink-0 mt-0.5">
                  <Skeleton className="h-5 w-5 rounded-full" />
                </div>
                
                {/* 步驟資訊骨架 */}
                <div className="flex-1 min-w-0 space-y-1">
                  <Skeleton className="h-4 w-24" /> {/* 步驟標題 */}
                  <Skeleton className="h-3 w-32" /> {/* 步驟描述 */}
                  {step === 1 && (
                    <div className="flex items-center mt-1.5">
                      <Skeleton className="h-3 w-12" /> {/* "進行中" */}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </aside>
        
        {/* --- 右欄：表單內容區骨架 --- */}
        <main className="md:col-span-3">
          {/* 基本資訊表單骨架 */}
          <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" /> {/* 圖標 */}
                <Skeleton className="h-6 w-32" /> {/* 標題 */}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 商品名稱輸入框骨架 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Input */}
              </div>
              
              {/* 商品描述文本域骨架 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" /> {/* Label */}
                <Skeleton className="h-24 w-full" /> {/* Textarea */}
              </div>
              
              {/* 商品分類選擇器骨架 */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" /> {/* Label */}
                <Skeleton className="h-10 w-full" /> {/* Select */}
              </div>
            </CardContent>
          </Card>
          
          {/* 圖片上傳區域骨架 */}
          <Card className="mt-6 bg-card text-card-foreground border border-border/40 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5" /> {/* 圖標 */}
                <Skeleton className="h-6 w-32" /> {/* 標題 */}
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full rounded-lg" /> {/* 上傳區域 */}
            </CardContent>
          </Card>
          
          {/* 底部導航控制骨架 */}
          <div className="mt-6 flex items-center justify-between">
            <Skeleton className="h-10 w-24" /> {/* 上一步按鈕 */}
            <Skeleton className="h-4 w-20" /> {/* 步驟指示 */}
            <Skeleton className="h-10 w-24" /> {/* 下一步按鈕 */}
          </div>
        </main>

      </div>
    </div>
  );
} 