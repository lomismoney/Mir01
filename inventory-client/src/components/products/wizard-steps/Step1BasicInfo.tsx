'use client';

import { forwardRef, useImperativeHandle, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from '@/hooks/useApi';
import { CategoryCombobox } from '@/components/categories/CategoryCombobox';
import { transformCategoriesResponse } from '@/types/api-helpers';

/**
 * 導出表單值的類型，供父元件使用
 */
export type Step1Data = {
  /** 商品名稱 */
  name: string;
  /** 商品描述 */
  description: string;
  /** 商品分類 ID */
  category_id: number | null;
};

/**
 * Props 類型現在只接收初始資料，不再需要回調函數
 */
interface Step1Props {
  /** 從父元件傳入的初始資料 */
  initialData: Step1Data;
}

/**
 * 定義對外暴露的 ref 句柄類型
 * 父元件可以通過 ref 調用這些方法
 */
export interface Step1Ref {
  /** 提交表單並返回驗證後的資料，如果驗證失敗則返回 null */
  submit: () => Promise<Step1Data | null>;
  /** 獲取當前表單資料，不進行驗證 */
  getCurrentData: () => Step1Data;
  /** 重置表單到初始狀態 */
  reset: () => void;
}

/**
 * 步驟一：基本資訊表單元件（重構版）
 * 
 * 🔧 架構重構亮點：
 * 1. ✅ 使用 forwardRef 和 useImperativeHandle 暴露控制介面
 * 2. ✅ 完全獨立的內部狀態管理，切斷無限渲染迴圈
 * 3. ✅ 父元件通過 ref 控制子元件，而非回調函數
 * 4. ✅ 支援表單驗證和錯誤處理
 * 5. ✅ 保持原有的用戶體驗和視覺設計
 * 
 * 使用方式：
 * ```tsx
 * const step1Ref = useRef<Step1Ref>(null);
 * const handleNext = async () => {
 *   const data = await step1Ref.current?.submit();
 *   if (data) {
 *     // 驗證成功，處理資料
 *   } else {
 *     // 驗證失敗，顯示錯誤
 *   }
 * };
 * ```
 */
export const Step1BasicInfo = forwardRef<Step1Ref, Step1Props>(
  ({ initialData }, ref) => {
    // 獲取分類資料
    const { data: categoriesResponse, isLoading: isLoadingCategories } = useCategories();
    
    // 初始化表單，使用父元件傳入的初始資料
    const { control, handleSubmit, getValues, reset, formState: { errors } } = useForm<Step1Data>({
      defaultValues: initialData,
      mode: 'onChange', // 即時驗證模式
    });

    /**
     * 將後端分類資料轉換為 CategoryCombobox 需要的格式
     * ✅ 後端現在直接返回扁平化的分類列表
     */
    const processedCategories = useMemo(() => {
      // ✅ 使用 API 類型轉換助手，完全符合架構規範
      const transformedCategories = transformCategoriesResponse(categoriesResponse || {});
      
      // 轉換為 CategoryCombobox 需要的格式
      return transformedCategories.map((category) => ({
        ...category,
        displayPath: category.name, // 簡化版，後續可擴展為完整路徑
        hasChildren: false // 簡化版，後續可根據實際數據結構擴展
      }));
    }, [categoriesResponse]);

    /**
     * 使用 useImperativeHandle 將控制方法暴露給父元件
     * 這是新架構的核心：父元件通過 ref 來控制子元件
     */
    useImperativeHandle(ref, () => ({
      /**
       * 提交表單方法
       * 執行表單驗證，成功時返回資料，失敗時返回 null
       */
      submit: () => {
        return new Promise<Step1Data | null>((resolve) => {
          handleSubmit(
            (data) => {
              // 表單驗證成功，返回清理後的資料
              const cleanedData: Step1Data = {
                name: data.name?.trim() || '',
                description: data.description?.trim() || '',
                category_id: data.category_id || null,
              };
              resolve(cleanedData);
            },
            (errors) => {
              // 表單驗證失敗，記錄錯誤並返回 null
              console.warn('Step1 表單驗證失敗:', errors);
              resolve(null);
            }
          )();
        });
      },

      /**
       * 獲取當前表單資料（不進行驗證）
       * 用於預覽或草稿儲存等場景
       */
      getCurrentData: () => {
        const currentValues = getValues();
        return {
          name: currentValues.name?.trim() || '',
          description: currentValues.description?.trim() || '',
          category_id: currentValues.category_id || null,
        };
      },

      /**
       * 重置表單到初始狀態
       */
      reset: () => {
        reset(initialData);
      },
    }), [handleSubmit, getValues, reset, initialData]);

    return (
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                1
              </span>
              商品基本資訊
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              請填寫商品的基本資訊，這些資訊將作為商品的核心識別資料。
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* 商品名稱欄位 */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                商品名稱 <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="name"
                control={control}
                rules={{
                  required: '商品名稱為必填欄位',
                  minLength: {
                    value: 2,
                    message: '商品名稱至少需要 2 個字符'
                  },
                  maxLength: {
                    value: 100,
                    message: '商品名稱不能超過 100 個字符'
                  }
                }}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="name"
                    placeholder="請輸入商品名稱，例如：iPhone 15 Pro"
                    className={`w-full ${errors.name ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                建議使用清楚、具描述性的名稱，方便日後管理和搜尋。
              </p>
            </div>

            {/* 商品描述欄位 */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                商品描述
              </Label>
              <Controller  
                name="description"
                control={control}
                rules={{
                  maxLength: {
                    value: 1000,
                    message: '商品描述不能超過 1000 個字符'
                  }
                }}
                render={({ field }) => (
                  <Textarea
                    {...field}
                    id="description"
                    placeholder="請輸入商品的詳細描述，包含特色、規格等資訊（選填）"
                    className={`w-full min-h-[100px] resize-vertical ${errors.description ? 'border-destructive' : ''}`}
                  />
                )}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                詳細的商品描述有助於客戶了解商品特色和規格。
              </p>
            </div>

            {/* 商品分類欄位 */}
            <div className="space-y-2">
              <Label htmlFor="category_id" className="text-sm font-medium">
                商品分類
              </Label>
              <Controller
                name="category_id"
                control={control}
                render={({ field }) => (
                  <CategoryCombobox
                    categories={processedCategories}
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isLoadingCategories}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">
                {isLoadingCategories 
                  ? '正在載入分類資料...'
                  : '選擇合適的商品分類有助於商品管理和客戶查找。'
                }
              </p>
            </div>

            {/* 新架構狀態指示 */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  架構模式：ref 控制模式（已解決無限渲染問題）
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-600 text-xs">獨立狀態管理</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

// 設定 displayName 以便於 React DevTools 除錯
Step1BasicInfo.displayName = "Step1BasicInfo"; 