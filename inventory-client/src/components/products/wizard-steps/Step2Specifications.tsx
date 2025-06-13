'use client';

import { forwardRef, useImperativeHandle, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Attribute } from '@/types/attribute';

/**
 * SKU 變體的資料結構
 */
export interface VariantData {
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
 * 導出表單值的類型，供父元件使用
 */
export type Step2Data = {
  /** 是否為多規格商品 */
  isVariable: boolean;
  /** 已選擇的屬性 ID 集合 */
  selectedAttrs: Set<number>;
  /** 屬性 ID 對應的屬性值陣列映射 */
  optionsMap: Record<number, string[]>;
  /** 變體資料陣列 */
  variants: VariantData[];
  /** 單規格商品的 SKU 編號 */
  singleSku?: string;
  /** 單規格商品的價格 */
  singlePrice?: string;
};

/**
 * Props 類型現在只接收初始資料和可用屬性
 */
interface Step2Props {
  /** 從父元件傳入的初始資料 */
  initialData: {
    isVariable: boolean;
    selectedAttrs: Set<number>;
    optionsMap: Record<number, string[]>;
  };
  /** 從父層傳入所有可選的 attributes */
  availableAttributes: Attribute[];
  /** 初始變體資料 */
  initialVariants?: VariantData[];
}

/**
 * 定義對外暴露的 ref 句柄類型
 */
export interface Step2Ref {
  /** 提交表單並返回驗證後的資料，如果驗證失敗則返回 null */
  submit: () => Promise<Step2Data | null>;
  /** 獲取當前表單資料，不進行驗證 */
  getCurrentData: () => Step2Data;
  /** 重置表單到初始狀態 */
  reset: () => void;
}

/**
 * 步驟二：規格定義表單元件（重構版）
 * 
 * 🔧 架構重構亮點：
 * 1. ✅ 使用 forwardRef 和 useImperativeHandle 暴露控制介面
 * 2. ✅ 完全獨立的內部狀態管理，切斷無限渲染迴圈
 * 3. ✅ 父元件通過 ref 控制子元件，而非回調函數
 * 4. ✅ 支援多規格驗證和錯誤處理
 * 5. ✅ 保持原有的用戶體驗和視覺設計
 * 
 * 功能特色：
 * 1. 單/多規格模式切換
 * 2. 屬性選擇與管理
 * 3. 規格值動態輸入
 * 4. 自動 SKU 組合生成
 * 5. SKU 編輯表格
 */
export const Step2Specifications = forwardRef<Step2Ref, Step2Props>(
  ({ initialData, availableAttributes, initialVariants = [] }, ref) => {
    
    // ===== 本地狀態管理系統（完全獨立） =====
    const [isVariable, setIsVariable] = useState<boolean>(initialData.isVariable);
    const [selectedAttrs, setSelectedAttrs] = useState<Set<number>>(initialData.selectedAttrs);
    const [optionsMap, setOptionsMap] = useState<Record<number, string[]>>(initialData.optionsMap);
    const [inputValues, setInputValues] = useState<Record<number, string>>({});
    const [variants, setVariants] = useState<VariantData[]>(initialVariants);
    
    // 單規格商品的狀態
    const [singleSku, setSingleSku] = useState<string>('');
    const [singlePrice, setSinglePrice] = useState<string>('0.00');

    /**
     * 檢查是否可以生成變體
     * 至少選擇一個屬性且該屬性至少有一個值
     */
    const canGenerateVariants = useMemo(() => {
      if (selectedAttrs.size === 0) return false;
      
      for (const attributeId of selectedAttrs) {
        const values = optionsMap[attributeId] || [];
        if (values.length === 0) return false;
      }
      
      return true;
    }, [selectedAttrs, optionsMap]);

    /**
     * 使用 useImperativeHandle 將控制方法暴露給父元件
     */
    useImperativeHandle(ref, () => ({
      /**
       * 提交表單方法
       * 執行表單驗證，成功時返回資料，失敗時返回 null
       */
      submit: () => {
        return new Promise<Step2Data | null>((resolve) => {
          try {
            // 多規格商品驗證
            if (isVariable) {
              if (selectedAttrs.size === 0) {
                toast.error('多規格商品必須至少選擇一個規格屬性');
                resolve(null);
                return;
              }

              // 檢查每個選中的屬性是否都有值
              for (const attrId of selectedAttrs) {
                const values = optionsMap[attrId] || [];
                if (values.length === 0) {
                  const attrName = availableAttributes.find(attr => attr.id === attrId)?.name || `屬性 ${attrId}`;
                  toast.error(`請為「${attrName}」至少添加一個規格值`);
                  resolve(null);
                  return;
                }
              }

              // 檢查是否已生成變體
              if (variants.length === 0) {
                toast.error('請點擊「生成規格組合」按鈕來生成 SKU 變體');
                resolve(null);
                return;
              }

                          // 檢查變體是否有空的 SKU
            const emptySkuVariant = variants.find(variant => !variant.sku.trim());
            if (emptySkuVariant) {
              toast.error('所有變體都必須設定 SKU 編號');
              resolve(null);
              return;
            }
          } else {
            // ✅ 單規格商品驗證
            if (!singleSku.trim()) {
              toast.error('單規格商品的 SKU 編號為必填項目');
              resolve(null);
              return;
            }
            
            if (!singlePrice.trim() || parseFloat(singlePrice) < 0) {
              toast.error('請輸入有效的商品價格');
              resolve(null);
              return;
            }
          }

          // 驗證成功，返回清理後的資料
          const cleanedData: Step2Data = {
            isVariable,
            selectedAttrs: new Set(selectedAttrs),
            optionsMap: { ...optionsMap },
            variants: [...variants],
            singleSku: singleSku.trim(),
            singlePrice: singlePrice.trim(),
          };
            
            resolve(cleanedData);
          } catch (error) {
            console.error('Step2 表單驗證失敗:', error);
            toast.error('規格定義驗證時發生錯誤');
            resolve(null);
          }
        });
      },

      /**
       * 獲取當前表單資料（不進行驗證）
       */
      getCurrentData: () => ({
        isVariable,
        selectedAttrs: new Set(selectedAttrs),
        optionsMap: { ...optionsMap },
        variants: [...variants],
        singleSku: singleSku.trim(),
        singlePrice: singlePrice.trim(),
      }),

      /**
       * 重置表單到初始狀態
       */
      reset: () => {
        setIsVariable(initialData.isVariable);
        setSelectedAttrs(new Set(initialData.selectedAttrs));
        setOptionsMap({ ...initialData.optionsMap });
        setInputValues({});
        setVariants(initialVariants);
        setSingleSku('');
        setSinglePrice('0.00');
      },
    }), [isVariable, selectedAttrs, optionsMap, variants, availableAttributes, initialData, initialVariants, singleSku, singlePrice]);

    // ===== 事件處理函式 =====
    
    /**
     * 處理多規格開關切換
     */
    const handleVariableToggle = (checked: boolean) => {
      setIsVariable(checked);
      
      // 如果關閉多規格，清空所有相關狀態
      if (!checked) {
        setSelectedAttrs(new Set());
        setOptionsMap({});
        setVariants([]);
        setInputValues({});
      }
    };

    /**
     * 處理屬性選擇切換
     */
    const handleAttributeToggle = (attributeId: number, checked: boolean) => {
      const newSelectedAttrs = new Set(selectedAttrs);
      
      if (checked) {
        newSelectedAttrs.add(attributeId);
      } else {
        newSelectedAttrs.delete(attributeId);
        
        // 移除該屬性的所有值
        const newOptionsMap = { ...optionsMap };
        delete newOptionsMap[attributeId];
        setOptionsMap(newOptionsMap);
        
        // 清空該屬性的輸入值
        const newInputValues = { ...inputValues };
        delete newInputValues[attributeId];
        setInputValues(newInputValues);
      }
      
      setSelectedAttrs(newSelectedAttrs);
    };

    /**
     * 處理屬性值輸入變更
     */
    const handleValueInputChange = (attributeId: number, value: string) => {
      setInputValues(prev => ({
        ...prev,
        [attributeId]: value
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

      const currentValues = optionsMap[attributeId] || [];
      
      // 檢查是否重複
      if (currentValues.includes(inputValue)) {
        toast.error('該屬性值已存在');
        return;
      }

      // 添加新值
      setOptionsMap(prev => ({
        ...prev,
        [attributeId]: [...currentValues, inputValue]
      }));

      // 清空輸入框
      setInputValues(prev => ({
        ...prev,
        [attributeId]: ''
      }));

      toast.success(`已添加屬性值：${inputValue}`);
    };

    /**
     * 移除屬性值
     */
    const handleRemoveAttributeValue = (attributeId: number, valueToRemove: string) => {
      setOptionsMap(prev => ({
        ...prev,
        [attributeId]: (prev[attributeId] || []).filter(value => value !== valueToRemove)
      }));

      toast.success(`已移除屬性值：${valueToRemove}`);
    };

    /**
     * 笛卡爾積輔助函數
     * 計算多個陣列的笛卡爾積，返回所有可能的組合
     */
    function cartesianProduct<T>(arrays: T[][]): T[][] {
      return arrays.reduce<T[][]>(
        (a, b) => a.flatMap(x => b.map(y => [...x, y])),
        [[]]
      );
    }

    /**
     * 生成規格組合
     * 根據選中的屬性和其值，生成所有可能的 SKU 變體組合
     */
    const handleGenerateVariants = () => {
      if (selectedAttrs.size === 0) {
        toast.error("請至少選擇一個規格屬性。");
        return;
      }

      // 準備用於計算笛卡爾積的二維陣列
      const optionsToCombine: { attributeId: number; value: string }[][] = [];
      
      for (const attrId of selectedAttrs) {
        const values = optionsMap[attrId];
        if (!values || values.length === 0) {
          toast.error("請為每一個已選的規格屬性，至少添加一個值。");
          return;
        }
        
        optionsToCombine.push(values.map(v => ({ attributeId: attrId, value: v })));
      }

      // 如果沒有任何屬性，清空變體
      if (optionsToCombine.length === 0) {
        setVariants([]);
        return;
      }

      const combinations = cartesianProduct(optionsToCombine);

      // 將組合結果轉換為 SKU 狀態格式
      const newVariants: VariantData[] = combinations.map(combo => {
        const key = combo.map(opt => `${opt.attributeId}-${opt.value}`).join('|');
        const defaultSku = combo.map(opt => opt.value.toUpperCase()).join('-');
        
        return {
          key: key,
          options: combo,
          sku: defaultSku,
          price: '0.00',
        };
      });

      setVariants(newVariants);
      
      toast.success(`已成功生成 ${newVariants.length} 個規格組合！`);
    };

    /**
     * 處理變體資料變更
     */
    const handleVariantChange = (index: number, field: 'sku' | 'price', value: string) => {
      const newVariants = [...variants];
      newVariants[index][field] = value;
      setVariants(newVariants);
    };

    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
                2
              </span>
              規格定義
            </CardTitle>
            <CardDescription>設定商品的規格屬性，支援單規格和多規格商品。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. 模式切換 Switch */}
            <div className="flex items-center space-x-3">
              <Switch
                id="variable-switch"
                checked={isVariable}
                onCheckedChange={handleVariableToggle}
              />
              <Label htmlFor="variable-switch" className="text-sm font-medium">
                此商品擁有多種規格
              </Label>
            </div>

            {/* 單規格配置 */}
            {!isVariable && (
              <div className="space-y-4">
                <Separator />
                <h4 className="text-sm font-medium">單規格商品設定</h4>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-blue-900 mb-1">單規格模式</h4>
                      <p className="text-sm text-blue-700">
                        商品只有一種規格，請直接設定 SKU 編號和價格。
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* SKU 編號 */}
                  <div className="space-y-2">
                    <Label htmlFor="single-sku">SKU 編號 *</Label>
                    <Input
                      id="single-sku"
                      placeholder="請輸入 SKU 編號"
                      value={singleSku}
                      onChange={(e) => setSingleSku(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      建議使用有意義的編號格式，如：PRODUCT-001
                    </p>
                  </div>

                  {/* 商品價格 */}
                  <div className="space-y-2">
                    <Label htmlFor="single-price">商品價格 *</Label>
                    <Input
                      id="single-price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={singlePrice}
                      onChange={(e) => setSinglePrice(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      請輸入商品的銷售價格
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. 多規格配置區 */}
            {isVariable && (
              <div className="space-y-6">
                <Separator />
                
                {/* 屬性載入狀態 */}
                {availableAttributes.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>載入屬性資料中...</span>
                  </div>
                )}

                {/* 規格選擇區 */}
                {availableAttributes.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">選擇規格屬性</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {availableAttributes.map((attribute: Attribute) => (
                        <div key={attribute.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`attr-${attribute.id}`}
                            checked={selectedAttrs.has(attribute.id)}
                            onCheckedChange={(checked) => 
                              handleAttributeToggle(attribute.id, checked === true)
                            }
                          />
                          <Label 
                            htmlFor={`attr-${attribute.id}`}
                            className="text-sm cursor-pointer"
                          >
                            {attribute.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. 規格值輸入區 */}
                {selectedAttrs.size > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <h4 className="text-sm font-medium">配置規格值</h4>
                    
                    {Array.from(selectedAttrs).map((attributeId) => {
                      const attribute = availableAttributes.find((attr: Attribute) => attr.id === attributeId);
                      if (!attribute) return null;

                      const currentValues = optionsMap[attributeId] || [];
                      const inputValue = inputValues[attributeId] || '';

                      return (
                        <Card key={attributeId} className="bg-muted/30">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">{attribute.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* 添加新值的輸入區 */}
                            <div className="flex space-x-2">
                              <Input
                                placeholder={`輸入${attribute.name}值，例如：紅色、藍色`}
                                value={inputValue}
                                onChange={(e) => handleValueInputChange(attributeId, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddAttributeValue(attributeId);
                                  }
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleAddAttributeValue(attributeId)}
                                disabled={!inputValue.trim()}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* 已添加的值列表 */}
                            {currentValues.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                  已添加的{attribute.name}值：
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {currentValues.map((value) => (
                                    <Badge 
                                      key={value} 
                                      variant="secondary"
                                      className="flex items-center gap-1"
                                    >
                                      {value}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 ml-1 hover:bg-transparent"
                                        onClick={() => handleRemoveAttributeValue(attributeId, value)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* 4. SKU 生成按鈕與變體編輯表格 */}
                {selectedAttrs.size > 0 && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium">生成 SKU 變體</h4>
                        <p className="text-xs text-muted-foreground">
                          根據選擇的規格屬性組合生成所有可能的 SKU 變體
                        </p>
                      </div>
                      <Button
                        type="button"
                        onClick={handleGenerateVariants}
                        disabled={!canGenerateVariants}
                        variant="default"
                        size="sm"
                        className="min-w-[120px]"
                      >
                        {variants.length > 0 ? '重新生成組合' : '生成規格組合'}
                      </Button>
                    </div>
                    
                    {/* 顯示已生成的變體數量 */}
                    {variants.length > 0 && (
                      <div className="bg-muted/50 rounded-lg p-3">
                        <p className="text-sm text-muted-foreground">
                          已生成 <span className="font-medium text-foreground">{variants.length}</span> 個 SKU 變體，
                          包含 <span className="font-medium text-foreground">{selectedAttrs.size}</span> 種規格屬性的組合
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SKU 變體編輯表格 */}
            {variants.length > 0 && isVariable && (
              <div className="space-y-4">
                <Separator />
                <div>
                  <h4 className="text-sm font-medium mb-2">編輯 SKU 變體</h4>
                  <p className="text-xs text-muted-foreground mb-4">
                    為每一個自動生成的規格組合，設定唯一的 SKU 編號和價格。
                  </p>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>規格組合</TableHead>
                          <TableHead>SKU 編號</TableHead>
                          <TableHead>價格</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {variants.map((variant, index) => (
                          <TableRow key={variant.key}>
                            <TableCell className="font-medium">
                              {variant.options.map(opt => opt.value).join(' / ')}
                            </TableCell>
                            <TableCell>
                              <Input
                                value={variant.sku}
                                onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                                placeholder="輸入 SKU 編號"
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.price}
                                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                                placeholder="0.00"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}

            {/* 新架構狀態指示 */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  架構模式：ref 控制模式（已解決無限渲染問題）| 規格模式：{isVariable ? '多規格' : '單規格'}
                </span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-600 text-xs">獨立狀態管理</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

// 設定 displayName 以便於 React DevTools 除錯
Step2Specifications.displayName = "Step2Specifications"; 