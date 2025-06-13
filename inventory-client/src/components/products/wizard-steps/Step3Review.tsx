'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Package, Tags, List } from 'lucide-react';

/**
 * SKU 變體的資料結構（與 Step2 中定義的保持一致）
 */
interface VariantData {
  /** 由規格值組成的唯一鍵 */
  key: string;
  /** 屬性選項陣列 */
  options: { attributeId: number; value: string }[];
  /** SKU 編號 */
  sku: string;
  /** 價格 */
  price: string;
}

/**
 * 嚮導表單數據結構（與主頁面保持一致）
 */
interface WizardFormData {
  basicInfo: {
    name: string;
    description: string;
    category_id: number | null;
  };
  specs: {
    isVariable: boolean;
    selectedAttrs: Set<number>;
    optionsMap: Record<number, string[]>;
  };
  variants: VariantData[];
}

interface Step3Props {
  /** 完整的表單數據 */
  formData: WizardFormData;
  /** 可用的屬性列表，用於顯示屬性名稱 */
  availableAttributes?: Array<{ id: number; name: string }>;
  /** 可用的分類列表，用於顯示分類名稱 */
  availableCategories?: Array<{ id: number; name: string }>;
}

/**
 * 步驟三：預覽與確認元件（重構版 - ref 控制模式兼容）
 * 
 * 🔧 架構重構亮點：
 * 1. ✅ 純展示元件，無需 ref 控制介面
 * 2. ✅ 完全移除回調函數，避免無限渲染迴圈
 * 3. ✅ 只接收 formData 進行純粹的資料渲染
 * 4. ✅ 與新架構完全兼容
 * 5. ✅ 保持原有的視覺設計和用戶體驗
 * 
 * 功能特色：
 * 1. 完整展示所有步驟的輸入資料
 * 2. 美觀的分區塊資料呈現
 * 3. 單/多規格的智慧顯示邏輯
 * 4. 變體資料表格化展示
 * 5. 視覺化的確認提示
 */
export function Step3Review({ formData, availableAttributes = [], availableCategories = [] }: Step3Props) {
  const { basicInfo, specs, variants } = formData;

  /**
   * 根據 ID 查找分類名稱
   */
  const getCategoryName = (categoryId: number | null) => {
    if (!categoryId) return '未指定分類';
    const category = availableCategories.find(cat => cat.id === categoryId);
    return category?.name || `分類 ID: ${categoryId}`;
  };

  /**
   * 根據 ID 查找屬性名稱
   */
  const getAttributeName = (attributeId: number) => {
    const attribute = availableAttributes.find(attr => attr.id === attributeId);
    return attribute?.name || `屬性 ID: ${attributeId}`;
  };

  /**
   * 計算總變體數量和平均價格
   */
  const getVariantStats = () => {
    if (!variants || variants.length === 0) return null;
    
    const totalVariants = variants.length;
    const totalPrice = variants.reduce((sum, variant) => sum + parseFloat(variant.price || '0'), 0);
    const averagePrice = totalPrice / totalVariants;
    
    return {
      total: totalVariants,
      averagePrice: averagePrice.toFixed(2)
    };
  };

  const variantStats = getVariantStats();

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              3
            </span>
            預覽與確認
          </CardTitle>
          <CardDescription>
            請仔細檢查以下所有資訊是否正確。確認無誤後，點擊「確認並建立商品」以完成商品建立。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* 基本資訊區塊 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">基本資訊</h3>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">商品名稱</label>
                  <p className="text-base font-medium">{basicInfo.name || '未填寫'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">所屬分類</label>
                  <p className="text-base">{getCategoryName(basicInfo.category_id)}</p>
                </div>
              </div>
              
              {basicInfo.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">商品描述</label>
                  <p className="text-base text-muted-foreground">{basicInfo.description}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* 規格定義區塊 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">規格定義</h3>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">規格模式：</span>
                <Badge variant={specs.isVariable ? "default" : "secondary"}>
                  {specs.isVariable ? '多規格商品' : '單規格商品'}
                </Badge>
              </div>
              
              {specs.isVariable && specs.selectedAttrs.size > 0 && (
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">已選擇的規格屬性：</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Array.from(specs.selectedAttrs).map(attrId => (
                        <Badge key={attrId} variant="outline">
                          {getAttributeName(attrId)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {/* 屬性值詳細展示 */}
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-muted-foreground">規格值配置：</span>
                    <div className="grid gap-2">
                      {Array.from(specs.selectedAttrs).map(attrId => {
                        const values = specs.optionsMap[attrId] || [];
                        return (
                          <div key={attrId} className="flex items-center gap-2">
                            <span className="text-sm font-medium min-w-[80px]">
                              {getAttributeName(attrId)}:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {values.map(value => (
                                <Badge key={value} variant="secondary" className="text-xs">
                                  {value}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 變體資料區塊 */}
          {specs.isVariable && variants && variants.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <List className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">SKU 變體列表</h3>
                  </div>
                  {variantStats && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>共 {variantStats.total} 個變體</span>
                      <span>平均價格：${variantStats.averagePrice}</span>
                    </div>
                  )}
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>規格組合</TableHead>
                        <TableHead>SKU 編號</TableHead>
                        <TableHead className="text-right">價格 ($)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variants.map((variant) => (
                        <TableRow key={variant.key}>
                          <TableCell className="font-medium">
                            <div className="flex flex-wrap gap-1">
                              {variant.options.map((opt, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {opt.value}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {variant.sku || '未設定'}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${parseFloat(variant.price || '0').toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}

          {/* 單規格商品的簡化顯示 */}
          {!specs.isVariable && (
            <>
              <Separator />
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-900 mb-1">單規格商品</h4>
                    <p className="text-sm text-blue-700">
                      此商品將以單一規格建立，不包含多個 SKU 變體。
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 最終確認提示 */}
          <Separator />
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <div className="w-2 h-2 bg-amber-600 rounded-full"></div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-amber-900 mb-1">最終確認</h4>
                <p className="text-sm text-amber-800">
                  請再次確認以上所有資訊正確無誤。提交後商品將立即建立並儲存至系統中。
                  如需修改任何資訊，請使用「上一步」按鈕返回對應步驟進行編輯。
                </p>
              </div>
            </div>
          </div>

          {/* 新架構狀態指示 */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                架構模式：ref 控制模式（純展示元件，無需 ref 控制）
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 text-xs">無狀態渲染</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 