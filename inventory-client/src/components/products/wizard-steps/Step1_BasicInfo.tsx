"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Package,
  FileText,
  FolderTree,
  HelpCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WizardFormData } from "../CreateProductWizard";
import { useCategories } from "@/hooks/queries/useEntityQueries";
import { Category } from "@/types/category";
import { ImageUploader } from "@/components/ui/ImageUploader";
import apiClient from "@/lib/apiClient";
import { toast } from "sonner";

/**
 * 步驟1組件Props
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
  isEditMode = false,
}: Step1Props) {
  // 獲取分類資料
  const {
    data: categoriesGrouped,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

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
      throw new Error("圖片上傳僅在編輯模式下可用");
    }

    try {
      // 對於 multipart/form-data，使用 FormData 對象
      const formData = new FormData();
      formData.append("image", file);

      // 使用類型安全的 API 客戶端進行圖片上傳
      const { data, error, response } = await apiClient.POST(
        "/api/products/{product_id}/upload-image",
        {
          params: {
            path: {
              product_id: Number(productId),
              product: Number(productId),
            },
          },
          body: formData as any, // 由於 openapi-fetch 的類型限制，這裡需要類型斷言
        },
      );

      // 檢查請求是否成功
      if (error || !response.ok) {
        // 優雅處理不同類型的錯誤
        if (response.status === 422) {
          // 422 驗證錯誤的處理
          const validationError = error as any;
          if (validationError?.errors?.image) {
            throw new Error(validationError.errors.image[0] || "圖片驗證失敗");
          } else if (validationError?.message) {
            throw new Error(validationError.message);
          }
        }

        const errorMessage =
          (error as any)?.message || `上傳失敗 (HTTP ${response.status})`;
        throw new Error(errorMessage);
      }

      // 上傳成功
    } catch (error: any) {
      throw error;
    }
  };

  /**
   * 圖片上傳成功回調
   *
   * @param imageUrls - 上傳成功後的圖片 URLs
   */
  const handleImageUploadSuccess = (imageUrls: any) => {
    toast.success("圖片上傳成功！");
    // 可以在這裡更新表單數據或觸發重新獲取商品詳情
  };

  return (
    <TooltipProvider data-oid="ilo9h60">
      <div className="space-y-3" data-oid="1:ftnob">
        {/* 表單區域 - 緊湊設計 */}
        <div className="space-y-3" data-oid="ihdk8vh">
          {/* 商品名稱 */}
          <div className="space-y-2" data-oid="pug_kvr">
            <div className="flex items-center gap-2" data-oid="4s4pms4">
              <Label
                htmlFor="productName"
                className="text-sm font-medium"
                data-oid="5h.mrx9"
              >
                商品名稱
              </Label>
              <span className="text-red-500 text-sm" data-oid="ycgjnmh">
                *
              </span>
              <Tooltip data-oid="jr1u6cw">
                <TooltipTrigger asChild data-oid="8.7zex:">
                  <HelpCircle
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help"
                    data-oid="hsfcq8o"
                  />
                </TooltipTrigger>
                <TooltipContent data-oid=":kq9o9b">
                  <p data-oid="0m:r98s">
                    為您的商品取一個吸引人的名稱，這將是顧客看到的第一印象
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="productName"
              type="text"
              placeholder="請輸入商品名稱，例如：iPhone 15 Pro"
              value={formData.basicInfo.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              onBlur={handleNameBlur}
              className={validationErrors.name ? "border-red-500" : ""}
              maxLength={100}
              data-oid="p:htxk8"
            />

            {validationErrors.name && (
              <Alert variant="destructive" data-oid="t_noag8">
                <AlertCircle className="h-4 w-4" data-oid="v-bxry:" />
                <AlertDescription data-oid="uk7.9q3">
                  {validationErrors.name}
                </AlertDescription>
              </Alert>
            )}
            <div
              className="flex justify-between text-xs text-gray-500"
              data-oid="96uuz1o"
            >
              <span data-oid="e:.tja6">建議長度：2-50個字符</span>
              <span data-oid="8yp7x_g">
                {formData.basicInfo.name.length}/100
              </span>
            </div>
          </div>

          {/* 商品描述 */}
          <div className="space-y-2" data-oid="eoupk5y">
            <div className="flex items-center gap-2" data-oid="4ewz.gb">
              <Label
                htmlFor="productDescription"
                className="text-sm font-medium"
                data-oid="soklovy"
              >
                商品描述
              </Label>
              <Tooltip data-oid="gq9m_r_">
                <TooltipTrigger asChild data-oid="_u6mmi5">
                  <HelpCircle
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help"
                    data-oid="_wn-k93"
                  />
                </TooltipTrigger>
                <TooltipContent data-oid=".1y4rl_">
                  <p data-oid="vgaq0nb">
                    詳細描述您的商品特色、功能和優勢，幫助顧客更好地了解商品
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="productDescription"
              placeholder="請詳細描述您的商品特色、功能、材質、尺寸等資訊..."
              value={formData.basicInfo.description}
              onChange={(e) => handleFieldChange("description", e.target.value)}
              onBlur={handleDescriptionBlur}
              className={`min-h-[100px] ${validationErrors.description ? "border-red-500" : ""}`}
              maxLength={1000}
              data-oid="97c4wkn"
            />

            {validationErrors.description && (
              <Alert variant="destructive" data-oid="7vcfmhj">
                <AlertCircle className="h-4 w-4" data-oid="2qfm5vn" />
                <AlertDescription data-oid="xe3580_">
                  {validationErrors.description}
                </AlertDescription>
              </Alert>
            )}
            <div
              className="flex justify-between text-xs text-gray-500"
              data-oid="c7x7qj8"
            >
              <span data-oid="tk3ev:4">選填，建議填寫以提升商品吸引力</span>
              <span data-oid="l69rt5e">
                {formData.basicInfo.description.length}/1000
              </span>
            </div>
          </div>

          {/* 商品分類 */}
          <div className="space-y-2" data-oid="sjqymej">
            <div className="flex items-center gap-2" data-oid="cv2quoh">
              <Label
                htmlFor="productCategory"
                className="text-sm font-medium"
                data-oid="7j.m6hx"
              >
                商品分類
              </Label>
              <Tooltip data-oid="9x-_l:f">
                <TooltipTrigger asChild data-oid=":rtm-20">
                  <HelpCircle
                    className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help"
                    data-oid="mucq24b"
                  />
                </TooltipTrigger>
                <TooltipContent data-oid="td:7yra">
                  <p data-oid="40cg06:">
                    選擇最符合您商品特性的分類，有助於顧客搜尋和瀏覽
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Select
              value={formData.basicInfo.category_id?.toString() || "none"}
              onValueChange={(value) =>
                handleFieldChange(
                  "category_id",
                  value === "none" ? null : Number(value),
                )
              }
              data-oid="kd5r3p."
            >
              <SelectTrigger data-oid="o3j2qk2">
                <SelectValue
                  placeholder="請選擇商品分類（選填）"
                  data-oid="vrp.yre"
                />
              </SelectTrigger>
              <SelectContent data-oid="1gt63l_">
                <SelectItem value="none" data-oid="f:t.w6u">
                  未分類
                </SelectItem>
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled data-oid="emki.u-">
                    載入分類中...
                  </SelectItem>
                ) : (
                  categoriesList.map((category) =>
                    category.id ? (
                      <SelectItem
                        key={category.id}
                        value={category.id.toString()}
                        data-oid="5g5.v3-"
                      >
                        {category.name}
                      </SelectItem>
                    ) : null,
                  )
                )}
              </SelectContent>
            </Select>
            <div className="text-xs text-gray-500" data-oid="q_beutj">
              選填，稍後您也可以在商品管理中修改分類
            </div>
          </div>

          {/* 商品圖片上傳 */}
          <div className="space-y-2" data-oid="symna6t">
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
              data-oid="mg9khqu"
            />

            {!isEditMode && (
              <Alert data-oid="hkq_s6i">
                <AlertCircle className="h-4 w-4" data-oid="n7wmyop" />
                <AlertDescription data-oid="2zv-cwb">
                  <strong data-oid="lt8u.m4">提示：</strong>
                  圖片上傳功能將在商品創建完成後開啟。您可以在創建商品後返回編輯頁面上傳圖片。
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* 進度提示 */}
        <Alert className="mt-4" data-oid="508lx01">
          <AlertCircle className="h-4 w-4" data-oid="249w6yl" />
          <AlertDescription data-oid="lio15q-">
            <strong data-oid="z0i7p_e">進度提示：</strong>
            商品名稱為必填欄位，填寫完成後即可進入下一步進行規格定義。
          </AlertDescription>
        </Alert>
      </div>
    </TooltipProvider>
  );
}
