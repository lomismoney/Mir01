'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  useAttributes,
  useCreateProduct // 新增：導入商品創建 Hook
} from '@/hooks/queries/useEntityQueries';
import { 
  type Attribute, 
  type ProductSubmissionData 
} from '@/types/products';
import { Plus, X, Package, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * 商品表單資料介面
 */
interface ProductFormData {
  name: string;
  description?: string;
  category_id?: number | null;
  // SPU/SKU 相關欄位會在後續開發中添加
}

/**
 * SKU 變體的臨時資料結構
 */
interface VariantData {
  /** 由規格值 ID 組成的唯一鍵，例如 "1-3" 代表 "紅色-S" */
  key: string;
  /** 屬性選項陣列 */
  options: { attributeId: number; value: string }[];
  /** SKU 編號 */
  sku: string;
  /** 價格 */
  price: string;
}

/**
 * 商品表單元件 Props
 */
interface ProductFormProps {
  /** 初始表單資料 */
  initialData?: Partial<ProductFormData>;
  /** 表單標題 */
  title?: string;
  /** 表單描述 */
  description?: string;
}

/**
 * 可重用的商品表單元件
 * 
 * 提供完整的商品資訊輸入功能，包含：
 * - 基本資訊輸入（商品名稱、描述、分類）
 * - 規格定義（單規格/多規格切換）
 * - 屬性選擇與屬性值管理
 * - 動態的 SKU 變體配置
 */
export function ProductForm({
  initialData = {},
  title = '商品資訊',
  description = '請填寫商品的基本資訊和規格定義'
}: ProductFormProps) {
  // Next.js 路由器
  const router = useRouter();
  
  // 獲取屬性資料
  const { data: attributesData, isLoading: attributesLoading, error: attributesError } = useAttributes();
  
  // 商品創建 Mutation
  const createProductMutation = useCreateProduct();
  
  // 確保類型安全的屬性資料
  const attributes: Attribute[] = Array.isArray(attributesData) ? attributesData : [];
  
  // 表單載入狀態
  const isLoading = createProductMutation.isPending;

  // 基本表單狀態
  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    category_id: initialData.category_id || null,
  });

  // 規格相關狀態
  const [isVariable, setIsVariable] = useState(false);
  const [selectedAttrs, setSelectedAttrs] = useState<Set<number>>(new Set());
  const [optionsMap, setOptionsMap] = useState<Record<number, string[]>>({});
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  
  // SKU 變體狀態
  const [variants, setVariants] = useState<VariantData[]>([]);

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
   * 處理基本表單欄位變更
   */
  const handleFieldChange = (field: keyof ProductFormData, value: string | number | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
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
   * 
   * 計算多個陣列的笛卡爾積，返回所有可能的組合
   * @param arrays 二維陣列，每個子陣列代表一個維度的可選值
   * @returns 所有可能組合的陣列
   */
  function cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce<T[][]>(
      (a, b) => a.flatMap(x => b.map(y => [...x, y])),
      [[]]
    );
  }

  /**
   * 生成規格組合
   * 
   * 根據選中的屬性和其值，生成所有可能的 SKU 變體組合。
   * 使用笛卡爾積算法來計算所有可能的屬性值組合。
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

    // 如果只有一個規格，不需要做笛卡爾積
    if (optionsToCombine.length === 0) {
      setVariants([]);
      return;
    }

    const combinations = cartesianProduct(optionsToCombine);

    // 將組合結果轉換為我們需要的 SKU 狀態格式
    const newVariants: VariantData[] = combinations.map(combo => {
      // combo 是一個陣列，例如 [{ attrId: 1, value: '紅色' }, { attrId: 2, value: 'S' }]
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
   * 處理表單提交 - 總裝提交邏輯
   * 
   * 將完整的 SPU/SKU 狀態轉換為後端 API 所需的格式，
   * 並透過 useCreateProduct Hook 提交到後端
   */
  /**
   * 處理表單提交
   * 
   * 功能說明：
   * 1. 驗證表單資料完整性
   * 2. 準備符合後端 API 格式的資料
   * 3. 提交商品創建請求（暫時模擬）
   * 4. 成功後導航回商品列表頁面
   */
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // 防止重複提交
    if (createProductMutation.isPending) return;
    
    // === 1. 基礎數據驗證 ===
    if (!formData.name.trim()) {
      toast.error('請填寫商品名稱。');
      return;
    }

    if (isVariable && selectedAttrs.size === 0) {
      toast.error('多規格商品模式下，請至少選擇一個規格屬性。');
      return;
    }

    if (isVariable && variants.length === 0) {
      toast.error('多規格商品模式下，請至少生成一個規格組合 (SKU)。');
      return;
    }

    // 檢查已選屬性是否都有值
    if (isVariable) {
      for (const attrId of selectedAttrs) {
        const values = optionsMap[attrId] || [];
        if (values.length === 0) {
          const attribute = attributes.find((attr: Attribute) => attr.id === attrId);
          toast.error(`請為「${attribute?.name || '屬性'}」添加至少一個值`);
          return;
        }
      }
    }

    // === 2. 準備 API 請求的數據格式 ===
    try {
      // 準備正確的後端 API 格式
      const correctSubmissionData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        attributes: Array.from(selectedAttrs), // 整數陣列
        variants: isVariable ? variants.map(variant => {
          // 將前端的 options 轉換為後端需要的格式
          const attributeValueIds = variant.options.map(opt => {
            // 在 attributes 數據中尋找對應的 attribute_value_id
            const attribute = attributes.find(attr => attr.id === opt.attributeId);
            const attributeValue = attribute?.values?.find(val => val.value === opt.value);
            
            if (!attributeValue) {
              throw new Error(`找不到屬性值：${opt.value}（屬性：${attribute?.name || opt.attributeId}）`);
            }
            
            return attributeValue.id;
          });

          return {
            sku: variant.sku || 'DEFAULT-SKU',
            price: parseFloat(variant.price) || 0,
            attribute_value_ids: attributeValueIds,
          };
        }) : [],
      };

      // 使用正確的類型定義，替代之前的 any 類型斷言
      const submissionData: ProductSubmissionData = correctSubmissionData;

      // === 3. 調用實際的 API 端點 ===
      console.log('準備提交的資料:', submissionData);
      
      // 使用 createProductMutation 進行實際的 API 調用
      await createProductMutation.mutateAsync(submissionData);
      
      // 顯示成功訊息
      toast.success('商品創建成功！');
      
      // === 4. 成功後導航回商品列表 ===
      router.push('/products');

    } catch (error) {
      console.error('商品創建失敗：', error);
      toast.error(`商品創建失敗：${(error as Error).message}`);
    }
  };

  // 載入狀態處理
  if (attributesLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>載入屬性資料中...</span>
        </CardContent>
      </Card>
    );
  }

  // 錯誤狀態處理
  if (attributesError) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-red-600">
            <p>載入屬性資料失敗</p>
            <p className="text-sm text-muted-foreground mt-1">請重試或聯繫系統管理員</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 表單標題 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 商品名稱 */}
          <div className="space-y-2">
            <Label htmlFor="name">商品名稱 *</Label>
            <Input
              id="name"
              placeholder="請輸入商品名稱"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>

          {/* 商品描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">商品描述</Label>
            <Textarea
              id="description"
              placeholder="請輸入商品詳細描述"
              value={formData.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 規格定義區 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            規格定義
          </CardTitle>
          <CardDescription>
            設定商品的規格屬性，支援單規格和多規格商品
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 多規格切換開關 */}
          <div className="flex items-center space-x-3">
            <Switch
              id="variable-switch"
              checked={isVariable}
              onCheckedChange={setIsVariable}
              disabled={isLoading}
            />
            <Label htmlFor="variable-switch" className="text-sm font-medium">
              此商品擁有多種規格
            </Label>
          </div>

          {/* 多規格配置區 */}
          {isVariable && (
            <div className="space-y-6">
              <Separator />
              
              {/* 規格選擇區 */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">選擇規格屬性</h4>
                                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                   {attributes.map((attribute: Attribute) => (
                     <div key={attribute.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`attr-${attribute.id}`}
                        checked={selectedAttrs.has(attribute.id)}
                        onCheckedChange={(checked) => 
                          handleAttributeToggle(attribute.id, checked === true)
                        }
                        disabled={isLoading}
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

              {/* 規格值輸入區 */}
              {selectedAttrs.size > 0 && (
                <div className="space-y-4">
                  <Separator />
                  <h4 className="text-sm font-medium">配置規格值</h4>
                  
                                     {Array.from(selectedAttrs).map((attributeId) => {
                     const attribute = attributes.find((attr: Attribute) => attr.id === attributeId);
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
                              disabled={isLoading}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddAttributeValue(attributeId)}
                              disabled={isLoading || !inputValue.trim()}
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
                                      disabled={isLoading}
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

              {/* 生成規格組合按鈕 */}
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
                      disabled={!canGenerateVariants || isLoading}
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
        </CardContent>
      </Card>

      {/* SKU 變體編輯表格 */}
      {variants.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>編輯規格 (SKU)</CardTitle>
            <CardDescription>為每一個自動生成的規格組合，設定唯一的 SKU 編號和價格。</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>規格</TableHead>
                  <TableHead>SKU 編號</TableHead>
                  <TableHead>價格</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variants.map((variant, index) => (
                  <TableRow key={variant.key}>
                    <TableCell>
                      {variant.options.map(opt => opt.value).join(' / ')}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={variant.sku}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[index].sku = e.target.value;
                          setVariants(newVariants);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={variant.price}
                        onChange={(e) => {
                          const newVariants = [...variants];
                          newVariants[index].price = e.target.value;
                          setVariants(newVariants);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* 表單操作按鈕 */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" disabled={isLoading}>
          取消
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          建立商品
        </Button>
      </div>
    </form>
  );
}
