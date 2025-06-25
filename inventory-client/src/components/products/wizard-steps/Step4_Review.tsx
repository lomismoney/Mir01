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
import { useAttributes } from "@/hooks/queries/useEntityQueries";
import { useCategories } from "@/hooks/queries/useEntityQueries";
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
    <div className="space-y-6" data-oid="9z13t75">
      {/* 步驟說明 */}
      <div className="space-y-2" data-oid=".pd87x6">
        <h2
          className="text-2xl font-semibold flex items-center space-x-2"
          data-oid="5qsx8vd"
        >
          <CheckCircle className="h-6 w-6 text-primary" data-oid="m5sv0ec" />
          <span data-oid=".1qlp1d">預覽確認</span>
        </h2>
        <p className="text-muted-foreground" data-oid="7-pl-ih">
          請仔細檢查所有配置資訊，確認無誤後即可提交創建商品。
        </p>
      </div>

      {/* 基本資訊預覽 */}
      <Card
        className="bg-card text-card-foreground border border-border/40 shadow-sm"
        data-oid="z8wu02l"
      >
        <CardHeader data-oid="qmifkvj">
          <CardTitle className="flex items-center space-x-2" data-oid="678oljt">
            <FileText className="h-5 w-5" data-oid="721anao" />
            <span data-oid="2vafz0a">基本資訊</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="tcaqbpc">
          <div
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            data-oid="ik5z:lp"
          >
            <div data-oid="aep57ax">
              <Label
                className="text-sm font-medium text-muted-foreground"
                data-oid="5kco0pz"
              >
                商品名稱
              </Label>
              <p className="text-base font-medium" data-oid="iahh6rc">
                {formData.basicInfo.name || "未設定"}
              </p>
            </div>

            <div data-oid="kig:u20">
              <Label
                className="text-sm font-medium text-muted-foreground"
                data-oid="nnofhnc"
              >
                商品分類
              </Label>
              <p className="text-base" data-oid="z.m35nn">
                {getCategoryName(formData.basicInfo.category_id)}
              </p>
            </div>
          </div>

          {formData.basicInfo.description && (
            <div data-oid="3e8o4bz">
              <Label
                className="text-sm font-medium text-muted-foreground"
                data-oid="yjvt0k0"
              >
                商品描述
              </Label>
              <p
                className="text-base text-muted-foreground mt-1"
                data-oid="7d9pbqb"
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
        data-oid="4_0zjpe"
      >
        <CardHeader data-oid="k04b69u">
          <CardTitle className="flex items-center space-x-2" data-oid="92oc-yf">
            <Settings className="h-5 w-5" data-oid="9qddeyb" />
            <span data-oid="zo9:71b">規格配置</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4" data-oid=":c9ggpy">
          <div className="flex items-center space-x-3" data-oid=":ky77r0">
            <Label
              className="text-sm font-medium text-muted-foreground"
              data-oid="dz5:60i"
            >
              規格類型
            </Label>
            <Badge
              variant={
                formData.specifications.isVariable ? "default" : "secondary"
              }
              data-oid="ld42.-b"
            >
              {formData.specifications.isVariable ? "多規格商品" : "單規格商品"}
            </Badge>
          </div>

          {formData.specifications.isVariable && (
            <>
              <Separator data-oid="y:6rp.6" />

              {/* 選中的屬性 */}
              <div data-oid="3v6qd8l">
                <Label
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="ke7ovcl"
                >
                  已選擇的屬性 (
                  {formData.specifications.selectedAttributes.length})
                </Label>
                <div className="flex flex-wrap gap-2 mt-2" data-oid=":iuicv3">
                  {formData.specifications.selectedAttributes.map(
                    (attributeId) => (
                      <Badge
                        key={attributeId}
                        variant="outline"
                        data-oid="0n_rjtp"
                      >
                        {getAttributeName(attributeId)}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {/* 屬性值配置 */}
              <div data-oid=":zu_7zw">
                <Label
                  className="text-sm font-medium text-muted-foreground"
                  data-oid="m:jm:_j"
                >
                  屬性值配置
                </Label>
                <div className="space-y-3 mt-2" data-oid="pwjzyvw">
                  {formData.specifications.selectedAttributes.map(
                    (attributeId) => {
                      const values =
                        formData.specifications.attributeValues[attributeId] ||
                        [];
                      return (
                        <div
                          key={attributeId}
                          className="flex items-start space-x-3"
                          data-oid=".7jgg.3"
                        >
                          <div className="min-w-[100px]" data-oid="pcnh2wd">
                            <Badge variant="secondary" data-oid="1jvj_c_">
                              {getAttributeName(attributeId)}
                            </Badge>
                          </div>
                          <div
                            className="flex flex-wrap gap-1"
                            data-oid="kj.5mm4"
                          >
                            {values.map((value) => (
                              <Badge
                                key={value}
                                variant="outline"
                                className="text-xs"
                                data-oid="1xul0.0"
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
        data-oid="0vrjvz6"
      >
        <CardHeader data-oid="nakhra9">
          <CardTitle className="flex items-center space-x-2" data-oid="eek587l">
            <Package className="h-5 w-5" data-oid="6af2.dh" />
            <span data-oid="596y0te">變體配置</span>
            <Badge variant="outline" data-oid="sug7cn2">
              {formData.variants.items.length} 個變體
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent data-oid="dg4z3qq">
          {formData.variants.items.length === 0 ? (
            <p className="text-muted-foreground" data-oid="0fseibn">
              尚未配置任何變體
            </p>
          ) : (
            <div className="space-y-3" data-oid="d6tokvv">
              {formData.variants.items.map((variant, index) => (
                <div
                  key={variant.key}
                  className="p-4 rounded-lg border bg-muted/30"
                  data-oid="pqc8v4q"
                >
                  <div
                    className="flex items-center justify-between"
                    data-oid="-o7gde9"
                  >
                    <div className="space-y-2" data-oid="2g.dp-2">
                      {formData.specifications.isVariable &&
                        variant.options.length > 0 && (
                          <div
                            className="flex flex-wrap gap-2"
                            data-oid="ez3:axz"
                          >
                            {variant.options.map(({ attributeId, value }) => (
                              <Badge
                                key={`${attributeId}-${value}`}
                                variant="secondary"
                                data-oid="uhjd15x"
                              >
                                {getAttributeName(attributeId)}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}

                      <div
                        className="flex items-center space-x-4 text-sm"
                        data-oid="g:pnemu"
                      >
                        <div data-oid=":n2pqu2">
                          <span
                            className="text-muted-foreground"
                            data-oid="gqgoxff"
                          >
                            SKU:{" "}
                          </span>
                          <span className="font-mono" data-oid="dpscp2q">
                            {variant.sku || "未設定"}
                          </span>
                        </div>
                        <div data-oid="xnsh-kq">
                          <span
                            className="text-muted-foreground"
                            data-oid="fsty8sl"
                          >
                            價格:{" "}
                          </span>
                          <span className="font-semibold" data-oid="7uvw6:f">
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
        data-oid="3mbj.k4"
      >
        {/* 變體數量卡片 */}
        <Card data-slot="card" className="@container/card" data-oid="egc97s9">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="mjqkyd5"
          >
            <CardTitle className="text-sm font-medium" data-oid="5alrgjx">
              總變體數量
            </CardTitle>
            <Shapes
              className="h-4 w-4 text-muted-foreground"
              data-oid="k0rv9oq"
            />
          </CardHeader>
          <CardContent data-oid="-occ1k2">
            <div
              className="text-3xl font-bold tracking-tighter"
              data-oid="u_y.1e5"
            >
              {statistics.totalVariants}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid="8dgua8z"
            >
              個變體組合
            </p>
          </CardContent>
        </Card>

        {/* 總價值卡片 */}
        <Card data-slot="card" className="@container/card" data-oid="zny1dec">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="4wgn302"
          >
            <CardTitle className="text-sm font-medium" data-oid="dw1wdvt">
              商品總價值
            </CardTitle>
            <DollarSign
              className="h-4 w-4 text-muted-foreground"
              data-oid="e2kwoau"
            />
          </CardHeader>
          <CardContent data-oid="hhev:rb">
            <div
              className="text-3xl font-bold tracking-tighter"
              data-oid="-a7qb_4"
            >
              $
              {statistics.totalValue.toLocaleString("zh-TW", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid="2h4_9uu"
            >
              所有變體合計
            </p>
          </CardContent>
        </Card>

        {/* 平均價格卡片 */}
        <Card data-slot="card" className="@container/card" data-oid="osmlmmq">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="4vde7p5"
          >
            <CardTitle className="text-sm font-medium" data-oid="kokk5kw">
              平均價格
            </CardTitle>
            <CircleDollarSign
              className="h-4 w-4 text-muted-foreground"
              data-oid="gf3kxel"
            />
          </CardHeader>
          <CardContent data-oid=":y6wyp4">
            <div
              className="text-3xl font-bold tracking-tighter"
              data-oid="ermo508"
            >
              $
              {statistics.averagePrice.toLocaleString("zh-TW", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid="73-90ng"
            >
              每個變體平均
            </p>
          </CardContent>
        </Card>

        {/* 屬性數量卡片 */}
        <Card data-slot="card" className="@container/card" data-oid=".k5ximx">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="yx2wy-p"
          >
            <CardTitle className="text-sm font-medium" data-oid="mwjjis8">
              使用屬性
            </CardTitle>
            <Layers
              className="h-4 w-4 text-muted-foreground"
              data-oid="ysksrhf"
            />
          </CardHeader>
          <CardContent data-oid="j8jd6dm">
            <div className="flex items-baseline space-x-2" data-oid="jvocg7w">
              <span
                className="text-3xl font-bold tracking-tighter"
                data-oid="lsqslrt"
              >
                {statistics.selectedAttributes}
              </span>
              <Badge variant="secondary" className="text-xs" data-oid="fz4fu_x">
                已選擇
              </Badge>
            </div>
            <p
              className="text-xs text-muted-foreground mt-2"
              data-oid="xq1.vh0"
            >
              共 {statistics.totalAttributeValues} 個屬性值
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
