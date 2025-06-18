'use client';

import React, { useState, useEffect } from 'react';
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
import { AlertCircle, Package, FileText, FolderTree, HelpCircle, ImageIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WizardFormData } from '../CreateProductWizard';
import { useCategories } from '@/hooks/queries/useEntityQueries';
import { Category } from '@/types/category';
import { ImageSelector } from '@/components/ui/ImageSelector';
import { useImageSelection } from '@/hooks/useImageSelection';

/**
 * 步驟1組件Props（原子化創建流程版本）
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
 * 步驟1：基本資訊 + 圖片選擇組件（原子化創建流程版本）
 * 
 * 遵循「本地暫存，鏈式提交」的原子化創建流程理念：
 * - 基本資訊輸入（商品名稱、描述、分類）
 * - 圖片本地選擇和預覽（不上傳）
 * - 即時驗證與提示
 * - 統一的用戶體驗
 * 
 * 功能包含：
 * - 商品名稱輸入（必填）
 * - 商品描述輸入（選填）
 * - 商品分類選擇（選填）
 * - 商品圖片選擇（選填，本地暫存）
 * - 即時驗證與提示
 */
export function Step1_BasicInfoWithImage({ 
  formData, 
  updateFormData, 
  productId, 
  isEditMode = false 
}: Step1Props) {
  // 獲取分類資料
  const { data: categoriesGrouped, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  
  // 圖片選擇邏輯
  const imageSelection = useImageSelection();
  
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
   * 同步圖片選擇到父組件
   */
  useEffect(() => {
    updateFormData('imageData', {
      selectedFile: imageSelection.imageData.file,
      previewUrl: imageSelection.imageData.preview,
    });
  }, [imageSelection.imageData.file, imageSelection.imageData.preview, updateFormData]);
  
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

  return (
    <div className="space-y-8">
      {/* 基本資訊區塊 */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            基本資訊
          </h3>
          <p className="text-sm text-muted-foreground">
            填寫商品的基本信息
          </p>
        </div>
        
        {/* 商品名稱 */}
        <div className="space-y-2">
          <Label htmlFor="product-name" className="text-sm font-medium flex items-center gap-1">
            <Package className="h-4 w-4" />
            商品名稱
            <span className="text-red-500">*</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>請輸入清晰、具描述性的商品名稱，有助於客戶快速理解商品</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Input
            id="product-name"
            type="text"
            placeholder="例如：高級人體工學辦公椅"
            value={formData.basicInfo.name}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            onBlur={handleNameBlur}
            className={validationErrors.name ? 'border-red-500 focus:border-red-500' : ''}
            aria-describedby={validationErrors.name ? 'name-error' : undefined}
          />
          {validationErrors.name && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription id="name-error">
                {validationErrors.name}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 商品描述 */}
        <div className="space-y-2">
          <Label htmlFor="product-description" className="text-sm font-medium flex items-center gap-1">
            <FileText className="h-4 w-4" />
            商品描述
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>詳細描述商品特色、用途和優勢，幫助客戶做出購買決定</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          <Textarea
            id="product-description"
            placeholder="例如：採用透氣網布設計，具備可調節腰靠和扶手，提供全天候舒適支撐..."
            value={formData.basicInfo.description}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            onBlur={handleDescriptionBlur}
            rows={4}
            className={validationErrors.description ? 'border-red-500 focus:border-red-500' : ''}
            aria-describedby={validationErrors.description ? 'description-error' : undefined}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>提供詳細的商品說明，有助於提升轉換率</span>
            <span>{formData.basicInfo.description.length}/1000</span>
          </div>
          {validationErrors.description && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription id="description-error">
                {validationErrors.description}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* 商品分類 */}
        <div className="space-y-2">
          <Label htmlFor="product-category" className="text-sm font-medium flex items-center gap-1">
            <FolderTree className="h-4 w-4" />
            商品分類
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>選擇合適的商品分類，有助於客戶瀏覽和搜尋</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </Label>
          
          {categoriesLoading ? (
            <div className="h-10 bg-gray-100 rounded-md animate-pulse" />
          ) : categoriesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                載入分類資料失敗，請重新整理頁面
              </AlertDescription>
            </Alert>
          ) : (
            <Select
              value={formData.basicInfo.category_id?.toString() || ''}
              onValueChange={(value) => handleFieldChange('category_id', value ? Number(value) : null)}
            >
              <SelectTrigger id="product-category">
                <SelectValue placeholder="請選擇商品分類（可選）" />
              </SelectTrigger>
              <SelectContent>
                {categoriesList.map((category) => (
                  <SelectItem key={category.id} value={category.id?.toString() || ''}>
                    {category.name}
                    {category.description && (
                      <span className="text-xs text-gray-500 ml-2">
                        - {category.description}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
      
      {/* 圖片選擇區塊 */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-green-600" />
            商品圖片
          </h3>
          <p className="text-sm text-muted-foreground">
            選擇商品主圖片（可選，稍後也可以上傳）
          </p>
        </div>
        
        {/* 整合的圖片選擇器 */}
        <ImageSelector
          imageData={imageSelection.imageData}
          onSelectImage={imageSelection.selectImage}
          onClearImage={imageSelection.clearImage}
          maxFileSize={5 * 1024 * 1024} // 5MB
          acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
        />
        
        {/* 圖片選擇提示 */}
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded-md">
          <p className="font-medium text-blue-800 mb-1">💡 圖片選擇說明</p>
          <ul className="space-y-1 text-blue-700">
            <li>• 圖片將在商品創建完成後自動上傳</li>
            <li>• 支援 JPEG、PNG、WebP 格式，建議使用高品質圖片</li>
            <li>• 圖片大小限制為 5MB</li>
            <li>• 如果現在不選擇，稍後可以在編輯頁面上傳</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 