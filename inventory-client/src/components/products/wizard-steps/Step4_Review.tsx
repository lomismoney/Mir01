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
    <div className="space-y-6" data-oid="bsd0284">
      {/* 步驟說明 */}
      <div className="space-y-2" data-oid="51govjf">
        <h2
          className="text-2xl font-semibold flex items-center space-x-2"
          data-oid="vh0bpwp"
        >
          <CheckCircle className="h-6 w-6 text-primary" data-oid="xy.j1qe" />
          <span data-oid="fw-4pc0">預覽確認</span>
        </h2>
        <p className="text-muted-foreground" data-oid=".qrcdbs">
          請仔細檢查所有配置資訊，確認無誤後即可提交創建商品。
        </p>
      </div>

      {/* 基本資訊預覽 */}
      <Card
        className="bg-card text-card-foreground border border-border/40 shadow-sm"
        data-oid="-owdc50"
      >
        <CardHeader data-oid=".efp-ku">
          <CardTitle className="flex items-center space-x-2" data-oid="z:thiei">
            <FileText className="h-5 w-5" data-oid="_f3__1q" />
            <span data-oid="vjj4fp9">基本資訊</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="jrq4_bf">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-oid="geifi-a"
          >
            <div data-oid="ljnu3s1">
              <Label
                className="text-sm font-medium text-muted-foreground"
                data-oid="aeui-cf"
              >
                商品名稱
              </Label>
              <p className="text-base font-medium" data-oid="-h.sm6d">
                {formData.basicInfo.name || "未設定"}
              </p>
            </div>

            <div data-oid="mdanfot">
              <Label
                className="text-sm font-medium text-muted-foreground"
                data-oid="mnw6t6e"
              >
                商品分類
              </Label>
              <p className="text-base" data-oid="fjgls1t">
                {getCategoryName(formData.basicInfo.category_id)}
              </p>
            </div>
          </div>

          {formData.basicInfo.description && (
            <div data-oid="7q4syqd">
              <Label
                className="text-sm font-medium text-muted-foreground"
                data-oid="-yz:gpq"
              >
                商品描述
              </Label>
              <p
                className="text-base text-muted-foreground mt-1"
                data-oid="2-jaqtl"
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
        data-oid="2zq2_eu"
      >
        <CardHeader data-oid="0xnedlu">
          <CardTitle className="flex items-center space-x-2" data-oid="hya78t1">
            <Settings className="h-5 w-5" data-oid="jb8b1ka" />
            <span data-oid="bm-3kvc">規格配置</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="_sse4d9">
          <div className="flex items-center space-x-3" data-oid="_5jfzin">
            <Label
              className="text-sm font-medium text-muted-foreground"
              data-oid="fkayg7_"
            >
              規格類型
            </Label>
            <Badge
              variant={
                formData.specifications.isVariable ? "default" : "secondary"
              }
              data-oid="19lcs:i"
            >
              {formData.specifications.isVariable ? "多規格商品" : "單規格商品"}
            </Badge>
          </div>

          {formData.specifications.isVariable && (
            <>
              <Separator data-oid="eo567zk" />

              {/* 選中的屬性 */}
              <div data-oid=":nzsd.9">
                <Label
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="y.l-hkr"
                >
                  已選擇的屬性 (
                  {formData.specifications.selectedAttributes.length})
                </Label>
                <div className="flex flex-wrap gap-2 mt-2" data-oid="ut9mw32">
                  {formData.specifications.selectedAttributes.map(
                    (attributeId) => (
                      <Badge
                        key={attributeId}
                        variant="outline"
                        data-oid="615v0tl"
                      >
                        {getAttributeName(attributeId)}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {/* 屬性值配置 */}
              <div data-oid="bp3j1k-">
                <Label
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="legrzhp"
                >
                  屬性值配置
                </Label>
                <div className="space-y-3 mt-2" data-oid="ltlfok.">
                  {formData.specifications.selectedAttributes.map(
                    (attributeId) => {
                      const values =
                        formData.specifications.attributeValues[attributeId] ||
                        [];
                      return (
                        <div
                          key={attributeId}
                          className="flex items-start space-x-3"
                          data-oid="ky-60-z"
                        >
                          <div className="min-w-[100px]" data-oid="0::9lc8">
                            <Badge variant="secondary" data-oid="62s60wi">
                              {getAttributeName(attributeId)}
                            </Badge>
                          </div>
                          <div
                            className="flex flex-wrap gap-1"
                            data-oid="wi7.7mq"
                          >
                            {values.map((value) => (
                              <Badge
                                key={value}
                                variant="outline"
                                className="text-xs"
                                data-oid="0v6a9o2"
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
        data-oid="knf931r"
      >
        <CardHeader data-oid="3a6hb-b">
          <CardTitle className="flex items-center space-x-2" data-oid="mg2x0x_">
            <Package className="h-5 w-5" data-oid=":bcim8g" />
            <span data-oid="fh.:-53">變體配置</span>
            <Badge variant="outline" data-oid="hyeez-f">
              {formData.variants.items.length} 個變體
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="7vw:yri">
          {formData.variants.items.length === 0 ? (
            <p className="text-muted-foreground" data-oid=".zrxc_j">
              尚未配置任何變體
            </p>
          ) : (
            <div className="space-y-3" data-oid="fd9st_9">
              {formData.variants.items.map((variant, index) => (
                <div
                  key={variant.key}
                  className="p-4 rounded-lg border bg-muted/30"
                  data-oid="cdgkyoq"
                >
                  <div
                    className="flex items-center justify-between"
                    data-oid="hrb9dk_"
                  >
                    <div className="space-y-2" data-oid="b1u:pfw">
                      {formData.specifications.isVariable &&
                        variant.options.length > 0 && (
                          <div
                            className="flex flex-wrap gap-2"
                            data-oid="sg9:iii"
                          >
                            {variant.options.map(({ attributeId, value }) => (
                              <Badge
                                key={`${attributeId}-${value}`}
                                variant="secondary"
                                data-oid="ubcr6.v"
                              >
                                {getAttributeName(attributeId)}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}

                      <div
                        className="flex items-center space-x-4 text-sm"
                        data-oid="k4b60.3"
                      >
                        <div data-oid="5frpeki">
                          <span
                            className="text-muted-foreground"
                            data-oid="ssagxje"
                          >
                            SKU:{" "}
                          </span>
                          <span className="font-mono" data-oid="v..oaka">
                            {variant.sku || "未設定"}
                          </span>
                        </div>
                        <div data-oid="97e0x8_">
                          <span
                            className="text-muted-foreground"
                            data-oid="14jqnhp"
                          >
                            價格:{" "}
                          </span>
                          <span className="font-semibold" data-oid="y4kp:14">
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
        data-oid="3r2ftng"
      >
        {/* 變體數量卡片 */}
        <Card data-slot="card" className="@container/card" data-oid="6fn6w3f">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="v.-hhiz"
          >
            <CardTitle className="text-sm font-medium" data-oid="cmckpaz">
              總變體數量
            </CardTitle>
            <Shapes
              className="h-4 w-4 text-muted-foreground"
              data-oid="828v.kh"
            />
          </CardHeader>
          <CardContent data-oid="bul:5n7">
            <div
              className="text-3xl font-bold tracking-tighter"
              data-oid="7n6z53h"
            >
              {statistics.totalVariants}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid="yf7mng."
            >
              個變體組合
            </p>
          </CardContent>
        </Card>

        {/* 總價值卡片 */}
        <Card data-slot="card" className="@container/card" data-oid="5bod0_i">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="6es:265"
          >
            <CardTitle className="text-sm font-medium" data-oid="b:0.vzz">
              商品總價值
            </CardTitle>
            <DollarSign
              className="h-4 w-4 text-muted-foreground"
              data-oid="8u9p9jg"
            />
          </CardHeader>
          <CardContent data-oid="z2wp9fr">
            <div
              className="text-3xl font-bold tracking-tighter"
              data-oid="5lfedov"
            >
              $
              {statistics.totalValue.toLocaleString("zh-TW", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid=".hao6w4"
            >
              所有變體合計
            </p>
          </CardContent>
        </Card>

        {/* 平均價格卡片 */}
        <Card data-slot="card" className="@container/card" data-oid="3noqd6x">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="4.0nwft"
          >
            <CardTitle className="text-sm font-medium" data-oid="nfev2x7">
              平均價格
            </CardTitle>
            <CircleDollarSign
              className="h-4 w-4 text-muted-foreground"
              data-oid="9rt.icu"
            />
          </CardHeader>
          <CardContent data-oid="qre8iu:">
            <div
              className="text-3xl font-bold tracking-tighter"
              data-oid="1a569nq"
            >
              $
              {statistics.averagePrice.toLocaleString("zh-TW", {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid="yg:jxh3"
            >
              每個變體平均
            </p>
          </CardContent>
        </Card>

        {/* 屬性數量卡片 */}
        <Card data-slot="card" className="@container/card" data-oid="wukx0kp">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid=".kr_y0e"
          >
            <CardTitle className="text-sm font-medium" data-oid="ld2usgf">
              使用屬性
            </CardTitle>
            <Layers
              className="h-4 w-4 text-muted-foreground"
              data-oid="ui0ts46"
            />
          </CardHeader>
          <CardContent data-oid="u0_7-h1">
            <div className="flex items-baseline space-x-2" data-oid="9ohzj71">
              <span
                className="text-3xl font-bold tracking-tighter"
                data-oid="6y6kvq8"
              >
                {statistics.selectedAttributes}
              </span>
              <Badge variant="secondary" className="text-xs" data-oid="n14dpm9">
                已選擇
              </Badge>
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid="q5kz.hy"
            >
              共 {statistics.totalAttributeValues} 個屬性值
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
