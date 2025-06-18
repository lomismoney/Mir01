'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { AlertCircle, Settings, Plus, X, Package, Tag, HelpCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WizardFormData } from '../CreateProductWizard';
import { useAttributes } from '@/hooks/queries/useEntityQueries';
import { Attribute } from '@/types/products';
import { toast } from 'sonner';
import { useSession } from 'next-auth/react';

/**
 * 步驟2組件Props
 */
interface Step2Props {
  formData: WizardFormData;
  updateFormData: <K extends keyof WizardFormData>(
    section: K,
    data: Partial<WizardFormData[K]>
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
  const { data: attributesData, isLoading: attributesLoading, error: attributesError } = useAttributes();
  
  // 修正：處理 API 回應結構 {data: [...]}
  const attributes: Attribute[] = React.useMemo(() => {
    if (!attributesData) return [];
    
    // 檢查是否是 ResourceCollection 格式 {data: [...]}
    if (typeof attributesData === 'object' && 'data' in attributesData && Array.isArray(attributesData.data)) {
      return attributesData.data as Attribute[];
    }
    
    // 如果直接是陣列格式
    if (Array.isArray(attributesData)) {
      return attributesData as Attribute[];
    }
    
    console.warn('Unexpected attributes data structure:', attributesData);
    return [];
  }, [attributesData]);
  
  // 除錯資訊
  React.useEffect(() => {
    console.log('=== Attributes Debug Info ===');
    console.log('Session status:', status);
    console.log('Session data:', session);
    console.log('User API token:', session?.user?.apiToken ? '✅ 有 token' : '❌ 無 token');
    console.log('Loading:', attributesLoading);
    console.log('Error:', attributesError);
    console.log('Raw API Data:', attributesData);
    console.log('Data type:', typeof attributesData);
    console.log('Is array:', Array.isArray(attributesData));
    console.log('Has data property:', attributesData && typeof attributesData === 'object' && 'data' in attributesData);
    console.log('Processed attributes:', attributes);
    console.log('Attributes count:', attributes.length);
    
    // 詳細檢查每個屬性的值
    attributes.forEach((attr, index) => {
      console.log(`Attribute ${index + 1}:`, {
        id: attr.id,
        name: attr.name,
        values: attr.values,
        valuesCount: attr.values?.length || 0
      });
    });
    
    console.log('===============================');
  }, [status, session, attributesLoading, attributesError, attributesData, attributes]);
  
  // 本地狀態：屬性值輸入框
  const [inputValues, setInputValues] = useState<Record<number, string>>({});

  /**
   * 處理規格類型切換
   */
  const handleSpecTypeChange = (isVariable: boolean) => {
    updateFormData('specifications', {
      isVariable,
      selectedAttributes: isVariable ? formData.specifications.selectedAttributes : [],
      attributeValues: isVariable ? formData.specifications.attributeValues : {},
    });
    
    // 如果切換到單規格，清空變體資料
    if (!isVariable) {
      updateFormData('variants', {
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
      : currentSelected.filter(id => id !== attributeId);
    
    const newAttributeValues = { ...formData.specifications.attributeValues };
    
    if (checked) {
      // 如果選擇屬性，自動添加預設值
      const attribute = attributes.find(attr => attr.id === attributeId);
      if (attribute?.values && attribute.values.length > 0) {
        const defaultValues = attribute.values.map(v => v.value);
        newAttributeValues[attributeId] = defaultValues;
        toast.success(`已自動添加 ${attribute.name} 的 ${defaultValues.length} 個預設值`);
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

    updateFormData('specifications', {
      selectedAttributes: newSelected,
      attributeValues: newAttributeValues,
    });
  };

  /**
   * 處理屬性值輸入變更
   */
  const handleValueInputChange = (attributeId: number, value: string) => {
    setInputValues(prev => ({
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
      toast.error('請輸入屬性值');
      return;
    }

    const currentValues = formData.specifications.attributeValues[attributeId] || [];
    
    // 檢查是否重複
    if (currentValues.includes(inputValue)) {
      toast.error('該屬性值已存在');
      return;
    }

    // 添加新值
    const newAttributeValues = {
      ...formData.specifications.attributeValues,
      [attributeId]: [...currentValues, inputValue],
    };

    updateFormData('specifications', {
      attributeValues: newAttributeValues,
    });

    // 清空輸入框
    setInputValues(prev => ({
      ...prev,
      [attributeId]: '',
    }));

    toast.success(`已添加屬性值：${inputValue}`);
  };

  /**
   * 移除屬性值
   */
  const handleRemoveAttributeValue = (attributeId: number, valueToRemove: string) => {
    const currentValues = formData.specifications.attributeValues[attributeId] || [];
    const newValues = currentValues.filter(value => value !== valueToRemove);
    
    const newAttributeValues = {
      ...formData.specifications.attributeValues,
      [attributeId]: newValues,
    };

    updateFormData('specifications', {
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
  }, [formData.specifications.selectedAttributes, formData.specifications.attributeValues]);

  /**
   * 檢查是否可以進入下一步
   */
  const canProceed = useMemo(() => {
    if (!formData.specifications.isVariable) {
      return true; // 單規格可以直接進入下一步
    }
    
    // 多規格需要至少選擇一個屬性且有屬性值
    return formData.specifications.selectedAttributes.length > 0 && potentialVariantsCount > 0;
  }, [formData.specifications.isVariable, formData.specifications.selectedAttributes.length, potentialVariantsCount]);

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* 規格類型選擇 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="specType" className="text-sm font-medium">
              規格類型
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>根據您的商品特性，選擇單規格或多規格管理方式</p>
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
              {formData.specifications.isVariable ? '多規格商品' : '單規格商品'}
            </Label>
          </div>
          <div className="text-xs text-gray-500">
            {formData.specifications.isVariable ? (
              '適合有多種選項的商品（顏色、尺寸等）'
            ) : (
              '適合統一規格的商品（書籍、食品等）'
            )}
          </div>
        </div>

      {/* 多規格配置 */}
      {formData.specifications.isVariable && (
        <>
          {/* 屬性選擇 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
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
                  <div className="text-muted-foreground">載入屬性資料中...</div>
                </div>
              ) : attributes.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    尚未建立任何屬性。請先到「規格管理」頁面建立屬性，如顏色、尺寸等。
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {attributes.map((attribute) => (
                    <div
                      key={attribute.id}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        id={`attr-${attribute.id}`}
                        checked={formData.specifications.selectedAttributes.includes(attribute.id)}
                        onCheckedChange={(checked) => 
                          handleAttributeToggle(attribute.id, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`attr-${attribute.id}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium">{attribute.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {attribute.values?.length || 0} 個預設值
                          {attribute.values && attribute.values.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {attribute.values.slice(0, 3).map((value) => (
                                <Badge key={value.id} variant="outline" className="text-xs">
                                  {value.value}
                                </Badge>
                              ))}
                              {attribute.values.length > 3 && (
                                <Badge variant="outline" className="text-xs">
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>管理屬性值</span>
                </CardTitle>
                <CardDescription>
                  為選中的屬性添加或管理屬性值，這些值將用於生成商品變體。
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {formData.specifications.selectedAttributes.map((attributeId) => {
                  const attribute = attributes.find(attr => attr.id === attributeId);
                  if (!attribute) return null;

                  const currentValues = formData.specifications.attributeValues[attributeId] || [];

                  return (
                    <div key={attributeId} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">
                          {attribute.name}
                        </Label>
                        <Badge variant="outline">
                          {currentValues.length} 個值
                        </Badge>
                      </div>

                      {/* 添加屬性值 */}
                      <div className="flex space-x-2">
                        <Input
                          placeholder={`輸入${attribute.name}的值，如：紅色、藍色`}
                          value={inputValues[attributeId] || ''}
                          onChange={(e) => handleValueInputChange(attributeId, e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddAttributeValue(attributeId);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={() => handleAddAttributeValue(attributeId)}
                          className="shrink-0"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          添加
                        </Button>
                      </div>

                      {/* 現有屬性值 */}
                      {currentValues.length > 0 && (
                        <div className="flex flex-wrap gap-2">
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
                                onClick={() => handleRemoveAttributeValue(attributeId, value)}
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
                })}
              </CardContent>
            </Card>
          )}

          {/* 變體預覽 */}
          {potentialVariantsCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>變體預覽</span>
                </CardTitle>
                <CardDescription>
                  根據您選擇的屬性和屬性值，將生成以下變體組合。
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-4 rounded-lg border bg-muted/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {potentialVariantsCount}
                    </div>
                    <div className="text-sm text-muted-foreground">
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
          {formData.specifications.isVariable ? (
            canProceed ? (
              `已配置 ${formData.specifications.selectedAttributes.length} 個屬性，
              將生成 ${potentialVariantsCount} 個變體。可以進入下一步配置變體詳情。`
            ) : (
              '請至少選擇一個屬性並為其添加屬性值，才能進入下一步。'
            )
          ) : (
            '單規格商品配置完成，可以直接進入下一步設定價格和庫存。'
          )}
        </AlertDescription>
      </Alert>
      </div>
    </TooltipProvider>
  );
} 