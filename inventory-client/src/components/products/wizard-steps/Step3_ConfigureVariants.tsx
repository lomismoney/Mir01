"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Package,
  DollarSign,
  Hash,
  Wand2,
  Shapes,
  Barcode,
  CircleDollarSign,
  Wallet,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WizardFormData } from "../CreateProductWizard";
import { useAttributes } from "@/hooks";
import { Attribute } from "@/types/products";
import { toast } from "sonner";

/**
 * 變體項目介面
 */
interface VariantItem {
  key: string;
  options: { attributeId: number; value: string }[];
  sku: string;
  price: string;
}

/**
 * 步驟3組件Props
 */
interface Step3Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>,
  ) => void;
}

/**
 * 步驟3：變體配置組件
 *
 * 功能包含：
 * - 自動生成變體組合
 * - SKU 編號配置
 * - 價格設定
 * - 批量操作工具
 */
export function Step3_ConfigureVariants({
  formData,
  updateFormData,
}: Step3Props) {
  // 獲取屬性資料
  const { data: attributesData } = useAttributes();
  const attributes: Attribute[] = Array.isArray(attributesData)
    ? attributesData
    : [];

  // 本地狀態：批量價格設定
  const [bulkPrice, setBulkPrice] = useState("");
  const [autoSku, setAutoSku] = useState(true);

  // 用於追蹤是否已經初始化過變體數據
  const isInitialized = useRef(false);

  /**
   * 生成笛卡爾積組合
   */
  const generateCartesianProduct = <T,>(arrays: T[][]): T[][] => {
    if (arrays.length === 0) return [[]];
    if (arrays.length === 1) return arrays[0].map((item) => [item]);

    const [first, ...rest] = arrays;
    const restProduct = generateCartesianProduct(rest);

    return first.flatMap((item) =>
      restProduct.map((combination) => [item, ...combination]),
    );
  };

  /**
   * 生成變體組合
   */
  const generateVariants = useMemo(() => {
    if (!formData.specifications.isVariable) {
      // 單規格商品
      return [
        {
          key: "single",
          options: [],
          sku: "",
          price: "",
        },
      ] as VariantItem[];
    }

    const selectedAttributeIds = formData.specifications.selectedAttributes;
    if (selectedAttributeIds.length === 0) return [];

    // 準備屬性值陣列
    const attributeValueArrays = selectedAttributeIds.map((attributeId) => {
      const values = formData.specifications.attributeValues[attributeId] || [];
      return values.map((value) => ({ attributeId, value }));
    });

    // 生成組合
    const combinations = generateCartesianProduct(attributeValueArrays);

    return combinations.map((combination, index) => {
      // 修復：使用與 CreateProductWizard 一致的 key 格式
      const key = `variant-${index}`;
      return {
        key,
        options: combination,
        sku: "",
        price: "",
      } as VariantItem;
    });
  }, [formData.specifications]);

  /**
   * 初始化或更新變體資料
   * 修復：避免在編輯模式下覆蓋已有的變體數據
   */
  useEffect(() => {
    const currentVariants = formData.variants.items;
    const newVariants = generateVariants;

    // 如果已有變體數據且包含價格信息，說明是編輯模式，不要覆蓋
    const hasExistingPriceData = currentVariants.some(
      (v) => v.price && v.price !== "",
    );

    // 如果已經初始化過且存在價格數據，跳過自動更新
    if (isInitialized.current && hasExistingPriceData) {
      return;
    }

    // 改進的合併邏輯：優先保留現有變體的所有數據
    const mergedVariants = newVariants.map((newVariant, index) => {
      // 嘗試通過 key 匹配
      let existing = currentVariants.find((v) => v.key === newVariant.key);

      // 如果通過 key 找不到，嘗試通過索引匹配（向後兼容）
      if (!existing && currentVariants[index]) {
        existing = currentVariants[index];
      }

      // 如果找到現有變體，保留其所有數據，只更新 options（如果需要）
      if (existing) {
        return {
          ...existing,
          key: newVariant.key, // 確保 key 是最新的格式
          options: newVariant.options, // 更新 options 以反映最新的屬性配置
        };
      }

      // 如果沒有找到現有變體，使用新生成的
      return newVariant;
    });

    // 如果啟用自動 SKU，生成 SKU（但不覆蓋已有的 SKU）
    if (autoSku) {
      mergedVariants.forEach((variant, index) => {
        if (!variant.sku) {
          variant.sku = generateAutoSku(variant, index);
        }
      });
    }

    // 只有在數據真的需要更新時才更新
    const needsUpdate =
      JSON.stringify(mergedVariants) !== JSON.stringify(currentVariants);

    if (needsUpdate) {
      updateFormData("variants", {
        items: mergedVariants,
      });
    }

    // 標記為已初始化
    isInitialized.current = true;
  }, [generateVariants, autoSku, formData.variants.items]);

  /**
   * 自動生成 SKU
   */
  const generateAutoSku = (variant: VariantItem, index: number): string => {
    if (!formData.specifications.isVariable) {
      return `${formData.basicInfo.name.substring(0, 3).toUpperCase()}001`;
    }

    const productPrefix = formData.basicInfo.name.substring(0, 3).toUpperCase();
    const attributeParts = variant.options
      .map(({ value }) => value.substring(0, 2).toUpperCase())
      .join("");

    return `${productPrefix}-${attributeParts}-${String(index + 1).padStart(3, "0")}`;
  };

  /**
   * 處理變體欄位變更
   */
  const handleVariantChange = (
    variantKey: string,
    field: "sku" | "price",
    value: string,
  ) => {
    const updatedVariants = formData.variants.items.map((variant) =>
      variant.key === variantKey ? { ...variant, [field]: value } : variant,
    );

    updateFormData("variants", {
      items: updatedVariants,
    });
  };

  /**
   * 批量設定價格
   */
  const handleBulkPriceSet = () => {
    if (!bulkPrice.trim()) {
      toast.error("請輸入價格");
      return;
    }

    const price = parseFloat(bulkPrice);
    if (isNaN(price) || price < 0) {
      toast.error("請輸入有效的價格");
      return;
    }

    const updatedVariants = formData.variants.items.map((variant) => ({
      ...variant,
      price: bulkPrice,
    }));

    updateFormData("variants", {
      items: updatedVariants,
    });

    toast.success(`已為所有變體設定價格：$${bulkPrice}`);
  };

  /**
   * 重新生成所有 SKU
   */
  const handleRegenerateSkus = () => {
    const updatedVariants = formData.variants.items.map((variant, index) => ({
      ...variant,
      sku: generateAutoSku(variant, index),
    }));

    updateFormData("variants", {
      items: updatedVariants,
    });

    toast.success("已重新生成所有 SKU");
  };

  /**
   * 獲取屬性名稱
   */
  const getAttributeName = (attributeId: number): string => {
    const attribute = attributes.find((attr) => attr.id === attributeId);
    return attribute?.name || `屬性${attributeId}`;
  };

  /**
   * 檢查是否可以進入下一步
   */
  const canProceed = useMemo(() => {
    return formData.variants.items.every(
      (variant) =>
        variant.sku.trim() &&
        variant.price.trim() &&
        !isNaN(parseFloat(variant.price)),
    );
  }, [formData.variants.items]);

  const variants = formData.variants.items;

  return (
    <div className="space-y-6" data-oid="i9kg6bu">
      {/* 步驟說明 */}
      <div className="space-y-2" data-oid="k6ags4-">
        <h2
          className="text-2xl font-semibold flex items-center space-x-2"
          data-oid="_qsj_:-"
        >
          <Package className="h-6 w-6 text-primary" data-oid="5o-:jbr" />
          <span data-oid=":j:d_np">設定變體</span>
        </h2>
        <p className="text-muted-foreground" data-oid="vv_ga5q">
          為您的商品變體設定 SKU 編號和價格資訊。
        </p>
      </div>

      {/* 批量操作工具 */}
      {variants.length > 1 && (
        <Card
          className="bg-card text-card-foreground border border-border/40 shadow-sm"
          data-oid="jl2r3ei"
        >
          <CardHeader data-oid="7zn:49q">
            <CardTitle
              className="flex items-center space-x-2"
              data-oid="_9qarx6"
            >
              <Wand2 className="h-5 w-5" data-oid="twsf1ix" />
              <span data-oid="s.l9qt8">批量操作</span>
            </CardTitle>
            <CardDescription data-oid="qpw7e3p">
              快速為所有變體進行批量設定，提升配置效率。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4" data-oid="8gn-nre">
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              data-oid="5xdoleb"
            >
              {/* 批量價格設定 */}
              <div className="space-y-3" data-oid="0dx1lb3">
                <Label className="text-base font-medium" data-oid="6uw:1_g">
                  批量設定價格
                </Label>
                <div className="flex space-x-2" data-oid="vh59r2e">
                  <Input
                    type="number"
                    placeholder="輸入統一價格"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    data-oid="s3fwrnt"
                  />

                  <Button
                    onClick={handleBulkPriceSet}
                    variant="outline"
                    data-oid="1-.ccnp"
                  >
                    <DollarSign className="h-4 w-4 mr-1" data-oid="o1wuxfk" />
                    套用
                  </Button>
                </div>
              </div>

              {/* SKU 重新生成 */}
              <div className="space-y-3" data-oid=".t62sil">
                <Label className="text-base font-medium" data-oid=":xeu6bh">
                  SKU 管理
                </Label>
                <Button
                  onClick={handleRegenerateSkus}
                  variant="outline"
                  className="w-full"
                  data-oid="-_c8t:q"
                >
                  <Hash className="h-4 w-4 mr-1" data-oid="qg6eptj" />
                  重新生成所有 SKU
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 變體配置表格 */}
      <Card
        className="bg-card text-card-foreground border border-border/40 shadow-sm"
        data-oid="sit2vm-"
      >
        <CardHeader data-oid="vmt.1aa">
          <CardTitle
            className="flex items-center justify-between"
            data-oid="17zi6w4"
          >
            <div className="flex items-center space-x-2" data-oid="z3six57">
              <Package className="h-5 w-5" data-oid="4ncipks" />
              <span data-oid="gse31n5">變體詳情配置</span>
            </div>
            <Badge variant="outline" data-oid="-_l2i1v">
              {variants.length} 個變體
            </Badge>
          </CardTitle>
          <CardDescription data-oid="bxzwb9z">
            為每個變體設定 SKU 編號和價格。SKU 應具唯一性，價格必須為正數。
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="b.mazao">
          {variants.length === 0 ? (
            <div className="text-center py-8" data-oid="otbvida">
              <div className="text-muted-foreground" data-oid="6m5ppxk">
                尚未生成任何變體，請返回上一步配置規格。
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto" data-oid="bqgiowc">
              <Table data-oid="qronuce">
                <TableHeader data-oid="jnjj_dc">
                  <TableRow
                    className="border-b hover:bg-transparent"
                    data-oid="tk88pnt"
                  >
                    {/* 變體組合 - 只在多規格商品時顯示 */}
                    {formData.specifications.isVariable && (
                      <TableHead
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                        data-oid="drrztn3"
                      >
                        變體組合
                      </TableHead>
                    )}
                    {/* SKU */}
                    <TableHead
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                      data-oid="e98wsdm"
                    >
                      SKU 編號
                    </TableHead>
                    <TableHead
                      className="h-12 px-4 text-left align-middle font-medium text-muted-foreground"
                      data-oid="hy62l.j"
                    >
                      價格 (NT$)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-oid="r.avs5c">
                  {variants.map((variant, index) => (
                    <TableRow key={variant.key} data-oid="bfk0pm5">
                      {formData.specifications.isVariable && (
                        <TableCell data-oid="lc5quj8">
                          <div
                            className="flex flex-wrap gap-2"
                            data-oid="ydtr965"
                          >
                            {variant.options.map(({ attributeId, value }) => (
                              <Badge
                                key={`${attributeId}-${value}`}
                                variant="secondary"
                                data-oid="_urfstk"
                              >
                                {getAttributeName(attributeId)}: {value}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      )}
                      <TableCell data-oid="7sb-q32">
                        <Input
                          placeholder="輸入 SKU 編號"
                          value={variant.sku}
                          onChange={(e) =>
                            handleVariantChange(
                              variant.key,
                              "sku",
                              e.target.value,
                            )
                          }
                          className="max-w-[200px]"
                          data-oid="b209bkc"
                        />
                      </TableCell>
                      <TableCell data-oid="cr460.f">
                        <div
                          className="flex items-center space-x-2"
                          data-oid="5--_uwy"
                        >
                          <span
                            className="text-muted-foreground"
                            data-oid="mmwg6.7"
                          >
                            $
                          </span>
                          <Input
                            type="number"
                            placeholder="0.00"
                            value={variant.price}
                            onChange={(e) =>
                              handleVariantChange(
                                variant.key,
                                "price",
                                e.target.value,
                              )
                            }
                            min="0"
                            step="0.01"
                            className={`max-w-[120px] ${
                              variant.price &&
                              (isNaN(parseFloat(variant.price)) ||
                                parseFloat(variant.price) <= 0)
                                ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                                : ""
                            }`}
                            data-oid="4wgkst3"
                          />

                          {variant.price &&
                            (isNaN(parseFloat(variant.price)) ||
                              parseFloat(variant.price) <= 0) && (
                              <AlertCircle
                                className="h-4 w-4 text-red-500"
                                data-oid="msmr3nr"
                              />
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 配置摘要 */}
      {variants.length > 0 && (
        <div
          className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-4 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs"
          data-oid="kyl0a1h"
        >
          {/* 變體數量卡片 */}
          <Card data-slot="card" className="@container/card" data-oid="dm3_bym">
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0 pb-2"
              data-oid="6mtryyb"
            >
              <CardTitle className="text-sm font-medium" data-oid="bp9thoi">
                總變體數量
              </CardTitle>
              <Shapes
                className="h-4 w-4 text-muted-foreground"
                data-oid="cjnppm9"
              />
            </CardHeader>
            <CardContent data-oid="ws6kx8q">
              <div className="flex items-baseline space-x-2" data-oid="r68f146">
                <span
                  className="text-3xl font-bold tracking-tighter"
                  data-oid="hgm-08:"
                >
                  {variants.length}
                </span>
                <Badge
                  variant="secondary"
                  className="text-xs"
                  data-oid="lbwu-_3"
                >
                  已生成
                </Badge>
              </div>
              <p
                className="text-xs text-muted-foreground mt-2"
                data-oid="9bdcu1_"
              >
                所有變體已準備就緒
              </p>
            </CardContent>
          </Card>

          {/* SKU 設定卡片 */}
          <Card data-slot="card" className="@container/card" data-oid="mi-rpkn">
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0 pb-2"
              data-oid="f.s_bn2"
            >
              <CardTitle className="text-sm font-medium" data-oid="78np-7f">
                SKU 配置進度
              </CardTitle>
              <Barcode
                className="h-4 w-4 text-muted-foreground"
                data-oid="mn2:8dc"
              />
            </CardHeader>
            <CardContent data-oid="xdkdrp-">
              <div
                className="text-3xl font-bold tracking-tighter"
                data-oid="1kizh0d"
              >
                {Math.round(
                  (variants.filter((v) => v.sku.trim()).length /
                    variants.length) *
                    100,
                )}
                %
              </div>
              <Progress
                value={
                  (variants.filter((v) => v.sku.trim()).length /
                    variants.length) *
                  100
                }
                className="h-2 mt-3"
                data-oid="67qngej"
              />

              <div
                className="flex items-center justify-between mt-2"
                data-oid="9d5g3uv"
              >
                <span
                  className="text-xs text-muted-foreground"
                  data-oid="p6dui3c"
                >
                  {variants.filter((v) => v.sku.trim()).length} 已完成
                </span>
                <span
                  className="text-xs text-muted-foreground"
                  data-oid="n8fh822"
                >
                  {variants.length} 總數
                </span>
              </div>
              <p
                className="text-xs text-muted-foreground mt-2"
                data-oid="ig6m10h"
              >
                {variants.filter((v) => v.sku.trim()).length === variants.length
                  ? "所有 SKU 已設定完成"
                  : `還有 ${variants.length - variants.filter((v) => v.sku.trim()).length} 個待設定`}
              </p>
            </CardContent>
          </Card>

          {/* 價格設定卡片 */}
          <Card data-slot="card" className="@container/card" data-oid="3lvaqs4">
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0 pb-2"
              data-oid="-lu8r10"
            >
              <CardTitle className="text-sm font-medium" data-oid="hk9i6l2">
                價格配置進度
              </CardTitle>
              <CircleDollarSign
                className="h-4 w-4 text-muted-foreground"
                data-oid="_bbo5w6"
              />
            </CardHeader>
            <CardContent data-oid="qttdru8">
              <div
                className="text-3xl font-bold tracking-tighter"
                data-oid="327au:p"
              >
                {Math.round(
                  (variants.filter(
                    (v) => v.price.trim() && !isNaN(parseFloat(v.price)),
                  ).length /
                    variants.length) *
                    100,
                )}
                %
              </div>
              <Progress
                value={
                  (variants.filter(
                    (v) => v.price.trim() && !isNaN(parseFloat(v.price)),
                  ).length /
                    variants.length) *
                  100
                }
                className="h-2 mt-3"
                data-oid="g9lq6bf"
              />

              <div
                className="flex items-center justify-between mt-2"
                data-oid="cl:owhq"
              >
                <span
                  className="text-xs text-muted-foreground"
                  data-oid="zv3uql."
                >
                  {
                    variants.filter(
                      (v) => v.price.trim() && !isNaN(parseFloat(v.price)),
                    ).length
                  }{" "}
                  已完成
                </span>
                <span
                  className="text-xs text-muted-foreground"
                  data-oid="-2k:y7c"
                >
                  {variants.length} 總數
                </span>
              </div>
              <p
                className="text-xs text-muted-foreground mt-2"
                data-oid="zz3x0xw"
              >
                {variants.filter(
                  (v) => v.price.trim() && !isNaN(parseFloat(v.price)),
                ).length === variants.length
                  ? "所有價格已設定完成"
                  : `還有 ${variants.length - variants.filter((v) => v.price.trim() && !isNaN(parseFloat(v.price))).length} 個待設定`}
              </p>
            </CardContent>
          </Card>

          {/* 總價值卡片 */}
          <Card data-slot="card" className="@container/card" data-oid="ba32g7n">
            <CardHeader
              className="flex flex-row items-center justify-between space-y-0 pb-2"
              data-oid="au6lv2x"
            >
              <CardTitle className="text-sm font-medium" data-oid="c2:4sdh">
                商品總價值
              </CardTitle>
              <Wallet
                className="h-4 w-4 text-muted-foreground"
                data-oid="q__snjd"
              />
            </CardHeader>
            <CardContent data-oid="acahpoz">
              <div
                className="text-3xl font-bold tracking-tighter"
                data-oid="d4bdwyi"
              >
                $
                {variants
                  .reduce((sum, v) => {
                    const price = parseFloat(v.price);
                    return sum + (isNaN(price) ? 0 : price);
                  }, 0)
                  .toLocaleString("zh-TW", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}
              </div>
              <p
                className="text-xs text-muted-foreground mt-2"
                data-oid="qmodc12"
              >
                預估庫存價值
              </p>
              <p className="text-xs text-muted-foreground" data-oid="9hq64.g">
                基於當前定價計算
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 進度提示 */}
      <Alert data-oid="4_7u2qg">
        <AlertCircle className="h-4 w-4" data-oid="3ynrww7" />
        <AlertDescription data-oid="p8.d8xw">
          <strong data-oid="hkv3o0.">進度提示：</strong>
          {canProceed
            ? "所有變體的 SKU 和價格都已配置完成，可以進入下一步進行最終確認。"
            : "請確保所有變體都有設定 SKU 編號和有效的價格才能進入下一步。"}
        </AlertDescription>
      </Alert>
    </div>
  );
}
