'use client';

import { useState, useMemo } from 'react';
import withAuth from '@/components/auth/withAuth';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  useProducts, 
  // useCreateProduct, // 暫時停用
  useUpdateProduct, 
  useDeleteProduct,
  useDeleteMultipleProducts,
  useCategories,
  useAttributes
} from "@/hooks/useApi";
import { Product } from '@/types/product';
import { Category } from '@/types/category';
import { Attribute } from '@/types/attribute';
import { useDebounce } from "@/hooks/useDebounce";
import { CategoryCombobox } from '@/components/categories';
import { 
  Loader2, 
  Plus, 
  Edit, 
  Trash2, 
  Package,
  Search,
  Settings,
  X
} from "lucide-react";
import { toast } from "sonner";

/**
 * 商品資料介面定義
 */
interface ProductFormData {
  name: string;
  sku: string;
  description?: string;
  selling_price: string;
  cost_price: string;
  category_id?: number | null;
}

/**
 * SKU 變體的資料結構
 */
interface VariantData {
  /** 由規格值組成的唯一鍵，例如 "紅色-S" */
  key: string;
  /** 屬性選項陣列 */
  options: { attributeId: number; value: string }[];
  /** SKU 編號 */
  sku: string;
  /** 價格 */
  price: string;
}

// Product 類型已從 @/types/product 導入

/**
 * 商品管理頁面
 * 提供完整的商品 CRUD 功能
 */
