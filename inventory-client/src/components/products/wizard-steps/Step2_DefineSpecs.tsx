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
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WizardFormData } from "../CreateProductWizard";
import { useAttributes } from "@/hooks/queries/useEntityQueries";
import { Attribute } from "@/types/products";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

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
  // 獲取用戶 session 和屬性資料
  const { data: session, status } = useSession();
  const {
    data: attributesData,
    isLoading: attributesLoading,
    error: attributesError,
  } = useAttributes();

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
   * 添加屬性值
   */
  const handleAddAttributeValue = (attributeId: number) => {
    const inputValue = inputValues[attributeId]?.trim();

    if (!inputValue) {
      toast.error("請輸入屬性值");
      return;
    }

    const currentValues =
      formData.specifications.attributeValues[attributeId] || [];

    // 檢查是否重複
    if (currentValues.includes(inputValue)) {
      toast.error("該屬性值已存在");
      return;
    }

    // 添加新值
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

    toast.success(`已添加屬性值：${inputValue}`);
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
    <TooltipProvider data-oid=".b_2wgb">
      <div className="space-y-3" data-oid="4-5du8c">
        {/* 規格類型選擇 */}
        <div className="space-y-2" data-oid="76p3i_c">
          <div className="flex items-center gap-2" data-oid="cj11:pm">
            <Label
              htmlFor="specType"
              className="text-sm font-medium"
              data-oid="d7s5jhg"
            >
              規格類型
            </Label>
            <Tooltip data-oid="j_.2el0">
              <TooltipTrigger asChild data-oid="t0g8p1o">
                <HelpCircle
                  className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help"
                  data-oid="9vfuoe7"
                />
              </TooltipTrigger>
              <TooltipContent data-oid="rfxtzdk">
                <p data-oid="_tcyppx">
                  根據您的商品特性，選擇單規格或多規格管理方式
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center space-x-2" data-oid="ncuu_lq">
            <Switch
              id="specType"
              checked={formData.specifications.isVariable}
              onCheckedChange={handleSpecTypeChange}
              data-oid="sdvrv6w"
            />

            <Label htmlFor="specType" className="text-sm" data-oid="21lflsg">
              {formData.specifications.isVariable ? "多規格商品" : "單規格商品"}
            </Label>
          </div>
          <div className="text-xs text-muted-foreground" data-oid="_yi5ts_">
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
              data-oid=".ffhjoc"
            >
              <CardHeader data-oid="jcnp4:q">
                <CardTitle
                  className="flex items-center space-x-2"
                  data-oid="yue5qcv"
                >
                  <Tag className="h-5 w-5" data-oid="q:bfpj1" />
                  <span data-oid="_pyqcx5">選擇規格屬性</span>
                </CardTitle>
                <CardDescription data-oid="b9rlsgt">
                  選擇用於構成商品變體的屬性，如顏色、尺寸、款式等。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4" data-oid="fuvmvs_">
                {attributesLoading ? (
                  <div className="text-center py-8" data-oid="n5j:yqn">
                    <div className="text-muted-foreground" data-oid="-cxw2pb">
                      載入屬性資料中...
                    </div>
                  </div>
                ) : attributes.length === 0 ? (
                  <Alert data-oid="eo4wr63">
                    <AlertCircle className="h-4 w-4" data-oid="q:3-5-z" />
                    <AlertDescription data-oid="s7:g5h9">
                      尚未建立任何屬性。請先到「規格管理」頁面建立屬性，如顏色、尺寸等。
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    data-oid="1ne_juu"
                  >
                    {attributes.map((attribute) => (
                      <div
                        key={attribute.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        data-oid="pvsx:06"
                      >
                        <Checkbox
                          id={`attr-${attribute.id}`}
                          checked={formData.specifications.selectedAttributes.includes(
                            attribute.id,
                          )}
                          onCheckedChange={(checked) =>
                            handleAttributeToggle(
                              attribute.id,
                              checked as boolean,
                            )
                          }
                          data-oid="ane3edy"
                        />

                        <Label
                          htmlFor={`attr-${attribute.id}`}
                          className="flex-1 cursor-pointer"
                          data-oid="z8yu4gf"
                        >
                          <div className="font-medium" data-oid="5e881fm">
                            {attribute.name}
                          </div>
                          <div
                            className="text-sm text-muted-foreground"
                            data-oid="8z2:8f_"
                          >
                            {attribute.values?.length || 0} 個預設值
                            {attribute.values &&
                              attribute.values.length > 0 && (
                                <div
                                  className="mt-1 flex flex-wrap gap-1"
                                  data-oid="squeju2"
                                >
                                  {attribute.values.slice(0, 3).map((value) => (
                                    <Badge
                                      key={value.id}
                                      variant="outline"
                                      className="text-xs"
                                      data-oid="p7zikgu"
                                    >
                                      {value.value}
                                    </Badge>
                                  ))}
                                  {attribute.values.length > 3 && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs"
                                      data-oid="j6o47hk"
                                    >
                                      +{attribute.values.length - 3} 更多
                                    </Badge>
                                  )}
                                </div>
                              )}
                          </div>
                        </Label>
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
                data-oid="hm7znyw"
              >
                <CardHeader data-oid="r:3qqiy">
                  <CardTitle
                    className="flex items-center space-x-2"
                    data-oid="4hw_fnx"
                  >
                    <Plus className="h-5 w-5" data-oid="1.afiv-" />
                    <span data-oid="mom2jpq">管理屬性值</span>
                  </CardTitle>
                  <CardDescription data-oid="7z:2fit">
                    為選中的屬性添加或管理屬性值，這些值將用於生成商品變體。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6" data-oid="yx84q8h">
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
                          data-oid="u5en8bh"
                        >
                          <div
                            className="flex items-center justify-between"
                            data-oid="xddu5-a"
                          >
                            <Label
                              className="text-base font-medium"
                              data-oid="d2bc2au"
                            >
                              {attribute.name}
                            </Label>
                            <Badge variant="outline" data-oid="5xzwnrx">
                              {currentValues.length} 個值
                            </Badge>
                          </div>

                          {/* 添加屬性值 */}
                          <div className="flex space-x-2" data-oid="c_87s43">
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
                              data-oid="52f0yyu"
                            />

                            <Button
                              type="button"
                              onClick={() =>
                                handleAddAttributeValue(attributeId)
                              }
                              className="shrink-0"
                              data-oid="og9e6.z"
                            >
                              <Plus
                                className="h-4 w-4 mr-1"
                                data-oid="iwh37-e"
                              />
                              添加
                            </Button>
                          </div>

                          {/* 現有屬性值 */}
                          {currentValues.length > 0 && (
                            <div
                              className="flex flex-wrap gap-2"
                              data-oid="vq85uzp"
                            >
                              {currentValues.map((value) => (
                                <Badge
                                  key={value}
                                  variant="secondary"
                                  className="flex items-center space-x-1 pr-1"
                                  data-oid="x4lcgic"
                                >
                                  <span data-oid="x9qiflk">{value}</span>
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
                                    data-oid="i_1jcwk"
                                  >
                                    <X className="h-3 w-3" data-oid="6is1klj" />
                                  </Button>
                                </Badge>
                              ))}
                            </div>
                          )}

                          <Separator data-oid="ht-e1zt" />
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
                data-oid=":2m0b93"
              >
                <CardHeader data-oid="vsoob0k">
                  <CardTitle
                    className="flex items-center space-x-2"
                    data-oid="oqdwfk9"
                  >
                    <Package className="h-5 w-5" data-oid="6bjl9q8" />
                    <span data-oid="otfj4t7">變體預覽</span>
                  </CardTitle>
                  <CardDescription data-oid="lt015l4">
                    根據您選擇的屬性和屬性值，將生成以下變體組合。
                  </CardDescription>
                </CardHeader>
                <CardContent data-oid="f3jonqk">
                  <div
                    className="p-4 rounded-lg border bg-muted/50"
                    data-oid="b52pzbd"
                  >
                    <div className="text-center" data-oid="qrg01.l">
                      <div
                        className="text-2xl font-bold text-primary"
                        data-oid="foo4.fy"
                      >
                        {potentialVariantsCount}
                      </div>
                      <div
                        className="text-sm text-muted-foreground"
                        data-oid="4ibnu3n"
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
        <Alert data-oid="7383jfh">
          <AlertCircle className="h-4 w-4" data-oid="l05:mi1" />
          <AlertDescription data-oid="0gsvat6">
            <strong data-oid="avzbrf8">進度提示：</strong>
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
