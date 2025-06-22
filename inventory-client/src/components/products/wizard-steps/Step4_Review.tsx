'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';

import { 
  CheckCircle, 
  Package, 
  FileText, 
  Settings, 
  DollarSign,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WizardFormData } from '../CreateProductWizard';
import { useAttributes } from '@/hooks/queries/useEntityQueries';
import { useCategories } from '@/hooks/queries/useEntityQueries';
import { Attribute } from '@/types/products';
import { Category } from '@/types/category';

/**
 * 步驟4組件Props
 */
interface Step4Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>
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
  
  const attributes: Attribute[] = Array.isArray(attributesData) ? attributesData : [];
  const categories: Category[] = Array.isArray(categoriesData) ? categoriesData : [];

  /**
   * 原子化創建流程不需要額外的確認步驟
   * 用戶點擊"創建商品"即表示確認
   */

  /**
   * 獲取分類名稱
   */
  const getCategoryName = (categoryId: number | null): string => {
    if (!categoryId) return '未分類';
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || `分類 ${categoryId}`;
  };

  /**
   * 獲取屬性名稱
   */
  const getAttributeName = (attributeId: number): string => {
    const attribute = attributes.find(attr => attr.id === attributeId);
    return attribute?.name || `屬性 ${attributeId}`;
  };

  /**
   * 計算統計資料
   */
  const statistics = {
    totalVariants: formData.variants.items.length,
    totalValue: formData.variants.items.reduce((sum, variant) => {
      const price = parseFloat(variant.price || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0),
    averagePrice: formData.variants.items.length > 0 
      ? formData.variants.items.reduce((sum, variant) => {
          const price = parseFloat(variant.price || '0');
          return sum + (isNaN(price) ? 0 : price);
        }, 0) / formData.variants.items.length
      : 0,
    selectedAttributes: formData.specifications.selectedAttributes.length,
    totalAttributeValues: Object.values(formData.specifications.attributeValues)
      .reduce((sum, values) => sum + values.length, 0),
  };

  return (
    <div className="space-y-6">
      {/* 步驟說明 */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold flex items-center space-x-2">
                      <CheckCircle className="h-6 w-6 text-primary" />
          <span>預覽確認</span>
        </h2>
        <p className="text-muted-foreground">
          請仔細檢查所有配置資訊，確認無誤後即可提交創建商品。
        </p>
      </div>

      {/* 基本資訊預覽 */}
      <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>基本資訊</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">商品名稱</Label>
              <p className="text-base font-medium">{formData.basicInfo.name || '未設定'}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-muted-foreground">商品分類</Label>
              <p className="text-base">{getCategoryName(formData.basicInfo.category_id)}</p>
            </div>
          </div>
          
          {formData.basicInfo.description && (
            <div>
              <Label className="text-sm font-medium text-muted-foreground">商品描述</Label>
              <p className="text-base text-muted-foreground mt-1">
                {formData.basicInfo.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 規格配置預覽 */}
      <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>規格配置</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Label className="text-sm font-medium text-muted-foreground">規格類型</Label>
            <Badge variant={formData.specifications.isVariable ? 'default' : 'secondary'}>
              {formData.specifications.isVariable ? '多規格商品' : '單規格商品'}
            </Badge>
          </div>

          {formData.specifications.isVariable && (
            <>
              <Separator />
              
              {/* 選中的屬性 */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  已選擇的屬性 ({formData.specifications.selectedAttributes.length})
                </Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specifications.selectedAttributes.map(attributeId => (
                    <Badge key={attributeId} variant="outline">
                      {getAttributeName(attributeId)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 屬性值配置 */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">屬性值配置</Label>
                <div className="space-y-3 mt-2">
                  {formData.specifications.selectedAttributes.map(attributeId => {
                    const values = formData.specifications.attributeValues[attributeId] || [];
                    return (
                      <div key={attributeId} className="flex items-start space-x-3">
                        <div className="min-w-[100px]">
                          <Badge variant="secondary">{getAttributeName(attributeId)}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {values.map(value => (
                            <Badge key={value} variant="outline" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 變體配置預覽 */}
      <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
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
            <p className="text-muted-foreground">尚未配置任何變體</p>
          ) : (
            <div className="space-y-3">
              {formData.variants.items.map((variant, index) => (
                <div key={variant.key} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      {formData.specifications.isVariable && variant.options.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {variant.options.map(({ attributeId, value }) => (
                            <Badge key={`${attributeId}-${value}`} variant="secondary">
                              {getAttributeName(attributeId)}: {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">SKU: </span>
                          <span className="font-mono">{variant.sku || '未設定'}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">價格: </span>
                          <span className="font-semibold">NT$ {variant.price || '0'}</span>
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
      <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>統計摘要</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-chart-1">
                {statistics.totalVariants}
              </div>
              <div className="text-sm text-muted-foreground">個變體</div>
            </div>
            
            <div className="text-center p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-chart-2">
                ${statistics.totalValue.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">總價值</div>
            </div>
            
            <div className="text-center p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-chart-3">
                ${statistics.averagePrice.toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">平均價格</div>
            </div>
            
            <div className="text-center p-4 rounded-lg border bg-muted/50">
              <div className="text-2xl font-bold text-chart-4">
                {statistics.selectedAttributes}
              </div>
              <div className="text-sm text-muted-foreground">個屬性</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 提交前檢查清單 */}
      <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>提交前檢查</span>
          </CardTitle>
          <CardDescription>
            請確認以下項目都已正確配置，以確保商品資訊的完整性。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">基本資訊完整</p>
                <p className="text-sm text-muted-foreground">
                  商品名稱已設定，描述和分類為選填項目
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">規格配置正確</p>
                <p className="text-sm text-muted-foreground">
                  {formData.specifications.isVariable 
                    ? '多規格商品的屬性和屬性值都已配置'
                    : '單規格商品配置完成'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="font-medium">變體資訊完整</p>
                <p className="text-sm text-muted-foreground">
                  所有變體的 SKU 和價格都已設定
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 原子化創建流程說明 */}
      <Card className="bg-card text-card-foreground border border-border/40 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5" />
            <span>準備完成</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-base font-medium text-primary">
              ✅ 所有配置已完成，可以開始創建商品
            </p>
            <p className="text-sm text-muted-foreground">
              點擊「創建商品」按鈕將會：
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• 創建商品主體和所有變體</li>
              {formData.imageData.selectedFile && (
                <li>• 自動上傳您選擇的商品圖片</li>
              )}
              <li>• 自動跳轉到商品列表頁面</li>
            </ul>
              <p className="text-sm text-muted-foreground">
              商品創建後可隨時編輯修改，所有變更都會即時生效。
              </p>
          </div>
        </CardContent>
      </Card>

      {/* 提示訊息 */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>溫馨提示：</strong>
          商品創建後，您可以隨時在商品管理頁面編輯基本資訊、調整價格或新增變體。
          所有變更都會即時生效，並保留完整的修改記錄。
        </AlertDescription>
      </Alert>
    </div>
  );
} 