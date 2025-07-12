import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, X } from "lucide-react";

interface IncomingFiltersProps {
  productNameInput: string;
  setProductNameInput: (value: string) => void;
  storesData: any;
  isLoadingStores: boolean;
  filters: any;
  handleStoreChange: (value: string) => void;
  handleDateChange: (field: "start_date" | "end_date", value: string) => void;
  handleResetFilters: () => void;
  handleRefresh: () => void;
  getActiveFiltersCount: () => number;
}

export function IncomingFilters({
  productNameInput,
  setProductNameInput,
  storesData,
  isLoadingStores,
  filters,
  handleStoreChange,
  handleDateChange,
  handleResetFilters,
  handleRefresh,
  getActiveFiltersCount,
}: IncomingFiltersProps) {
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="bg-card rounded-lg border p-4 mb-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">篩選器</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} 個篩選條件
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              清除
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="text-xs"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            重新整理
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 商品名稱搜尋 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            商品名稱
          </label>
          <Input
            placeholder="搜尋商品名稱..."
            value={productNameInput}
            onChange={(e) => setProductNameInput(e.target.value)}
            className="w-full"
          />
        </div>

        {/* 門市選擇 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            門市
          </label>
          <Select
            value={filters.store_id?.toString() || "all"}
            onValueChange={handleStoreChange}
            disabled={isLoadingStores}
          >
            <SelectTrigger>
              <SelectValue placeholder="選擇門市" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部門市</SelectItem>
              {storesData?.data?.map((store: any) => (
                <SelectItem key={store.id} value={store.id.toString()}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 開始日期 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            開始日期
          </label>
          <Input
            type="date"
            value={filters.start_date || ""}
            onChange={(e) => handleDateChange("start_date", e.target.value)}
            className="w-full"
          />
        </div>

        {/* 結束日期 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">
            結束日期
          </label>
          <Input
            type="date"
            value={filters.end_date || ""}
            onChange={(e) => handleDateChange("end_date", e.target.value)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}