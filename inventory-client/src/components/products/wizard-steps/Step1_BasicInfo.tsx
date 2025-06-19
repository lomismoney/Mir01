'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, Package, FileText, FolderTree, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WizardFormData } from '../CreateProductWizard';
import { useCategories } from '@/hooks/queries/useEntityQueries';
import { Category } from '@/types/category';
import { ImageUploader } from '@/components/ui/ImageUploader';
import apiClient from '@/lib/apiClient';
import { toast } from 'sonner';

/**
 * 步驟1組件Props
 */
interface Step1Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>
  ) => void;
  /** 商品 ID（編輯模式時使用） */
  productId?: string | number;
  /** 是否為編輯模式 */
  isEditMode?: boolean;
}

/**
 * 步驟1：基本資訊輸入組件
 * 
 * 功能包含：
 * - 商品名稱輸入（必填）
 * - 商品描述輸入（選填）
 * - 商品分類選擇（選填）
 * - 商品圖片上傳（編輯模式時可用）
 * - 即時驗證與提示
 */
export function Step1_BasicInfo({ 
  formData, 
  updateFormData, 
  productId, 
  isEditMode = false 
}: Step1Props) {
  // 獲取分類資料
  const { data: categoriesGrouped, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  
  // 將分組的分類資料轉換為平面陣列
  const categoriesList = React.useMemo(() => {
    if (!categoriesGrouped) return [];
    
    // 將分組的分類資料扁平化為單一陣列
    const allCategories = Object.values(categoriesGrouped).flat();
    
    // 過濾有效的分類資料
    return allCategories.filter(category => 
      category && 
      category.id && 
      category.name
    );
  }, [categoriesGrouped]);

  // 除錯資訊
  React.useEffect(() => {
    console.log('Categories loading:', categoriesLoading);
    console.log('Categories error:', categoriesError);
    console.log('Categories grouped:', categoriesGrouped);
    console.log('Categories list:', categoriesList);
  }, [categoriesLoading, categoriesError, categoriesGrouped, categoriesList]);
  
  // 本地驗證狀態
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  /**
   * 處理基本資訊欄位變更
   */
  const handleFieldChange = (field: keyof WizardFormData['basicInfo'], value: string | number | null) => {
    // 清除該欄位的驗證錯誤
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // 更新表單資料
    updateFormData('basicInfo', {
      [field]: value,
    });
  };

  /**
   * 驗證商品名稱
   */
  const validateName = (name: string) => {
    if (!name.trim()) {
      setValidationErrors(prev => ({
        ...prev,
        name: '商品名稱為必填欄位'
      }));
      return false;
    }
    
    if (name.trim().length < 2) {
      setValidationErrors(prev => ({
        ...prev,
        name: '商品名稱至少需要2個字符'
      }));
      return false;
    }
    
    if (name.trim().length > 100) {
      setValidationErrors(prev => ({
        ...prev,
        name: '商品名稱不能超過100個字符'
      }));
      return false;
    }
    
    return true;
  };

  /**
   * 驗證商品描述
   */
  const validateDescription = (description: string) => {
    if (description.length > 1000) {
      setValidationErrors(prev => ({
        ...prev,
        description: '商品描述不能超過1000個字符'
      }));
      return false;
    }
    
    return true;
  };

  /**
   * 處理名稱失焦驗證
   */
  const handleNameBlur = () => {
    validateName(formData.basicInfo.name);
  };

  /**
   * 處理描述失焦驗證
   */
  const handleDescriptionBlur = () => {
    validateDescription(formData.basicInfo.description);
  };

  /**
   * 處理圖片上傳
   * 
   * 僅在編輯模式下可用，將圖片上傳至指定的商品
   * 使用類型安全的 API 客戶端，確保完整的類型檢查和認證支援
   * 
   * @param file - 要上傳的圖片文件
   */
  const handleImageUpload = async (file: File): Promise<void> => {
    if (!isEditMode || !productId) {
      throw new Error('圖片上傳僅在編輯模式下可用');
    }

    try {
      // 對於 multipart/form-data，使用 FormData 對象
      const formData = new FormData();
      formData.append('image', file);

      // 使用類型安全的 API 客戶端進行圖片上傳
      const { data, error, response } = await apiClient.POST("/api/products/{product_id}/upload-image", {
        params: {
          path: {
            product_id: Number(productId),
            id: Number(productId)
          }
        },
        body: formData as any // 由於 openapi-fetch 的類型限制，這裡需要類型斷言
      });

      // 檢查請求是否成功
      if (error || !response.ok) {
        // 優雅處理不同類型的錯誤
        if (response.status === 422) {
          // 422 驗證錯誤的處理
          const validationError = error as any;
          if (validationError?.errors?.image) {
            throw new Error(validationError.errors.image[0] || '圖片驗證失敗');
          } else if (validationError?.message) {
            throw new Error(validationError.message);
          }
        }
        
        const errorMessage = (error as any)?.message || `上傳失敗 (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      // 上傳成功，記錄結果
      console.log('✅ 圖片上傳成功:', data);
      
      if (data?.message) {
        console.log('📝 服務器響應:', data.message);
      }
      
    } catch (error: any) {
      console.error('❌ 圖片上傳錯誤:', error);
      throw error;
    }
  };

  /**
   * 圖片上傳成功回調
   * 
   * @param imageUrls - 上傳成功後的圖片 URLs
   */
  const handleImageUploadSuccess = (imageUrls: any) => {
    toast.success('圖片上傳成功！');
    // 可以在這裡更新表單數據或觸發重新獲取商品詳情
    console.log('圖片上傳成功，URLs:', imageUrls);
  };

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* 表單區域 - 緊湊設計 */}
        <div className="space-y-3">
          {/* 商品名稱 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="productName" className="text-sm font-medium">
                商品名稱
              </Label>
              <span className="text-red-500 text-sm">*</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>為您的商品取一個吸引人的名稱，這將是顧客看到的第一印象</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="productName"
              type="text"
              placeholder="請輸入商品名稱，例如：iPhone 15 Pro"
              value={formData.basicInfo.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              onBlur={handleNameBlur}
              className={validationErrors.name ? 'border-red-500' : ''}
              maxLength={100}
            />
            {validationErrors.name && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationErrors.name}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>建議長度：2-50個字符</span>
              <span>{formData.basicInfo.name.length}/100</span>
            </div>
          </div>

          {/* 商品描述 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="productDescription" className="text-sm font-medium">
                商品描述
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>詳細描述您的商品特色、功能和優勢，幫助顧客更好地了解商品</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="productDescription"
              placeholder="請詳細描述您的商品特色、功能、材質、尺寸等資訊..."
              value={formData.basicInfo.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              onBlur={handleDescriptionBlur}
              className={`min-h-[100px] ${validationErrors.description ? 'border-red-500' : ''}`}
              maxLength={1000}
            />
            {validationErrors.description && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationErrors.description}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-between text-xs text-gray-500">
              <span>選填，建議填寫以提升商品吸引力</span>
              <span>{formData.basicInfo.description.length}/1000</span>
            </div>
          </div>

          {/* 商品分類 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="productCategory" className="text-sm font-medium">
                商品分類
              </Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>選擇最符合您商品特性的分類，有助於顧客搜尋和瀏覽</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.basicInfo.category_id?.toString() || 'none'}
              onValueChange={(value) => handleFieldChange('category_id', value === 'none' ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="請選擇商品分類（選填）" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  未分類
                </SelectItem>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    載入分類中...
                  </SelectItem>
                ) : (
                  categoriesList.map((category) => (
                    category.id ? (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ) : null
                  ))
                )}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500">
              選填，稍後您也可以在商品管理中修改分類
            </div>
          </div>

          {/* 商品圖片上傳 */}
          <div className="space-y-2">
            <ImageUploader
              onUpload={handleImageUpload}
              onUploadSuccess={handleImageUploadSuccess}
              disabled={!isEditMode}
              label="商品圖片"
              helperText={
                !isEditMode 
                  ? "請先創建商品後再上傳圖片" 
                  : "支援 JPEG、PNG、GIF、WebP 格式，最大 10MB"
              }
            />
            {!isEditMode && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>提示：</strong> 
                  圖片上傳功能將在商品創建完成後開啟。您可以在創建商品後返回編輯頁面上傳圖片。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* 進度提示 */}
        <Alert className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>進度提示：</strong> 
            商品名稱為必填欄位，填寫完成後即可進入下一步進行規格定義。
          </AlertDescription>
        </Alert>
      </div>
    </TooltipProvider>
  );
} 