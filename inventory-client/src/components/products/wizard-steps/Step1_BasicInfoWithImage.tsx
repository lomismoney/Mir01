"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Plus, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WizardFormData } from "../CreateProductWizard";
import { useCategories } from "@/hooks";
import { Category } from "@/types/category";
import { useImageSelection } from "@/hooks/useImageSelection";

/**
 * 步驟1組件Props（原子化創建流程版本）
 */
interface Step1Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>,
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
  isEditMode = false,
}: Step1Props) {
  // 獲取分類資料
  const {
    data: categoriesGrouped,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  // 圖片選擇邏輯（支援編輯模式初始化）
  const imageSelection = useImageSelection(
    isEditMode ? formData.imageData.previewUrl : null
  );

  // 處理分類資料，分離父分類和子分類
  const { parentCategories, allCategoriesMap } = React.useMemo(() => {
    if (!categoriesGrouped) return { parentCategories: [], allCategoriesMap: new Map() };

    let allCategories: Category[] = [];
    
    if (Array.isArray(categoriesGrouped)) {
      allCategories = categoriesGrouped as Category[];
    } else if (categoriesGrouped && typeof categoriesGrouped === 'object') {
      allCategories = Object.values(categoriesGrouped).flat() as Category[];
    }

    // 建立所有分類的映射（包括子分類）
    const categoriesMap = new Map<number, Category>();
    
    const addToMap = (categories: Category[]) => {
      for (const category of categories) {
        if (category && category.id && category.name) {
          categoriesMap.set(category.id, category);
          if (category.children && category.children.length > 0) {
            addToMap(category.children);
          }
        }
      }
    };
    
    addToMap(allCategories);

    // 提取父分類（parent_id 為 null 的分類）
    const parents = allCategories.filter(cat => cat && cat.parent_id === null);

    return { 
      parentCategories: parents, 
      allCategoriesMap: categoriesMap 
    };
  }, [categoriesGrouped]);

  // 動態多階段分類選擇狀態
  const [categoryPath, setCategoryPath] = React.useState<number[]>([]);
  const currentCategory = formData.basicInfo.category_id ? allCategoriesMap.get(formData.basicInfo.category_id) : null;
  
  // 根據當前選中的分類，建立分類路徑
  React.useEffect(() => {
    if (currentCategory) {
      // 建立從根分類到當前分類的完整路徑
      const buildPath = (category: Category): number[] => {
        if (!category.parent_id) {
          // 這是根分類
          return [category.id];
        } else {
          // 遞歸建立路徑
          const parentCategory = allCategoriesMap.get(category.parent_id);
          if (parentCategory) {
            return [...buildPath(parentCategory), category.id];
          } else {
            return [category.id];
          }
        }
      };
      
      const path = buildPath(currentCategory);
      setCategoryPath(path);
    } else {
      setCategoryPath([]);
    }
  }, [currentCategory, allCategoriesMap]);

  // 動態計算每個階段的分類選項
  const categoryStages = React.useMemo(() => {
    const stages: Array<{
      level: number;
      parentCategory: Category | null;
      options: Category[];
      selectedId: number | null;
    }> = [];

    // 第一階段：根分類
    stages.push({
      level: 0,
      parentCategory: null,
      options: parentCategories,
      selectedId: categoryPath[0] || null,
    });

    // 動態建立後續階段
    let currentOptions = parentCategories;
    for (let i = 0; i < categoryPath.length; i++) {
      const selectedId = categoryPath[i];
      const selectedCategory = allCategoriesMap.get(selectedId);
      
      if (selectedCategory && selectedCategory.children && selectedCategory.children.length > 0) {
        stages.push({
          level: i + 1,
          parentCategory: selectedCategory,
          options: selectedCategory.children,
          selectedId: categoryPath[i + 1] || null,
        });
      }
    }

    return stages;
  }, [categoryPath, parentCategories, allCategoriesMap]);



  // 本地驗證狀態
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  /**
   * 編輯模式下的反向同步：formData → imageSelection
   * 當商品數據加載完成後，初始化圖片預覽
   */
  useEffect(() => {
    if (isEditMode && formData.imageData.previewUrl && !imageSelection.imageData.preview) {
      imageSelection.setExternalPreview(formData.imageData.previewUrl);
    }
  }, [isEditMode, formData.imageData.previewUrl, imageSelection.imageData.preview, imageSelection.setExternalPreview]);

  /**
   * 同步圖片選擇到父組件
   * 遵循單一事實來源原則：所有狀態都來自 formData
   */
  useEffect(() => {
    // 只有在選擇了新文件時才更新
    // 使用時間戳來確保只在真正的新文件時才更新
    if (imageSelection.imageData.file && imageSelection.imageData.preview) {
      const currentFile = imageSelection.imageData.file;
      const currentPreview = imageSelection.imageData.preview;
      
      // 檢查是否是真正的新文件（避免重複更新）
      if (formData.imageData.selectedFile !== currentFile) {
        updateFormData("imageData", {
          selectedFile: currentFile,
          previewUrl: currentPreview,
        });
      }
    }
  }, [
    imageSelection.imageData.file,
    imageSelection.imageData.preview,
    formData.imageData.selectedFile,
    updateFormData,
  ]);

  /**
   * 處理清除圖片
   * 清除時同時清除 selectedFile 和 previewUrl
   */
  const handleClearImage = () => {
    imageSelection.clearImage();
    // 同時清除 formData 中的預覽 URL
    updateFormData("imageData", {
      selectedFile: null,
      previewUrl: null,
    });
  };

  /**
   * 處理基本資訊欄位變更
   */
  const handleFieldChange = (
    field: keyof WizardFormData["basicInfo"],
    value: string | number | null,
  ) => {
    // 清除該欄位的驗證錯誤
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // 更新表單資料
    updateFormData("basicInfo", {
      [field]: value,
    });
  };

  /**
   * 驗證商品名稱
   */
  const validateName = (name: string) => {
    if (!name.trim()) {
      setValidationErrors((prev) => ({
        ...prev,
        name: "商品名稱為必填欄位",
      }));
      return false;
    }

    if (name.trim().length < 2) {
      setValidationErrors((prev) => ({
        ...prev,
        name: "商品名稱至少需要2個字符",
      }));
      return false;
    }

    if (name.trim().length > 100) {
      setValidationErrors((prev) => ({
        ...prev,
        name: "商品名稱不能超過100個字符",
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
      setValidationErrors((prev) => ({
        ...prev,
        description: "商品描述不能超過1000個字符",
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

  // 文件輸入 ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /**
   * 處理文件選擇
   */
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      imageSelection.selectImage(file);
    }
    // 清空 input 值，允許重複選擇同一文件
    event.target.value = "";
  };

  /**
   * 觸發文件選擇對話框
   */
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>基本資訊</CardTitle>
        <CardDescription>
          填寫商品的基礎銷售資訊。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* --- 商品名稱 --- */}
        <div className="space-y-2">
          <Label
            htmlFor="product-name"
            className="text-sm font-medium"
           
          >
            商品名稱
            <span className="text-red-500 ml-1">
              *
            </span>
          </Label>
          <Input
            id="product-name"
            type="text"
            placeholder="例如：高級人體工學辦公椅"
            value={formData.basicInfo.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            onBlur={handleNameBlur}
            className={
              validationErrors.name ? "border-red-500 focus:border-red-500" : ""
            }
            aria-describedby={validationErrors.name ? "name-error" : undefined}
           
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

        {/* --- 商品描述 --- */}
        <div className="space-y-2">
          <Label
            htmlFor="product-description"
            className="text-sm font-medium"
           
          >
            商品描述
          </Label>
          <Textarea
            id="product-description"
            placeholder="例如：採用透氣網布設計，具備可調節腰靠和扶手，提供全天候舒適支撐..."
            value={formData.basicInfo.description}
            onChange={(e) => handleFieldChange("description", e.target.value)}
            onBlur={handleDescriptionBlur}
            rows={4}
            className={
              validationErrors.description
                ? "border-red-500 focus:border-red-500"
                : ""
            }
            aria-describedby={
              validationErrors.description ? "description-error" : undefined
            }
           
          />

          <div
            className="flex justify-between text-xs text-muted-foreground"
           
          >
            <span>提供詳細的商品說明，有助於提升轉換率</span>
            <span>
              {formData.basicInfo.description.length}/1000
            </span>
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

        {/* --- 商品分類 --- */}
        <div className="space-y-2">
          <Label
            htmlFor="product-category"
            className="text-sm font-medium"
           
          >
            商品分類
          </Label>

          {categoriesLoading ? (
            <div
              className="h-10 bg-muted rounded-md animate-pulse"
             
            />
          ) : categoriesError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                載入分類資料失敗，請重新整理頁面
              </AlertDescription>
            </Alert>
          ) : (
                                      <div className="space-y-3">
              {/* 動態多階段分類選擇器 */}
              {categoryStages.map((stage, stageIndex) => (
                <div key={`stage-${stage.level}`}>
                  <Label 
                    htmlFor={`category-stage-${stage.level}`} 
                    className="text-sm font-medium"
                  >
                    {stage.level === 0 ? '主分類' : `${stage.parentCategory?.name} 的子分類`}
                    {stage.level > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (可選，不選則使用 "{stage.parentCategory?.name}")
                      </span>
                    )}
                  </Label>
                  <Select
                    value={
                      stage.selectedId?.toString() || 
                      (stage.level === 0 ? "none" : `parent_${stage.parentCategory?.id}`)
                    }
                    onValueChange={(value) => {
                      if (value === "none") {
                        // 清除所有選擇
                        setCategoryPath([]);
                        handleFieldChange("category_id", null);
                      } else if (value.startsWith("parent_")) {
                        // 選擇使用父分類
                        const newPath = categoryPath.slice(0, stage.level);
                        setCategoryPath(newPath);
                        const categoryId = newPath[newPath.length - 1] || null;
                        handleFieldChange("category_id", categoryId);
                      } else {
                        // 選擇特定分類
                        const categoryId = Number(value);
                        const newPath = [...categoryPath.slice(0, stage.level), categoryId];
                        setCategoryPath(newPath);
                        handleFieldChange("category_id", categoryId);
                      }
                    }}
                  >
                    <SelectTrigger id={`category-stage-${stage.level}`}>
                      <SelectValue
                        placeholder={
                          stage.level === 0 
                            ? "請選擇主分類（可選）" 
                            : `選擇 ${stage.parentCategory?.name} 的子分類（可選）`
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {stage.level === 0 ? (
                        <SelectItem value="none">
                          未分類
                        </SelectItem>
                      ) : (
                        <SelectItem value={`parent_${stage.parentCategory?.id}`}>
                          使用：{stage.parentCategory?.name}
                        </SelectItem>
                      )}
                      {stage.options.map((category) => (
                        <SelectItem
                          key={category.id}
                          value={category.id?.toString() || ""}
                        >
                          {category.name}
                          {category.description && (
                            <span className="text-xs text-muted-foreground ml-2">
                              - {category.description}
                            </span>
                          )}
                          {category.children && category.children.length > 0 && (
                            <span className="text-xs text-blue-500 ml-2">
                              ({category.children.length} 子分類)
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- 🎯 行內緊湊型圖片上傳器 --- */}
        <div className="space-y-2">
          <Label>商品圖片</Label>
          <div className="flex items-start gap-4">
            {/* 優化的圖片顯示邏輯：統一處理所有圖片來源 */}
            {imageSelection.imageData.preview || formData.imageData.previewUrl ? (
              /* 已上傳圖片的預覽區 */
              <div className="relative">
                <div
                  className="w-24 h-24 border rounded-md overflow-hidden bg-muted"
                 
                >
                  <img
                    src={imageSelection.imageData.preview || formData.imageData.previewUrl || ""}
                    alt="商品圖片預覽"
                    className="w-full h-full object-cover"
                   
                  />

                  {/* 移除按鈕 */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleClearImage}
                   
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {/* 上傳按鈕 - 只在沒有圖片時顯示 */}
                <Button
                  type="button"
                  variant="outline"
                  className="flex flex-col items-center justify-center w-24 h-24 border-dashed shrink-0"
                  onClick={triggerFileSelect}
                 
                >
                  <Plus className="h-6 w-6" />
                  <span className="text-xs mt-1">
                    上傳圖片
                  </span>
                </Button>

                {/* 圖片說明文字 - 只在沒有圖片時顯示 */}
                <div
                  className="text-xs text-muted-foreground self-center"
                 
                >
                  <p>支援 JPG、PNG、WebP 格式</p>
                  <p>建議尺寸 800x800 像素</p>
                  <p>最多可上傳 1 張圖片</p>
                </div>
              </>
            )}
          </div>

          {/* 隱藏的文件輸入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
           
          />
        </div>
      </CardContent>
    </Card>
  );
}
