"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

import {
  CheckCircle,
  Package,
  FileText,
  Settings,
  DollarSign,
  Shapes,
  CircleDollarSign,
  Layers,
} from "lucide-react";

import { WizardFormData } from "../CreateProductWizard";
import { useAttributes } from "@/hooks";
import { useCategories } from "@/hooks";
import { Attribute } from "@/types/products";
import { Category } from "@/types/category";

/**
 * 步驟4組件Props
 */
interface Step4Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>,
  ) => void;
}

/**
 * 步驟4：預覽確認組件
 *
 * 功能包含：
 * - 完整資訊預覽
 * - 最終確認檢查清單
 * - 提交前驗證
 * - 資料摘要統計
 */
export function Step4_Review({ formData, updateFormData }: Step4Props) {
  // 獲取必要資料
  const { data: attributesData } = useAttributes();
  const { data: categoriesData } = useCategories();

  const attributes: Attribute[] = Array.isArray(attributesData)
    ? attributesData
    : [];
  const categories: Category[] = Array.isArray(categoriesData)
    ? categoriesData
    : [];

  /**
   * 原子化創建流程不需要額外的確認步驟
   * 用戶點擊"創建商品"即表示確認
   */

  /**
   * 獲取分類名稱
   */
  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return "未分類";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.name || `分類 ${categoryId}`;
  };

  /**
   * 獲取屬性名稱
   */
  const getAttributeName = (attributeId: number): string => {
    const attribute = attributes.find((attr) => attr.id === attributeId);
    return attribute?.name || `屬性 ${attributeId}`;
  };

  /**
   * 計算統計資料
   */
  const statistics = {
    totalVariants: formData.variants.items.length,
    totalValue: formData.variants.items.reduce((sum, variant) => {
      const price = parseFloat(variant.price || "0");
      return sum + (isNaN(price) ? 0 : price);
    }, 0),
    averagePrice:
      formData.variants.items.length > 0
        ? formData.variants.items.reduce((sum, variant) => {
            const price = parseFloat(variant.price || "0");
            return sum + (isNaN(price) ? 0 : price);
          }, 0) / formData.variants.items.length
        : 0,
    selectedAttributes: formData.specifications.selectedAttributes.length,
    totalAttributeValues: Object.values(
      formData.specifications.attributeValues,
    ).reduce((sum, values) => sum + values.length, 0),
  };

  return (
    <div className="space-y-6">
      {/* 步驟說明 */}
      <div className="space-y-2">
        <h2
          className="text-2xl font-semibold flex items-center space-x-2"
         
        >
          <CheckCircle className="h-6 w-6 text-primary" />
          <span>預覽確認</span>
        </h2>
        <p className="text-muted-foreground">
          請仔細檢查所有配置資訊，確認無誤後即可提交創建商品。
        </p>
      </div>

      {/* 基本資訊預覽 */}
      <Card
        className="bg-card text-card-foreground border border-border/40 shadow-sm"
       
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>基本資訊</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
           
          >
            <div>
              <Label
                className="text-sm font-medium text-muted-foreground"
               
              >
                商品名稱
              </Label>
              <p className="text-base font-medium">
                {formData.basicInfo.name || "未設定"}
              </p>
            </div>

            <div>
              <Label
                className="text-sm font-medium text-muted-foreground"
               
              >
                商品分類
              </Label>
              <p className="text-base">
                {getCategoryName(formData.basicInfo.category_id)}
              </p>
            </div>
          </div>

          {formData.basicInfo.description && (
            <div>
              <Label
                className="text-sm font-medium text-muted-foreground"
               
              >
                商品描述
              </Label>
              <p
                className="text-base text-muted-foreground mt-1"
               
              >
                {formData.basicInfo.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 規格配置預覽 */}
      <Card
        className="bg-card text-card-foreground border border-border/40 shadow-sm"
       
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>規格配置</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Label
              className="text-sm font-medium text-muted-foreground"
             
            >
              規格類型
            </Label>
            <Badge
              variant={
                formData.specifications.isVariable ? "default" : "secondary"
              }
             
            >
              {formData.specifications.isVariable ? "多規格商品" : "單規格商品"}
            </Badge>
          </div>

          {formData.specifications.isVariable && (
            <>
              <Separator />

              {/* 選中的屬性 */}
              <div>
                <Label
                  className="text-sm font-medium text-muted-foreground"
                 
                >
                  已選擇的屬性 (
                  {formData.specifications.selectedAttributes.length})
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specifications.selectedAttributes.map(
                    (attributeId) => (
                      <Badge
                        key={attributeId}
                        variant="outline"
                       
                      >
                        {getAttributeName(attributeId)}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {/* 屬性值配置 */}
              <div>
                <Label
                  className="text-sm font-medium text-muted-foreground"
                 
                >
                  屬性值配置
                </Label>
                <div className="space-y-3 mt-2">
                  {formData.specifications.selectedAttributes.map(
                    (attributeId) => {
                      const values =
                        formData.specifications.attributeValues[attributeId] ||
                        [];
                      return (
                        <div
                          key={attributeId}
                          className="flex items-start space-x-3"
                         
                        >
                          <div className="min-w-[100px]">
                            <Badge variant="secondary">
                              {getAttributeName(attributeId)}
                            </Badge>
                          </div>
                          <div
                            className="flex flex-wrap gap-1"
                           
                          >
                            {values.map((value) => (
                              <Badge
                                key={value}
                                variant="outline"
                                className="text-xs"
                               
                              >
                                {value}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 變體配置預覽 */}
      <Card
        className="bg-card text-card-foreground border border-border/40 shadow-sm"
       
      >
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>變體配置</span>
            <Badge variant="outline">
              {formData.variants.items.length} 個變體
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {formData.variants.items.length === 0 ? (
            <p className="text-muted-foreground">
              尚未配置任何變體
            </p>
          ) : (
            <div className="space-y-3">
              {formData.variants.items.map((variant, index) => (
                <div
                  key={variant.key}
                  className="p-4 rounded-lg border bg-muted/30"
                 
                >
                  <div
                    className="flex items-center justify-between"
                   
                  >
                    <div className="space-y-2">
                      {formData.specifications.isVariable &&
                        variant.options.length > 0 && (
                          <div
                            className="flex flex-wrap gap-2"
                           
                          >
                            {variant.options.map(({ attributeId, value }) => (
                              <Badge
                                key={`${attributeId}-${value}`}
                                variant="secondary"
                               
                              >
                                {getAttributeName(attributeId)}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}

                      <div
                        className="flex items-center space-x-4 text-sm"
                       
                      >
                        <div>
                          <span
                            className="text-muted-foreground"
                           
                          >
                            SKU:{" "}
                          </span>
                          <span className="font-mono">
                            {variant.sku || "未設定"}
                          </span>
                        </div>
                        <div>
                          <span
                            className="text-muted-foreground"
                           
                          >
                            價格:{" "}
                          </span>
                          <span className="font-semibold">
                            NT$ {variant.price || "0"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 統計摘要 */}
      <div
        className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs"
       
      >
        {/* 變體數量卡片 */}
        <Card data-slot="card" className="@container/card">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
           
          >
            <CardTitle className="text-sm font-medium">
              總變體數量
            </CardTitle>
            <Shapes
              className="h-4 w-4 text-muted-foreground"
             
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold tracking-tighter"
             
            >
              {statistics.totalVariants}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
             
            >
              個變體組合
            </p>
          </CardContent>
        </Card>

        {/* 總價值卡片 */}
        <Card data-slot="card" className="@container/card">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
           
          >
            <CardTitle className="text-sm font-medium">
              商品總價值
            </CardTitle>
            <DollarSign
              className="h-4 w-4 text-muted-foreground"
             
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold tracking-tighter"
             
            >
              $
              {statistics.totalValue.toLocaleString("zh-TW", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
             
            >
              所有變體合計
            </p>
          </CardContent>
        </Card>

        {/* 平均價格卡片 */}
        <Card data-slot="card" className="@container/card">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
           
          >
            <CardTitle className="text-sm font-medium">
              平均價格
            </CardTitle>
            <CircleDollarSign
              className="h-4 w-4 text-muted-foreground"
             
            />
          </CardHeader>
          <CardContent>
            <div
              className="text-3xl font-bold tracking-tighter"
             
            >
              $
              {statistics.averagePrice.toLocaleString("zh-TW", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
             
            >
              每個變體平均
            </p>
          </CardContent>
        </Card>

        {/* 屬性數量卡片 */}
        <Card data-slot="card" className="@container/card">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
           
          >
            <CardTitle className="text-sm font-medium">
              使用屬性
            </CardTitle>
            <Layers
              className="h-4 w-4 text-muted-foreground"
             
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <span
                className="text-3xl font-bold tracking-tighter"
               
              >
                {statistics.selectedAttributes}
              </span>
              <Badge variant="secondary" className="text-xs">
                已選擇
              </Badge>
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
             
            >
              共 {statistics.totalAttributeValues} 個屬性值
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
