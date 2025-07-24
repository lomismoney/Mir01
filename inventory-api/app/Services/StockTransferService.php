<?php

namespace App\Services;

use App\Models\Store;
use App\Models\Inventory;
use App\Services\DistanceCalculator;
use App\Services\BaseService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * 庫存調貨服務
 * 
 * 負責處理門市間的庫存調貨邏輯，支援基於距離的智能調貨策略
 */
class StockTransferService extends BaseService
{
    public function __construct(
        protected DistanceCalculator $distanceCalculator
    ) {
    }

    /**
     * 尋找最佳調貨來源店舖
     * 
     * 根據目標店舖和商品需求，找出最適合的調貨來源店舖列表。
     * 優先使用基於距離的排序，如果座標不完整則回退到庫存量排序。
     * 
     * @param int $targetStoreId 目標店舖ID
     * @param int $productVariantId 商品變體ID  
     * @param int $requiredQuantity 需求數量
     * @return array 調貨建議列表
     */
    public function findOptimalTransferStores(int $targetStoreId, int $productVariantId, int $requiredQuantity): array
    {
        // 1. 獲取目標店舖資訊
        $targetStore = Store::find($targetStoreId);
        if (!$targetStore) {
            Log::warning('目標店舖不存在', ['store_id' => $targetStoreId]);
            return [];
        }

        // 2. 查詢其他店舖的可用庫存
        $availableInventories = Inventory::where('product_variant_id', $productVariantId)
            ->where('store_id', '!=', $targetStoreId)
            ->where('quantity', '>', 0)
            ->with(['store' => function ($query) {
                $query->select('id', 'name', 'latitude', 'longitude');
            }])
            ->get();

        if ($availableInventories->isEmpty()) {
            return [];
        }

        // 3. 檢查目標店舖是否有座標，決定排序策略
        $hasTargetCoordinates = $this->distanceCalculator->isValidCoordinates(
            $targetStore->latitude, 
            $targetStore->longitude
        );

        if ($hasTargetCoordinates) {
            return $this->sortByDistanceStrategy($targetStore, $availableInventories, $requiredQuantity);
        } else {
            return $this->sortByStockStrategy($availableInventories, $requiredQuantity);
        }
    }

    /**
     * 基於距離的排序策略
     * 
     * @param Store $targetStore 目標店舖
     * @param Collection $inventories 可用庫存集合
     * @param int $requiredQuantity 需求數量
     * @return array
     */
    protected function sortByDistanceStrategy(Store $targetStore, Collection $inventories, int $requiredQuantity): array
    {
        // 分離有座標和無座標的店舖
        $storesWithCoords = [];
        $storesWithoutCoords = [];

        foreach ($inventories as $inventory) {
            $store = $inventory->store;
            
            if ($this->distanceCalculator->isValidCoordinates($store->latitude, $store->longitude)) {
                $storesWithCoords[] = [
                    'id' => $store->id,
                    'lat' => $store->latitude,
                    'lon' => $store->longitude,
                    'inventory' => $inventory,
                ];
            } else {
                $storesWithoutCoords[] = $inventory;
            }
        }

        $results = [];

        // 處理有座標的店舖：按距離排序
        if (!empty($storesWithCoords)) {
            $distanceResults = $this->distanceCalculator->calculateDistancesToMultiple(
                $targetStore->latitude,
                $targetStore->longitude,
                $storesWithCoords
            );

            // 按距離排序
            usort($distanceResults, fn($a, $b) => $a['distance'] <=> $b['distance']);

            foreach ($distanceResults as $distanceResult) {
                $inventory = collect($storesWithCoords)
                    ->firstWhere('id', $distanceResult['id'])['inventory'];

                $results[] = $this->buildTransferOption($inventory, $requiredQuantity, $distanceResult['distance']);
            }
        }

        // 處理無座標的店舖：按庫存量排序
        $storesWithoutCoords = collect($storesWithoutCoords)
            ->sortByDesc('quantity')
            ->values();

        foreach ($storesWithoutCoords as $inventory) {
            $results[] = $this->buildTransferOption($inventory, $requiredQuantity, null);
        }

        return $results;
    }

    /**
     * 基於庫存量的排序策略
     * 
     * @param Collection $inventories 可用庫存集合
     * @param int $requiredQuantity 需求數量
     * @return array
     */
    protected function sortByStockStrategy(Collection $inventories, int $requiredQuantity): array
    {
        // 按庫存量降序排序
        $sortedInventories = $inventories->sortByDesc('quantity');
        
        $results = [];
        foreach ($sortedInventories as $inventory) {
            $results[] = $this->buildTransferOption($inventory, $requiredQuantity, null);
        }

        return $results;
    }

    /**
     * 建立調貨選項
     * 
     * @param Inventory $inventory 庫存記錄
     * @param int $requiredQuantity 需求數量
     * @param float|null $distance 距離（公里）
     * @return array
     */
    protected function buildTransferOption(Inventory $inventory, int $requiredQuantity, ?float $distance): array
    {
        $suggestedQuantity = min($inventory->quantity, $requiredQuantity);

        return [
            'store_id' => $inventory->store_id,
            'store_name' => $inventory->store->name,
            'available_quantity' => $inventory->quantity,
            'suggested_quantity' => $suggestedQuantity,
            'distance' => $distance,
        ];
    }

    /**
     * 整合到現有的庫存建議系統
     * 
     * 更新 InventoryService 中的 getStockSuggestions 方法使用的調貨邏輯
     * 
     * @param int $productVariantId 商品變體ID
     * @param int $targetStoreId 目標店舖ID
     * @param int $shortageQuantity 缺貨數量
     * @return array 調貨選項列表
     */
    public function getTransferOptionsForStockSuggestion(int $productVariantId, int $targetStoreId, int $shortageQuantity): array
    {
        $transferOptions = $this->findOptimalTransferStores($targetStoreId, $productVariantId, $shortageQuantity);
        
        // 轉換為前端期望的格式
        $frontendOptions = [];
        $remainingNeeded = $shortageQuantity;

        foreach ($transferOptions as $option) {
            if ($remainingNeeded <= 0) {
                break;
            }

            $transferQuantity = min($option['available_quantity'], $remainingNeeded);
            
            $frontendOptions[] = [
                'store_id' => $option['store_id'],
                'store_name' => $option['store_name'],
                'available_quantity' => $option['available_quantity'],
                'suggested_quantity' => $transferQuantity,
                'distance' => $option['distance'],
            ];

            $remainingNeeded -= $transferQuantity;
        }

        return $frontendOptions;
    }

    /**
     * 獲取調貨統計資訊
     * 
     * @param array $transferOptions 調貨選項
     * @return array
     */
    public function getTransferStatistics(array $transferOptions): array
    {
        $totalAvailable = array_sum(array_column($transferOptions, 'available_quantity'));
        $totalSuggested = array_sum(array_column($transferOptions, 'suggested_quantity'));
        $storeCount = count($transferOptions);
        
        $avgDistance = null;
        $distanceOptions = array_filter($transferOptions, fn($option) => $option['distance'] !== null);
        
        if (!empty($distanceOptions)) {
            $avgDistance = array_sum(array_column($distanceOptions, 'distance')) / count($distanceOptions);
        }

        return [
            'total_available_quantity' => $totalAvailable,
            'total_suggested_quantity' => $totalSuggested,
            'store_count' => $storeCount,
            'average_distance' => $avgDistance,
            'distance_based_sorting' => !empty($distanceOptions),
        ];
    }
}