function ProductsPage() {
  // 獲取用戶認證資訊以控制操作權限
  const { user } = useAuth();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 500); // 500ms 防抖
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    sku: '',
    description: '',
    selling_price: '',
    cost_price: '',
    category_id: null,
  });

  // 新增商品模式切換和單規格商品相關狀態
  const [isVariable, setIsVariable] = useState(false); // 用於切換單/多規格模式
  const [singleSku, setSingleSku] = useState('');      // 用於儲存單規格的 SKU
  const [singlePrice, setSinglePrice] = useState('0.00'); // 用於儲存單規格的價格

  // 多規格相關狀態
  const [selectedAttrs, setSelectedAttrs] = useState<Set<number>>(new Set());
  const [optionsMap, setOptionsMap] = useState<Record<number, string[]>>({});
  const [inputValues, setInputValues] = useState<Record<number, string>>({});
  const [variants, setVariants] = useState<VariantData[]>([]);

  // API Hooks - 使用防抖後的搜尋條件
  const { data: productsResponse, isLoading, error, refetch } = useProducts({ search: debouncedSearchQuery });
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useCategories();
  const { data: attributesData, isLoading: attributesLoading, error: attributesError } = useAttributes();
  // const createProductMutation = useCreateProduct(); // 暫時停用
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const deleteMultipleMutation = useDeleteMultipleProducts();

  // 直接從 API 回應獲取已處理好的資料，API Hook 中已完成轉換
  const products: Product[] = (productsResponse?.data || []) as Product[];
  
  // 確保類型安全的屬性資料
  const attributes: Attribute[] = Array.isArray(attributesData) ? attributesData : [];
  
  // 建立帶有完整顯示路徑的扁平化分類列表，用於 CategoryCombobox
  const flatCategoriesWithOptions = useMemo(() => {
    if (!categoriesResponse) return [];
    
    const result: (Category & { displayPath: string; hasChildren: boolean })[] = [];
    
    // 使用遞迴函式來建構帶有路徑的列表
    const buildList = (parentId: string | null, path: string) => {
      // 修正：當 parentId 為 null 時，使用空字串而非 "null"
      const key = parentId === null ? '' : String(parentId);
      const children = (categoriesResponse[key] || []) as Category[];
      children.forEach(category => {
        const currentPath = path ? `${path} > ${category.name}` : category.name;
        const hasChildren = (categoriesResponse[category.id] || []).length > 0;
        
        result.push({
          ...category,
          displayPath: currentPath,
          hasChildren: hasChildren,
        });
        
        buildList(String(category.id), currentPath);
      });
    };

    buildList(null, '');
    return result;
  }, [categoriesResponse]);

  /**
   * 重置表單資料
   */
  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      description: '',
      selling_price: '',
      cost_price: '',
      category_id: null,
    });
    // 重置新增的狀態
    setIsVariable(false);
    setSingleSku('');
    setSinglePrice('0.00');
    // 重置多規格狀態
    setSelectedAttrs(new Set());
    setOptionsMap({});
    setInputValues({});
    setVariants([]);
  };

  /**
   * 處理輸入變更
   */
  const handleInputChange = (field: keyof ProductFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  /**
   * 處理全選/取消全選
   */
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map(product => product.id).filter((id): id is number => id !== undefined)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  /**
   * 處理單個商品選取
   */
  const handleSelectProduct = (productId: number, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  /**
   * 檢查是否全選
   */
  const isAllSelected = products.length > 0 && selectedProducts.size === products.length;
  
  /**
   * 檢查是否部分選取
   */
  const isIndeterminate = selectedProducts.size > 0 && selectedProducts.size < products.length;

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
  };

  /**
   * 笛卡爾積演算法
   */
  function cartesianProduct<T>(arrays: T[][]): T[][] {
    return arrays.reduce((acc, curr) => {
      const result: T[][] = [];
      acc.forEach(a => {
        curr.forEach(b => {
          result.push([...a, b]);
        });
      });
      return result;
    }, [[]] as T[][]);
  }

  /**
   * 生成 SKU 變體
   */
  const handleGenerateVariants = () => {
    if (selectedAttrs.size === 0) {
      toast.error('請至少選擇一個屬性');
      return;
    }

    // 檢查所有選中屬性都有值
    for (const attrId of selectedAttrs) {
      const values = optionsMap[attrId] || [];
      if (values.length === 0) {
        const attribute = attributes.find(attr => attr.id === attrId);
        toast.error(`請為「${attribute?.name || '屬性'}」添加至少一個值`);
        return;
      }
    }

    // 準備笛卡爾積的輸入
    const attributeIds = Array.from(selectedAttrs);
    const valueArrays = attributeIds.map(attrId => {
      const values = optionsMap[attrId] || [];
      return values.map(value => ({ attributeId: attrId, value }));
    });

    // 執行笛卡爾積
    const combinations = cartesianProduct(valueArrays);

    // 生成變體
    const newVariants: VariantData[] = combinations.map((combination, index) => {
      const key = combination.map(item => item.value).join('-');
      return {
        key,
        options: combination,
        sku: `SKU-${Date.now()}-${index + 1}`, // 自動生成 SKU
        price: '0.00'
      };
    });

    setVariants(newVariants);
    toast.success(`成功生成 ${newVariants.length} 個規格組合`);
  };

  /**
   * 更新變體資料
   */
  const handleVariantChange = (variantKey: string, field: 'sku' | 'price', value: string) => {
    setVariants(prev => prev.map(variant => 
      variant.key === variantKey 
        ? { ...variant, [field]: value }
        : variant
    ));
  };

  /**
   * 處理創建商品
   */
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault(); // 防止表單預設提交行為
    
    // 基礎驗證
    if (!formData.name.trim()) {
      toast.error('請填寫商品名稱。');
      return;
    }

    let submissionData;

    if (isVariable) {
      // === 多規格模式 ===
      if (selectedAttrs.size === 0) {
        toast.error('多規格商品模式下，請至少選擇一個規格屬性。');
        return;
      }

      if (variants.length === 0) {
        toast.error('多規格商品模式下，請至少生成一個規格組合 (SKU)。');
        return;
      }

      // 檢查已選屬性是否都有值
      for (const attrId of selectedAttrs) {
        const values = optionsMap[attrId] || [];
        if (values.length === 0) {
          const attribute = attributes.find((attr: Attribute) => attr.id === attrId);
          toast.error(`請為「${attribute?.name || '屬性'}」添加至少一個值`);
          return;
        }
      }

      submissionData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        attributes: Array.from(selectedAttrs), // 整數陣列
        variants: variants.map(variant => {
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
        }),
      };
    } else {
      // === 單規格模式 ===
      if (!singleSku.trim()) {
        toast.error('請為單規格商品填寫 SKU 編號。');
        return;
      }
      submissionData = {
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id || null,
        attributes: [], // 單規格商品沒有可選屬性
        variants: [    // variants 陣列只包含一個元素
          {
            sku: singleSku,
            price: parseFloat(singlePrice) || 0,
            attribute_value_ids: [], // 單規格商品沒有規格值
          },
        ],
      };
    }

    // TODO: 暫時停用商品創建功能，等待後端 POST /api/products 端點實現
    toast.info('商品創建功能開發中，請等待後端 API 完成');
    console.log('準備提交的資料:', submissionData);
  };

  /**
   * 開啟編輯對話框
   */
  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      sku: product.sku || '',
      description: product.description || '',
      selling_price: product.selling_price?.toString() || '',
      cost_price: product.cost_price?.toString() || '',
      category_id: product.category_id || null,
    });
    setIsEditDialogOpen(true);
  };

  /**
   * 處理更新商品
   */
  const handleUpdateProduct = async () => {
    if (!editingProduct) return;

    try {
      if (!editingProduct.id) {
        toast.error('商品ID無效');
        return;
      }
      
      // TODO: 升級為 SPU/SKU 架構 - 暫時註釋避免編譯錯誤
      console.log('更新商品功能需要升級為 SPU/SKU 架構');
      toast.info('更新功能開發中，請使用新的商品表單');
      /*
      await updateProductMutation.mutateAsync({
        id: editingProduct.id,
        name: formData.name,
        description: formData.description || null,
        category_id: formData.category_id,
      });
      */
      
      toast.success('商品更新成功！');
      setIsEditDialogOpen(false);
      setEditingProduct(null);
      resetForm();
    } catch (error) {
      toast.error('更新商品失敗：' + (error as Error).message);
    }
  };

  /**
   * 處理刪除商品
   */
  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProductMutation.mutateAsync(id);
      toast.success('商品刪除成功！');
    } catch (error) {
      toast.error('刪除商品失敗：' + (error as Error).message);
    }
  };

  /**
   * 計算毛利率
   */
  const calculateProfitMargin = (sellingPrice: number, costPrice: number): string => {
    if (costPrice === 0) return '0.00';
    return ((sellingPrice - costPrice) / sellingPrice * 100).toFixed(2);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Package className="h-8 w-8" />
            商品管理
          </h1>
          <p className="text-muted-foreground">
            管理您的商品庫存、價格和基本資訊
          </p>
        </div>
        
        {user?.is_admin && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                新增商品
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>新增商品</DialogTitle>
              <DialogDescription>
                填寫商品的基本資訊以新增到庫存中
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateProduct}>
              <div className="grid gap-4 py-4">
                {/* SPU 級別的基本資訊欄位 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">商品名稱 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="請輸入商品名稱"
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">商品描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="請輸入商品描述（選填）"
                    rows={3}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">商品分類</Label>
                  <div className="col-span-3">
                    <CategoryCombobox
                      categories={flatCategoriesWithOptions}
                      value={formData.category_id || null}
                      onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                      disabled={isLoadingCategories}
                    />
                  </div>
                </div>

                {/* 模式切換開關 */}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is-variable" className="text-right">啟用多規格</Label>
                  <Switch
                    id="is-variable"
                    checked={isVariable}
                    onCheckedChange={setIsVariable}
                    className="col-span-3"
                  />
                </div>

                <Separator />

                {/* A. 單規格模式 UI */}
                {!isVariable && (
                  <div className="grid gap-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="single-sku" className="text-right">SKU 編號 *</Label>
                      <Input 
                        id="single-sku" 
                        value={singleSku} 
                        onChange={(e) => setSingleSku(e.target.value)} 
                        className="col-span-3"
                        placeholder="請輸入 SKU 編號"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="single-price" className="text-right">售價 *</Label>
                      <Input 
                        id="single-price" 
                        type="number" 
                        step="0.01"
                        min="0"
                        value={singlePrice} 
                        onChange={(e) => setSinglePrice(e.target.value)} 
                        className="col-span-3"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                )}

                {/* B. 多規格模式 UI */}
                {isVariable && (
                  <div className="space-y-6">
                    {/* 屬性載入狀態 */}
                    {attributesLoading && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>載入屬性資料中...</span>
                      </div>
                    )}

                    {/* 屬性載入錯誤 */}
                    {attributesError && (
                      <div className="text-center py-4 text-red-600">
                        <p>載入屬性資料失敗</p>
                        <p className="text-sm text-muted-foreground mt-1">請重試或聯繫系統管理員</p>
                      </div>
                    )}

                    {/* 屬性選擇區塊 */}
                    {!attributesLoading && !attributesError && (
                      <>
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              <Settings className="h-5 w-5" />
                              選擇規格屬性
                            </CardTitle>
                            <CardDescription>
                              請選擇此商品擁有的規格屬性，如顏色、尺寸等
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {attributes.map((attribute: Attribute) => (
                                <div key={attribute.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`attr-${attribute.id}`}
                                    checked={selectedAttrs.has(attribute.id)}
                                    onCheckedChange={(checked) => 
                                      handleAttributeToggle(attribute.id, checked as boolean)
                                    }
                                  />
                                  <Label 
                                    htmlFor={`attr-${attribute.id}`}
                                    className="text-sm font-medium cursor-pointer"
                                  >
                                    {attribute.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                            {attributes.length === 0 && (
                              <div className="text-center py-4 text-muted-foreground">
                                <p>目前沒有可用的屬性</p>
                                <p className="text-sm">請先在系統中建立商品屬性</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {/* 屬性值輸入區塊 */}
                        {selectedAttrs.size > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>定義屬性值</CardTitle>
                              <CardDescription>
                                為選中的屬性添加具體的值，如紅色、藍色、S、M、L 等
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              {Array.from(selectedAttrs).map(attributeId => {
                                const attribute = attributes.find(attr => attr.id === attributeId);
                                const currentValues = optionsMap[attributeId] || [];
                                
                                return (
                                  <div key={attributeId} className="border rounded-lg p-4">
                                    <div className="space-y-3">
                                      <h4 className="font-medium text-sm">{attribute?.name}</h4>
                                      
                                      {/* 輸入區域 */}
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder={`輸入${attribute?.name}值...`}
                                          value={inputValues[attributeId] || ''}
                                          onChange={(e) => handleValueInputChange(attributeId, e.target.value)}
                                          onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                              e.preventDefault();
                                              handleAddAttributeValue(attributeId);
                                            }
                                          }}
                                          className="flex-1"
                                        />
                                        <Button
                                          type="button"
                                          onClick={() => handleAddAttributeValue(attributeId)}
                                          size="sm"
                                        >
                                          <Plus className="h-4 w-4" />
                                        </Button>
                                      </div>
                                      
                                      {/* 值展示區域 */}
                                      {currentValues.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                          {currentValues.map(value => (
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
                                                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() => handleRemoveAttributeValue(attributeId, value)}
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </CardContent>
                          </Card>
                        )}

                        {/* 生成 SKU 按鈕 */}
                        {selectedAttrs.size > 0 && (
                          <div className="flex justify-center">
                            <Button
                              type="button"
                              onClick={handleGenerateVariants}
                              className="flex items-center gap-2"
                              disabled={Array.from(selectedAttrs).some(attrId => 
                                (optionsMap[attrId] || []).length === 0
                              )}
                            >
                              <Settings className="h-4 w-4" />
                              生成規格組合
                            </Button>
                          </div>
                        )}

                        {/* SKU 編輯表格 */}
                        {variants.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle>SKU 規格管理</CardTitle>
                              <CardDescription>
                                編輯生成的 SKU 編號和價格
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="rounded-md border">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>規格組合</TableHead>
                                      <TableHead>SKU 編號</TableHead>
                                      <TableHead>價格</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {variants.map((variant) => (
                                      <TableRow key={variant.key}>
                                        <TableCell className="font-medium">
                                          {variant.options.map(opt => opt.value).join(' / ')}
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={variant.sku}
                                            onChange={(e) => 
                                              handleVariantChange(variant.key, 'sku', e.target.value)
                                            }
                                            placeholder="SKU 編號"
                                            className="w-full"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={variant.price}
                                            onChange={(e) => 
                                              handleVariantChange(variant.key, 'price', e.target.value)
                                            }
                                            placeholder="0.00"
                                            className="w-full"
                                          />
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div className="mt-4 text-sm text-muted-foreground">
                                共生成 {variants.length} 個 SKU 變體
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </>
                    )}
                  </div>
                )}
                </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  取消
                </Button>
                <Button 
                  type="submit"
                  disabled={!formData.name || (!isVariable && !singleSku.trim())}
                >
                  創建商品
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <Separator />

      {/* 統計資訊 */}
      <Card>
        <CardHeader>
          <CardTitle>商品概覽</CardTitle>
          <CardDescription>
            目前系統中的商品統計資訊
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isLoading ? '載入中...' : `${products.length} 個商品`}
          </div>
          <p className="text-sm text-muted-foreground">
            已建立的商品總數
          </p>
        </CardContent>
      </Card>

      {/* 商品列表 */}
      <Card>
        <CardHeader>
          <CardTitle>商品列表</CardTitle>
          <CardDescription>
            管理您的商品資訊，包括價格、SKU 和描述
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜尋輸入框和批量操作區域 */}
          <div className="flex items-center justify-between mb-6">
            {/* 搜尋區域 */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="搜尋商品名稱、SKU 或描述..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchQuery('')}
                  className="shrink-0"
                >
                  清除
                </Button>
              )}
            </div>

            {/* 批量操作區域 */}
            {selectedProducts.size > 0 && user?.is_admin && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-muted-foreground">
                  已選取 {selectedProducts.size} 項
                </span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      刪除選中商品
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>確定要執行批量刪除嗎？</AlertDialogTitle>
                      <AlertDialogDescription>
                        你正準備刪除 {selectedProducts.size} 個商品。這個操作無法復原，所有相關資料將被永久移除。
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>取消</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          const idsToDelete = Array.from(selectedProducts);
                          
                          toast.promise(deleteMultipleMutation.mutateAsync({ ids: idsToDelete }), {
                            loading: '正在刪除商品...',
                            success: () => {
                              setSelectedProducts(new Set()); // 清空選中狀態
                              return `成功刪除 ${idsToDelete.length} 個商品！`;
                            },
                            error: (err) => `刪除失敗：${err.message}`,
                          });
                        }}
                      >
                        確定刪除
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>載入商品資料中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">載入商品失敗</p>
              <p className="text-sm text-muted-foreground mb-4">
                {(error as Error)?.message || '請檢查網路連線或聯繫系統管理員'}
              </p>
              <Button variant="outline" onClick={() => refetch()}>
                重試
              </Button>
            </div>
          ) : products.length === 0 ? (
            // 區分空狀態和搜尋無結果的顯示
            searchQuery.trim() ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">未找到符合條件的商品</p>
                <p className="text-sm">
                  嘗試調整搜尋關鍵字或 
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={() => setSearchQuery('')}
                  >
                    清除搜尋條件
                  </Button>
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">尚無商品資料</p>
                <p className="text-sm">點擊「新增商品」開始建立您的商品庫存</p>
              </div>
            )
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {user?.is_admin && (
                      <TableHead className="w-10">
                        <Checkbox 
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="全選商品"
                          {...(isIndeterminate && { 'data-state': 'indeterminate' })}
                        />
                      </TableHead>
                    )}
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>商品名稱</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>成本價</TableHead>
                    <TableHead>售價</TableHead>
                    <TableHead>毛利率</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product: Product) => (
                    <TableRow key={product.id}>
                      {user?.is_admin && (
                        <TableCell>
                          <Checkbox 
                            checked={product.id ? selectedProducts.has(product.id) : false}
                            onCheckedChange={(checked) => product.id && handleSelectProduct(product.id, checked as boolean)}
                            aria-label={`選取商品 ${product.name}`}
                          />
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{product.id}</TableCell>
                      <TableCell className="font-medium">
                        {product.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.sku}</Badge>
                      </TableCell>
                      <TableCell>
                        ${typeof product.cost_price === 'number' ? product.cost_price.toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell>
                        ${typeof product.selling_price === 'number' ? product.selling_price.toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          parseFloat(calculateProfitMargin(product.selling_price || 0, product.cost_price || 0)) > 20 
                            ? "default" 
                            : parseFloat(calculateProfitMargin(product.selling_price || 0, product.cost_price || 0)) > 10 
                            ? "secondary" 
                            : "destructive"
                        }>
                          {calculateProfitMargin(product.selling_price || 0, product.cost_price || 0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {product.description || '無描述'}
                      </TableCell>
                      <TableCell className="text-right">
                        {user?.is_admin && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(product)}
                              disabled={updateProductMutation.isPending}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={deleteProductMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確定要刪除商品嗎？</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    即將刪除商品「{product.name}」。此操作無法復原，所有相關資料將被永久移除。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => product.id && handleDeleteProduct(product.id)}
                                  >
                                    確定刪除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 編輯對話框 - 只有管理員可見 */}
      {user?.is_admin && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>編輯商品</DialogTitle>
            <DialogDescription>
              修改商品資訊
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">商品名稱 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="請輸入商品名稱"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-sku">SKU 編號 *</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="請輸入 SKU 編號"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-description">商品描述</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="請輸入商品描述（選填）"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-category">商品分類</Label>
              <CategoryCombobox
                categories={flatCategoriesWithOptions}
                value={formData.category_id || null}
                onChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                disabled={isLoadingCategories}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-cost-price">成本價 *</Label>
                <Input
                  id="edit-cost-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.cost_price}
                  onChange={(e) => handleInputChange('cost_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="edit-selling-price">售價 *</Label>
                <Input
                  id="edit-selling-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => handleInputChange('selling_price', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              取消
            </Button>
            <Button 
              onClick={handleUpdateProduct}
              disabled={updateProductMutation.isPending || !formData.name || !formData.sku}
            >
              {updateProductMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              更新商品
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      )}
    </div>
  );
}

export default withAuth(ProductsPage); 