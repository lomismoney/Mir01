"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  useProducts,
  useStores,
  useCategories,
  useInventoryList,
  CategoryNode,
} from "@/hooks";
import { useDebounce } from "@/hooks/use-debounce";
import { useToast } from "@/components/ui/use-toast";
import { InventoryNestedTable } from "@/components/inventory/InventoryNestedTable";
import { ProductFilters } from "@/types/api-helpers";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  RotateCw as RefreshIcon,
  Search,
  AlertCircle,
  LogIn,
  Store,
  Tag,
  AlertTriangle,
  PackageX,
  Package,
} from "lucide-react";

import Link from "next/link";
import { InventoryPagination } from "./InventoryPagination";

export function InventoryManagement() {
  const { toast } = useToast();
  const router = useRouter();

  // 篩選器狀態管理
  const [filters, setFilters] = useState<ProductFilters>({});
  const [productNameInput, setProductNameInput] = useState("");
  const [page, setPage] = useState(1);

  // 使用 debounce 優化商品名稱搜尋
  const debouncedProductName = useDebounce(productNameInput, 300);

  // 將 debounced 值同步到 filters
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      product_name: debouncedProductName || undefined,
    }));
  }, [debouncedProductName]);

  // 獲取基礎資料
  const { data: storesResponse, isLoading: isLoadingStores } = useStores();
  const { data: categoriesResponse, isLoading: isLoadingCategories } =
    useCategories();

  // 🎯 標準化數據獲取 - 統一處理 API 回傳的結構化資料
  const stores = storesResponse?.data ?? [];
  const categories = categoriesResponse ?? [];

  // 獲取庫存列表數據
  const {
    data: inventoryData,
    isLoading: isLoadingInventory,
    error: inventoryError,
    refetch: refetchInventory,
  } = useInventoryList({
    store_id: filters.store_id,
    low_stock: filters.low_stock,
    out_of_stock: filters.out_of_stock,
    product_name: filters.product_name,
    page,
    per_page: 15,
  });

  const paginationMeta = inventoryData?.meta;

  const handleRefresh = () => {
    refetchInventory();
    toast({
      title: "重新整理",
      description: "已重新載入庫存資料",
    });
  };

  /**
   * 處理門市篩選變更
   */
  const handleStoreChange = (value: string) => {
    const storeId = value === "all" ? undefined : parseInt(value);
    setFilters((prev) => ({
      ...prev,
      store_id: storeId,
    }));
  };

  /**
   * 處理分類篩選變更
   */
  const handleCategoryChange = (value: string) => {
    const categoryId = value === "all" ? undefined : parseInt(value);
    setFilters((prev) => ({
      ...prev,
      category_id: categoryId,
    }));
  };

  /**
   * 處理低庫存篩選變更
   */
  const handleLowStockChange = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      low_stock: checked || undefined,
    }));
  };

  /**
   * 處理缺貨篩選變更
   */
  const handleOutOfStockChange = (checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      out_of_stock: checked || undefined,
    }));
  };

  /**
   * 重置所有篩選器
   */
  const handleResetFilters = () => {
    setFilters({});
    setProductNameInput("");
  };

  /**
   * 處理商品管理操作
   * @param spuId - 商品 SPU ID
   */
  const handleManageProduct = (spuId: number) => {
    router.push(`/products/${spuId}/edit`);
  };

  /**
   * 處理庫存調整操作
   * @param skuId - SKU ID (變體 ID)
   * @param currentQuantity - 當前庫存數量
   *
   * 現在庫存修改功能已整合到表格中，此函數主要用於資料刷新
   */
  const handleAdjustInventory = (skuId: number, currentQuantity: number) => {
    // 刷新庫存資料
    refetchInventory();
  };

  /**
   * 計算當前篩選器的數量
   */
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.product_name) count++;
    if (filters.store_id) count++;
    if (filters.category_id) count++;
    if (filters.low_stock) count++;
    if (filters.out_of_stock) count++;
    return count;
  };

  // 顯示錯誤狀態
  if (inventoryError) {
    return (
      <div className="space-y-6 p-6" data-oid="9b5p__d">
        {/* 頁面標題區 */}
        <div className="flex flex-col space-y-2" data-oid="5me540s">
          <h1 className="text-2xl font-bold" data-oid="_yjxm8b">
            庫存管理
          </h1>
          <p className="text-muted-foreground" data-oid="idphyw7">
            管理商品庫存數量、監控庫存水位和處理庫存調整
          </p>
        </div>

        <Alert className="mt-4" data-oid="ue27jb-">
          <AlertCircle className="h-4 w-4" data-oid="rkl.vi7" />
          <AlertTitle data-oid="3bv9w6-">載入失敗</AlertTitle>
          <AlertDescription
            className="flex items-center justify-between"
            data-oid="xb6dbku"
          >
            <span data-oid="zzasw1o">無法載入庫存資料，請稍後再試</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="ml-4"
              data-oid="1epgfyu"
            >
              <RefreshIcon className="h-4 w-4 mr-2" data-oid="t.bo0ip" />
              重試
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" data-oid="u3y:w5u">
      {/* 頁面標題區 */}
      <div
        className="flex items-center justify-between mb-6"
        data-oid="myyx..b"
      >
        <div data-oid="rv.:9p.">
          <h1 className="text-2xl font-bold" data-oid="vhcsmml">
            庫存管理
          </h1>
          <p className="text-muted-foreground" data-oid="yaa7dai">
            管理商品庫存數量、監控庫存水位和處理庫存調整
          </p>
        </div>
      </div>

      {/* 篩選器區域 */}
      <Card data-oid=":_vos79">
        <CardHeader data-oid="euudy.j">
          <CardTitle className="flex items-center gap-2" data-oid="gnkjv73">
            <Search className="h-5 w-5" data-oid="7091por" />
            篩選器
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2" data-oid="26.nqww">
                {getActiveFiltersCount()} 項篩選
              </Badge>
            )}
          </CardTitle>
          <CardDescription data-oid="vl6h3e5">
            使用以下篩選器來精確查找您需要的商品和庫存資訊
          </CardDescription>
        </CardHeader>
        <CardContent data-oid="64iz6ev">
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            data-oid="aymw7g7"
          >
            {/* 商品名稱搜尋 */}
            <div className="space-y-2" data-oid="idua581">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="_oj6xlo"
              >
                <Search className="h-4 w-4" data-oid=".xjmdgg" />
                商品名稱
              </label>
              <Input
                placeholder="搜尋商品名稱..."
                value={productNameInput}
                onChange={(e) => setProductNameInput(e.target.value)}
                className="w-full"
                data-oid="c-xuv.m"
              />
            </div>

            {/* 門市篩選 */}
            <div className="space-y-2" data-oid="gwg2owk">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="7wkc0e-"
              >
                <Store className="h-4 w-4" data-oid="zo8lfb6" />
                門市
              </label>
              <Select
                value={filters.store_id?.toString() || "all"}
                onValueChange={handleStoreChange}
                data-oid="oxl9qpg"
              >
                <SelectTrigger data-oid="4xdvt94">
                  <SelectValue placeholder="選擇門市" data-oid="w_4_x7o" />
                </SelectTrigger>
                <SelectContent data-oid="x091tnn">
                  <SelectItem value="all" data-oid="dr5e:xo">
                    所有門市
                  </SelectItem>
                  {stores.map((store) => (
                    <SelectItem
                      key={store.id}
                      value={store.id?.toString() || ""}
                      data-oid="wi6nw13"
                    >
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 分類篩選 */}
            <div className="space-y-2" data-oid="r6s9xbc">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid=":gww_wd"
              >
                <Tag className="h-4 w-4" data-oid="jsu4.20" />
                分類
              </label>
              <Select
                value={filters.category_id?.toString() || "all"}
                onValueChange={handleCategoryChange}
                data-oid="r6uw81_"
              >
                <SelectTrigger data-oid="1.p6w_w">
                  <SelectValue placeholder="選擇分類" data-oid="mew2u0r" />
                </SelectTrigger>
                <SelectContent data-oid="kmb3k4u">
                  <SelectItem value="all" data-oid="_8214bu">
                    所有分類
                  </SelectItem>
                  {categories.map((category) => (
                    <SelectItem
                      key={category.id}
                      value={category.id?.toString() || ""}
                      data-oid="qk.t7kr"
                    >
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 低庫存篩選 */}
            <div className="space-y-2" data-oid="6nwdsxg">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="bevgbx-"
              >
                <AlertTriangle className="h-4 w-4" data-oid="da57o7p" />
                庫存狀態
              </label>
              <div className="flex items-center space-x-2" data-oid="0w:o4ku">
                <Checkbox
                  id="low-stock"
                  checked={!!filters.low_stock}
                  onCheckedChange={handleLowStockChange}
                  data-oid="7bq845v"
                />

                <label
                  htmlFor="low-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  data-oid=":szfg9:"
                >
                  低庫存
                </label>
              </div>
            </div>

            {/* 缺貨篩選 */}
            <div className="space-y-2" data-oid="itftwn4">
              <label
                className="text-sm font-medium flex items-center gap-2"
                data-oid="ae4s4tz"
              >
                <PackageX className="h-4 w-4" data-oid="ue65kxz" />
                缺貨狀態
              </label>
              <div className="flex items-center space-x-2" data-oid="j9n5tq-">
                <Checkbox
                  id="out-of-stock"
                  checked={!!filters.out_of_stock}
                  onCheckedChange={handleOutOfStockChange}
                  data-oid="594np2k"
                />

                <label
                  htmlFor="out-of-stock"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  data-oid="mey5hp6"
                >
                  缺貨
                </label>
              </div>
            </div>
          </div>

          {/* 操作按鈕區域 */}
          <div
            className="flex items-center justify-between pt-4"
            data-oid="g72e9qh"
          >
            <div className="flex items-center gap-2" data-oid="8qoqx3z">
              <Button
                variant="outline"
                onClick={handleResetFilters}
                data-oid="..07hpe"
              >
                重置篩選
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                data-oid="zuglzm-"
              >
                <RefreshIcon className="h-4 w-4 mr-2" data-oid="tc0v-y_" />
                重新整理
              </Button>
            </div>
            {getActiveFiltersCount() > 0 && (
              <p className="text-sm text-muted-foreground" data-oid="hoyxcjo">
                找到 {inventoryData?.data?.length || 0} 筆結果
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 商品庫存明細 */}
      <Card data-oid="yiqq5z9">
        <CardHeader data-oid="_7bom5-">
          <CardTitle className="flex items-center gap-2" data-oid="d49wtgg">
            <Package className="h-5 w-5" data-oid="-t4vwwr" />
            商品庫存明細
          </CardTitle>
          <CardDescription data-oid="xdf-lcl">
            按商品分組顯示庫存詳情，支援展開查看各變體的庫存狀況
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0" data-oid=":10jelv">
          {inventoryError ? (
            <div className="p-6" data-oid="qfn3ula">
              <Alert data-oid="oq-wyia">
                <AlertCircle className="h-4 w-4" data-oid="mq8:g.j" />
                <AlertTitle data-oid="jr7mvaq">載入失敗</AlertTitle>
                <AlertDescription
                  className="flex items-center justify-between"
                  data-oid="x1ee3lz"
                >
                  <span data-oid="lk-dkf-">無法載入庫存資料</span>
                  <Button asChild size="sm" className="ml-4" data-oid="-cxajdg">
                    <Link href="/login" data-oid="6xrd1bj">
                      <LogIn className="h-4 w-4 mr-2" data-oid="pshhd.e" />
                      立即登入
                    </Link>
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <InventoryNestedTable
              data={inventoryData?.data || []}
              isLoading={isLoadingInventory}
              onAdjustInventory={handleAdjustInventory}
              onManageProduct={handleManageProduct}
              data-oid="kw4eg6a"
            />
          )}
        </CardContent>
        {inventoryData?.meta && (
          <CardFooter
            className="flex items-center justify-center border-t pt-6"
            data-oid="eee7v6f"
          >
            <InventoryPagination
              meta={{
                current_page: inventoryData.meta.current_page || 1,
                last_page: inventoryData.meta.last_page || 1,
                per_page: inventoryData.meta.per_page || 15,
                total: inventoryData.meta.total || 0,
              }}
              onPageChange={setPage}
              data-oid="wg5.2ar"
            />
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
