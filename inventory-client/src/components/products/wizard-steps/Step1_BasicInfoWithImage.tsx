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
import { useCategories } from "@/hooks/queries/useEntityQueries";
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

  // 圖片選擇邏輯
  const imageSelection = useImageSelection();

  // 將分組的分類資料轉換為平面陣列
  const categoriesList = React.useMemo(() => {
    if (!categoriesGrouped) return [];

    // 將分組的分類資料扁平化為單一陣列
    const allCategories = Object.values(categoriesGrouped).flat();

    // 過濾有效的分類資料
    return allCategories.filter(
      (category) => category && category.id && category.name,
    );
  }, [categoriesGrouped]);

  // 本地驗證狀態
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  /**
   * 同步圖片選擇到父組件
   * 遵循單一事實來源原則：所有狀態都來自 formData
   */
  useEffect(() => {
    // 只有在選擇了新文件時才更新
    if (imageSelection.imageData.file) {
      updateFormData("imageData", {
        selectedFile: imageSelection.imageData.file,
        previewUrl: imageSelection.imageData.preview,
      });
    }
  }, [
    imageSelection.imageData.file,
    imageSelection.imageData.preview,
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
    <Card data-oid="lg:17o7">
      <CardHeader data-oid="n.s5zcl">
        <CardTitle data-oid="v0006:g">基本資訊</CardTitle>
        <CardDescription data-oid="-jbj3bh">
          填寫商品的基礎銷售資訊。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6" data-oid="7r3re5l">
        {/* --- 商品名稱 --- */}
        <div className="space-y-2" data-oid=":oqkzq1">
          <Label
            htmlFor="product-name"
            className="text-sm font-medium"
            data-oid="6ebi.tz"
          >
            商品名稱
            <span className="text-red-500 ml-1" data-oid="-zzc0.5">
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
            data-oid="6otk9wh"
          />

          {validationErrors.name && (
            <Alert variant="destructive" data-oid="p7rknzl">
              <AlertCircle className="h-4 w-4" data-oid="2ywfj5c" />
              <AlertDescription id="name-error" data-oid="k1y338j">
                {validationErrors.name}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* --- 商品描述 --- */}
        <div className="space-y-2" data-oid="tz1snrt">
          <Label
            htmlFor="product-description"
            className="text-sm font-medium"
            data-oid="qeidhz:"
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
            data-oid="93zza.l"
          />

          <div
            className="flex justify-between text-xs text-muted-foreground"
            data-oid="uxe6y1y"
          >
            <span data-oid="-oj5me9">提供詳細的商品說明，有助於提升轉換率</span>
            <span data-oid="ukfbsy3">
              {formData.basicInfo.description.length}/1000
            </span>
          </div>
          {validationErrors.description && (
            <Alert variant="destructive" data-oid="_odgg1z">
              <AlertCircle className="h-4 w-4" data-oid="hnw7b9u" />
              <AlertDescription id="description-error" data-oid="tukf8uq">
                {validationErrors.description}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* --- 商品分類 --- */}
        <div className="space-y-2" data-oid="3wt.czr">
          <Label
            htmlFor="product-category"
            className="text-sm font-medium"
            data-oid="3fecnq9"
          >
            商品分類
          </Label>

          {categoriesLoading ? (
            <div
              className="h-10 bg-muted rounded-md animate-pulse"
              data-oid="ktpabj7"
            />
          ) : categoriesError ? (
            <Alert variant="destructive" data-oid="cz7m:kd">
              <AlertCircle className="h-4 w-4" data-oid="zy3a-c2" />
              <AlertDescription data-oid="m5b4-gj">
                載入分類資料失敗，請重新整理頁面
              </AlertDescription>
            </Alert>
          ) : (
            <Select
              value={formData.basicInfo.category_id?.toString() || ""}
              onValueChange={(value) =>
                handleFieldChange("category_id", value ? Number(value) : null)
              }
              data-oid="1ve_5-p"
            >
              <SelectTrigger id="product-category" data-oid="5agtxnc">
                <SelectValue
                  placeholder="請選擇商品分類（可選）"
                  data-oid=".x4te:s"
                />
              </SelectTrigger>
              <SelectContent data-oid="_1apu9k">
                {categoriesList.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id?.toString() || ""}
                    data-oid="1tnitzz"
                  >
                    {category.name}
                    {category.description && (
                      <span
                        className="text-xs text-muted-foreground ml-2"
                        data-oid="iuhy8.z"
                      >
                        - {category.description}
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* --- 🎯 行內緊湊型圖片上傳器 --- */}
        <div className="space-y-2" data-oid="avzxsmq">
          <Label data-oid="nkl8vge">商品圖片</Label>
          <div className="flex items-start gap-4" data-oid="txp.uk5">
            {formData.imageData.selectedFile ||
            formData.imageData.previewUrl ? (
              /* 已上傳圖片的預覽區 */
              <div className="relative" data-oid="rop2ug9">
                <div
                  className="w-24 h-24 border rounded-md overflow-hidden bg-muted"
                  data-oid="qh1qm1s"
                >
                  <img
                    src={
                      imageSelection.imageData.preview ||
                      formData.imageData.previewUrl ||
                      ""
                    }
                    alt="商品圖片預覽"
                    className="w-full h-full object-cover"
                    data-oid="ak6b2r8"
                  />

                  {/* 移除按鈕 */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={handleClearImage}
                    data-oid="hgv28u1"
                  >
                    <X className="h-3 w-3" data-oid=".egl-5." />
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
                  data-oid=":jdyzvj"
                >
                  <Plus className="h-6 w-6" data-oid="jkoy40e" />
                  <span className="text-xs mt-1" data-oid="fvr900r">
                    上傳圖片
                  </span>
                </Button>

                {/* 圖片說明文字 - 只在沒有圖片時顯示 */}
                <div
                  className="text-xs text-muted-foreground self-center"
                  data-oid="suptyjl"
                >
                  <p data-oid="kzqejl5">支援 JPG、PNG、WebP 格式</p>
                  <p data-oid="_3mdfor">建議尺寸 800x800 像素</p>
                  <p data-oid="gq6-nj5">最多可上傳 1 張圖片</p>
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
            data-oid="gfjiew1"
          />
        </div>
      </CardContent>
    </Card>
  );
}
