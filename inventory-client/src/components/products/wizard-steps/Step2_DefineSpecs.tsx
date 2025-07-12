"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertCircle,
  Settings,
  Plus,
  X,
  Package,
  Tag,
  HelpCircle,
  Loader2,
  Check,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WizardFormData } from "../CreateProductWizard";
import { 
  useAttributes, 
  useCreateAttributeValue
} from "@/hooks";
import { Attribute } from "@/types/products";
import { toast } from "sonner";
import { useErrorHandler } from "@/hooks";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

/**
 * 步驟2組件Props
 */
interface Step2Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>,
  ) => void;
}

/**
 * 步驟2：規格定義組件
 *
 * 功能包含：
 * - 單規格/多規格切換
 * - 屬性選擇與管理
 * - 動態屬性值添加
 * - 規格組合預覽
 */
export function Step2_DefineSpecs({ formData, updateFormData }: Step2Props) {
  // 統一錯誤處理
  const { handleError } = useErrorHandler();
  
  // 獲取用戶 session 和屬性資料
  const { data: session, status } = useSession();
  const {
    data: attributesData,
    isLoading: attributesLoading,
    error: attributesError,
    refetch: refetchAttributes, // 🎯 Task 2: 獲取 refetch 函數用於數據同步
  } = useAttributes();

  // 🎯 Task 2: 初始化屬性值創建的 Mutation Hook
  const createAttributeValueMutation = useCreateAttributeValue();

  // 修正：處理 API 回應結構 {data: [...]}
  const attributes: Attribute[] = React.useMemo(() => {
    if (!attributesData) return [];

    // 檢查是否是 ResourceCollection 格式 {data: [...]}
    if (
      typeof attributesData === "object" &&
      "data" in attributesData &&
      Array.isArray(attributesData.data)
    ) {
      return attributesData.data as Attribute[];
    }

    // 如果直接是陣列格式
    if (Array.isArray(attributesData)) {
      return attributesData as Attribute[];
    }

    return [];
  }, [attributesData]);

  // 本地狀態：屬性值輸入框
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

  /**
   * 處理規格類型切換
   */
  const handleSpecTypeChange = (isVariable: boolean) => {
    updateFormData("specifications", {
      isVariable,
      selectedAttributes: isVariable
        ? formData.specifications.selectedAttributes
        : [],
      attributeValues: isVariable
        ? formData.specifications.attributeValues
        : {},
    });

    // 如果切換到單規格，清空變體資料
    if (!isVariable) {
      updateFormData("variants", {
        items: [],
      });
    }
  };

  /**
   * 處理屬性選擇切換
   */
  const handleAttributeToggle = (attributeId: number, checked: boolean) => {
    const currentSelected = formData.specifications.selectedAttributes;
    const newSelected = checked
      ? [...currentSelected, attributeId]
      : currentSelected.filter((id) => id !== attributeId);

    const newAttributeValues = { ...formData.specifications.attributeValues };

    if (checked) {
      // 如果選擇屬性，自動添加預設值
      const attribute = attributes.find((attr) => attr.id === attributeId);
      if (attribute?.values && attribute.values.length > 0) {
        const defaultValues = attribute.values.map((v) => v.value);
        newAttributeValues[attributeId] = defaultValues;
        toast.success(
          `已自動添加 ${attribute.name} 的 ${defaultValues.length} 個預設值`,
        );
      } else {
        newAttributeValues[attributeId] = [];
      }
    } else {
      // 如果取消選擇，移除該屬性的所有值
      delete newAttributeValues[attributeId];
      // 清空輸入框
      const newInputValues = { ...inputValues };
      delete newInputValues[attributeId];
      setInputValues(newInputValues);
    }

    updateFormData("specifications", {
      selectedAttributes: newSelected,
      attributeValues: newAttributeValues,
    });
  };

  /**
   * 處理屬性值輸入變更
   */
  const handleValueInputChange = (attributeId: number, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [attributeId]: value,
    }));
  };

  /**
   * 🎯 升級版屬性值添加函數（真正的資料庫同步）
   * 
   * 此函數將：
   * 1. 驗證輸入內容
   * 2. 調用 API 將屬性值保存到資料庫
   * 3. 成功後更新本地狀態
   * 4. 重新獲取屬性列表確保數據一致性
   * 5. 提供用戶反饋和載入狀態
   */
  const handleAddAttributeValue = async (attributeId: number) => {
    const inputValue = inputValues[attributeId]?.trim();

    // 🎯 步驟 1: 輸入驗證
    if (!inputValue) {
      handleError("請輸入屬性值");
      return;
    }

    const currentValues =
      formData.specifications.attributeValues[attributeId] || [];

    // 檢查是否重複（本地檢查，避免不必要的 API 調用）
    if (currentValues.includes(inputValue)) {
      handleError("該屬性值已存在");
      return;
    }

    try {
      // 🎯 步驟 2: 調用 API 將屬性值保存到資料庫
      await createAttributeValueMutation.mutateAsync({
        attributeId: attributeId,
        body: {
          value: inputValue,
        },
      });

      // 🎯 步驟 3: 成功後更新本地狀態
    const newAttributeValues = {
      ...formData.specifications.attributeValues,
      [attributeId]: [...currentValues, inputValue],
    };

    updateFormData("specifications", {
      attributeValues: newAttributeValues,
    });

    // 清空輸入框
    setInputValues((prev) => ({
      ...prev,
      [attributeId]: "",
    }));

      // 🎯 步驟 4: 重新獲取屬性列表，確保資料一致性
      await refetchAttributes();

      // 🎯 步驟 5: 成功反饋
      toast.success(`屬性值「${inputValue}」已成功保存到資料庫`);
    } catch (error) {
      // 🛡️ 完整的錯誤處理
      console.error("創建屬性值失敗:", error);
      handleError(error);
    }
  };

  /**
   * 移除屬性值
   */
  const handleRemoveAttributeValue = (
    attributeId: number,
    valueToRemove: string,
  ) => {
    const currentValues =
      formData.specifications.attributeValues[attributeId] || [];
    const newValues = currentValues.filter((value) => value !== valueToRemove);

    const newAttributeValues = {
      ...formData.specifications.attributeValues,
      [attributeId]: newValues,
    };

    updateFormData("specifications", {
      attributeValues: newAttributeValues,
    });

    toast.success(`已移除屬性值：${valueToRemove}`);
  };

  /**
   * 計算可能的變體組合數量
   */
  const potentialVariantsCount = useMemo(() => {
    const selectedAttributeIds = formData.specifications.selectedAttributes;
    if (selectedAttributeIds.length === 0) return 0;

    let count = 1;
    for (const attributeId of selectedAttributeIds) {
      const values = formData.specifications.attributeValues[attributeId] || [];
      if (values.length === 0) return 0;
      count *= values.length;
    }

    return count;
  }, [
    formData.specifications.selectedAttributes,
    formData.specifications.attributeValues,
  ]);

  /**
   * 檢查是否可以進入下一步
   */
  const canProceed = useMemo(() => {
    if (!formData.specifications.isVariable) {
      return true; // 單規格可以直接進入下一步
    }

    // 多規格需要至少選擇一個屬性且有屬性值
    return (
      formData.specifications.selectedAttributes.length > 0 &&
      potentialVariantsCount > 0
    );
  }, [
    formData.specifications.isVariable,
    formData.specifications.selectedAttributes.length,
    potentialVariantsCount,
  ]);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* 規格類型選擇 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="specType"
              className="text-sm font-medium"
             
            >
              規格類型
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle
                  className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help"
                 
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  根據您的商品特性，選擇單規格或多規格管理方式
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="specType"
              checked={formData.specifications.isVariable}
              onCheckedChange={handleSpecTypeChange}
             
            />

            <Label htmlFor="specType" className="text-sm">
              {formData.specifications.isVariable ? "多規格商品" : "單規格商品"}
            </Label>
          </div>
          <div className="text-xs text-muted-foreground">
            {formData.specifications.isVariable
              ? "適合有多種選項的商品（顏色、尺寸等）"
              : "適合統一規格的商品（書籍、食品等）"}
          </div>
        </div>

        {/* 多規格配置 */}
        {formData.specifications.isVariable && (
          <>
            {/* 屬性選擇 */}
            <Card
              className="bg-card text-card-foreground border border-border/40 shadow-sm"
             
            >
              <CardHeader>
                <CardTitle
                  className="flex items-center space-x-2"
                 
                >
                  <Tag className="h-5 w-5" />
                  <span>選擇規格屬性</span>
                </CardTitle>
                <CardDescription>
                  選擇用於構成商品變體的屬性，如顏色、尺寸、款式等。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {attributesLoading ? (
                  <div className="text-center py-8">
                    <div className="text-muted-foreground">
                      載入屬性資料中...
                    </div>
                  </div>
                ) : attributes.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      尚未建立任何屬性。請先到「規格管理」頁面建立屬性，如顏色、尺寸等。
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
                   
                  >
                    {attributes.map((attribute) => (
                      <div
                        key={attribute.id}
                        className={cn(
                          "group relative p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer",
                          "hover:shadow-md hover:border-primary/20 hover:bg-primary/5",
                          "flex flex-col h-24", // 🎯 減少高度：從 h-32 (128px) 改為 h-24 (96px)
                          formData.specifications.selectedAttributes.includes(attribute.id)
                            ? "border-primary bg-primary/10 shadow-sm"
                            : "border-border/60 bg-card"
                        )}
                        onClick={() => {
                          const isSelected = formData.specifications.selectedAttributes.includes(attribute.id);
                          handleAttributeToggle(attribute.id, !isSelected);
                        }}
                       
                      >
                        {/* 🎯 頂部區域：選擇框和名稱 */}
                        <div className="flex items-start space-x-2">
                          <div className="flex-shrink-0 mt-0.5">
                        <Checkbox
                          id={`attr-${attribute.id}`}
                          checked={formData.specifications.selectedAttributes.includes(
                            attribute.id,
                          )}
                              onCheckedChange={(checked) => {
                            handleAttributeToggle(
                              attribute.id,
                              checked as boolean,
                                );
                              }}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                         
                        />
                          </div>

                          <div className="flex-1 min-w-0">
                        <Label
                          htmlFor={`attr-${attribute.id}`}
                              className="font-medium text-sm cursor-pointer group-hover:text-primary transition-colors"
                         
                        >
                            {attribute.name}
                            </Label>
                            <div className="text-xs text-muted-foreground">
                              {attribute.values?.length || 0} 個預設值
                            </div>
                          </div>
                        </div>

                        {/* 🎯 中間區域：屬性值預覽（緊湊高度） */}
                        <div className="flex-1 mt-2 overflow-hidden">
                          {attribute.values && attribute.values.length > 0 ? (
                            <div className="flex items-center h-full">
                              {/* 🎯 單行顯示所有徽章 */}
                              <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                                {attribute.values.slice(0, 4).map((value) => (
                                    <Badge
                                      key={value.id}
                                      variant="outline"
                                    className="text-[9px] px-1 py-0.5 h-4 text-muted-foreground border-muted-foreground/30 flex-shrink-0"
                                     
                                    >
                                      {value.value}
                                    </Badge>
                                  ))}
                                {attribute.values.length > 4 && (
                                    <Badge
                                    variant="secondary"
                                    className="text-[9px] px-1 py-0.5 h-4 bg-muted text-muted-foreground flex-shrink-0"
                                     
                                    >
                                    +{attribute.values.length - 4}
                                    </Badge>
                                  )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <span className="text-xs text-muted-foreground italic">
                                尚無預設值
                              </span>
                                </div>
                              )}
                        </div>

                        {/* 🎯 右上角：選中指示器 */}
                        {formData.specifications.selectedAttributes.includes(attribute.id) && (
                          <div className="absolute top-2 right-2">
                            <div className="w-2.5 h-2.5 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-1.5 h-1.5 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 屬性值管理 */}
            {formData.specifications.selectedAttributes.length > 0 && (
              <Card
                className="bg-card text-card-foreground border border-border/40 shadow-sm"
               
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center space-x-2"
                   
                  >
                    <Plus className="h-5 w-5" />
                    <span>管理屬性值</span>
                  </CardTitle>
                  <CardDescription>
                    為選中的屬性添加或管理屬性值，這些值將即時保存到資料庫並用於生成商品變體。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {formData.specifications.selectedAttributes.map(
                    (attributeId) => {
                      const attribute = attributes.find(
                        (attr) => attr.id === attributeId,
                      );
                      if (!attribute) return null;

                      const currentValues =
                        formData.specifications.attributeValues[attributeId] ||
                        [];

                      return (
                        <div
                          key={attributeId}
                          className="space-y-3"
                         
                        >
                          <div
                            className="flex items-center justify-between"
                           
                          >
                            <Label
                              className="text-base font-medium"
                             
                            >
                              {attribute.name}
                            </Label>
                            <Badge variant="outline">
                              {currentValues.length} 個值
                            </Badge>
                          </div>

                          {/* 🎯 升級版添加屬性值區域（含載入狀態） */}
                          <div className="flex space-x-2">
                            <Input
                              placeholder={`輸入${attribute.name}的值，如：紅色、藍色`}
                              value={inputValues[attributeId] || ""}
                              onChange={(e) =>
                                handleValueInputChange(
                                  attributeId,
                                  e.target.value,
                                )
                              }
                              onKeyPress={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddAttributeValue(attributeId);
                                }
                              }}
                              disabled={createAttributeValueMutation.isPending} // 🎯 載入時禁用輸入框
                             
                            />

                            <Button
                              type="button"
                              onClick={() =>
                                handleAddAttributeValue(attributeId)
                              }
                              disabled={
                                createAttributeValueMutation.isPending || 
                                !inputValues[attributeId]?.trim()
                              } // 🎯 智能按鈕狀態：載入中或輸入為空時禁用
                              className="shrink-0"
                             
                            >
                              {createAttributeValueMutation.isPending ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                  保存中
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  添加
                                </>
                              )}
                            </Button>
                          </div>

                          {/* 現有屬性值 */}
                          {currentValues.length > 0 && (
                            <div
                              className="flex flex-wrap gap-2"
                             
                            >
                              {currentValues.map((value) => (
                                <Badge
                                  key={value}
                                  variant="secondary"
                                  className="flex items-center space-x-1 pr-1"
                                 
                                >
                                  <span>{value}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() =>
                                      handleRemoveAttributeValue(
                                        attributeId,
                                        value,
                                      )
                                    }
                                   
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}

                          <Separator />
                        </div>
                      );
                    },
                  )}
                </CardContent>
              </Card>
            )}

            {/* 變體預覽 */}
            {potentialVariantsCount > 0 && (
              <Card
                className="bg-card text-card-foreground border border-border/40 shadow-sm"
               
              >
                <CardHeader>
                  <CardTitle
                    className="flex items-center space-x-2"
                   
                  >
                    <Package className="h-5 w-5" />
                    <span>變體預覽</span>
                  </CardTitle>
                  <CardDescription>
                    根據您選擇的屬性和屬性值，將生成以下變體組合。
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="p-4 rounded-lg border bg-muted/50"
                   
                  >
                    <div className="text-center">
                      <div
                        className="text-2xl font-bold text-primary"
                       
                      >
                        {potentialVariantsCount}
                      </div>
                      <div
                        className="text-sm text-muted-foreground"
                       
                      >
                        個變體將在下一步中配置
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* 進度提示 */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>進度提示：</strong>
            {formData.specifications.isVariable
              ? canProceed
                ? `已配置 ${formData.specifications.selectedAttributes.length} 個屬性，
              將生成 ${potentialVariantsCount} 個變體。可以進入下一步配置變體詳情。`
                : "請至少選擇一個屬性並為其添加屬性值，才能進入下一步。"
              : "單規格商品配置完成，可以直接進入下一步設定價格和庫存。"}
          </AlertDescription>
        </Alert>
      </div>
    </TooltipProvider>
  );
}
